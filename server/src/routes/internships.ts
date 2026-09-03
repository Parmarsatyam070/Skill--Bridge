import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { PostInternshipSchema } from '../../../shared/validation.js';
import { calculateStudentMatches, calculateSingleMatch } from '../services/matchingEngine.js';
import { RequiredSkill } from '../../../shared/types.js';

const router = Router();

/**
 * GET /api/internships
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.query.studentId as string;
  const industryId = req.query.industryId as string;

  const internships = await prisma.internship.findMany({
    where: {
      industryId: industryId || undefined,
      status: industryId ? undefined : 'OPEN',
    },
    include: {
      industry: true,
      _count: { select: { applications: true } },
    },
    orderBy: { postedAt: 'desc' },
  });

  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map(allSkills.map(s => [s.id, s.name]));

  // If studentId provided, fetch authoritative match scores
  let studentMatchesMap = new Map<string, { overallScore: number; tier: 'high' | 'medium' | 'low'; applied: boolean }>();
  if (studentProfileId) {
    const matches = await calculateStudentMatches(studentProfileId);
    const existingApps = await prisma.application.findMany({
      where: { studentId: studentProfileId },
      select: { internshipId: true }
    });
    const appliedSet = new Set(existingApps.map(a => a.internshipId));

    matches.forEach(m => {
      studentMatchesMap.set(m.internshipId, {
        overallScore: m.overallScore,
        tier: m.tier,
        applied: appliedSet.has(m.internshipId)
      });
    });
  }

  const formatted = internships.map(j => {
    let requiredSkills: RequiredSkill[] = [];
    try {
      requiredSkills = JSON.parse(j.requiredSkillsJson);
    } catch {}

    const enrichedSkills = requiredSkills.map(rs => ({
      skillId: rs.skillId,
      skillName: skillMap.get(rs.skillId) || 'Skill',
      weight: rs.weight,
      minScore: rs.minScore,
    }));

    const matchInfo = studentMatchesMap.get(j.id);

    return {
      id: j.id,
      industryId: j.industryId,
      companyName: j.industry.companyName,
      companyWebsite: j.industry.website,
      title: j.title,
      description: j.description,
      requiredSkills: enrichedSkills,
      stipend: j.stipend,
      location: j.location,
      workMode: j.workMode,
      status: j.status,
      postedAt: j.postedAt,
      applicantCount: j._count.applications,
      matchScore: matchInfo ? matchInfo.overallScore : undefined,
      matchTier: matchInfo ? matchInfo.tier : undefined,
      applied: matchInfo ? matchInfo.applied : false,
    };
  });

  return res.json({ internships: formatted });
});

/**
 * POST /api/internships
 * Post new internship (Industry only)
 */
router.post('/', authenticate, requireRole(['INDUSTRY']), async (req: AuthRequest, res: Response) => {
  const parseResult = PostInternshipSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0]?.message }
    });
  }

  const industryProfileId = req.user?.industryProfileId;
  if (!industryProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Industry profile not found.' } });
  }

  const data = parseResult.data;

  const internship = await prisma.internship.create({
    data: {
      industryId: industryProfileId,
      title: data.title,
      description: data.description,
      requiredSkillsJson: JSON.stringify(data.requiredSkills),
      stipend: data.stipend,
      location: data.location,
      workMode: data.workMode,
      status: 'OPEN',
    },
    include: { industry: true }
  });

  return res.status(201).json({ message: 'Internship posted successfully', internship });
});

/**
 * PUT /api/internships/:id/status
 */
router.put('/:id/status', authenticate, requireRole(['INDUSTRY']), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['OPEN', 'CLOSED', 'DRAFT'].includes(status)) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid status' } });
  }

  const updated = await prisma.internship.update({
    where: { id: req.params.id },
    data: { status }
  });

  return res.json({ message: 'Internship status updated', internship: updated });
});

/**
 * GET /api/internships/:id/applicants
 * Returns ranked applicants for an internship with live match breakdowns
 */
router.get('/:id/applicants', authenticate, requireRole(['INDUSTRY']), async (req: AuthRequest, res: Response) => {
  const internshipId = req.params.id;

  const applications = await prisma.application.findMany({
    where: { internshipId },
    include: {
      student: {
        include: {
          user: true,
          skillScores: { include: { skill: true } }
        }
      },
      resume: true,
    },
    orderBy: { matchScoreAtApply: 'desc' }
  });

  // Calculate current live match breakdown for each applicant
  const rankedApplicants = await Promise.all(
    applications.map(async app => {
      const liveBreakdown = await calculateSingleMatch(app.studentId, internshipId);
      return {
        id: app.id,
        studentId: app.student.id,
        studentName: app.student.user.name,
        studentEmail: app.student.user.email,
        avatarUrl: app.student.user.avatarUrl,
        institution: app.student.institution,
        targetDomain: app.student.targetDomain,
        cgpa: app.student.cgpa,
        githubUsername: app.student.githubUsername,
        linkedinUrl: app.student.linkedinUrl,
        status: app.status,
        matchScoreAtApply: app.matchScoreAtApply,
        currentMatchScore: liveBreakdown ? liveBreakdown.overallScore : app.matchScoreAtApply,
        matchTier: liveBreakdown ? liveBreakdown.tier : 'medium',
        coverNote: app.coverNote,
        resume: app.resume,
        appliedAt: app.appliedAt,
        breakdown: liveBreakdown,
      };
    })
  );

  // Sort descending by current match score
  rankedApplicants.sort((a, b) => b.currentMatchScore - a.currentMatchScore);

  return res.json({ applicants: rankedApplicants });
});

export default router;
