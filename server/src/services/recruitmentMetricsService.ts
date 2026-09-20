/**
 * recruitmentMetricsService.ts
 * Phase 3 — Recruitment Metrics Dashboard
 *
 * All queries are institution-scoped via institutionProfileId.
 * Derives metrics exclusively from real database records.
 * No hardcoded statistics, no predictive/AI values.
 *
 * Correction notes (verified 2026-09-20):
 *
 *  PLACEMENT RATE
 *    Numerator  : count of UNIQUE students who have at least one application
 *                 with a normalised status of "hired"
 *    Denominator: total StudentProfile records affiliated with this institution
 *    Formula    : (uniqueStudentsPlaced / totalStudents) × 100
 *    Population : same level (student) for both sides — no cross-population mismatch
 *
 *  COMPANY ACTIVITY
 *    Grouping : IndustryProfile.id derived from Application → Opportunity → company
 *               OR Application → Internship → industry
 *    Sort     : total application count descending (explicit; no opaque ranking score)
 *    Limit    : top 10 by application volume
 *
 *  DOMAIN PERFORMANCE (previously mislabelled "Department Performance")
 *    Source field : StudentProfile.targetDomain — a career-domain preference
 *                   (e.g. "Full Stack", "Data Science"), NOT an academic department.
 *                   No academic department field exists on StudentProfile.
 *    Label        : "Domain Performance" / "domain" throughout — never "Department"
 *
 *  AVG MATCH SCORE AT APPLY
 *    Source : Application.matchScoreAtApply — a Float snapshotted from the 7-factor
 *             CandidateMatch score at the moment the student submitted the application.
 *    Algorithm unchanged: uses the existing score as stored, no new computation.
 *    Population: applications belonging to students in this institution where
 *                matchScoreAtApply IS NOT NULL.
 *    Records without a score are excluded from the average; never substituted.
 *    Field name: avgMatchScoreAtApply throughout (no ambiguity with live CandidateMatch).
 */

import { prisma } from '../config/prisma.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverviewMetrics {
  totalStudents: number;
  totalApplications: number;
  /** Unique students (not application rows) with a hired outcome */
  uniqueStudentsPlaced: number;
  /**
   * Placement rate = (uniqueStudentsPlaced / totalStudents) × 100
   * Both numerator and denominator are at the student level.
   */
  overallPlacementRate: number;
  activeApplications: number;
  /**
   * Average of Application.matchScoreAtApply for all applications in this institution.
   * matchScoreAtApply is snapshotted from the 7-factor CandidateMatch score at apply-time.
   * Applications with null matchScoreAtApply are excluded from the average.
   */
  avgMatchScoreAtApply: number;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  pct: number;
}

/**
 * Company recruitment activity.
 * Sorted by totalApplications descending; top 10 by application volume.
 */
export interface CompanyActivity {
  companyId: string;
  companyName: string;
  industrySector: string;
  /** Total application rows linked to this company via Opportunity or Internship */
  totalApplications: number;
  hired: number;
  /** Applications reaching shortlisted / assessment / interview / hired stage */
  advancedApplications: number;
  /** hired / totalApplications × 100 */
  conversionRate: number;
}

/**
 * Domain performance — grouped by StudentProfile.targetDomain.
 * targetDomain is a career/domain preference field, NOT an academic department.
 */
export interface DomainPerformance {
  domain: string;
  studentCount: number;
  applicationCount: number;
  hiredCount: number;
  /**
   * Placement rate = (hiredCount / studentCount) × 100
   * Uses student-level denominator (students in this domain group).
   */
  placementRate: number;
  /**
   * Average of Application.matchScoreAtApply for applications in this domain group.
   * Null matchScoreAtApply records are excluded.
   * 0 when no scored applications exist for this group.
   */
  avgMatchScoreAtApply: number;
}

export interface BatchCohort {
  gradYear: number;
  studentCount: number;
  applicationCount: number;
  hiredCount: number;
  /** (hiredCount / studentCount) × 100 */
  placementRate: number;
}

export interface MonthlyTrend {
  month: string;
  applications: number;
  hired: number;
}

export interface StatusDistribution {
  status: string;
  label: string;
  count: number;
  pct: number;
}

export interface RecruitmentMetrics {
  overview: OverviewMetrics;
  funnel: FunnelStage[];
  /** Top 10 companies by application volume (sorted descending by totalApplications) */
  topCompaniesByVolume: CompanyActivity[];
  /** Domain performance grouped by StudentProfile.targetDomain */
  domainPerformance: DomainPerformance[];
  batchCohorts: BatchCohort[];
  monthlyTrends: MonthlyTrend[];
  statusDistribution: StatusDistribution[];
  topOpportunityTypes: { type: string; count: number; hired: number }[];
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNNEL_STAGES = [
  { stage: 'applied',      label: 'Applied'      },
  { stage: 'under_review', label: 'Under Review' },
  { stage: 'shortlisted',  label: 'Shortlisted'  },
  { stage: 'assessment',   label: 'Assessment'   },
  { stage: 'interview',    label: 'Interview'    },
  { stage: 'hired',        label: 'Hired'        },
  { stage: 'rejected',     label: 'Rejected'     },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseStatus(s: string): string {
  if (!s) return 'applied';
  const v = s.trim().toLowerCase();
  switch (v) {
    case 'accepted': return 'hired';
    case 'offered':  return 'hired';
    case 'interview_scheduled':
    case 'interview_completed': return 'interview';
    case 'withdrawn': return 'rejected';
    case 'on_hold':   return 'under_review';
    default: return v;
  }
}

// ---------------------------------------------------------------------------
export interface RecruitmentMetricsFilterOptions {
  startDate?: Date | null;
  endDate?: Date | null;
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

export async function getRecruitmentMetrics(
  institutionProfileId: string,
  options?: RecruitmentMetricsFilterOptions,
): Promise<RecruitmentMetrics> {

  // 1. Students affiliated with this institution (baseline cohort)
  const students = await prisma.studentProfile.findMany({
    where: { institutionProfileId },
    select: { id: true, targetDomain: true, gradYear: true },
  });

  const studentIds = students.map(s => s.id);
  const totalStudents = students.length;

  // Zero-result guard
  if (studentIds.length === 0) {
    return {
      overview: {
        totalStudents: 0,
        totalApplications: 0,
        uniqueStudentsPlaced: 0,
        overallPlacementRate: 0,
        activeApplications: 0,
        avgMatchScoreAtApply: 0,
      },
      funnel: FUNNEL_STAGES.map(f => ({ ...f, count: 0, pct: 0 })),
      topCompaniesByVolume: [],
      domainPerformance: [],
      batchCohorts: [],
      monthlyTrends: [],
      statusDistribution: [],
      topOpportunityTypes: [],
      computedAt: new Date().toISOString(),
    };
  }

  // 2. Applications for these students (optionally bounded by reporting period)
  const whereApplications: any = {
    studentId: { in: studentIds },
  };

  if (options?.startDate || options?.endDate) {
    whereApplications.appliedAt = {};
    if (options.startDate) {
      whereApplications.appliedAt.gte = options.startDate;
    }
    if (options.endDate) {
      whereApplications.appliedAt.lte = options.endDate;
    }
  }

  const applications = await prisma.application.findMany({
    where: whereApplications,
    select: {
      id: true,
      studentId: true,
      status: true,
      matchScoreAtApply: true,
      appliedAt: true,
      opportunity: {
        select: {
          id: true,
          type: true,
          company: { select: { id: true, companyName: true, industrySector: true } },
        },
      },
      internship: {
        select: {
          id: true,
          industry: { select: { id: true, companyName: true, industrySector: true } },
        },
      },
    },
  });

  const totalApplications = applications.length;
  const statusNorm = applications.map(a => normaliseStatus(a.status));

  // 3. Overview
  // Placement rate: unique students (not application rows) with a hired outcome.
  // Both numerator and denominator are at the student level.
  const placedStudentIds = new Set<string>();
  for (let i = 0; i < applications.length; i++) {
    if (statusNorm[i] === 'hired') placedStudentIds.add(applications[i].studentId);
  }
  const uniqueStudentsPlaced = placedStudentIds.size;

  const activeSet = new Set(['applied', 'under_review', 'shortlisted', 'assessment', 'interview']);
  const activeApplications = statusNorm.filter(s => activeSet.has(s)).length;

  // avgMatchScoreAtApply: average of Application.matchScoreAtApply (snapshotted 7-factor score).
  // Excludes null/NaN records from both numerator and denominator.
  const scores = applications
    .map(a => a.matchScoreAtApply)
    .filter((s): s is number => s != null && !isNaN(s));
  const avgMatchScoreAtApply = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const overallPlacementRate = totalStudents > 0
    ? parseFloat(((uniqueStudentsPlaced / totalStudents) * 100).toFixed(1))
    : 0;

  // 4. Funnel
  const stageCounts: Record<string, number> = {};
  for (const s of statusNorm) { stageCounts[s] = (stageCounts[s] || 0) + 1; }

  const funnel: FunnelStage[] = FUNNEL_STAGES.map(f => ({
    ...f,
    count: stageCounts[f.stage] || 0,
    pct: totalApplications > 0
      ? parseFloat((((stageCounts[f.stage] || 0) / totalApplications) * 100).toFixed(1))
      : 0,
  }));

  // 5. Status distribution (for pie/donut chart, excludes zero-count stages)
  const statusDistribution: StatusDistribution[] = funnel
    .filter(s => s.count > 0)
    .map(s => ({ status: s.stage, label: s.label, count: s.count, pct: s.pct }));

  // 6. Company activity
  // Grouped by IndustryProfile.id (from Opportunity.company or Internship.industry).
  // Sorted by totalApplications descending; limited to top 10 by application volume.
  const companyMap = new Map<string, {
    companyId: string; companyName: string; industrySector: string;
    total: number; hired: number; advanced: number;
  }>();

  for (let i = 0; i < applications.length; i++) {
    const app  = applications[i];
    const norm = statusNorm[i];
    let companyId = '', companyName = 'Unknown', industrySector = '';

    if (app.opportunity?.company) {
      companyId      = app.opportunity.company.id;
      companyName    = app.opportunity.company.companyName;
      industrySector = app.opportunity.company.industrySector;
    } else if (app.internship?.industry) {
      companyId      = app.internship.industry.id;
      companyName    = app.internship.industry.companyName;
      industrySector = app.internship.industry.industrySector;
    } else {
      continue; // skip orphan applications with no company association
    }

    if (!companyMap.has(companyId)) {
      companyMap.set(companyId, { companyId, companyName, industrySector, total: 0, hired: 0, advanced: 0 });
    }
    const entry = companyMap.get(companyId)!;
    entry.total++;
    if (norm === 'hired') entry.hired++;
    if (['shortlisted', 'assessment', 'interview', 'hired'].includes(norm)) entry.advanced++;
  }

  // Sort: totalApplications descending. Top 10 by application volume.
  const topCompaniesByVolume: CompanyActivity[] = Array.from(companyMap.values())
    .map(c => ({
      companyId:           c.companyId,
      companyName:         c.companyName,
      industrySector:      c.industrySector,
      totalApplications:   c.total,
      hired:               c.hired,
      advancedApplications: c.advanced,
      conversionRate:      c.total > 0 ? parseFloat(((c.hired / c.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalApplications - a.totalApplications)
    .slice(0, 10);

  // 7. Domain performance — grouped by StudentProfile.targetDomain.
  // targetDomain is a career/domain preference field, NOT an academic department.
  // Placement rate uses student-level denominator (students in this domain group).
  // avgMatchScoreAtApply excludes null records.
  const studentMeta = new Map(students.map(s => [s.id, s]));
  const domainMap = new Map<string, {
    domain: string; studentCount: number; applicationCount: number;
    hiredCount: number; scoredApplications: number[];
  }>();

  for (const s of students) {
    const domain = s.targetDomain || 'Unspecified';
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, studentCount: 0, applicationCount: 0, hiredCount: 0, scoredApplications: [] });
    }
    domainMap.get(domain)!.studentCount++;
  }

  for (let i = 0; i < applications.length; i++) {
    const app  = applications[i];
    const norm = statusNorm[i];
    const meta = studentMeta.get(app.studentId);
    if (!meta) continue;
    const domain = meta.targetDomain || 'Unspecified';
    const entry  = domainMap.get(domain);
    if (!entry) continue;
    entry.applicationCount++;
    if (norm === 'hired') entry.hiredCount++;
    // Only include scored applications; null records are excluded.
    if (app.matchScoreAtApply != null && !isNaN(app.matchScoreAtApply)) {
      entry.scoredApplications.push(app.matchScoreAtApply);
    }
  }

  const domainPerformance: DomainPerformance[] = Array.from(domainMap.values())
    .map(d => ({
      domain:               d.domain,
      studentCount:         d.studentCount,
      applicationCount:     d.applicationCount,
      hiredCount:           d.hiredCount,
      placementRate:        d.studentCount > 0
        ? parseFloat(((d.hiredCount / d.studentCount) * 100).toFixed(1))
        : 0,
      avgMatchScoreAtApply: d.scoredApplications.length > 0
        ? Math.round(d.scoredApplications.reduce((a, b) => a + b, 0) / d.scoredApplications.length)
        : 0,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount);

  // 8. Batch cohorts (by gradYear)
  const cohortMap = new Map<number, {
    gradYear: number; studentCount: number; applicationCount: number; hiredCount: number;
  }>();
  for (const s of students) {
    const gy = s.gradYear ?? 0;
    if (!cohortMap.has(gy)) cohortMap.set(gy, { gradYear: gy, studentCount: 0, applicationCount: 0, hiredCount: 0 });
    cohortMap.get(gy)!.studentCount++;
  }
  for (let i = 0; i < applications.length; i++) {
    const app   = applications[i];
    const norm  = statusNorm[i];
    const meta  = studentMeta.get(app.studentId);
    if (!meta) continue;
    const gy    = meta.gradYear ?? 0;
    const entry = cohortMap.get(gy);
    if (!entry) continue;
    entry.applicationCount++;
    if (norm === 'hired') entry.hiredCount++;
  }

  const batchCohorts: BatchCohort[] = Array.from(cohortMap.values())
    .filter(c => c.gradYear > 0)
    .map(c => ({
      ...c,
      placementRate: c.studentCount > 0
        ? parseFloat(((c.hiredCount / c.studentCount) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => a.gradYear - b.gradYear);

  // 9. Monthly trends (last 12 months, zero-filled)
  const now = new Date();
  const monthlyMap = new Map<string, { applications: number; hired: number }>();
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, { applications: 0, hired: 0 });
  }
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  for (let i = 0; i < applications.length; i++) {
    const app  = applications[i];
    const norm = statusNorm[i];
    const d    = new Date(app.appliedAt);
    if (d < cutoff) continue;
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap.has(key)) continue;
    const entry = monthlyMap.get(key)!;
    entry.applications++;
    if (norm === 'hired') entry.hired++;
  }

  const monthlyTrends: MonthlyTrend[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // 10. Top opportunity types (by application count)
  const typeMap = new Map<string, { count: number; hired: number }>();
  for (let i = 0; i < applications.length; i++) {
    const app  = applications[i];
    const norm = statusNorm[i];
    const type = app.opportunity?.type ?? (app.internship ? 'INTERNSHIP' : 'OTHER');
    if (!typeMap.has(type)) typeMap.set(type, { count: 0, hired: 0 });
    const entry = typeMap.get(type)!;
    entry.count++;
    if (norm === 'hired') entry.hired++;
  }

  const topOpportunityTypes = Array.from(typeMap.entries())
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    overview: {
      totalStudents,
      totalApplications,
      uniqueStudentsPlaced,
      overallPlacementRate,
      activeApplications,
      avgMatchScoreAtApply,
    },
    funnel,
    topCompaniesByVolume,
    domainPerformance,
    batchCohorts,
    monthlyTrends,
    statusDistribution,
    topOpportunityTypes,
    computedAt: new Date().toISOString(),
  };
}
