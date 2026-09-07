import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { calculateStudentMatches, calculateSingleMatch } from '../services/matchingEngine.js';
import { gradeAssessment, getDerivedPortfolio } from '../services/skillEngine.js';
import { AssessmentSubmitSchema, UpdateProfileSchema, SaveStudentProfileSchema, AddStudentDomainSchema } from '../../../shared/validation.js';
import { recordDailyActivity, calculateStudentActivityPoints, getUserActivityHeatmap } from '../services/streakService.js';
import { getCuratedRoadmapResources } from '../services/learningRecommendationService.js';
import { getOrCreateDailyTarget, markDailyTargetComplete } from '../services/dailyTargetService.js';

const router = Router();

// Setup local uploads storage for avatars and documents
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB maximum
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, JPEG, and WEBP images up to 5MB are allowed.'));
    }
  },
});

/**
 * GET /api/students/domains/catalog
 * Returns all available domains with required skills and market compensation benchmarks
 */
router.get('/domains/catalog', async (_req, res) => {
  const domains = await prisma.domain.findMany({
    include: {
      requirements: {
        include: { skill: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  const catalog = domains.map(d => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    avgSalaryINR: d.avgSalaryINR,
    avgSalaryDisplay: `₹${(d.avgSalaryINR / 100000).toFixed(1)} LPA`,
    icon: d.icon || 'Code',
    skills: d.requirements.map(r => ({
      skillId: r.skillId,
      skillName: r.skill.name,
      category: r.skill.category,
      benchmarkScore: r.benchmarkScore,
      displayOrder: r.displayOrder,
    })),
  }));

  return res.json({ catalog });
});

/**
 * GET /api/students/questions?domain=AI%2FData+Science
 * Fetch assessment questions for specific domain
 */
router.get('/questions', async (req, res) => {
  const domain = (req.query.domain as string) || 'Full-Stack Web';
  const questions = await prisma.question.findMany({
    where: { domain },
  });

  const parsed = questions.map(q => {
    let options: { id: string; text: string; isCorrect: boolean }[] = [];
    try {
      options = JSON.parse(q.optionsJson);
    } catch {}

    const safeOptions = options.map(o => ({ id: o.id, text: o.text }));
    return {
      id: q.id,
      domain: q.domain,
      skillId: q.skillId,
      type: q.type,
      prompt: q.prompt,
      options: safeOptions,
      weight: q.weight,
    };
  });

  return res.json({ questions: parsed });
});

/**
 * GET /api/students/:id/domains
 * Returns all domains tracked by this student with their verified/self-rated status
 */
router.get('/:id/domains', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      domains: {
        include: {
          domain: {
            include: {
              requirements: {
                include: { skill: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      },
      skillScores: {
        include: { skill: true },
      },
    },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  // If student has no tracked domains in StudentDomain, create initial default from targetDomain
  let trackedDomains = student.domains;
  if (trackedDomains.length === 0 && student.targetDomain) {
    const existingDomain = await prisma.domain.findFirst({
      where: { name: student.targetDomain },
    });
    if (existingDomain) {
      const created = await prisma.studentDomain.create({
        data: {
          studentId: student.id,
          domainId: existingDomain.id,
          isPrimary: true,
        },
        include: {
          domain: {
            include: {
              requirements: {
                include: { skill: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      });
      trackedDomains = [created];
    }
  }

  const scoreMap = new Map(student.skillScores.map(ss => [ss.skillId, ss.score]));

  const responseDomains = trackedDomains.map(td => {
    const domainReqs = td.domain.requirements.map(req => {
      const currentScore = scoreMap.get(req.skillId) || 0;
      return {
        skillId: req.skillId,
        skillName: req.skill.name,
        category: req.skill.category,
        benchmarkScore: req.benchmarkScore,
        currentScore,
        isMet: currentScore >= req.benchmarkScore,
      };
    });

    const strengthsCount = domainReqs.filter(r => r.isMet).length;
    const gapsCount = domainReqs.filter(r => !r.isMet).length;

    return {
      studentDomainId: td.id,
      domainId: td.domain.id,
      domainName: td.domain.name,
      slug: td.domain.slug,
      description: td.domain.description,
      avgSalaryINR: td.domain.avgSalaryINR,
      avgSalaryDisplay: `₹${(td.domain.avgSalaryINR / 100000).toFixed(1)} LPA`,
      icon: td.domain.icon || 'Code',
      isPrimary: td.isPrimary,
      addedAt: td.addedAt,
      skills: domainReqs,
      strengthsCount,
      gapsCount,
    };
  });

  return res.json({ domains: responseDomains });
});

/**
 * POST /api/students/:id/domains
 * Adds a new domain to the student profile and saves initial self-rated skill scores
 */
router.post('/:id/domains', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const parseResult = AddStudentDomainSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message } });
  }

  const { domainId, initialSkillRatings } = parseResult.data;

  // Find domain by id or name
  const domain = await prisma.domain.findFirst({
    where: {
      OR: [{ id: domainId }, { name: domainId }, { slug: domainId }],
    },
    include: {
      requirements: { include: { skill: true } },
    },
  });

  if (!domain) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Domain not found in catalog.' } });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  // 1. Upsert StudentDomain relation
  await prisma.studentDomain.upsert({
    where: {
      studentId_domainId: {
        studentId,
        domainId: domain.id,
      },
    },
    update: {
      isPrimary: true,
    },
    create: {
      studentId,
      domainId: domain.id,
      isPrimary: true,
    },
  });

  // 2. Update StudentProfile.targetDomain to newly selected domain
  await prisma.studentProfile.update({
    where: { id: studentId },
    data: { targetDomain: domain.name },
  });

  // 3. Upsert initial self-rated skill scores
  for (const rating of initialSkillRatings) {
    await prisma.studentSkillScore.upsert({
      where: {
        studentId_skillId: {
          studentId,
          skillId: rating.skillId,
        },
      },
      update: {
        score: rating.score,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        skillId: rating.skillId,
        score: rating.score,
      },
    });
  }

  // 4. Recalculate dynamic activity points
  const rankStats = await calculateStudentActivityPoints(studentId);

  return res.json({
    message: `Domain ${domain.name} added successfully with initial skill ratings.`,
    domain: {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
    },
    rankings: rankStats,
  });
});

/**
 * GET /api/students/:id/radar?domain=AI%2FData+Science
 * Refetches genuine domain-specific skill radar data for the selected domain
 */
router.get('/:id/radar', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const targetDomain = (req.query.domain as string);

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      skillScores: { include: { skill: true } },
    },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
  }

  const domainName = targetDomain || student.targetDomain || 'Full-Stack Web';

  // Find domain requirement records
  const domainRecord = await prisma.domain.findFirst({
    where: {
      OR: [{ name: domainName }, { slug: domainName }, { id: domainName }],
    },
    include: {
      requirements: {
        include: { skill: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  let benchmarks: { skillId: string; skillName: string; category: string; benchmarkScore: number }[] = [];

  if (domainRecord && domainRecord.requirements.length > 0) {
    benchmarks = domainRecord.requirements.map(r => ({
      skillId: r.skillId,
      skillName: r.skill.name,
      category: r.skill.category,
      benchmarkScore: r.benchmarkScore,
    }));
  } else {
    // Fallback to legacy skill benchmarks table
    const legacyBenchmarks = await prisma.skillBenchmark.findMany({
      where: { domain: domainName },
      include: { skill: true },
      orderBy: { displayOrder: 'asc' },
    });
    benchmarks = legacyBenchmarks.map(b => ({
      skillId: b.skillId,
      skillName: b.skill.name,
      category: b.skill.category,
      benchmarkScore: b.benchmarkScore,
    }));
  }

  const nowTime = Date.now();

  const studentSkills = benchmarks.map(b => {
    const scoreItem = student.skillScores.find(s => s.skillId === b.skillId);
    let baseScore = scoreItem ? scoreItem.score : 0;

    // Check inactivity decay if last attempt > 30 days
    const lastAttempt = scoreItem?.lastAttemptDate || scoreItem?.updatedAt;
    const daysInactive = lastAttempt
      ? Math.max(0, Math.floor((nowTime - new Date(lastAttempt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    let inactivityDecayPct = 0;
    if (daysInactive >= 30 && baseScore > 20) {
      inactivityDecayPct = Math.min(15, Math.round((daysInactive - 30) * 0.5));
      baseScore = Math.max(10, Math.round(baseScore * (1 - inactivityDecayPct / 100)));
    }

    let scoreHistory: { date: string; score: number; delta?: number }[] = [];
    try {
      if (scoreItem?.scoreHistoryJson) {
        scoreHistory = JSON.parse(scoreItem.scoreHistoryJson);
      }
    } catch {}

    const delta = scoreHistory.length > 0 && typeof scoreHistory[0].delta === 'number'
      ? scoreHistory[0].delta
      : 0;

    return {
      skillId: b.skillId,
      skillName: b.skillName,
      category: b.category,
      score: baseScore,
      rawScore: scoreItem ? scoreItem.score : 0,
      decayDaysCount: daysInactive,
      inactivityDecayPct,
      isDecayed: inactivityDecayPct > 0,
      delta,
      scoreHistory: scoreHistory.slice(0, 5),
    };
  });

  return res.json({
    domain: domainRecord ? domainRecord.name : domainName,
    benchmarks,
    studentSkills,
  });
});

/**
 * GET /api/students/:id/recommendations
 * Recommends higher-earning domains based on weighted skill overlap (60%) + earning potential (40%)
 */
router.get('/:id/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      domains: true,
      skillScores: { include: { skill: true } },
    },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  // Already added domain IDs and names
  const addedDomainIds = new Set(student.domains.map(d => d.domainId));
  const addedDomainNames = new Set([student.targetDomain]);

  // Fetch all domains in catalog
  const allDomains = await prisma.domain.findMany({
    include: {
      requirements: {
        include: { skill: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  // Filter for candidate unadded domains
  const candidateDomains = allDomains.filter(d => !addedDomainIds.has(d.id) && !addedDomainNames.has(d.name));

  const studentScoreMap = new Map(student.skillScores.map(ss => [ss.skillId, ss.score]));

  const OVERLAP_WEIGHT = 0.6;
  const EARNING_WEIGHT = 0.4;
  const MAX_BENCHMARK_SALARY = 1500000; // ₹15 LPA normalizer

  const recommendations = candidateDomains.map(d => {
    const totalReqs = d.requirements.length;
    const overlappingSkills: { skillId: string; skillName: string; currentScore: number }[] = [];
    const missingSkills: { skillId: string; skillName: string; benchmarkScore: number }[] = [];

    let positiveOverlapCount = 0;

    d.requirements.forEach(req => {
      const score = studentScoreMap.get(req.skillId) || 0;
      if (score >= 50) {
        positiveOverlapCount += 1;
        overlappingSkills.push({
          skillId: req.skillId,
          skillName: req.skill.name,
          currentScore: score,
        });
      } else {
        missingSkills.push({
          skillId: req.skillId,
          skillName: req.skill.name,
          benchmarkScore: req.benchmarkScore,
        });
      }
    });

    const skillOverlapPercentage = totalReqs > 0 ? Math.round((positiveOverlapCount / totalReqs) * 100) : 0;
    const earningScore = Math.min(100, Math.round((d.avgSalaryINR / MAX_BENCHMARK_SALARY) * 100));
    const weightedScore = Math.round((OVERLAP_WEIGHT * skillOverlapPercentage) + (EARNING_WEIGHT * earningScore));

    let readinessTier: 'High Readiness' | 'Moderate Gap' | 'Exploratory' = 'Exploratory';
    if (skillOverlapPercentage >= 40 || weightedScore >= 65) {
      readinessTier = 'High Readiness';
    } else if (skillOverlapPercentage >= 20 || weightedScore >= 45) {
      readinessTier = 'Moderate Gap';
    }

    return {
      domainId: d.id,
      domainName: d.name,
      slug: d.slug,
      description: d.description,
      avgSalaryINR: d.avgSalaryINR,
      avgSalaryDisplay: `₹${(d.avgSalaryINR / 100000).toFixed(1)} LPA`,
      icon: d.icon || 'TrendingUp',
      skillOverlapPercentage,
      overlappingSkillsCount: positiveOverlapCount,
      totalRequiredSkills: totalReqs,
      overlappingSkills,
      missingSkills,
      weightedScore,
      readinessTier,
    };
  });

  // Sort descending by weighted score
  recommendations.sort((a, b) => b.weightedScore - a.weightedScore);

  return res.json({ recommendations });
});

/**
 * POST /api/students/:id/target-internship
 * Sets the student's active target internship posting
 */
router.post('/:id/target-internship', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const { internshipId } = req.body;

  if (!internshipId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'internshipId is required.' } });
  }

  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { industry: true },
  });

  if (!internship) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Internship posting not found.' } });
  }

  const updated = await prisma.studentProfile.update({
    where: { id: studentId },
    data: { targetInternshipId: internshipId },
    include: {
      targetInternship: {
        include: { industry: true },
      },
    },
  });

  return res.json({
    message: 'Target internship set successfully',
    targetInternshipId: updated.targetInternshipId,
    targetInternship: updated.targetInternship,
  });
});

/**
 * DELETE /api/students/:id/target-internship
 * Clears the student's active target internship
 */
router.delete('/:id/target-internship', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: { targetInternshipId: null },
  });

  return res.json({
    message: 'Target internship cleared successfully',
    targetInternshipId: null,
  });
});

/**
 * GET /api/students/:id/roadmap?domain=...&internshipId=...
 * Generates dynamic 2-Year Roadmap from live gap analysis and real course catalog.
 * When internshipId is passed or active on profile, generates a role-scoped roadmap
 * tailored specifically to the target posting's requirements and mock interview gaps.
 */
router.get('/:id/roadmap', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const targetDomainQuery = req.query.domain as string | undefined;
  const requestedInternshipId = (req.query.internshipId as string) || undefined;

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      skillScores: { include: { skill: true } },
      targetInternship: { include: { industry: true } },
    },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  const activeInternshipId = requestedInternshipId || student.targetInternshipId;
  const studentScoreMap = new Map(student.skillScores.map(ss => [ss.skillId, ss.score]));

  // Fetch all real courses from DB for recommendation
  const allCourses = await prisma.course.findMany({
    include: { provider: true },
  });

  // Fetch all skills for name lookup
  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map(allSkills.map(s => [s.id, s.name]));

  // ── BRANCH A: Role-Specific Roadmap for Active Target Internship ──
  if (activeInternshipId) {
    const targetInternship = await prisma.internship.findUnique({
      where: { id: activeInternshipId },
      include: { industry: true },
    });

    if (targetInternship) {
      let requiredSkills: any[] = [];
      try {
        requiredSkills = JSON.parse(targetInternship.requiredSkillsJson || '[]');
      } catch {}

      // Calculate gaps specifically against target role requirements
      const roleGaps = requiredSkills.map(r => {
        const skillName = skillMap.get(r.skillId) || 'Core Skill';
        const currentScore = studentScoreMap.get(r.skillId) || 0;
        const targetScore = r.minScore || 70;
        const gap = Math.max(0, targetScore - currentScore);
        const weight = r.weight || 1;
        return {
          skillId: r.skillId,
          skillName,
          currentScore,
          benchmarkScore: targetScore,
          gap,
          weight,
        };
      }).filter(g => g.gap > 0).sort((a, b) => (b.gap * b.weight) - (a.gap * a.weight));

      // Check for identified weak areas from previous mock interviews for this student & role
      const latestMock = await prisma.mockInterviewSession.findFirst({
        where: {
          studentId,
          internshipId: targetInternship.id,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
      });

      let mockWeakAreas: string[] = [];
      if (latestMock?.identifiedGapsJson) {
        try {
          mockWeakAreas = JSON.parse(latestMock.identifiedGapsJson);
        } catch {}
      }

      // Find remediation courses matching top role gaps
      const topGapSkillIds = new Set(roleGaps.slice(0, 3).map(g => g.skillId));
      const relevantCourses = allCourses.filter(c => {
        try {
          const skillsCovered = JSON.parse(c.skillsCoveredJson);
          return skillsCovered.some((sc: any) => topGapSkillIds.has(sc.skillId));
        } catch {
          return false;
        }
      });

      // Compute current live match breakdown for this target role
      const matchBreakdown = await calculateSingleMatch(studentId, targetInternship.id);
      const currentMatchScore = matchBreakdown ? matchBreakdown.overallScore : 65;

      const company = targetInternship.industry.companyName;
      const roleTitle = targetInternship.title;

      const milestones = [
        {
          id: 'm1',
          phase: 'Phase 01',
          timeframe: 'Month 1–2',
          title: `${roleTitle} Skill Baseline & Alignment`,
          description: `Benchmark your verified competency baseline specifically against ${company} hiring requirements.`,
          status: 'completed' as const,
          accentColor: 'campus-blue' as const,
          skillTags: ['DSA', 'Baseline', ...roleGaps.slice(0, 2).map(g => g.skillName)],
          actions: [
            { text: `Complete baseline diagnostic for ${company} required skills`, link: '/assessment', isDone: true },
            { text: `Review ${roleGaps.length} identified prerequisite competency gaps for this posting`, link: '/skill-profile', isDone: true },
          ],
        },
        {
          id: 'm2',
          phase: 'Phase 02',
          timeframe: 'Month 3–6',
          title: `Role-Specific Targeted Remediation (${company})`,
          description: roleGaps.length > 0
            ? `Close prioritized gaps in ${roleGaps.slice(0, 2).map(g => g.skillName).join(' & ')} required for ${roleTitle}.`
            : `Deepen advanced mastery in ${roleTitle} core technologies.`,
          status: 'current' as const,
          accentColor: 'bridge-teal' as const,
          skillTags: roleGaps.length > 0 ? roleGaps.slice(0, 3).map(g => g.skillName) : ['React', 'Node.js', 'Dynamic Programming'],
          actions: [
            ...(relevantCourses.length > 0
              ? relevantCourses.slice(0, 2).map(c => ({
                  text: `Complete ${c.title} (${c.provider.name})`,
                  link: '/courses',
                  isDone: false,
                }))
              : [{ text: `Explore accredited courses aligned to ${roleTitle}`, link: '/courses', isDone: false }]),
            ...(mockWeakAreas.length > 0
              ? [{
                  text: `Remediate Sash Mock Interview weak areas: ${mockWeakAreas.slice(0, 2).join(' & ')}`,
                  link: '/report-card',
                  isDone: false,
                }]
              : []),
            { text: `Solve Daily Practice sets weighted to ${roleTitle} gaps`, link: '/assessment?category=daily_mixed', isDone: false },
          ],
          recommendedCourses: relevantCourses.slice(0, 3).map(c => ({
            id: c.id,
            title: c.title,
            provider: c.provider.name,
            duration: c.duration,
            pointsGain: 20,
            externalUrl: c.externalUrl,
          })),
        },
        {
          id: 'm3',
          phase: 'Phase 03',
          timeframe: 'Month 7–12',
          title: `${roleTitle} Capstone & Verified Artifacts`,
          description: `Build a production-grade showcase project tailored to ${company}'s technology stack.`,
          status: 'upcoming' as const,
          accentColor: 'bridge-teal' as const,
          skillTags: ['System Design', 'Clean Code', ...roleGaps.slice(0, 2).map(g => g.skillName)],
          actions: [
            { text: `Publish portfolio project demonstrating ${roleGaps.map(g => g.skillName).slice(0, 2).join(' & ') || 'core stack'} to GitHub`, link: '/portfolio', isDone: false },
            { text: `Generate ATS-tailored resume specifically targeted to ${roleTitle}`, link: '/resume-builder', isDone: false },
            {
              text: `Pass Sash AI Mock Interview (Score ≥75%) for ${roleTitle}`,
              link: '/internships',
              isDone: latestMock ? latestMock.overallScore >= 75 : false,
            },
          ],
        },
        {
          id: 'm4',
          phase: 'Phase 04',
          timeframe: 'Month 13–24',
          title: `${company} Direct Fast-Track & Hiring`,
          description: `Achieve ≥80% match tier and submit verified snapshot application directly to ${company}.`,
          status: 'upcoming' as const,
          accentColor: 'industry-amber' as const,
          skillTags: ['Interview Prep', 'System Design', 'DSA', 'Cracking the Coding Interview'],
          actions: [
            { text: `Submit verified application with match score snapshot to ${company}`, link: '/internships', isDone: false },
            { text: `Track recruiter review status and technical interview rounds`, link: '/dashboard', isDone: false },
          ],
        },
      ];

      // Populate curated books and YouTube recommendations for each milestone
      for (const m of milestones) {
        const { books, youtube } = await getCuratedRoadmapResources(m.skillTags, student.targetDomain);
        (m as any).recommendedBooks = books;
        (m as any).recommendedYoutube = youtube;
      }

      return res.json({
        domain: student.targetDomain,
        targetRole: `${roleTitle} @ ${company}`,
        companyName: company,
        projectedSalaryRange: targetInternship.stipend,
        readinessScore: currentMatchScore,
        studentGapsCount: roleGaps.length,
        isRoleSpecific: true,
        internshipId: targetInternship.id,
        mockInterviewWeakAreas: mockWeakAreas,
        milestones,
      });
    }
  }

  // ── BRANCH B: Standard Domain-Wide Roadmap ──
  const domainName = targetDomainQuery || student.targetDomain || 'Full-Stack Web';

  // Find domain requirements
  const domainRecord = await prisma.domain.findFirst({
    where: {
      OR: [{ name: domainName }, { slug: domainName }, { id: domainName }],
    },
    include: {
      requirements: {
        include: { skill: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  const requirements = domainRecord ? domainRecord.requirements : [];

  // Calculate gaps for this domain
  const gaps = requirements.map(r => {
    const currentScore = studentScoreMap.get(r.skillId) || 0;
    const gap = Math.max(0, r.benchmarkScore - currentScore);
    return {
      skillId: r.skillId,
      skillName: r.skill.name,
      currentScore,
      benchmarkScore: r.benchmarkScore,
      gap,
    };
  }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);

  // Find courses that match the top gap skills
  const topGapSkillIds = new Set(gaps.slice(0, 3).map(g => g.skillId));
  const relevantCourses = allCourses.filter(c => {
    try {
      const skillsCovered = JSON.parse(c.skillsCoveredJson);
      return skillsCovered.some((sc: any) => topGapSkillIds.has(sc.skillId));
    } catch {
      return false;
    }
  });

  // Build domain-specific project description
  const domainProjectExamples: Record<string, string> = {
    'Full-Stack Web': 'Microservices backend with TypeScript, PostgreSQL connection pooling, and real-time React dashboard.',
    'AI/Data Science': 'End-to-end RAG question-answering pipeline with PyTorch embeddings and fine-tuned Transformer model.',
    'Cloud/DevOps': 'Multi-region AWS Kubernetes deployment automated with GitHub Actions and Terraform state locking.',
    'UI/UX Product Design': 'Multi-brand Design System in Figma with WCAG AAA accessibility tokens and interactive prototype.',
    'Embedded/IoT': 'Real-time FreeRTOS sensor telemetry hub communicating over MQTT and low-power BLE protocol.',
  };

  const projectFocus = domainProjectExamples[domainName] || `Production-grade ${domainName} capstone project demonstrating verified competency.`;

  const milestones = [
    {
      id: 'm1',
      phase: 'Phase 01',
      timeframe: 'Month 1–2',
      title: `${domainName} Baseline Assessment`,
      description: `Establish your verified competency baseline against ${domainName} industry benchmarks.`,
      status: 'completed' as const,
      accentColor: 'campus-blue' as const,
      skillTags: [domainName, 'DSA', 'Fundamentals', requirements[0]?.skill.name || 'Core'],
      actions: [
        { text: `Complete standardized ${domainName} MCQ assessment`, link: `/assessment?domain=${encodeURIComponent(domainName)}`, isDone: true },
        { text: `Review ${gaps.length} identified competency gaps against benchmark standard`, link: '/skill-profile', isDone: true },
      ],
    },
    {
      id: 'm2',
      phase: 'Phase 02',
      timeframe: 'Month 3–6',
      title: `Targeted ${domainName} Remediation`,
      description: gaps.length > 0
        ? `Close identified gaps in ${gaps.slice(0, 2).map(g => g.skillName).join(' & ')} through accredited partner certifications.`
        : `Expand advanced mastery in ${domainName} core competencies with enterprise certifications.`,
      status: 'current' as const,
      accentColor: 'bridge-teal' as const,
      skillTags: gaps.length > 0 ? gaps.slice(0, 3).map(g => g.skillName) : [domainName, 'React', 'Node.js', 'Machine Learning'],
      actions: [
        ...(relevantCourses.length > 0
          ? relevantCourses.slice(0, 2).map(c => ({
              text: `Enroll in ${c.title} (${c.provider.name})`,
              link: '/courses',
              isDone: false,
            }))
          : [{ text: `Explore accredited courses mapped to ${domainName} skills`, link: '/courses', isDone: false }]),
        { text: 'Trigger server-side vector match recalculation', link: '/internships', isDone: false },
      ],
      recommendedCourses: relevantCourses.slice(0, 3).map(c => ({
        id: c.id,
        title: c.title,
        provider: c.provider.name,
        duration: c.duration,
        pointsGain: 20,
        externalUrl: c.externalUrl,
      })),
    },
    {
      id: 'm3',
      phase: 'Phase 03',
      timeframe: 'Month 7–12',
      title: `${domainName} Capstone & Portfolio`,
      description: `Build and showcase verified portfolio artifacts: ${projectFocus}`,
      status: 'upcoming' as const,
      accentColor: 'bridge-teal' as const,
      skillTags: ['System Design', 'Clean Code', domainName, 'Architecture'],
      actions: [
        { text: `Publish ${domainName} capstone project repository to GitHub`, link: '/portfolio', isDone: false },
        { text: `Generate ATS-optimized PDF resume tailored to ${domainName} roles`, link: '/resume-builder', isDone: false },
      ],
    },
    {
      id: 'm4',
      phase: 'Phase 04',
      timeframe: 'Month 13–24',
      title: `${domainName} Industry Fast-Track`,
      description: `Achieve >=80% match tier and submit verified applications to top ${domainName} recruiters.`,
      status: 'upcoming' as const,
      accentColor: 'industry-amber' as const,
      skillTags: ['Interview Prep', 'System Design', 'DSA', 'Cracking the Coding Interview'],
      actions: [
        { text: `Apply to top-ranked matched openings for ${domainName}`, link: '/internships', isDone: false },
        { text: 'Track recruiter shortlisting and technical interviews', link: '/dashboard', isDone: false },
      ],
    },
  ];

  // Populate curated books and YouTube recommendations for each milestone
  for (const m of milestones) {
    const { books, youtube } = await getCuratedRoadmapResources(m.skillTags, domainName);
    (m as any).recommendedBooks = books;
    (m as any).recommendedYoutube = youtube;
  }

  return res.json({
    domain: domainName,
    studentGapsCount: gaps.length,
    isRoleSpecific: false,
    milestones,
  });
});

/**
 * GET /api/students/:id/daily-target?date=YYYY-MM-DD
 * Retrieves or generates the AI-powered Daily Target for the student.
 * Once-per-calendar-day regeneration guarantee.
 */
router.get('/:id/daily-target', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    const dateQuery = req.query.date as string | undefined;

    const target = await getOrCreateDailyTarget(studentId, dateQuery);
    return res.json({ target });
  } catch (err: any) {
    console.error('❌ [DAILY_TARGET] Failed to get/create daily target:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to process daily target. Please try again.' } });
  }
});

/**
 * POST /api/students/:id/daily-target/complete
 * Explicitly marks the student's daily target for today as completed.
 */
router.post('/:id/daily-target/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    const dateQuery = req.body?.date as string | undefined;

    const updated = await markDailyTargetComplete(studentId, dateQuery);
    return res.json({ success: true, target: updated });
  } catch (err: any) {
    console.error('❌ [DAILY_TARGET] Failed to complete daily target:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to complete daily target. Please try again.' } });
  }
});



/**
 * GET /api/students/:id
 * Retrieve student profile, skills, benchmarks, streak, dynamic points, and structured portfolio
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      skillScores: {
        include: { skill: true },
      },
      enrollments: {
        include: {
          course: {
            include: { provider: true },
          },
        },
      },
      resumes: true,
      applications: true,
      targetInternship: {
        include: { industry: true },
      },
    },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  // Record daily activity
  await recordDailyActivity(student.userId);

  // Fetch benchmarks for target domain
  const benchmarks = await prisma.skillBenchmark.findMany({
    where: { domain: student.targetDomain },
    include: { skill: true },
  });

  // Calculate dynamic real points, ranking, and badges
  const rankStats = await calculateStudentActivityPoints(student.id);

  // Parse structured JSON arrays
  const parseJson = (str: string | null, defaultValue: any) => {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  };

  const experiences = parseJson(student.experiencesJson, []);
  const educations = parseJson(student.educationsJson, []);
  const projects = parseJson(student.projectsJson, []);
  const certificates = parseJson(student.certificatesJson, []);
  const responsibilities = parseJson(student.responsibilitiesJson, []);
  const achievements = parseJson(student.achievementsJson, []);
  const socials = parseJson(student.socialsJson, {});
  const customSkills = parseJson(student.customSkillsJson, []);

  // Format skills: combine verified assessment scores with any custom added skills
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];

  student.skillScores.forEach(ss => {
    if (ss.skill.category === 'soft') {
      softSkills.push(ss.skill.name);
    } else {
      technicalSkills.push(ss.skill.name);
    }
  });

  // Include custom tags
  if (Array.isArray(customSkills)) {
    customSkills.forEach((sk: string) => {
      if (!technicalSkills.includes(sk)) {
        technicalSkills.push(sk);
      }
    });
  }

  return res.json({
    student: {
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      email: student.user.email,
      phone: student.user.phone,
      avatarUrl: student.user.avatarUrl,
      institution: student.institution,
      targetDomain: student.targetDomain,
      cgpa: student.cgpa,
      bio: student.bio,
      gradYear: student.gradYear,
      githubUsername: student.githubUsername,
      linkedinUrl: student.linkedinUrl,
      headline: student.headline,
      location: student.location,
      resumeFileName: student.resumeFileName,
      targetInternshipId: student.targetInternshipId,
      targetInternship: student.targetInternship ? {
        id: student.targetInternship.id,
        title: student.targetInternship.title,
        companyName: student.targetInternship.industry.companyName,
        stipend: student.targetInternship.stipend,
        location: student.targetInternship.location,
        workMode: student.targetInternship.workMode,
      } : null,
      experiences,
      educations,
      projects,
      certificates,
      responsibilities,
      achievements,
      socials,
      technicalSkills,
      softSkills,
      skillScores: student.skillScores.map(ss => {
        let history: any[] = [];
        try {
          if (ss.scoreHistoryJson) history = JSON.parse(ss.scoreHistoryJson);
        } catch {}
        const delta = history.length > 0 && typeof history[0].delta === 'number' ? history[0].delta : 0;
        return {
          skillId: ss.skillId,
          skillName: ss.skill.name,
          category: ss.skill.category,
          score: ss.score,
          delta,
          inactivityDecayPct: ss.inactivityDecayPct,
          decayDaysCount: ss.decayDaysCount,
          lastAttemptDate: ss.lastAttemptDate,
          scoreHistory: history.slice(0, 5),
          updatedAt: ss.updatedAt,
        };
      }),
      benchmarks: benchmarks.map(b => ({
        skillId: b.skillId,
        skillName: b.skill.name,
        benchmarkScore: b.benchmarkScore,
      })),
      enrollments: student.enrollments.map(e => ({
        id: e.id,
        courseId: e.courseId,
        courseTitle: e.course.title,
        providerName: e.course.provider.name,
        status: e.status,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
      })),
      resumes: student.resumes,
      rankings: {
        totalPoints: rankStats.totalPoints,
        totalBadges: rankStats.totalBadges,
        level: rankStats.level,
        progressToNextLevel: rankStats.progressToNextLevel,
        currentStreak: rankStats.currentStreak,
        longestStreak: rankStats.longestStreak,
      },
      badges: rankStats.badges,
    },
  });
});

/**
 * PUT /api/students/:id/profile
 * Unified endpoint to persist all student portfolio sections directly to SQLite
 */
router.put('/:id/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const parseResult = SaveStudentProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message } });
  }

  const data = parseResult.data;

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  // Update user name and avatarUrl if provided
  if (data.name || data.avatarUrl) {
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: data.name || student.user.name,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : student.user.avatarUrl,
      },
    });
  }

  // Update studentProfile fields & JSON structures
  const updatedStudent = await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      bio: data.bio !== undefined ? data.bio : student.bio,
      headline: data.headline !== undefined ? data.headline : student.headline,
      location: data.location !== undefined ? data.location : student.location,
      institution: data.institution !== undefined ? data.institution : student.institution,
      resumeFileName: data.resumeFileName !== undefined ? data.resumeFileName : student.resumeFileName,
      experiencesJson: data.experiences !== undefined ? JSON.stringify(data.experiences) : student.experiencesJson,
      educationsJson: data.educations !== undefined ? JSON.stringify(data.educations) : student.educationsJson,
      projectsJson: data.projects !== undefined ? JSON.stringify(data.projects) : student.projectsJson,
      certificatesJson: data.certificates !== undefined ? JSON.stringify(data.certificates) : student.certificatesJson,
      responsibilitiesJson: data.responsibilities !== undefined ? JSON.stringify(data.responsibilities) : student.responsibilitiesJson,
      achievementsJson: data.achievements !== undefined ? JSON.stringify(data.achievements) : student.achievementsJson,
      socialsJson: data.socials !== undefined ? JSON.stringify(data.socials) : student.socialsJson,
      customSkillsJson: data.technicalSkills !== undefined ? JSON.stringify(data.technicalSkills) : student.customSkillsJson,
    },
    include: { user: true },
  });

  // Re-calculate dynamic points
  const rankStats = await calculateStudentActivityPoints(studentId);

  return res.json({
    message: 'Profile updated and saved to database successfully.',
    profile: updatedStudent,
    rankings: {
      totalPoints: rankStats.totalPoints,
      totalBadges: rankStats.totalBadges,
      level: rankStats.level,
      progressToNextLevel: rankStats.progressToNextLevel,
      currentStreak: rankStats.currentStreak,
      longestStreak: rankStats.longestStreak,
    },
  });
});

/**
 * POST /api/students/:id/activity
 * Register daily activity / streak heartbeat
 */
router.post('/:id/activity', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return res.status(404).json({ error: { message: 'Student not found' } });
  }

  const streakResult = await recordDailyActivity(student.userId);
  return res.json({ streak: streakResult });
});

/**
 * PUT /api/students/:id
 * Update individual student basic fields
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const parseResult = UpdateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message } });
  }

  const { name, bio, targetDomain, cgpa, gradYear, githubUsername, linkedinUrl } = parseResult.data;

  const updated = await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      bio: bio !== undefined ? bio : undefined,
      targetDomain: targetDomain !== undefined ? targetDomain : undefined,
      cgpa: cgpa !== undefined ? cgpa : undefined,
      gradYear: gradYear !== undefined ? gradYear : undefined,
      githubUsername: githubUsername !== undefined ? githubUsername : undefined,
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
      user: name ? { update: { name } } : undefined,
    },
    include: { user: true },
  });

  return res.json({ message: 'Profile updated successfully', profile: updated });
});

/**
 * GET /api/students/:id/matches
 * SINGLE SOURCE OF TRUTH for match percentages across the platform
 */
router.get('/:id/matches', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  try {
    const matches = await calculateStudentMatches(studentId);
    return res.json({ matches });
  } catch (error) {
    console.error('Matches computation error:', error);
    return res.status(500).json({ error: { code: 'MATCHING_ERROR', message: 'Could not compute match scores.' } });
  }
});

/**
 * POST /api/students/:id/assessment
 * Submits assessment and updates skill scores
 */
router.post('/:id/assessment', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  const parseResult = AssessmentSubmitSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid assessment submission.' } });
  }

  const { domain, answers } = parseResult.data;

  try {
    const result = await gradeAssessment(studentId, domain, answers);
    return res.json({
      message: 'Assessment evaluated successfully. Skill scores updated.',
      result,
    });
  } catch (error) {
    console.error('Assessment grading error:', error);
    return res.status(500).json({ error: { code: 'ASSESSMENT_ERROR', message: 'Could not grade assessment.' } });
  }
});

/**
 * GET /api/students/:id/portfolio
 * Returns the derived, verified digital portfolio
 */
router.get('/:id/portfolio', async (req, res) => {
  const studentId = req.params.id;
  try {
    const portfolio = await getDerivedPortfolio(studentId);
    return res.json({ portfolio });
  } catch (error) {
    console.error('Portfolio error:', error);
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found.' } });
  }
});

/**
 * GET /api/students/:id/activity-heatmap
 * Returns verified GitHub-style activity contribution graph and server stats for the year
 */
router.get('/:id/activity-heatmap', authenticate, async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
    }

    const heatmap = await getUserActivityHeatmap(student.userId, year);
    return res.json(heatmap);
  } catch (error: any) {
    console.error('Heatmap calculation error:', error);
    return res.status(500).json({ error: { code: 'HEATMAP_ERROR', message: error.message || 'Could not compute activity heatmap.' } });
  }
});

/**
 * POST /api/students/:id/avatar
 * Uploads a profile avatar photo, validates file type and size (5MB), and updates user record
 */
router.post('/:id/avatar', authenticate, avatarUpload.single('file'), async (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No image file uploaded.' } });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found.' } });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  // Update both User and StudentProfile
  await prisma.user.update({
    where: { id: student.userId },
    data: { avatarUrl },
  });

  return res.json({
    message: 'Avatar uploaded successfully',
    avatarUrl,
  });
});

export default router;
