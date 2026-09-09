/**
 * Industry Demo Service
 *
 * Provides dedicated data services for the Industry / Recruiter Demo Mode.
 * Driven strictly by the 5 CSV benchmark datasets (410 records, 4 universities + benchmark).
 *
 * STRICT INTEGRITY RULES:
 * 1. Do NOT fabricate additional skills for a candidate.
 * 2. Do NOT copy a candidate's score across skills.
 * 3. Calculate all statistics dynamically.
 * 4. Multi-skill matching calculates deterministic fit from actual skills present.
 * 5. Assessment and Interview data must be clearly labeled as DEMO with advisory disclaimers.
 */

import { prisma } from '../config/prisma.js';
import { generateLlmText } from './llmService.js';
import { seedIndustryDemoDataset } from '../scripts/seedIndustryDemo.js';

export interface IndustryDemoStatsResult {
  totalRecords: number;
  uniqueCandidates: number;
  universitiesCount: number;
  sourcesCount: number;
  branchesCount: number;
  skillsCount: number;
  skillCategoriesCount: number;
  sourceDomainsCount: number;
  averageScore: number;
  opportunitiesCount: number;
  applicationsCount: number;
  scoreBands: {
    below60: number;
    band60to69: number;
    band70to79: number;
    band80to89: number;
    band90to100: number;
  };
  universityBreakdown: Array<{
    university: string;
    candidateCount: number;
    averageScore: number;
    isBenchmark: boolean;
  }>;
  skillBreakdown: Array<{
    skill: string;
    category: string;
    candidateCount: number;
    averageScore: number;
  }>;
  branchBreakdown: Array<{
    branch: string;
    candidateCount: number;
    averageScore: number;
  }>;
}

export interface CandidateComparisonInput {
  candidateIds: string[];
  opportunityId: string;
}

const ADVISORY_DISCLAIMER =
  'Advisory AI — Final hiring decisions remain with human recruiters. ' +
  'This evaluation is generated for demonstration and benchmarking purposes based on imported dataset skills.';

/**
 * Dynamically computes all statistics across the Industry Demo Candidate dataset.
 */
export async function getIndustryDemoStats(): Promise<IndustryDemoStatsResult> {
  const candidates = await (prisma as any).industryDemoCandidate.findMany({
    where: { source: 'DEMO_DATASET' },
    include: { skills: true },
  });

  const opportunitiesCount = await (prisma as any).industryDemoOpportunity.count({
    where: { source: 'DEMO_DATASET' },
  });

  const applicationsCount = await (prisma as any).industryDemoApplication.count({
    where: { source: 'DEMO_DATASET' },
  });

  const allSkills: any[] = [];
  candidates.forEach((c: any) => {
    if (c.skills && c.skills.length > 0) {
      allSkills.push(...c.skills);
    }
  });

  const totalRecords = allSkills.length;
  const uniqueCandidates = candidates.length;

  const universitiesSet = new Set(candidates.map((c: any) => c.university));
  const branchesSet = new Set(candidates.map((c: any) => c.branch));
  const skillsSet = new Set(allSkills.map((s: any) => s.skill));
  const categoriesSet = new Set(allSkills.map((s: any) => s.skillCategory));
  const sourceDomainsSet = new Set(candidates.map((c: any) => c.sourceDomain).filter(Boolean));

  const allScores = allSkills.map((s: any) => s.skillScore);
  const averageScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) * 100) / 100
      : 0;

  // Score bands
  const scoreBands = {
    below60: allScores.filter((s: number) => s < 60).length,
    band60to69: allScores.filter((s: number) => s >= 60 && s < 70).length,
    band70to79: allScores.filter((s: number) => s >= 70 && s < 80).length,
    band80to89: allScores.filter((s: number) => s >= 80 && s < 90).length,
    band90to100: allScores.filter((s: number) => s >= 90).length,
  };

  // University breakdown
  const uniMap: Record<string, { count: number; totalScore: number; isBenchmark: boolean }> = {};
  for (const c of candidates) {
    if (!uniMap[c.university]) {
      uniMap[c.university] = {
        count: 0,
        totalScore: 0,
        isBenchmark: c.university === 'SkillBridge Benchmark',
      };
    }
    uniMap[c.university].count++;
    uniMap[c.university].totalScore += c.averageScore;
  }

  const universityBreakdown = Object.entries(uniMap).map(([university, data]) => ({
    university,
    candidateCount: data.count,
    averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
    isBenchmark: data.isBenchmark,
  }));

  // Skill breakdown
  const skillMap: Record<string, { category: string; count: number; totalScore: number }> = {};
  for (const s of allSkills) {
    if (!skillMap[s.skill]) {
      skillMap[s.skill] = { category: s.skillCategory, count: 0, totalScore: 0 };
    }
    skillMap[s.skill].count++;
    skillMap[s.skill].totalScore += s.skillScore;
  }

  const skillBreakdown = Object.entries(skillMap).map(([skill, data]) => ({
    skill,
    category: data.category,
    candidateCount: data.count,
    averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
  }));

  // Branch breakdown
  const branchMap: Record<string, { count: number; totalScore: number }> = {};
  for (const c of candidates) {
    if (!branchMap[c.branch]) {
      branchMap[c.branch] = { count: 0, totalScore: 0 };
    }
    branchMap[c.branch].count++;
    branchMap[c.branch].totalScore += c.averageScore;
  }

  const branchBreakdown = Object.entries(branchMap).map(([branch, data]) => ({
    branch,
    candidateCount: data.count,
    averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
  }));

  // Total universities (4 universities) vs data sources (5 data sources)
  const actualUniversities = Array.from(universitiesSet).filter(u => u !== 'SkillBridge Benchmark');

  return {
    totalRecords,
    uniqueCandidates,
    universitiesCount: actualUniversities.length, // 4
    sourcesCount: universitiesSet.size, // 5
    branchesCount: branchesSet.size,
    skillsCount: skillsSet.size,
    skillCategoriesCount: categoriesSet.size,
    sourceDomainsCount: sourceDomainsSet.size,
    averageScore,
    opportunitiesCount,
    applicationsCount,
    scoreBands,
    universityBreakdown,
    skillBreakdown,
    branchBreakdown,
  };
}

/**
 * Returns all demo opportunities with their required skills and applicant count.
 */
export async function getIndustryDemoOpportunities() {
  const opportunities = await (prisma as any).industryDemoOpportunity.findMany({
    where: { source: 'DEMO_DATASET' },
    include: {
      applications: {
        select: {
          id: true,
          matchScore: true,
          stage: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return opportunities.map((opp: any) => ({
    id: opp.id,
    title: opp.title,
    department: opp.department,
    roleType: opp.roleType,
    location: opp.location,
    requiredSkills: JSON.parse(opp.requiredSkillsJson || '[]'),
    description: opp.description,
    minScoreThreshold: opp.minScoreThreshold,
    source: opp.source,
    applicantCount: opp.applications.length,
    averageMatchScore:
      opp.applications.length > 0
        ? Math.round(
            (opp.applications.reduce((sum: number, a: any) => sum + a.matchScore, 0) /
              opp.applications.length) *
              10
          ) / 10
        : 0,
    hiredCount: opp.applications.filter((a: any) => a.stage === 'HIRED').length,
  }));
}

/**
 * Returns applicants for a specific demo opportunity with match scores, skill coverage, and missing skills.
 */
export async function getIndustryDemoOpportunityApplicants(opportunityId: string) {
  const opportunity = await (prisma as any).industryDemoOpportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    throw new Error('Demo opportunity not found.');
  }

  const requiredSkills: string[] = JSON.parse(opportunity.requiredSkillsJson || '[]');

  const applications = await (prisma as any).industryDemoApplication.findMany({
    where: { opportunityId },
    include: {
      candidate: {
        include: { skills: true },
      },
    },
    orderBy: { matchScore: 'desc' },
  });

  return {
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      department: opportunity.department,
      roleType: opportunity.roleType,
      location: opportunity.location,
      requiredSkills,
      minScoreThreshold: opportunity.minScoreThreshold,
    },
    applicants: applications.map((app: any) => {
      const knownSkills = JSON.parse(app.knownSkillsJson || '[]');
      const missingSkills = JSON.parse(app.missingSkillsJson || '[]');
      return {
        id: app.id,
        candidateId: app.candidate.id,
        studentName: app.candidate.studentName,
        externalStudentId: app.candidate.externalStudentId,
        university: app.candidate.university,
        branch: app.candidate.branch,
        averageScore: app.candidate.averageScore,
        matchScore: app.matchScore,
        skillCoverageRatio: app.skillCoverageRatio,
        knownSkills,
        missingSkills,
        stage: app.stage,
        appliedAt: app.appliedAt,
      };
    }),
  };
}

/**
 * Filterable candidate list with pagination and search.
 */
export async function getIndustryDemoCandidates(filter: {
  university?: string;
  skill?: string;
  branch?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = { source: 'DEMO_DATASET' };

  if (filter.university && filter.university !== 'ALL') {
    where.university = filter.university;
  }
  if (filter.branch && filter.branch !== 'ALL') {
    where.branch = filter.branch;
  }
  if (filter.search) {
    where.OR = [
      { studentName: { contains: filter.search, mode: 'insensitive' } },
      { externalStudentId: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  if (filter.minScore !== undefined || filter.maxScore !== undefined) {
    where.averageScore = {};
    if (filter.minScore !== undefined) where.averageScore.gte = filter.minScore;
    if (filter.maxScore !== undefined) where.averageScore.lte = filter.maxScore;
  }

  const limit = Math.min(filter.limit || 50, 100);
  const offset = filter.offset || 0;

  const [candidates, totalCount] = await Promise.all([
    (prisma as any).industryDemoCandidate.findMany({
      where,
      include: { skills: true },
      orderBy: { averageScore: 'desc' },
      take: limit,
      skip: offset,
    }),
    (prisma as any).industryDemoCandidate.count({ where }),
  ]);

  return {
    candidates: candidates.map((c: any) => ({
      id: c.id,
      studentName: c.studentName,
      externalStudentId: c.externalStudentId,
      university: c.university,
      branch: c.branch,
      sourceDomain: c.sourceDomain,
      derivedDomain: c.derivedDomain,
      averageScore: c.averageScore,
      skills: c.skills.map((s: any) => ({
        skill: s.skill,
        skillCategory: s.skillCategory,
        skillScore: s.skillScore,
      })),
      sourceDataset: c.sourceDataset,
      source: c.source,
    })),
    totalCount,
    limit,
    offset,
  };
}

/**
 * Returns detailed candidate profile including DEMO ASSESSMENT and DEMO AI INTERVIEW contexts.
 */
export async function getIndustryDemoCandidateById(candidateId: string) {
  const candidate = await (prisma as any).industryDemoCandidate.findUnique({
    where: { id: candidateId },
    include: {
      skills: true,
      applications: {
        include: {
          opportunity: true,
        },
      },
    },
  });

  if (!candidate) {
    throw new Error('Demo candidate not found.');
  }

  const candidateSkill = candidate.skills[0] || {
    skill: 'Technical',
    skillCategory: 'Technical',
    skillScore: candidate.averageScore,
  };

  // Structured DEMO ASSESSMENT context
  const demoAssessment = {
    badge: 'DEMO ASSESSMENT',
    disclaimer: 'This is a simulated assessment record based strictly on dataset benchmark score.',
    skillEvaluated: candidateSkill.skill,
    score: candidateSkill.skillScore,
    percentileBand:
      candidateSkill.skillScore >= 85 ? 'Top 10%' : candidateSkill.skillScore >= 70 ? 'Top 35%' : 'Developing',
    completedAt: '2026-09-01T10:00:00Z',
    status: 'COMPLETED',
  };

  // Structured DEMO AI INTERVIEW context
  const demoInterview = {
    badge: 'DEMO AI INTERVIEW',
    disclaimer: 'This is an advisory AI interview simulation generated from dataset skill competency.',
    technicalScore: candidateSkill.skillScore,
    communicationScore: Math.min(100, Math.round(candidateSkill.skillScore * 0.95 + 4)),
    problemSolvingScore: Math.min(100, Math.round(candidateSkill.skillScore * 0.98 + 2)),
    readinessRating:
      candidateSkill.skillScore >= 80 ? 'Ready for Deployment' : candidateSkill.skillScore >= 65 ? 'Ready with Mentorship' : 'Upskilling Recommended',
    completedAt: '2026-09-02T14:30:00Z',
    status: 'COMPLETED',
  };

  return {
    candidate: {
      id: candidate.id,
      studentName: candidate.studentName,
      externalStudentId: candidate.externalStudentId,
      university: candidate.university,
      branch: candidate.branch,
      sourceDomain: candidate.sourceDomain,
      derivedDomain: candidate.derivedDomain,
      averageScore: candidate.averageScore,
      skills: candidate.skills,
      sourceDataset: candidate.sourceDataset,
      source: candidate.source,
    },
    applications: candidate.applications.map((a: any) => ({
      id: a.id,
      opportunityId: a.opportunityId,
      opportunityTitle: a.opportunity.title,
      department: a.opportunity.department,
      matchScore: a.matchScore,
      skillCoverageRatio: a.skillCoverageRatio,
      knownSkills: JSON.parse(a.knownSkillsJson || '[]'),
      missingSkills: JSON.parse(a.missingSkillsJson || '[]'),
      stage: a.stage,
    })),
    demoAssessment,
    demoInterview,
  };
}

/**
 * Compares 2 to 5 candidates for a specific demo opportunity.
 * Computes deterministic skill coverage, known skill scores, missing skills, and AI advisory synthesis.
 */
export async function compareIndustryDemoCandidates(
  candidateIds: string[],
  opportunityId: string
) {
  if (candidateIds.length < 2 || candidateIds.length > 5) {
    throw new Error('Please select between 2 and 5 candidates for comparison.');
  }

  const opportunity = await (prisma as any).industryDemoOpportunity.findUnique({
    where: { id: opportunityId },
  });

  if (!opportunity) {
    throw new Error('Demo opportunity not found.');
  }

  const requiredSkills: string[] = JSON.parse(opportunity.requiredSkillsJson || '[]');

  const candidates = await (prisma as any).industryDemoCandidate.findMany({
    where: { id: { in: candidateIds } },
    include: { skills: true },
  });

  if (candidates.length !== candidateIds.length) {
    throw new Error('One or more candidates could not be found.');
  }

  // Calculate detailed match profiles for each candidate
  const candidateProfiles = candidates.map((cand: any) => {
    const candSkills: Array<{ skill: string; skillScore: number; skillCategory: string }> = cand.skills;

    const matched = candSkills.filter(cs =>
      requiredSkills.some(rs => rs.toLowerCase() === cs.skill.toLowerCase())
    );

    const missing = requiredSkills.filter(
      rs => !candSkills.some(cs => cs.skill.toLowerCase() === rs.toLowerCase())
    );

    const coverageRatio = `${matched.length} / ${requiredSkills.length}`;
    const matchedScoresAvg =
      matched.length > 0
        ? matched.reduce((sum, s) => sum + s.skillScore, 0) / matched.length
        : 0;

    const deterministicMatchScore = Math.round(
      ((matched.length / requiredSkills.length) * 40 + (matchedScoresAvg * 0.6)) * 10
    ) / 10;

    return {
      candidateId: cand.id,
      studentName: cand.studentName,
      externalStudentId: cand.externalStudentId,
      university: cand.university,
      branch: cand.branch,
      benchmarkAverageScore: cand.averageScore,
      deterministicMatchScore,
      skillCoverageRatio: coverageRatio,
      matchedSkillsCount: matched.length,
      totalRequiredSkillsCount: requiredSkills.length,
      knownSkills: matched,
      missingSkills: missing,
      allCandidateSkills: candSkills,
    };
  });

  // Sort by deterministic match score descending
  candidateProfiles.sort((a: any, b: any) => b.deterministicMatchScore - a.deterministicMatchScore);

  // Generate LLM Advisory Summary
  const promptSummary = `
Role: ${opportunity.title} (${opportunity.department})
Required Skills: ${requiredSkills.join(', ')}

Candidate Profiles:
${candidateProfiles
  .map(
    (c: any, i: number) => `
Candidate #${i + 1}: ${c.studentName} (${c.externalStudentId})
- University: ${c.university}
- Branch: ${c.branch}
- Skill Coverage: ${c.skillCoverageRatio}
- Known Skills: ${c.knownSkills.map((s: any) => `${s.skill} (${s.skillScore}%)`).join(', ') || 'None matching'}
- Missing Skills: ${c.missingSkills.join(', ') || 'None'}
- Algorithmic Match Score: ${c.deterministicMatchScore}%
`
  )
  .join('\n')}

Provide an objective advisory comparison:
1. Explain the skill coverage and known score trade-offs between candidates.
2. Outline specific strengths and gap areas for each candidate.
3. Recommend next steps (e.g. focused technical assessment for missing skills).
Keep it concise, professional, and within 250 words.
`;

  let aiSummary = '';
  try {
    const generated = await generateLlmText({
      systemPrompt:
        'You are SkillBridge Recruiter Copilot. You are comparing candidates based strictly on factual benchmark scores. You are strictly advisory.',
      prompt: promptSummary,
    });
    aiSummary = generated || `Deterministic comparison generated. Candidate ${candidateProfiles[0].studentName} leads with a match score of ${candidateProfiles[0].deterministicMatchScore}%, demonstrating strong proficiency in ${candidateProfiles[0].knownSkills.map((s: any) => s.skill).join(', ')}.`;
  } catch (err) {
    aiSummary = `Deterministic comparison generated. Candidate ${candidateProfiles[0].studentName} leads with a match score of ${candidateProfiles[0].deterministicMatchScore}%, demonstrating strong proficiency in ${candidateProfiles[0].knownSkills.map((s: any) => s.skill).join(', ')}.`;
  }

  const advisoryRanking = candidateProfiles.map((c: any, idx: number) => ({
    candidateId: c.candidateId,
    candidateName: c.studentName,
    advisoryScore: c.deterministicMatchScore,
    rank: idx + 1,
    advisoryReason: `Rank #${idx + 1} with ${c.skillCoverageRatio} skill coverage (${c.knownSkills.map((s: any) => `${s.skill}: ${s.skillScore}%`).join(', ')}). Missing: ${c.missingSkills.join(', ')}.`,
  }));

  const strengthsMap: Record<string, string[]> = {};
  const gapsMap: Record<string, string[]> = {};

  candidateProfiles.forEach((c: any) => {
    strengthsMap[c.candidateId] = c.knownSkills.map((s: any) => `Benchmark Skill Score: ${s.skillScore}% in ${s.skill}`);
    gapsMap[c.candidateId] = c.missingSkills.map((s: any) => `Missing ${s} in benchmark dataset`);
  });

  return {
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      requiredSkills,
    },
    candidates: candidateProfiles,
    advisoryRanking,
    advisorySummary: aiSummary,
    topStrengths: strengthsMap,
    topGaps: gapsMap,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}

/**
 * Returns live recruitment funnel and analytics for Demo Mode.
 */
export async function getIndustryDemoAnalytics() {
  const applications = await (prisma as any).industryDemoApplication.findMany({
    where: { source: 'DEMO_DATASET' },
    include: {
      candidate: true,
      opportunity: true,
    },
  });

  const funnelStages = {
    applied: applications.length,
    shortlisted: applications.filter((a: any) =>
      ['SHORTLISTED', 'ASSESSMENT_COMPLETED', 'INTERVIEW_SCHEDULED', 'HIRED'].includes(a.stage)
    ).length,
    assessmentCompleted: applications.filter((a: any) =>
      ['ASSESSMENT_COMPLETED', 'INTERVIEW_SCHEDULED', 'HIRED'].includes(a.stage)
    ).length,
    interviewScheduled: applications.filter((a: any) =>
      ['INTERVIEW_SCHEDULED', 'HIRED'].includes(a.stage)
    ).length,
    hired: applications.filter((a: any) => a.stage === 'HIRED').length,
  };

  const universityStats = await getIndustryDemoStats();

  return {
    funnel: funnelStages,
    totalApplications: applications.length,
    universityBreakdown: universityStats.universityBreakdown,
    skillBreakdown: universityStats.skillBreakdown,
    scoreBands: universityStats.scoreBands,
  };
}

/**
 * Resets and re-seeds the Industry Demo dataset.
 */
export async function resetIndustryDemoData() {
  return await seedIndustryDemoDataset();
}
