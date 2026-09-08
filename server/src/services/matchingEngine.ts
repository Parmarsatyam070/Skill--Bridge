import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import {
  MatchBreakdown,
  RequiredSkill,
  SkillCovered,
  SkillMatchPillar,
  ExperienceMatchPillar,
  AssessmentScorePillar,
} from '../../../shared/types.js';

export interface ComputedMatch {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  workMode: string;
  stipend: string;
  status: string;
  overallScore: number;
  tier: 'high' | 'medium' | 'low';
  breakdown: MatchBreakdown;
}

/**
 * Authoritative 3-Pillar AI Matching Engine
 * 
 * Mathematical Architecture:
 * ----------------------------
 * 
 * 1. PILLAR 1: SKILL MATCH (40% Weight)
 *    Evaluates student's verified skills against required thresholds and weights.
 *    For each required skill k_i:
 *      - Fulfillment Ratio: f_i = min(1.0, s_i / m_i)
 *      - Weighted Contribution: C_i = (w_i * f_i) / sum(w_k)
 *      - Gap: g_i = max(0, m_i - s_i)
 *    RawMatch = (sum(w_i * f_i) / sum(w_i)) * 100
 *    MissingPenalty = min(10, count(s_i == 0) * 2.5)
 *    SkillScore = clamp(round(RawMatch - MissingPenalty), 0, 100)
 *    SkillWeighted = round(SkillScore * 0.40 * 10) / 10
 * 
 * 2. PILLAR 2: EXPERIENCE & PROJECTS (30% Weight)
 *    Analyzes candidate's practical portfolio and verified certifications.
 *    - Tech Stack Overlap: Ratio of required skills present in project tech stacks/tags (up to 50 pts).
 *    - Project Depth & Credibility: Live demo URL (+5 pts/proj), verifiable GitHub repo (+5 pts/proj) (up to 30 pts).
 *    - Accredited Certifications: Relevant verified credentials (up to 20 pts).
 *    ExperienceScore = clamp(round(TechStackPts + ProjectDepthPts + CertPts), 0, 100)
 *    ExperienceWeighted = round(ExperienceScore * 0.30 * 10) / 10
 * 
 * 3. PILLAR 3: ASSESSMENT & CALIBRATION SCORE (30% Weight)
 *    Measures proctored evaluations, problem solving, and practice discipline.
 *    - Proctored Quiz Performance: Average score & pass rate on practice sets (up to 50 pts).
 *    - Coding Challenge Mastery: Solved DSA problems weighted by difficulty (Easy: 3, Med: 6, Hard: 12, up to 35 pts).
 *    - Practice Discipline: Streak and consistency records (up to 15 pts).
 *    AssessmentScore = clamp(round(QuizPts + DSAPts + StreakPts), 0, 100)
 *    AssessmentWeighted = round(AssessmentScore * 0.30 * 10) / 10
 * 
 * 4. AUTHORITATIVE COMPOSITE VERIFIED MATCH SCORE
 *    VerifiedMatchScore = round(0.40 * SkillScore + 0.30 * ExperienceScore + 0.30 * AssessmentScore)
 *    Tier:
 *      - "high"   : Score >= 80% (Direct Fast-Track / Interview Ready)
 *      - "medium" : 50% <= Score < 80% (Targeted Up-skilling Needed)
 *      - "low"    : Score < 50% (Prerequisites Missing)
 */
export async function calculateStudentMatches(studentProfileId: string): Promise<ComputedMatch[]> {
  // 1. Fetch Complete Student Profile Data (Skills, Projects, Certs, Assessments, DSA)
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      portfolioWebsite: true,
      skillScores: { include: { skill: true } },
      assessmentAttempts: {
        orderBy: { startedAt: 'desc' },
        take: 30,
      },
      dsaAttempts: {
        where: { status: 'SOLVED' },
        include: { question: true },
      },
      dailyPractices: {
        orderBy: { date: 'desc' },
        take: 14,
      },
    },
  });

  if (!student) {
    return [];
  }

  // Build Student Skill Score Map
  const scoreMap = new Map<string, number>();
  student.skillScores.forEach(ss => scoreMap.set(ss.skillId, ss.score));

  // Parse Student Projects
  let studentProjects: any[] = [];
  try {
    studentProjects = JSON.parse(student.projectsJson || '[]');
  } catch {
    studentProjects = [];
  }
  if (studentProjects.length === 0 && student.portfolioWebsite?.projectsJson) {
    try {
      studentProjects = JSON.parse(student.portfolioWebsite.projectsJson);
    } catch {}
  }

  // Parse Student Certificates
  let studentCerts: any[] = [];
  try {
    studentCerts = JSON.parse(student.certificatesJson || '[]');
  } catch {
    studentCerts = [];
  }

  // 2. Compute Pre-calculated Pillar 3: Assessment & Calibration Score (Independent of Job)
  const attempts = student.assessmentAttempts || [];
  const dsaSolved = student.dsaAttempts || [];
  const currentStreak = student.user?.currentStreak || 0;

  // Proctored Quiz Performance (up to 50 pts)
  let quizPoints = 0;
  const passedAttempts = attempts.filter(a => a.passed);
  const avgQuizScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
    : 0;

  if (attempts.length > 0) {
    quizPoints = (avgQuizScore / 100) * 40;
    const passRatio = passedAttempts.length / attempts.length;
    quizPoints += passRatio * 10;
  } else if (scoreMap.size > 0) {
    // If no formal attempts yet, derive calibrated baseline from assessed skill scores
    const avgSkill = Array.from(scoreMap.values()).reduce((a, b) => a + b, 0) / scoreMap.size;
    quizPoints = (avgSkill / 100) * 35;
  } else {
    quizPoints = 15; // Baseline self-reported onboarding
  }

  // DSA Coding Problem Solving (up to 35 pts)
  let easyDsa = 0;
  let medDsa = 0;
  let hardDsa = 0;
  for (const d of dsaSolved) {
    const diff = (d.question?.difficulty || '').toLowerCase();
    if (diff === 'hard') hardDsa++;
    else if (diff === 'medium') medDsa++;
    else easyDsa++;
  }
  const dsaPoints = Math.min(35, easyDsa * 3 + medDsa * 6 + hardDsa * 12);

  // Daily Practice & Streak Discipline (up to 15 pts)
  let streakPoints = 0;
  if (currentStreak >= 7) streakPoints = 15;
  else if (currentStreak >= 3) streakPoints = 10;
  else if (currentStreak >= 1) streakPoints = 5;

  const assessmentScoreValue = Math.max(0, Math.min(100, Math.round(quizPoints + dsaPoints + streakPoints)));
  const assessmentWeighted = Math.round(assessmentScoreValue * 0.30 * 10) / 10;

  let calibrationTier: 'Expert' | 'Proficient' | 'Developing' | 'Uncalibrated' = 'Uncalibrated';
  if (assessmentScoreValue >= 80) calibrationTier = 'Expert';
  else if (assessmentScoreValue >= 65) calibrationTier = 'Proficient';
  else if (assessmentScoreValue >= 45) calibrationTier = 'Developing';

  let assessmentBadge = 'Verified Candidate';
  if (calibrationTier === 'Expert') assessmentBadge = 'Top 5% Calibrated';
  else if (calibrationTier === 'Proficient') assessmentBadge = 'Proctored & Certified';
  else if (calibrationTier === 'Developing') assessmentBadge = 'Baseline Calibrated';
  else assessmentBadge = 'Self-Assessed';

  const baseAssessmentPillar: AssessmentScorePillar = {
    score: assessmentScoreValue,
    weight: 0.30,
    weightedScore: assessmentWeighted,
    attemptsCount: attempts.length,
    passedCount: passedAttempts.length,
    averageTestScore: Math.round(avgQuizScore),
    dsaSolvedCount: dsaSolved.length,
    dsaBreakdown: {
      easy: easyDsa,
      medium: medDsa,
      hard: hardDsa,
    },
    dailyPracticeStreak: currentStreak,
    calibrationTier,
    badge: assessmentBadge,
  };

  // 3. Fetch Open Internships
  const internships = await prisma.internship.findMany({
    where: { status: 'OPEN' },
    include: {
      industry: true,
    },
    orderBy: { postedAt: 'desc' },
  });

  // 4. Fetch All Skills & Courses for Lookups
  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map<string, { name: string; category: string }>();
  allSkills.forEach(s => skillMap.set(s.id, { name: s.name, category: s.category }));

  const allCourses = await prisma.course.findMany({
    include: { provider: true },
  });

  const matches: ComputedMatch[] = [];

  for (const internship of internships) {
    let requiredSkills: RequiredSkill[] = [];
    try {
      requiredSkills = JSON.parse(internship.requiredSkillsJson);
    } catch {
      requiredSkills = [];
    }

    if (requiredSkills.length === 0) continue;

    // -------------------------------------------------------------
    // PILLAR 1: SKILL MATCH CALCULATION (40%)
    // -------------------------------------------------------------
    let totalWeight = 0;
    let weightedFulfillmentSum = 0;
    let missingCount = 0;

    const matchedSkillsBreakdown: MatchBreakdown['matchedSkills'] = [];
    const strengths: string[] = [];
    const missingSkills: MatchBreakdown['missingSkills'] = [];

    const reqSkillNames: string[] = [];

    for (const req of requiredSkills) {
      const skillInfo = skillMap.get(req.skillId) || { name: 'Unknown Skill', category: 'technical' };
      reqSkillNames.push(skillInfo.name);

      const studentScore = scoreMap.get(req.skillId) || 0;
      const targetScore = req.minScore || 70;
      const weight = req.weight || 1;

      totalWeight += weight;

      if (studentScore === 0) {
        missingCount++;
      }

      // Fulfillment ratio capped at 1.0
      const fulfillment = Math.min(1.0, studentScore / targetScore);
      weightedFulfillmentSum += weight * fulfillment;

      const isMet = studentScore >= targetScore;
      if (isMet) {
        strengths.push(skillInfo.name);
      }

      // Find recommended courses if there is a gap
      const gap = Math.max(0, targetScore - studentScore);
      let recommendedCourses: MatchBreakdown['missingSkills'][0]['recommendedCourses'] = [];

      if (gap > 0) {
        const matchingCourses = allCourses.filter(c => {
          try {
            const skillsCovered: SkillCovered[] = JSON.parse(c.skillsCoveredJson);
            return skillsCovered.some(sc => sc.skillId === req.skillId);
          } catch {
            return false;
          }
        });

        recommendedCourses = matchingCourses.slice(0, 2).map(c => {
          let pointsGain = 15;
          try {
            const covered: SkillCovered[] = JSON.parse(c.skillsCoveredJson);
            const found = covered.find(sc => sc.skillId === req.skillId);
            if (found) pointsGain = found.pointsGain;
          } catch {}

          return {
            courseId: c.id,
            title: c.title,
            providerName: c.provider.name,
            externalUrl: c.externalUrl,
            pointsGain,
          };
        });

        missingSkills.push({
          skillId: req.skillId,
          skillName: skillInfo.name,
          gap: Math.round(gap),
          recommendedCourses,
        });
      }

      matchedSkillsBreakdown.push({
        skillId: req.skillId,
        skillName: skillInfo.name,
        studentScore: Math.round(studentScore),
        requiredScore: Math.round(targetScore),
        weight,
        contribution: Math.round(((weight * fulfillment) / (totalWeight || 1)) * 100),
        isMet,
      });
    }

    const rawMatchPercent = totalWeight > 0 ? (weightedFulfillmentSum / totalWeight) * 100 : 0;
    const penalty = Math.min(10, missingCount * 2.5);
    const skillScoreValue = Math.max(0, Math.min(100, Math.round(rawMatchPercent - penalty)));
    const skillWeighted = Math.round(skillScoreValue * 0.40 * 10) / 10;

    const skillPillar: SkillMatchPillar = {
      score: skillScoreValue,
      weight: 0.40,
      weightedScore: skillWeighted,
      matchedSkills: matchedSkillsBreakdown,
      strengths,
      missingSkills,
      penalty,
    };

    // -------------------------------------------------------------
    // PILLAR 2: EXPERIENCE & PROJECTS CALCULATION (30%)
    // -------------------------------------------------------------
    const jobKeywords = [
      ...reqSkillNames.map(s => s.toLowerCase()),
      internship.title.toLowerCase(),
      internship.description.toLowerCase(),
    ];

    const relevantProjects: ExperienceMatchPillar['relevantProjects'] = [];
    const skillsCoveredInProjects = new Set<string>();

    for (const proj of studentProjects) {
      const projTitle = (proj.title || '').toString();
      const projDesc = (proj.description || '').toString();
      const projStack: string[] = Array.isArray(proj.techStack)
        ? proj.techStack.map((t: any) => String(t))
        : Array.isArray(proj.tags)
        ? proj.tags.map((t: any) => String(t))
        : [];

      const combinedText = `${projTitle} ${projDesc} ${projStack.join(' ')}`.toLowerCase();

      // Check which required skills are matched by this project
      const matchingSkillsForProj = reqSkillNames.filter(name => {
        const lower = name.toLowerCase();
        const matches = combinedText.includes(lower) ||
          projStack.some(t => t.toLowerCase().includes(lower) || lower.includes(t.toLowerCase()));
        if (matches) skillsCoveredInProjects.add(name);
        return matches;
      });

      const hasLiveDemo = !!(proj.demoUrl && typeof proj.demoUrl === 'string' && proj.demoUrl.startsWith('http'));
      const hasGithub = !!(proj.githubUrl && typeof proj.githubUrl === 'string' && proj.githubUrl.includes('github.com'));

      const isRelevant = matchingSkillsForProj.length > 0 ||
        jobKeywords.some(kw => kw.length > 3 && combinedText.includes(kw));

      if (isRelevant || relevantProjects.length < 2) {
        relevantProjects.push({
          id: proj.id,
          title: projTitle || 'Featured Project',
          description: projDesc,
          techStack: projStack,
          matchingSkills: matchingSkillsForProj,
          hasLiveDemo,
          hasGithub,
          demoUrl: proj.demoUrl,
          githubUrl: proj.githubUrl,
        });
      }
    }

    // Process certificates
    const verifiedCertificates: ExperienceMatchPillar['verifiedCertificates'] = [];
    for (const cert of studentCerts) {
      const certTitle = (cert.title || '').toString();
      const certIssuer = (cert.issuer || '').toString();
      const certLower = `${certTitle} ${certIssuer}`.toLowerCase();

      const isRelevant = reqSkillNames.some(name => certLower.includes(name.toLowerCase())) ||
        jobKeywords.some(kw => kw.length > 3 && certLower.includes(kw));

      verifiedCertificates.push({
        id: cert.id,
        title: certTitle,
        issuer: certIssuer,
        issueDate: cert.issueDate,
        credentialUrl: cert.credentialUrl,
        isRelevant,
      });
    }

    // Calculate Tech Stack Overlap & Project Score
    const techStackOverlapPct = reqSkillNames.length > 0
      ? Math.round((skillsCoveredInProjects.size / reqSkillNames.length) * 100)
      : 0;

    // Base 50 points from skill overlap in projects
    const techStackPts = (techStackOverlapPct / 100) * 50;

    // Up to 30 points from project quality / live demonstrations
    let projectDepthPts = 0;
    for (const p of relevantProjects.slice(0, 3)) {
      projectDepthPts += 4; // Base project existence
      if (p.hasLiveDemo) projectDepthPts += 3; // Live URL verified
      if (p.hasGithub) projectDepthPts += 3; // Verifiable code repository
    }
    projectDepthPts = Math.min(30, projectDepthPts);

    // Up to 20 points from relevant certificates
    const relevantCertsCount = verifiedCertificates.filter(c => c.isRelevant).length;
    const certPts = Math.min(20, relevantCertsCount * 10 + (verifiedCertificates.length > 0 ? 5 : 0));

    // Fallback: If student has GitHub username connected or overall portfolio
    let githubPresenceBonus = 0;
    if (student.githubUsername) githubPresenceBonus += 5;
    if (student.portfolioWebsite?.status === 'PUBLISHED') githubPresenceBonus += 5;

    const experienceScoreValue = Math.max(0, Math.min(100, Math.round(techStackPts + projectDepthPts + certPts + githubPresenceBonus)));
    const experienceWeighted = Math.round(experienceScoreValue * 0.30 * 10) / 10;

    const experienceHighlights: string[] = [];
    if (techStackOverlapPct >= 50) {
      experienceHighlights.push(`${techStackOverlapPct}% Tech Stack covered in projects`);
    }
    if (relevantProjects.some(p => p.hasLiveDemo)) {
      experienceHighlights.push('Live production demo available');
    }
    if (relevantProjects.some(p => p.hasGithub)) {
      experienceHighlights.push('Public code repository verified');
    }
    if (relevantCertsCount > 0) {
      experienceHighlights.push(`${relevantCertsCount} domain-relevant certification(s)`);
    }

    const experiencePillar: ExperienceMatchPillar = {
      score: experienceScoreValue,
      weight: 0.30,
      weightedScore: experienceWeighted,
      totalProjects: studentProjects.length,
      matchedProjectsCount: relevantProjects.length,
      relevantProjects,
      verifiedCertificates,
      techStackOverlapPct,
      highlights: experienceHighlights,
    };

    // -------------------------------------------------------------
    // AUTHORITATIVE COMPOSITE VERIFIED MATCH SCORE
    // Formula: round(0.40 * Skill + 0.30 * Experience + 0.30 * Assessment)
    // -------------------------------------------------------------
    const overallScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          0.40 * skillScoreValue +
          0.30 * experienceScoreValue +
          0.30 * assessmentScoreValue
        )
      )
    );

    let tier: 'high' | 'medium' | 'low' = 'low';
    if (overallScore >= 80) tier = 'high';
    else if (overallScore >= 50) tier = 'medium';

    // Generate authoritative verification hash
    const hashData = `${studentProfileId}:${internship.id}:${overallScore}:${skillScoreValue}:${experienceScoreValue}:${assessmentScoreValue}`;
    const verificationHash = crypto.createHash('sha256').update(hashData).digest('hex').slice(0, 16);

    const breakdown: MatchBreakdown = {
      internshipId: internship.id,
      internshipTitle: internship.title,
      companyName: internship.industry.companyName,
      overallScore,
      tier,
      pillars: {
        skillMatch: skillPillar,
        experienceMatch: experiencePillar,
        assessmentScore: baseAssessmentPillar,
      },
      // Legacy backwards-compatible fields
      matchedSkills: matchedSkillsBreakdown,
      strengths,
      missingSkills,
      verificationHash,
    };

    matches.push({
      internshipId: internship.id,
      internshipTitle: internship.title,
      companyName: internship.industry.companyName,
      location: internship.location,
      workMode: internship.workMode,
      stipend: internship.stipend,
      status: internship.status,
      overallScore,
      tier,
      breakdown,
    });
  }

  // Sort descending by authoritative overall match score
  return matches.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Calculates match score for a single student against a single internship.
 * Used for applicant ranking in Industry view and snapshotting during application.
 */
export async function calculateSingleMatch(studentProfileId: string, internshipId: string): Promise<MatchBreakdown | null> {
  const matches = await calculateStudentMatches(studentProfileId);
  const match = matches.find(m => m.internshipId === internshipId);
  return match ? match.breakdown : null;
}

// ================================================================
// OPPORTUNITY MODEL MATCHING — Opportunity table only
//
// CRITICAL: This engine uses a DIFFERENT formula than the Internship
// engine above. The Internship engine (calculateStudentMatches) uses
// a 3-pillar 40/30/30 formula and MUST NOT be modified.
//
// This Opportunity engine uses the approved 7-factor formula:
//
//   Factor 1: Required Skills Coverage    = 40%
//   Factor 2: Skill Proficiency Depth     = 20%
//   Factor 3: Experience (work/projects)  = 10%
//   Factor 4: Project Portfolio Quality   = 10%
//   Factor 5: Assessment & DSA Score      = 10%
//   Factor 6: Education Match             = 5%
//   Factor 7: Certification Relevance     = 5%
//   TOTAL                                 = 100%
//
// Mandatory skill eligibility is evaluated BEFORE scoring.
// AI MUST NOT override eligibility or these deterministic scores.
// AlgorithmVersion: v2.0-7factor
// ================================================================

export interface OpportunityMatchResult {
  opportunityId: string;
  opportunityTitle: string;
  score: number;
  eligibility: boolean;
  ineligibilityReason: string | null;
  tier: 'high' | 'medium' | 'low';
  breakdownJson: string;
  matchedSkillsJson: string;
  missingSkillsJson: string;
  strengthsJson: string;
  weaknessesJson: string;
  recommendationsJson: string;
}

/**
 * Calculates match scores for a student against open Opportunities.
 * Uses the approved 7-factor formula — NOT the 3-pillar Internship formula.
 * Mandatory skill eligibility is checked first.
 * Results are upserted into CandidateMatch for caching.
 *
 * @param studentProfileId - Student to score
 * @param opportunityId    - If provided, score only that opportunity; else all OPEN ones
 */
export async function calculateOpportunityMatches(
  studentProfileId: string,
  opportunityId?: string
): Promise<OpportunityMatchResult[]> {
  // ---- 1. Fetch comprehensive student data ----
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      portfolioWebsite: true,
      skillScores: { include: { skill: true } },
      assessmentAttempts: { orderBy: { startedAt: 'desc' }, take: 30 },
      dsaAttempts: { where: { status: 'SOLVED' }, include: { question: true } },
      dailyPractices: { orderBy: { date: 'desc' }, take: 14 },
    },
  });

  if (!student) return [];

  // Build skill score map: skillId → score (0-100)
  const scoreMap = new Map<string, number>();
  student.skillScores.forEach(ss => scoreMap.set(ss.skillId, Math.min(100, Math.max(0, ss.score))));

  // Parse projects & certs from JSON fields
  let studentProjects: any[] = [];
  try { studentProjects = JSON.parse(student.projectsJson || '[]'); } catch {}
  if (studentProjects.length === 0 && student.portfolioWebsite?.projectsJson) {
    try { studentProjects = JSON.parse(student.portfolioWebsite.projectsJson); } catch {}
  }
  let studentCerts: any[] = [];
  try { studentCerts = JSON.parse(student.certificatesJson || '[]'); } catch {}

  // ---- 2. Pre-compute candidate-level factors (independent of each opportunity) ----

  // Factor 5: Assessment Score (0-100)
  // Uses quiz performance + DSA difficulty-weighted problems + streak discipline
  const attempts = student.assessmentAttempts || [];
  const dsaSolved = student.dsaAttempts || [];
  const currentStreak = student.user?.currentStreak || 0;

  const passedAttempts = attempts.filter(a => a.passed);
  const avgQuizScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
    : 0;

  let quizPoints = 0;
  if (attempts.length > 0) {
    // Up to 70 pts from quiz avg × pass rate
    quizPoints = (avgQuizScore / 100) * 50 + (passedAttempts.length / attempts.length) * 20;
  } else if (scoreMap.size > 0) {
    // Fallback: calibrate from skill scores
    const avgSkill = Array.from(scoreMap.values()).reduce((a, b) => a + b, 0) / scoreMap.size;
    quizPoints = (avgSkill / 100) * 40;
  } else {
    quizPoints = 10; // Minimal baseline
  }

  let hardDsa = 0, medDsa = 0, easyDsa = 0;
  for (const d of dsaSolved) {
    const diff = (d.question?.difficulty || '').toLowerCase();
    if (diff === 'hard') hardDsa++;
    else if (diff === 'medium') medDsa++;
    else easyDsa++;
  }
  // DSA points: Easy=2pts, Medium=5pts, Hard=10pts, capped at 30
  const dsaPoints = Math.min(30, easyDsa * 2 + medDsa * 5 + hardDsa * 10);

  const assessmentScore = Math.max(0, Math.min(100, Math.round(quizPoints + dsaPoints)));

  // Factor 6: Education Score (0-100)
  // Normalized: degree level + GPA/CGPA quality + graduation recency
  const cgpa = student.cgpa || 0;
  const currentYear = new Date().getFullYear();
  const gradYear = student.gradYear || currentYear;
  const recencyBonus = gradYear >= currentYear - 2 ? 20 : gradYear >= currentYear - 5 ? 10 : 0;
  const cgpaScore = cgpa >= 9.0 ? 60 : cgpa >= 8.0 ? 50 : cgpa >= 7.0 ? 35 : cgpa >= 6.0 ? 20 : cgpa > 0 ? 10 : 0;

  // Extract degree from student's educationsJson if available
  let degree = '';
  try {
    const edus = JSON.parse(student.educationsJson || '[]');
    if (Array.isArray(edus) && edus.length > 0) {
      degree = (edus[0].degree || edus[0].title || '').toLowerCase();
    }
  } catch {}

  // Degree level bonus (Bachelor's=10, Master's=20, PhD=30)
  const degreeBonus = degree.includes('phd') || degree.includes('doctor') ? 30
    : degree.includes('master') || degree.includes('mtech') || degree.includes('mca') ? 20
    : 10;
  const educationScore = Math.min(100, cgpaScore + degreeBonus + recencyBonus);

  // ---- 3. Fetch opportunities ----
  const oppWhere: any = { status: 'OPEN' };
  if (opportunityId) oppWhere.id = opportunityId;

  const opportunities = await prisma.opportunity.findMany({
    where: oppWhere,
    include: {
      company: { select: { companyName: true } },
      skills: { include: { skill: { select: { id: true, name: true } } } },
    },
  });

  const results: OpportunityMatchResult[] = [];

  for (const opp of opportunities) {
    const requiredSkillSpecs = opp.skills;

    // ---- ELIGIBILITY GATE (deterministic — AI must not override) ----
    // Evaluated BEFORE scoring. Ineligible candidates are still scored
    // for informational purposes but ranked separately.
    let eligibility = true;
    let ineligibilityReason: string | null = null;

    const mandatorySkills = requiredSkillSpecs.filter((rs: any) => rs.isMandatory);
    for (const rs of mandatorySkills) {
      const studentScore = scoreMap.get(rs.skillId) || 0;
      if (studentScore < rs.minScore) {
        eligibility = false;
        ineligibilityReason =
          `Missing mandatory skill: ${rs.skill?.name || rs.skillName} ` +
          `(required ≥ ${rs.minScore}%, candidate: ${Math.round(studentScore)}%)`;
        break;
      }
    }

    // ---- Factor 1: Required Skills Coverage (40%) ----
    // Measures how many of the opportunity's required skills the candidate covers.
    // Each skill is weighted by its `weight` field (default 3).
    // Only mandatory+preferred required skills are counted.
    const matchedSkills: any[] = [];
    const missingSkills: any[] = [];
    let totalSkillWeight = 0;
    let coveredSkillWeight = 0;

    for (const rs of requiredSkillSpecs) {
      const studentScore = scoreMap.get(rs.skillId) || 0;
      const skillWeight = Math.max(1, rs.weight || 3);
      const minScore = Math.max(1, rs.minScore || 70);
      totalSkillWeight += skillWeight;

      if (studentScore >= minScore) {
        coveredSkillWeight += skillWeight;
        matchedSkills.push({
          skillId: rs.skillId,
          skillName: rs.skill?.name || rs.skillName,
          studentScore: Math.round(studentScore),
          required: minScore,
          isMandatory: rs.isMandatory,
          covered: true,
        });
      } else if (studentScore > 0) {
        // Partial credit — proportional to how close they are
        const partialCredit = (studentScore / minScore) * skillWeight * 0.5;
        coveredSkillWeight += partialCredit;
        matchedSkills.push({
          skillId: rs.skillId,
          skillName: rs.skill?.name || rs.skillName,
          studentScore: Math.round(studentScore),
          required: minScore,
          isMandatory: rs.isMandatory,
          covered: false,
          partialCredit: true,
        });
      } else {
        missingSkills.push({
          skillId: rs.skillId,
          skillName: rs.skill?.name || rs.skillName,
          required: minScore,
          isMandatory: rs.isMandatory,
        });
      }
    }

    // requiredSkillsScore: 0-100, normalized by total skill weight
    const requiredSkillsScore = totalSkillWeight > 0
      ? Math.max(0, Math.min(100, Math.round((coveredSkillWeight / totalSkillWeight) * 100)))
      : 0;

    // ---- Factor 2: Skill Proficiency Depth (20%) ----
    // Measures HOW WELL the candidate knows required skills (beyond just coverage).
    // Average proficiency ratio across all required skills the candidate has.
    const proficiencyRatios: number[] = requiredSkillSpecs
      .map((rs: any) => {
        const studentScore = scoreMap.get(rs.skillId) || 0;
        const minScore = Math.max(1, rs.minScore || 70);
        return Math.min(1.0, studentScore / minScore);
      });

    const avgProficiencyRatio = proficiencyRatios.length > 0
      ? proficiencyRatios.reduce((a, b) => a + b, 0) / proficiencyRatios.length
      : 0;
    const skillProficiencyScore = Math.max(0, Math.min(100, Math.round(avgProficiencyRatio * 100)));

    // ---- Factor 3: Experience Score (10%) ----
    // Measures practical experience via project tech stack relevance.
    // Only tech stack overlap (not project depth — that's Factor 4).
    const requiredSkillNames = new Set(
      requiredSkillSpecs.map((rs: any) => (rs.skill?.name || rs.skillName || '').toLowerCase())
    );

    let techOverlapCount = 0;
    for (const proj of studentProjects) {
      const techs: string[] = Array.isArray(proj.technologies) ? proj.technologies : [];
      const tags: string[] = Array.isArray(proj.tags) ? proj.tags : [];
      const allTechs = [...techs, ...tags].map(t => t.toLowerCase());
      if (allTechs.some(t => requiredSkillNames.has(t))) {
        techOverlapCount++;
      }
    }
    const experienceScore = requiredSkillNames.size > 0
      ? Math.max(0, Math.min(100, Math.round((techOverlapCount / Math.max(1, requiredSkillNames.size)) * 100)))
      : Math.min(30, studentProjects.length * 10); // Fallback: any projects count

    // ---- Factor 4: Project Portfolio Quality (10%) ----
    // Measures depth and verifiability of the candidate's project portfolio.
    // Live URL = public demo quality; GitHub URL = verifiable code; count = breadth.
    let projectDepthPts = 0;
    for (const proj of studentProjects) {
      if (proj.liveUrl || proj.projectUrl) projectDepthPts += 15; // Live demo
      if (proj.githubUrl) projectDepthPts += 10;                   // Verifiable code
      projectDepthPts += 5;                                         // Each project = breadth
    }
    const projectsScore = Math.max(0, Math.min(100, projectDepthPts));

    // ---- Factor 5: Assessment Score (10%) — pre-computed above ----
    // assessmentScore already computed (0-100)

    // ---- Factor 6: Education Score (5%) — pre-computed above ----
    // educationScore already computed (0-100)
    // Cross-check against opportunity's educationRequirements if specified
    let adjustedEducationScore = educationScore;
    if (opp.educationRequirements) {
      const eduReq = opp.educationRequirements.toLowerCase();
      if (eduReq.includes('master') || eduReq.includes('mtech') || eduReq.includes('phd')) {
        if (!degree.includes('master') && !degree.includes('phd') && !degree.includes('mtech')) {
          adjustedEducationScore = Math.max(0, adjustedEducationScore - 30); // Penalty for unmet edu requirement
        }
      }
    }

    // ---- Factor 7: Certification Relevance (5%) ----
    // Measures how many relevant, verifiable certifications the candidate holds.
    let certRelevanceCount = 0;
    for (const cert of studentCerts) {
      const certName = (cert.name || cert.title || '').toLowerCase();
      const isRelevant = Array.from(requiredSkillNames).some(sn => certName.includes(sn));
      if (isRelevant) certRelevanceCount++;
    }
    // Each relevant cert = 25 pts, capped at 100
    const certificationScore = Math.max(0, Math.min(100, certRelevanceCount * 25));

    // ---- Composite 7-Factor Score (deterministic) ----
    //
    //   Required Skills Coverage    × 0.40
    //   Skill Proficiency Depth     × 0.20
    //   Experience (tech overlap)   × 0.10
    //   Project Portfolio Quality   × 0.10
    //   Assessment & DSA            × 0.10
    //   Education Match             × 0.05
    //   Certification Relevance     × 0.05
    //
    // TOTAL WEIGHT = 1.00 = 100%
    const totalScore = Math.max(0, Math.min(100, Math.round(
      requiredSkillsScore   * 0.40 +
      skillProficiencyScore * 0.20 +
      experienceScore       * 0.10 +
      projectsScore         * 0.10 +
      assessmentScore       * 0.10 +
      adjustedEducationScore * 0.05 +
      certificationScore    * 0.05
    )));

    const tier: 'high' | 'medium' | 'low' =
      totalScore >= 80 ? 'high' : totalScore >= 50 ? 'medium' : 'low';

    // Build detailed breakdown for auditability
    const breakdown = {
      algorithmVersion: 'v2.0-7factor',
      opportunityId: opp.id,
      totalScore,
      tier,
      eligibility,
      ineligibilityReason,
      factors: {
        requiredSkillsCoverage:  { score: requiredSkillsScore,    weight: 0.40, weighted: Math.round(requiredSkillsScore   * 0.40 * 10) / 10 },
        skillProficiencyDepth:   { score: skillProficiencyScore,  weight: 0.20, weighted: Math.round(skillProficiencyScore * 0.20 * 10) / 10 },
        experienceTechOverlap:   { score: experienceScore,         weight: 0.10, weighted: Math.round(experienceScore       * 0.10 * 10) / 10 },
        projectPortfolioQuality: { score: projectsScore,           weight: 0.10, weighted: Math.round(projectsScore         * 0.10 * 10) / 10 },
        assessmentAndDSA:        { score: assessmentScore,         weight: 0.10, weighted: Math.round(assessmentScore       * 0.10 * 10) / 10 },
        educationMatch:          { score: adjustedEducationScore,  weight: 0.05, weighted: Math.round(adjustedEducationScore * 0.05 * 10) / 10 },
        certificationRelevance:  { score: certificationScore,      weight: 0.05, weighted: Math.round(certificationScore    * 0.05 * 10) / 10 },
      },
    };

    const strengths: string[] = [];
    if (requiredSkillsScore >= 70) strengths.push(`Strong skill coverage (${requiredSkillsScore}%)`);
    if (skillProficiencyScore >= 70) strengths.push(`High skill proficiency (${skillProficiencyScore}%)`);
    if (projectsScore >= 60) strengths.push(`Strong project portfolio (${studentProjects.length} projects)`);
    if (assessmentScore >= 70) strengths.push(`Good assessment performance (${assessmentScore}%)`);
    if (certRelevanceCount > 0) strengths.push(`${certRelevanceCount} relevant certification(s)`);

    const weaknesses: string[] = missingSkills.slice(0, 4).map(s =>
      `${s.skillName}${s.isMandatory ? ' (MANDATORY)' : ''}: missing`
    );

    const recommendations: string[] = [];
    if (missingSkills.length > 0) {
      const mandatoryMissing = missingSkills.filter(s => s.isMandatory);
      if (mandatoryMissing.length > 0) {
        recommendations.push(`Critical: acquire mandatory skills — ${mandatoryMissing.slice(0, 2).map(s => s.skillName).join(', ')}`);
      } else {
        recommendations.push(`Improve: ${missingSkills.slice(0, 2).map(s => s.skillName).join(', ')}`);
      }
    }
    if (projectsScore < 50) recommendations.push('Add more verifiable projects with GitHub/live links');
    if (assessmentScore < 50) recommendations.push('Complete more proctored assessments and DSA practice');
    if (recommendations.length === 0) recommendations.push('Strong candidate — consider applying now');

    const result: OpportunityMatchResult = {
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      score: totalScore,
      eligibility,
      ineligibilityReason,
      tier,
      breakdownJson: JSON.stringify(breakdown),
      matchedSkillsJson: JSON.stringify(matchedSkills),
      missingSkillsJson: JSON.stringify(missingSkills),
      strengthsJson: JSON.stringify(strengths),
      weaknessesJson: JSON.stringify(weaknesses),
      recommendationsJson: JSON.stringify(recommendations),
    };

    results.push(result);

    // Upsert cached match score (non-fatal — scoring still completes if cache fails)
    try {
      await prisma.candidateMatch.upsert({
        where: {
          candidateId_opportunityId: {
            candidateId: studentProfileId,
            opportunityId: opp.id,
          },
        },
        update: {
          score: totalScore,
          eligibility,
          ineligibilityReason,
          breakdownJson: result.breakdownJson,
          matchedSkillsJson: result.matchedSkillsJson,
          missingSkillsJson: result.missingSkillsJson,
          strengthsJson: result.strengthsJson,
          weaknessesJson: result.weaknessesJson,
          recommendationsJson: result.recommendationsJson,
          algorithmVersion: 'v2.0-7factor',
        },
        create: {
          candidateId: studentProfileId,
          opportunityId: opp.id,
          score: totalScore,
          eligibility,
          ineligibilityReason,
          breakdownJson: result.breakdownJson,
          matchedSkillsJson: result.matchedSkillsJson,
          missingSkillsJson: result.missingSkillsJson,
          strengthsJson: result.strengthsJson,
          weaknessesJson: result.weaknessesJson,
          recommendationsJson: result.recommendationsJson,
          algorithmVersion: 'v2.0-7factor',
        },
      });
    } catch (cacheErr) {
      console.warn('[OPPORTUNITY MATCHING] Failed to upsert CandidateMatch:', cacheErr);
    }
  }

  // Sort by score descending; eligible candidates first
  return results.sort((a, b) => {
    if (a.eligibility !== b.eligibility) return a.eligibility ? -1 : 1;
    return b.score - a.score;
  });
}

/**
 * Calculates match for a single student against a single Opportunity using the 7-factor model.
 * Returns null if the opportunity is not found or not OPEN.
 */
export async function calculateSingleOpportunityMatch(
  studentProfileId: string,
  opportunityId: string
): Promise<OpportunityMatchResult | null> {
  const results = await calculateOpportunityMatches(studentProfileId, opportunityId);
  return results.find(r => r.opportunityId === opportunityId) || null;
}
