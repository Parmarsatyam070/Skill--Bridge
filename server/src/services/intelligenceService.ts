/**
 * Intelligence Dashboard Service
 *
 * Deterministic analytics and safe advisory AI insights for SkillBridge Phase 8.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Zero fake data: All metrics are computed strictly from real DB records.
 *    Returns clean zero/empty states if no records exist.
 * 2. Deterministic backend calculations: The database and deterministic algorithms
 *    are the authoritative source of truth.
 * 3. AI outputs are strictly ADVISORY: They never write to the database and
 *    always include mandatory safety disclaimers.
 * 4. Multi-tenancy isolation:
 *    - Industry metrics strictly scoped to authenticated req.user.industryProfileId.
 *    - Institution metrics strictly scoped to authenticated req.user.institutionProfileId
 *      resolved to InstitutionProfile.institutionName on the server.
 * 5. Reuses authoritative thresholds:
 *    - SKILL_COVERAGE_THRESHOLD = 60 (standard coverage benchmark)
 *    - SKILL_PROFICIENCY_BENCHMARK = 70 (proficiency depth benchmark)
 */

import { prisma } from '../config/prisma.js';
import { generateLlmText } from './llmService.js';
import {
  IndustryOverviewDto,
  RecruitmentFunnelStage,
  IndustryFunnelResponse,
  IndustryOpportunityPerformanceResponse,
  IndustryOpportunityPerformanceItem,
  IndustrySkillAnalyticsResponse,
  SkillDemandItem,
  CandidateSkillSupplyItem,
  IndustryAssessmentAnalyticsDto,
  IndustryInterviewAnalyticsDto,
  IndustryTrendsDto,
  InstitutionOverviewDto,
  InstitutionSkillsResponse,
  InstitutionSkillComparisonItem,
  GapSeverityLevel,
  AffectedStudentsResponse,
  AffectedStudentDto,
  InstitutionInterventionsResponse,
  InstitutionInterventionRecommendation,
  InstitutionTrendsDto,
  IntelligenceAiInsight,
} from '../../../shared/types.js';
import { IntelligenceAiInsightSchema } from '../../../shared/validation.js';

// ================================================================
// AUTHORITATIVE THRESHOLDS
// ================================================================
export const SKILL_COVERAGE_THRESHOLD = 60;
export const SKILL_PROFICIENCY_BENCHMARK = 70;

const ADVISORY_DISCLAIMER =
  'This is an AI-generated advisory analysis based on aggregate platform data. ' +
  'All strategic, hiring, and curricular decisions must be verified by humans. ' +
  'AI insights do not alter platform records or guarantee specific outcomes.';

// ================================================================
// INDUSTRY INTELLIGENCE SERVICES
// ================================================================

/**
 * Computes high-level KPI overview for an industry organization.
 */
export async function getIndustryOverview(companyId: string): Promise<IndustryOverviewDto> {
  const [
    activeOpportunities,
    opportunities,
  ] = await Promise.all([
    prisma.opportunity.count({
      where: { companyId, status: 'OPEN' },
    }),
    prisma.opportunity.findMany({
      where: { companyId },
      select: { id: true },
    }),
  ]);

  const oppIds = opportunities.map(o => o.id);

  if (oppIds.length === 0) {
    return {
      activeOpportunities: 0,
      totalApplications: 0,
      shortlistedCandidates: 0,
      assessmentsCompleted: 0,
      interviewsCompleted: 0,
      hiredCandidates: 0,
      overallConversionRate: 0,
    };
  }

  const [applications, assessmentsCompleted, interviewsCompleted] = await Promise.all([
    prisma.application.findMany({
      where: { opportunityId: { in: oppIds } },
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.assessmentSubmission.count({
      where: {
        assessment: { companyId },
        submittedAt: { not: null },
      },
    }),
    prisma.interviewSession.count({
      where: {
        opportunityId: { in: oppIds },
        status: 'COMPLETED',
      },
    }),
  ]);

  const totalApplications = applications.length;
  let shortlistedCandidates = 0;
  let hiredCandidates = 0;

  for (const app of applications) {
    if (['shortlisted', 'assessment', 'interview', 'hired'].includes(app.status)) {
      shortlistedCandidates++;
    }
    if (app.status === 'hired') {
      hiredCandidates++;
    }
  }

  const overallConversionRate = totalApplications > 0
    ? Math.round((hiredCandidates / totalApplications) * 1000) / 10
    : 0;

  return {
    activeOpportunities,
    totalApplications,
    shortlistedCandidates,
    assessmentsCompleted,
    interviewsCompleted,
    hiredCandidates,
    overallConversionRate,
  };
}

/**
 * Calculates deterministic hiring funnel based on actual Application.status.
 */
export async function getIndustryFunnel(
  companyId: string,
  opportunityId?: string
): Promise<IndustryFunnelResponse> {
  const oppWhere: any = { companyId };
  if (opportunityId) {
    oppWhere.id = opportunityId;
  }

  const opportunities = await prisma.opportunity.findMany({
    where: oppWhere,
    select: { id: true },
  });

  const oppIds = opportunities.map(o => o.id);
  if (oppIds.length === 0) {
    return {
      totalApplications: 0,
      rejectedCount: 0,
      overallConversionRate: 0,
      stages: [
        { stage: 'applied', label: 'Applied', count: 0, percentageOfTotal: 0, conversionFromPrevious: 0 },
        { stage: 'under_review', label: 'Screening', count: 0, percentageOfTotal: 0, conversionFromPrevious: 0 },
        { stage: 'shortlisted', label: 'Shortlisted', count: 0, percentageOfTotal: 0, conversionFromPrevious: 0 },
        { stage: 'interview', label: 'Interview', count: 0, percentageOfTotal: 0, conversionFromPrevious: 0 },
        { stage: 'hired', label: 'Hired', count: 0, percentageOfTotal: 0, conversionFromPrevious: 0 },
      ],
    };
  }

  const applications = await prisma.application.findMany({
    where: { opportunityId: { in: oppIds } },
    select: { status: true },
  });

  const totalApplications = applications.length;

  let appliedCount = totalApplications;
  let underReviewCount = 0;
  let shortlistedCount = 0;
  let interviewCount = 0;
  let hiredCount = 0;
  let rejectedCount = 0;

  for (const app of applications) {
    const s = app.status;
    if (s === 'rejected') {
      rejectedCount++;
    }
    if (['under_review', 'shortlisted', 'assessment', 'interview', 'hired'].includes(s)) {
      underReviewCount++;
    }
    if (['shortlisted', 'assessment', 'interview', 'hired'].includes(s)) {
      shortlistedCount++;
    }
    if (['interview', 'hired'].includes(s)) {
      interviewCount++;
    }
    if (s === 'hired') {
      hiredCount++;
    }
  }

  const stageDefinitions: Array<{
    stage: 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'hired';
    label: string;
    count: number;
  }> = [
    { stage: 'applied', label: 'Applied', count: appliedCount },
    { stage: 'under_review', label: 'Screening', count: underReviewCount },
    { stage: 'shortlisted', label: 'Shortlisted', count: shortlistedCount },
    { stage: 'interview', label: 'Interview', count: interviewCount },
    { stage: 'hired', label: 'Hired', count: hiredCount },
  ];

  const stages: RecruitmentFunnelStage[] = stageDefinitions.map((def, idx) => {
    const percentageOfTotal = totalApplications > 0
      ? Math.round((def.count / totalApplications) * 1000) / 10
      : 0;

    let conversionFromPrevious = 100;
    if (idx > 0) {
      const prev = stageDefinitions[idx - 1].count;
      conversionFromPrevious = prev > 0 ? Math.round((def.count / prev) * 1000) / 10 : 0;
    }

    return {
      stage: def.stage,
      label: def.label,
      count: def.count,
      percentageOfTotal,
      conversionFromPrevious,
    };
  });

  const overallConversionRate = totalApplications > 0
    ? Math.round((hiredCount / totalApplications) * 1000) / 10
    : 0;

  return {
    totalApplications,
    rejectedCount,
    overallConversionRate,
    stages,
  };
}

/**
 * Returns paginated performance analytics for individual opportunities.
 */
export async function getIndustryOpportunityPerformance(
  companyId: string,
  query: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<IndustryOpportunityPerformanceResponse> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const where: any = { companyId };
  if (query.search?.trim()) {
    where.title = { contains: query.search.trim(), mode: 'insensitive' };
  }

  const [total, opportunities] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        applications: {
          select: { id: true, status: true },
        },
        matches: {
          select: { score: true, eligibility: true },
        },
        assessments: {
          include: {
            submissions: { select: { id: true } },
          },
        },
        interviewSessions: {
          select: { id: true },
        },
      },
    }),
  ]);

  const items: IndustryOpportunityPerformanceItem[] = opportunities.map(opp => {
    const apps = opp.applications || [];
    const matches = opp.matches || [];
    const hiredCount = apps.filter(a => a.status === 'hired').length;
    const eligibleCount = matches.filter((m: { eligibility: boolean }) => m.eligibility).length;

    let assessmentParticipationCount = 0;
    for (const a of opp.assessments || []) {
      assessmentParticipationCount += a.submissions?.length || 0;
    }

    const conversionRate = apps.length > 0
      ? Math.round((hiredCount / apps.length) * 1000) / 10
      : 0;

    return {
      id: opp.id,
      title: opp.title,
      type: opp.type,
      status: opp.status,
      createdAt: opp.createdAt.toISOString(),
      applicationCount: apps.length,
      eligibleCandidateCount: eligibleCount,
      matchCount: matches.length,
      assessmentParticipationCount,
      interviewCount: opp.interviewSessions?.length || 0,
      hiredCount,
      conversionRate,
    };
  });

  return {
    opportunities: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Returns skill demand and candidate supply analytics for an industry organization.
 */
export async function getIndustrySkillDemand(companyId: string): Promise<IndustrySkillAnalyticsResponse> {
  const opportunities = await prisma.opportunity.findMany({
    where: { companyId },
    include: {
      skills: {
        include: {
          skill: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });

  const totalOpps = opportunities.length;

  const skillAggMap = new Map<string, {
    skillId: string;
    skillName: string;
    category: string;
    demandCount: number;
    mandatoryCount: number;
    preferredCount: number;
  }>();

  for (const opp of opportunities) {
    for (const os of opp.skills) {
      const skillId = os.skillId;
      const skillName = os.skill?.name || os.skillName || 'Unknown';
      const category = os.skill?.category || 'technical';
      const isMandatory = os.isMandatory;

      const existing = skillAggMap.get(skillId);
      if (existing) {
        existing.demandCount += 1;
        if (isMandatory) existing.mandatoryCount += 1;
        else existing.preferredCount += 1;
      } else {
        skillAggMap.set(skillId, {
          skillId,
          skillName,
          category,
          demandCount: 1,
          mandatoryCount: isMandatory ? 1 : 0,
          preferredCount: isMandatory ? 0 : 1,
        });
      }
    }
  }

  const skillIds = Array.from(skillAggMap.keys());

  // Fetch candidate supply matching these skills with score >= SKILL_COVERAGE_THRESHOLD
  const candidateScores = skillIds.length > 0
    ? await prisma.studentSkillScore.findMany({
        where: {
          skillId: { in: skillIds },
          score: { gte: SKILL_COVERAGE_THRESHOLD },
        },
        select: {
          skillId: true,
          score: true,
        },
      })
    : [];

  const supplyMap = new Map<string, number>();
  for (const cs of candidateScores) {
    supplyMap.set(cs.skillId, (supplyMap.get(cs.skillId) || 0) + 1);
  }

  const topDemandedSkills: SkillDemandItem[] = [];
  const skillSupplyComparison: CandidateSkillSupplyItem[] = [];

  for (const item of Array.from(skillAggMap.values())) {
    const demandPct = totalOpps > 0 ? Math.round((item.demandCount / totalOpps) * 1000) / 10 : 0;
    const supplyCount = supplyMap.get(item.skillId) || 0;
    const coveragePct = item.demandCount > 0 ? Math.round((supplyCount / item.demandCount) * 1000) / 10 : 0;

    let gapType: 'HEALTHY' | 'SUPPLY_DEFICIT' | 'HIGH_DEMAND_LOW_SUPPLY' = 'HEALTHY';
    if (coveragePct < 50 && item.demandCount >= 3) {
      gapType = 'HIGH_DEMAND_LOW_SUPPLY';
    } else if (coveragePct < 100) {
      gapType = 'SUPPLY_DEFICIT';
    }

    topDemandedSkills.push({
      skillId: item.skillId,
      skillName: item.skillName,
      category: item.category,
      demandCount: item.demandCount,
      demandPct,
      mandatoryCount: item.mandatoryCount,
      preferredCount: item.preferredCount,
    });

    skillSupplyComparison.push({
      skillId: item.skillId,
      skillName: item.skillName,
      category: item.category,
      demandCount: item.demandCount,
      candidateSupplyCount: supplyCount,
      coveragePct,
      gapType,
    });
  }

  // Sort by demand count descending
  topDemandedSkills.sort((a, b) => b.demandCount - a.demandCount);
  skillSupplyComparison.sort((a, b) => b.demandCount - a.demandCount);

  return {
    topDemandedSkills,
    skillSupplyComparison,
    totalOpportunitiesAnalyzed: totalOpps,
  };
}

/**
 * Returns assessment performance metrics for this company.
 */
export async function getIndustryAssessmentAnalytics(
  companyId: string
): Promise<IndustryAssessmentAnalyticsDto> {
  const assessments = await prisma.assessment.findMany({
    where: { companyId },
    include: {
      submissions: {
        select: {
          id: true,
          score: true,
          passed: true,
        },
      },
    },
  });

  if (assessments.length === 0) {
    return {
      assessmentsCreated: 0,
      totalSubmissions: 0,
      completionRate: 0,
      averageScore: 0,
      passRate: 0,
      assessments: [],
    };
  }

  let totalSubmissions = 0;
  let totalScore = 0;
  let totalPassed = 0;

  const assessmentItems = assessments.map(a => {
    const subs = a.submissions || [];
    const subCount = subs.length;
    const passed = subs.filter((s: { passed: boolean }) => s.passed).length;
    const scoreSum = subs.reduce((sum: number, s: { score: number }) => sum + s.score, 0);
    const avg = subCount > 0 ? Math.round((scoreSum / subCount) * 10) / 10 : 0;
    const pRate = subCount > 0 ? Math.round((passed / subCount) * 1000) / 10 : 0;

    totalSubmissions += subCount;
    totalScore += scoreSum;
    totalPassed += passed;

    return {
      id: a.id,
      title: a.title,
      submissionsCount: subCount,
      averageScore: avg,
      passedCount: passed,
      passRate: pRate,
    };
  });

  const overallAvg = totalSubmissions > 0 ? Math.round((totalScore / totalSubmissions) * 10) / 10 : 0;
  const overallPassRate = totalSubmissions > 0 ? Math.round((totalPassed / totalSubmissions) * 1000) / 10 : 0;

  return {
    assessmentsCreated: assessments.length,
    totalSubmissions,
    completionRate: 100, // submitted assessments
    averageScore: overallAvg,
    passRate: overallPassRate,
    assessments: assessmentItems,
  };
}

/**
 * Returns interview performance metrics for this company.
 */
export async function getIndustryInterviewAnalytics(
  companyId: string
): Promise<IndustryInterviewAnalyticsDto> {
  const opportunities = await prisma.opportunity.findMany({
    where: { companyId },
    select: { id: true },
  });
  const oppIds = opportunities.map(o => o.id);

  if (oppIds.length === 0) {
    return {
      interviewsScheduled: 0,
      interviewsCompleted: 0,
      completionRate: 0,
      averageScore: null,
      typeDistribution: {},
      recommendationDistribution: {},
    };
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { opportunityId: { in: oppIds } },
    select: {
      status: true,
      type: true,
      overallScore: true,
      recommendation: true,
    },
  });

  const scheduled = sessions.length;
  const completed = sessions.filter(s => s.status === 'COMPLETED').length;
  const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 1000) / 10 : 0;

  const scoredSessions = sessions.filter(s => s.overallScore !== null && s.overallScore !== undefined);
  const avgScore = scoredSessions.length > 0
    ? Math.round(
        (scoredSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / scoredSessions.length) * 10
      ) / 10
    : null;

  const typeDistribution: Record<string, number> = {};
  const recommendationDistribution: Record<string, number> = {};

  for (const s of sessions) {
    typeDistribution[s.type] = (typeDistribution[s.type] || 0) + 1;
    if (s.recommendation) {
      recommendationDistribution[s.recommendation] = (recommendationDistribution[s.recommendation] || 0) + 1;
    }
  }

  return {
    interviewsScheduled: scheduled,
    interviewsCompleted: completed,
    completionRate,
    averageScore: avgScore,
    typeDistribution,
    recommendationDistribution,
  };
}

/**
 * Returns authentic monthly volume trends for this company.
 */
export async function getIndustryTrends(companyId: string): Promise<IndustryTrendsDto> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [opportunities, snapshots] = await Promise.all([
    prisma.opportunity.findMany({
      where: { companyId },
      include: {
        applications: {
          where: { appliedAt: { gte: sixMonthsAgo } },
          select: { appliedAt: true },
        },
      },
    }),
    prisma.skillDemandSnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      take: 20,
    }),
  ]);

  const monthMap = new Map<string, { applications: number; opportunities: number }>();

  // Prepopulate last 6 calendar months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(label, { applications: 0, opportunities: 0 });
  }

  for (const opp of opportunities) {
    const oppDate = new Date(opp.createdAt);
    const oppMonth = `${oppDate.getFullYear()}-${String(oppDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap.has(oppMonth)) {
      monthMap.get(oppMonth)!.opportunities += 1;
    }
    for (const app of opp.applications) {
      const appDate = new Date(app.appliedAt);
      const appMonth = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(appMonth)) {
        monthMap.get(appMonth)!.applications += 1;
      }
    }
  }

  const monthlyApplications: Array<{ month: string; count: number }> = [];
  const monthlyOpportunities: Array<{ month: string; count: number }> = [];

  for (const [month, data] of Array.from(monthMap.entries())) {
    monthlyApplications.push({ month, count: data.applications });
    monthlyOpportunities.push({ month, count: data.opportunities });
  }

  const skillTrends = snapshots.map(s => ({
    skillName: s.skillName,
    month: s.snapshotDate,
    demandCount: s.demandCount,
    trendDirection: s.trendDirection,
  }));

  return {
    periodLabel: 'Last 6 Months',
    monthlyApplications,
    monthlyOpportunities,
    skillTrends,
  };
}

/**
 * Generates an advisory AI executive summary for an Industry recruiter.
 */
export async function generateIndustryAiSummary(companyId: string): Promise<IntelligenceAiInsight> {
  const [overview, funnel, skills] = await Promise.all([
    getIndustryOverview(companyId),
    getIndustryFunnel(companyId),
    getIndustrySkillDemand(companyId),
  ]);

  const fallbackInsight: IntelligenceAiInsight = {
    summary: `Hiring overview indicates ${overview.activeOpportunities} active positions with ${overview.totalApplications} total candidate applications. Current conversion to hire stands at ${overview.hiredCandidates} candidates with overall conversion rate of ${overview.overallConversionRate}%.`,
    keyObservations: [
      `Overall candidate application volume: ${overview.totalApplications} across ${overview.activeOpportunities} open opportunities.`,
      `Screening funnel conversion rate: ${funnel.stages[1]?.percentageOfTotal || 0}% moving to screening stage.`,
      `Top market demand skill: ${skills.topDemandedSkills[0]?.skillName || 'General Tech'} with ${skills.topDemandedSkills[0]?.demandCount || 0} occurrences.`,
    ],
    recommendations: [
      'Focus candidate outreach on high-supply verified skill categories to reduce time-to-hire.',
      'Calibrate screening minimum score thresholds to optimize early funnel throughput.',
      'Deploy Talent Assessments for pre-screening to accelerate shortlist decisions.',
    ],
    disclaimer: ADVISORY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };

  try {
    const prompt = `Analyze this deterministic recruitment intelligence for a corporate hiring organization:
Active Opportunities: ${overview.activeOpportunities}
Total Applications: ${overview.totalApplications}
Shortlisted Candidates: ${overview.shortlistedCandidates}
Total Hires: ${overview.hiredCandidates}
Overall Conversion Rate: ${overview.overallConversionRate}%
Hiring Funnel: ${JSON.stringify(funnel.stages)}
Top Demanded Skills: ${JSON.stringify(skills.topDemandedSkills.slice(0, 5))}

Provide a JSON object strictly matching this schema:
{
  "summary": "Concise 2-sentence executive hiring summary",
  "keyObservations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "disclaimer": "${ADVISORY_DISCLAIMER}"
}`;

    const raw = await generateLlmText({
      systemPrompt: 'You are an expert talent acquisition advisor. Output strictly valid JSON matching the requested schema with zero formatting tags.',
      prompt,
      temperature: 0.3,
    });

    if (!raw) return fallbackInsight;

    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    const validated = IntelligenceAiInsightSchema.safeParse(parsed);

    if (validated.success) {
      return {
        ...validated.data,
        disclaimer: ADVISORY_DISCLAIMER,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('⚠️ [Industry AI Summary] Fallback engaged:', (err as any)?.message);
  }

  return fallbackInsight;
}

// ================================================================
// INSTITUTION INTELLIGENCE SERVICES
// ================================================================

/**
 * Resolves authoritative institution name from an authenticated user's institution profile ID.
 */
export async function resolveInstitutionName(institutionProfileId: string): Promise<string> {
  const profile = await prisma.institutionProfile.findUnique({
    where: { id: institutionProfileId },
    select: { institutionName: true },
  });

  if (!profile || !profile.institutionName) {
    throw new Error('Institution profile not found or missing institution name.');
  }

  return profile.institutionName;
}

/**
 * Computes high-level KPI overview for an academic institution.
 */
export async function getInstitutionOverview(institutionProfileId: string): Promise<InstitutionOverviewDto> {
  const institutionName = await resolveInstitutionName(institutionProfileId);

  const students = await prisma.studentProfile.findMany({
    where: {
      institution: { equals: institutionName, mode: 'insensitive' },
    },
    select: {
      id: true,
      skillScores: {
        select: {
          id: true,
          skillId: true,
          score: true,
          verificationLevel: true,
          scoreHistoryJson: true,
        },
      },
    },
  });

  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      verifiedSkillsCount: 0,
      highDemandSkillsCount: 0,
      skillGapsCount: 0,
      affectedStudentsCount: 0,
      studentsWithImprovementCount: 0,
      activeInterventionsCount: 0,
    };
  }

  const oppSkills = await prisma.opportunitySkill.findMany({
    where: { opportunity: { status: 'OPEN' } },
    select: { skillId: true },
  });
  const demandSet = new Set(oppSkills.map(os => os.skillId));

  let verifiedSkillsCount = 0;
  const studentSkillTotals = new Map<string, { totalScore: number; count: number }>();
  const affectedStudentIds = new Set<string>();
  let studentsWithImprovementCount = 0;

  for (const student of students) {
    let studentHasImprovement = false;
    let studentHasGap = false;

    for (const ss of student.skillScores) {
      if (ss.verificationLevel !== 'SELF-REPORTED') {
        verifiedSkillsCount++;
      }

      const existing = studentSkillTotals.get(ss.skillId);
      if (existing) {
        existing.totalScore += ss.score;
        existing.count += 1;
      } else {
        studentSkillTotals.set(ss.skillId, { totalScore: ss.score, count: 1 });
      }

      if (demandSet.has(ss.skillId) && ss.score < SKILL_COVERAGE_THRESHOLD) {
        studentHasGap = true;
      }

      if (ss.scoreHistoryJson) {
        try {
          const history = JSON.parse(ss.scoreHistoryJson);
          if (Array.isArray(history) && history.length > 1) {
            studentHasImprovement = true;
          }
        } catch {}
      }
    }

    if (studentHasGap) {
      affectedStudentIds.add(student.id);
    }
    if (studentHasImprovement) {
      studentsWithImprovementCount++;
    }
  }

  // Count skills with an institutional average score below the proficiency benchmark
  let skillGapsCount = 0;
  for (const [skillId, agg] of Array.from(studentSkillTotals.entries())) {
    if (demandSet.has(skillId) && (agg.totalScore / agg.count) < SKILL_PROFICIENCY_BENCHMARK) {
      skillGapsCount++;
    }
  }

  const activeInterventionsCount = await prisma.course.count();

  return {
    totalStudents,
    verifiedSkillsCount,
    highDemandSkillsCount: demandSet.size,
    skillGapsCount,
    affectedStudentsCount: affectedStudentIds.size,
    studentsWithImprovementCount,
    activeInterventionsCount,
  };
}

/**
 * Compares institution student skills against live industry demand to identify gaps.
 */
export async function getInstitutionSkillComparison(
  institutionProfileId: string
): Promise<InstitutionSkillsResponse> {
  const institutionName = await resolveInstitutionName(institutionProfileId);

  const [students, oppSkills] = await Promise.all([
    prisma.studentProfile.findMany({
      where: {
        institution: { equals: institutionName, mode: 'insensitive' },
      },
      include: {
        skillScores: {
          include: {
            skill: { select: { id: true, name: true, category: true } },
          },
        },
      },
    }),
    prisma.opportunitySkill.findMany({
      where: { opportunity: { status: 'OPEN' } },
      include: {
        skill: { select: { id: true, name: true, category: true } },
      },
    }),
  ]);

  const totalStudents = students.length;

  const demandMap = new Map<string, {
    skillId: string;
    skillName: string;
    category: string;
    demandCount: number;
  }>();

  for (const os of oppSkills) {
    const skillId = os.skillId;
    const skillName = os.skill?.name || os.skillName || 'Unknown';
    const category = os.skill?.category || 'technical';

    const existing = demandMap.get(skillId);
    if (existing) {
      existing.demandCount += 1;
    } else {
      demandMap.set(skillId, {
        skillId,
        skillName,
        category,
        demandCount: 1,
      });
    }
  }

  const studentSkillMap = new Map<string, {
    scores: number[];
    coveredCount: number;
    verifiedCount: number;
  }>();

  for (const student of students) {
    for (const ss of student.skillScores) {
      const existing = studentSkillMap.get(ss.skillId);
      const isCovered = ss.score >= SKILL_COVERAGE_THRESHOLD;
      const isVerified = ss.verificationLevel !== 'SELF-REPORTED';

      if (existing) {
        existing.scores.push(ss.score);
        if (isCovered) existing.coveredCount += 1;
        if (isVerified) existing.verifiedCount += 1;
      } else {
        studentSkillMap.set(ss.skillId, {
          scores: [ss.score],
          coveredCount: isCovered ? 1 : 0,
          verifiedCount: isVerified ? 1 : 0,
        });
      }
    }
  }

  const comparison: InstitutionSkillComparisonItem[] = [];

  for (const dem of Array.from(demandMap.values())) {
    const perf = studentSkillMap.get(dem.skillId) || { scores: [], coveredCount: 0, verifiedCount: 0 };
    const coveredCount = perf.coveredCount;
    const coveragePct = totalStudents > 0 ? Math.round((coveredCount / totalStudents) * 1000) / 10 : 0;
    const avgScore = perf.scores.length > 0
      ? Math.round((perf.scores.reduce((a, b) => a + b, 0) / perf.scores.length) * 10) / 10
      : 0;

    const affectedCount = totalStudents - coveredCount;

    let gapSeverity: GapSeverityLevel = 'LOW';
    if (coveragePct < 30 || (avgScore > 0 && avgScore < 50) || coveredCount === 0) {
      gapSeverity = 'CRITICAL';
    } else if (coveragePct < 60 || avgScore < SKILL_PROFICIENCY_BENCHMARK) {
      gapSeverity = 'MEDIUM';
    }

    const verificationStrengthPct = perf.scores.length > 0
      ? Math.round((perf.verifiedCount / perf.scores.length) * 1000) / 10
      : 0;

    comparison.push({
      skillId: dem.skillId,
      skillName: dem.skillName,
      category: dem.category,
      industryDemandCount: dem.demandCount,
      studentCoverageCount: coveredCount,
      coveragePct,
      avgStudentScore: avgScore,
      gapSeverity,
      affectedStudentCount: affectedCount,
      verificationStrengthPct,
    });
  }

  const severityOrder: Record<GapSeverityLevel, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  comparison.sort((a, b) => {
    const diff = severityOrder[b.gapSeverity] - severityOrder[a.gapSeverity];
    if (diff !== 0) return diff;
    return b.industryDemandCount - a.industryDemandCount;
  });

  return {
    institutionName,
    totalStudents,
    comparison,
  };
}

/**
 * Returns privacy-safe affected student list for a targeted skill gap.
 */
export async function getInstitutionAffectedStudents(
  institutionProfileId: string,
  query: { skillId: string; page?: number; limit?: number; search?: string }
): Promise<AffectedStudentsResponse> {
  const institutionName = await resolveInstitutionName(institutionProfileId);
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));

  const skill = await prisma.skill.findUnique({
    where: { id: query.skillId },
    select: { id: true, name: true },
  });

  if (!skill) {
    throw new Error('Specified skill does not exist.');
  }

  const allStudents = await prisma.studentProfile.findMany({
    where: {
      institution: { equals: institutionName, mode: 'insensitive' },
    },
    include: {
      user: { select: { name: true } },
      skillScores: {
        where: { skillId: query.skillId },
      },
    },
  });

  const affected = allStudents.filter(s => {
    const scoreRecord = s.skillScores[0];
    return !scoreRecord || scoreRecord.score < SKILL_COVERAGE_THRESHOLD;
  });

  let filtered = affected;
  if (query.search?.trim()) {
    const term = query.search.trim().toLowerCase();
    filtered = affected.filter(s => s.user.name.toLowerCase().includes(term));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  const totalInstitutionStudents = allStudents.length;
  const coverageRatio = totalInstitutionStudents > 0
    ? (totalInstitutionStudents - affected.length) / totalInstitutionStudents
    : 0;

  const gapSeverity: GapSeverityLevel = coverageRatio < 0.3
    ? 'CRITICAL'
    : coverageRatio < 0.6
    ? 'MEDIUM'
    : 'LOW';

  const students: AffectedStudentDto[] = paginated.map(s => {
    const scoreRec = s.skillScores[0];
    const cgpa = s.cgpa;
    const cgpaBracket = cgpa
      ? cgpa >= 9.0 ? '9.0 - 10.0' : cgpa >= 8.0 ? '8.0 - 8.9' : cgpa >= 7.0 ? '7.0 - 7.9' : '< 7.0'
      : null;

    return {
      id: s.id,
      fullName: s.user.name,
      targetDomain: s.targetDomain || 'Engineering',
      cgpaBracket,
      currentSkillScore: scoreRec ? scoreRec.score : 0,
      verificationLevel: scoreRec ? scoreRec.verificationLevel : 'UNATTEMPTED',
      lastAttemptDate: scoreRec?.lastAttemptDate ? scoreRec.lastAttemptDate.toISOString() : null,
    };
  });

  return {
    skillId: skill.id,
    skillName: skill.name,
    gapSeverity,
    totalAffected: total,
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Returns real database learning resources and courses recommended for gap remediation.
 */
export async function getInstitutionInterventions(
  institutionProfileId: string
): Promise<InstitutionInterventionsResponse> {
  const comparison = await getInstitutionSkillComparison(institutionProfileId);
  const gapSkills = comparison.comparison.filter(
    c => c.gapSeverity === 'CRITICAL' || c.gapSeverity === 'HIGH' || c.gapSeverity === 'MEDIUM'
  );

  const recommendations: InstitutionInterventionRecommendation[] = [];

  for (const gap of gapSkills.slice(0, 10)) {
    // 1. Search actual courses covering this skill
    const courses = await prisma.course.findMany({
      take: 2,
      include: {
        provider: { select: { name: true } },
        enrollments: true,
      },
    });

    for (const c of courses) {
      let coversSkill = false;
      try {
        const covered = JSON.parse(c.skillsCoveredJson || '[]');
        if (Array.isArray(covered) && covered.some((sc: any) => sc.skillId === gap.skillId)) {
          coversSkill = true;
        }
      } catch {}

      if (coversSkill) {
        recommendations.push({
          id: `rec-course-${c.id}-${gap.skillId}`,
          skillId: gap.skillId,
          skillName: gap.skillName,
          gapSeverity: gap.gapSeverity,
          interventionType: 'COURSE',
          title: c.title,
          provider: c.provider?.name || 'SkillBridge Partner',
          url: c.externalUrl,
          rationale: `Direct course curriculum targeted to resolve institutional gap in ${gap.skillName}.`,
          enrolledStudentsCount: c.enrollments?.length || 0,
        });
      }
    }

    // 2. Search learning resources
    const resources = await prisma.learningResource.findMany({
      where: {
        OR: [
          { skillId: gap.skillId },
          { topicTag: { contains: gap.skillName, mode: 'insensitive' } },
        ],
      },
      take: 2,
    });

    for (const r of resources) {
      recommendations.push({
        id: `rec-res-${r.id}-${gap.skillId}`,
        skillId: gap.skillId,
        skillName: gap.skillName,
        gapSeverity: gap.gapSeverity,
        interventionType: 'RESOURCE',
        title: r.title,
        provider: r.provider,
        url: r.url,
        rationale: `Curated learning reference to elevate foundational competence in ${gap.skillName}.`,
        enrolledStudentsCount: 0,
      });
    }

    // 3. Search Talent Assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        requiredSkillsJson: { contains: gap.skillName },
      },
      take: 1,
    });

    for (const a of assessments) {
      recommendations.push({
        id: `rec-assess-${a.id}-${gap.skillId}`,
        skillId: gap.skillId,
        skillName: gap.skillName,
        gapSeverity: gap.gapSeverity,
        interventionType: 'ASSESSMENT',
        title: a.title,
        provider: 'SkillBridge Certified',
        url: `/assessments/${a.id}`,
        rationale: `Diagnostic talent assessment to measure cohort mastery of ${gap.skillName}.`,
        enrolledStudentsCount: 0,
      });
    }
  }

  return {
    institutionName: comparison.institutionName,
    recommendations,
  };
}

/**
 * Returns authentic monthly score progression trends for an institution.
 */
export async function getInstitutionTrends(institutionProfileId: string): Promise<InstitutionTrendsDto> {
  const institutionName = await resolveInstitutionName(institutionProfileId);

  const students = await prisma.studentProfile.findMany({
    where: {
      institution: { equals: institutionName, mode: 'insensitive' },
    },
    select: { id: true },
  });
  const studentIds = students.map(s => s.id);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const scores = studentIds.length > 0
    ? await prisma.studentSkillScore.findMany({
        where: {
          studentId: { in: studentIds },
          updatedAt: { gte: sixMonthsAgo },
        },
        select: {
          score: true,
          updatedAt: true,
        },
      })
    : [];

  const monthMap = new Map<string, { totalScore: number; count: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(label, { totalScore: 0, count: 0 });
  }

  for (const s of scores) {
    const d = new Date(s.updatedAt);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap.has(m)) {
      const entry = monthMap.get(m)!;
      entry.totalScore += s.score;
      entry.count += 1;
    }
  }

  const cohortScoreProgression: Array<{ month: string; avgScore: number; evaluatedCount: number }> = [];
  for (const [month, data] of Array.from(monthMap.entries())) {
    const avgScore = data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : 0;
    cohortScoreProgression.push({
      month,
      avgScore,
      evaluatedCount: data.count,
    });
  }

  const comparison = await getInstitutionSkillComparison(institutionProfileId);
  const topGapSkillsTrend = comparison.comparison.slice(0, 5).map(c => ({
    skillName: c.skillName,
    currentGap: Math.max(0, Math.round((100 - c.avgStudentScore) * 10) / 10),
    severity: c.gapSeverity,
  }));

  return {
    periodLabel: 'Last 6 Months',
    cohortScoreProgression,
    topGapSkillsTrend,
  };
}

/**
 * Generates an advisory AI curriculum and upskilling recommendation for an Institution Admin.
 */
export async function generateInstitutionAiRecommendations(
  institutionProfileId: string
): Promise<IntelligenceAiInsight> {
  const [overview, comparison] = await Promise.all([
    getInstitutionOverview(institutionProfileId),
    getInstitutionSkillComparison(institutionProfileId),
  ]);

  const criticalGaps = comparison.comparison.filter(c => c.gapSeverity === 'CRITICAL');
  const moderateGaps = comparison.comparison.filter(c => c.gapSeverity === 'MEDIUM');

  const fallbackInsight: IntelligenceAiInsight = {
    summary: `Cohort curriculum analysis for ${comparison.institutionName} highlights ${overview.totalStudents} enrolled students with ${overview.verifiedSkillsCount} verified skills and ${overview.skillGapsCount} identified skill gaps relative to live market demand.`,
    keyObservations: [
      `Cohort size: ${overview.totalStudents} students with ${criticalGaps.length} critical skill gaps identified.`,
      `Most critical skill gap: ${criticalGaps[0]?.skillName || 'None'} with only ${criticalGaps[0]?.coveragePct || 0}% student coverage.`,
      `Verified skill benchmark: ${overview.verifiedSkillsCount} verified skill evaluations recorded to date.`,
    ],
    recommendations: [
      'Integrate lab modules and hands-on projects for high-demand technologies into the upcoming academic term.',
      'Organize targeted assessment bootcamps to transition self-reported skills to verified credentials.',
      'Partner with industry sponsors through the Collaboration module for guest lectures and hackathons.',
    ],
    disclaimer: ADVISORY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };

  try {
    const prompt = `Analyze this deterministic academic institution skill intelligence data:
Institution: ${comparison.institutionName}
Enrolled Students: ${overview.totalStudents}
Verified Skill Badges: ${overview.verifiedSkillsCount}
Identified Skill Gaps: ${overview.skillGapsCount}
Affected Students: ${overview.affectedStudentsCount}
Critical Gaps: ${JSON.stringify(criticalGaps.slice(0, 4))}
Medium Gaps: ${JSON.stringify(moderateGaps.slice(0, 4))}

Provide a JSON object strictly matching this schema:
{
  "summary": "Concise 2-sentence executive curriculum guidance summary",
  "keyObservations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendations": ["Actionable curriculum recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "disclaimer": "${ADVISORY_DISCLAIMER}"
}`;

    const raw = await generateLlmText({
      systemPrompt: 'You are an expert higher education curriculum and placement advisor. Output strictly valid JSON matching the requested schema with zero formatting tags.',
      prompt,
      temperature: 0.3,
    });

    if (!raw) return fallbackInsight;

    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    const validated = IntelligenceAiInsightSchema.safeParse(parsed);

    if (validated.success) {
      return {
        ...validated.data,
        disclaimer: ADVISORY_DISCLAIMER,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('⚠️ [Institution AI Recommendations] Fallback engaged:', (err as any)?.message);
  }

  return fallbackInsight;
}
