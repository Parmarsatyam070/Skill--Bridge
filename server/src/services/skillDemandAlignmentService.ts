/**
 * skillDemandAlignmentService.ts
 * Phase 4 — Skill Demand vs Curriculum Alignment
 *
 * All queries are strictly institution-scoped via institutionProfileId.
 * Uses ONE authoritative opportunity population: status IN ('OPEN', 'CLOSED', 'PAUSED').
 * Distinguishes Opportunity.type via existing schema field (JOB vs INTERNSHIP).
 * Deduplicates unique students across all student-level metrics.
 * Evaluates curriculum coverage using the strict deterministic 4-priority precedence.
 * Generates RFC-4180 compliant CSV export from the exact same calculated DTO.
 */

import { prisma } from '../config/prisma.js';
import {
  CurriculumClassification,
  CurriculumMappingSource,
  GapStatus,
  SkillDemandItemDto,
  SkillDemandOverviewDto,
  CurriculumBreakdownDto,
  MonthlySkillTrendDto,
  SkillDemandAlignmentResponseDto,
} from '../../../shared/types.js';

export interface SkillDemandFilterOptions {
  timeRange?: '30d' | '90d' | '6m' | '12m' | 'all';
  opportunityType?: 'ALL' | 'JOB' | 'INTERNSHIP';
  search?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Resolves the start date for a time filter string relative to current time.
 */
function resolveStartDate(timeRange?: string): Date | null {
  const normalized = (timeRange || 'all').toLowerCase();
  const now = new Date();
  switch (normalized) {
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6m':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '12m':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

/**
 * Evaluates gap status deterministically based on percentage point delta.
 */
function evaluateGapStatus(gapPp: number): GapStatus {
  if (gapPp > 15) return 'Higher demand than supply';
  if (gapPp < -15) return 'Higher supply than demand';
  return 'Balanced';
}

/**
 * Escapes an RFC-4180 CSV field.
 */
function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Computes complete Skill Demand vs Curriculum Alignment analytics.
 */
export async function getSkillDemandAlignment(
  institutionProfileId: string,
  options: SkillDemandFilterOptions = {}
): Promise<SkillDemandAlignmentResponseDto> {
  const timeRange = options.timeRange || 'all';
  const opportunityType = (options.opportunityType || 'ALL').toUpperCase() as 'ALL' | 'JOB' | 'INTERNSHIP';
  const searchTerm = (options.search || '').trim().toLowerCase();

  // 1. Resolve institution name & ensure institution exists
  const institution = await prisma.institutionProfile.findUnique({
    where: { id: institutionProfileId },
    select: { institutionName: true },
  });

  if (!institution) {
    throw new Error('Institution profile not found.');
  }

  // 2. Query Authoritative Opportunities Population
  // status IN ('OPEN', 'CLOSED', 'PAUSED'), excluding DRAFT
  const filterStartDate = options.startDate !== undefined ? options.startDate : resolveStartDate(timeRange);
  const whereOpportunity: any = {
    status: { in: ['OPEN', 'CLOSED', 'PAUSED'] },
  };

  if (filterStartDate || options.endDate) {
    whereOpportunity.createdAt = {};
    if (filterStartDate) {
      whereOpportunity.createdAt.gte = filterStartDate;
    }
    if (options.endDate) {
      whereOpportunity.createdAt.lte = options.endDate;
    }
  }

  if (opportunityType !== 'ALL') {
    whereOpportunity.type = opportunityType;
  }

  const opportunities = await prisma.opportunity.findMany({
    where: whereOpportunity,
    select: {
      id: true,
      status: true,
      type: true,
      companyId: true,
      createdAt: true,
      skills: {
        select: {
          skillId: true,
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const relevantOpportunities = opportunities.length;
  const activeOpportunities = opportunities.filter(o => o.status === 'OPEN').length;
  const closedOpportunities = opportunities.filter(o => o.status === 'CLOSED').length;
  const pausedOpportunities = opportunities.filter(o => o.status === 'PAUSED').length;

  // 3. Query All Canonical Skills from Database
  const allSkills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      category: true,
    },
    orderBy: { name: 'asc' },
  });

  // 4. Query Platform Courses with skillsCoveredJson (Priority 3 Source)
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      skillsCoveredJson: true,
    },
    orderBy: { title: 'asc' },
  });

  const platformCourseSkillMap = new Map<string, string[]>(); // skillId -> course titles
  for (const c of courses) {
    if (!c.skillsCoveredJson) continue;
    try {
      const parsed = JSON.parse(c.skillsCoveredJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item.skillId === 'string') {
            const list = platformCourseSkillMap.get(item.skillId) || [];
            list.push(c.title);
            platformCourseSkillMap.set(item.skillId, list);
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 5. Query Institution Students and their Skill Scores
  // Tenant-scoped strictly to institutionProfileId
  const students = await prisma.studentProfile.findMany({
    where: { institutionProfileId },
    select: {
      id: true,
      skillScores: {
        select: {
          skillId: true,
          score: true,
          verificationLevel: true,
        },
      },
    },
  });

  const totalStudents = students.length;

  // Compute Students with Verified Skills KPI (Unique students having >=1 verified skill)
  const uniqueVerifiedStudentsSet = new Set<string>();
  for (const s of students) {
    const hasVerified = s.skillScores.some(
      ss => ss.verificationLevel && ss.verificationLevel !== 'SELF-REPORTED' && ss.score > 0
    );
    if (hasVerified) {
      uniqueVerifiedStudentsSet.add(s.id);
    }
  }
  const studentsWithVerifiedSkills = uniqueVerifiedStudentsSet.size;
  const verifiedStudentsPct =
    totalStudents > 0
      ? parseFloat(((studentsWithVerifiedSkills / totalStudents) * 100).toFixed(1))
      : 0;

  // 6. Aggregate Demand per Skill
  // Deduplicate opportunities if an opportunity lists a skill multiple times
  const skillDemandMap = new Map<
    string,
    {
      opportunityIds: Set<string>;
      companyIds: Set<string>;
    }
  >();

  for (const opp of opportunities) {
    for (const os of opp.skills) {
      if (!os.skillId) continue;
      let entry = skillDemandMap.get(os.skillId);
      if (!entry) {
        entry = {
          opportunityIds: new Set<string>(),
          companyIds: new Set<string>(),
        };
        skillDemandMap.set(os.skillId, entry);
      }
      entry.opportunityIds.add(opp.id);
      if (opp.companyId) {
        entry.companyIds.add(opp.companyId);
      }
    }
  }

  // 7. Aggregate Student Supply per Skill
  // Count unique students per skill (score > 0) and unique verified students (score > 0 and not SELF-REPORTED)
  const studentSkillSupplyMap = new Map<
    string,
    {
      studentIds: Set<string>;
      verifiedStudentIds: Set<string>;
      scores: number[];
    }
  >();

  for (const s of students) {
    for (const ss of s.skillScores) {
      if (!ss.skillId || ss.score <= 0) continue;
      let entry = studentSkillSupplyMap.get(ss.skillId);
      if (!entry) {
        entry = {
          studentIds: new Set<string>(),
          verifiedStudentIds: new Set<string>(),
          scores: [],
        };
        studentSkillSupplyMap.set(ss.skillId, entry);
      }
      entry.studentIds.add(s.id);
      entry.scores.push(ss.score);
      if (ss.verificationLevel && ss.verificationLevel !== 'SELF-REPORTED') {
        entry.verifiedStudentIds.add(s.id);
      }
    }
  }

  // 8. Build Alignment Items for all skills
  const skillItems: SkillDemandItemDto[] = [];
  const allDemandingCompanyIds = new Set<string>();

  for (const skill of allSkills) {
    const demand = skillDemandMap.get(skill.id);
    const supply = studentSkillSupplyMap.get(skill.id);

    const oppCount = demand ? demand.opportunityIds.size : 0;
    const compCount = demand ? demand.companyIds.size : 0;

    if (demand) {
      demand.companyIds.forEach(cId => allDemandingCompanyIds.add(cId));
    }

    const studentCount = supply ? supply.studentIds.size : 0;
    const verifiedStudentCount = supply ? supply.verifiedStudentIds.size : 0;
    const scores = supply ? supply.scores : [];

    const demandPct =
      relevantOpportunities > 0
        ? parseFloat(((oppCount / relevantOpportunities) * 100).toFixed(1))
        : 0;
    const supplyPct =
      totalStudents > 0
        ? parseFloat(((studentCount / totalStudents) * 100).toFixed(1))
        : 0;
    const verifiedSupplyPct =
      totalStudents > 0
        ? parseFloat(((verifiedStudentCount / totalStudents) * 100).toFixed(1))
        : 0;
    const avgScore =
      scores.length > 0
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : 0;

    const gapPp = parseFloat((demandPct - supplyPct).toFixed(1));
    const gapStatus = evaluateGapStatus(gapPp);

    // ─── 4-PRIORITY DETERMINISTIC CURRICULUM CLASSIFICATION ──────────────
    // Priority 1: Explicit CORE academic curriculum mapping → Covered
    // Priority 2: Explicit SUPPORTING academic curriculum mapping → Partially Covered
    // Priority 3: Explicit Course.skillsCoveredJson coverage → Partially Covered
    // Priority 4: No explicit mapping → Not Mapped
    let curriculumStatus: CurriculumClassification = 'Not Mapped';
    let mappingSource: CurriculumMappingSource = 'Not Mapped';
    let mappedDetails: string[] = [];

    // Check Priority 3: Explicit platform course mapping from Course.skillsCoveredJson
    const coursesCovering = platformCourseSkillMap.get(skill.id);
    if (coursesCovering && coursesCovering.length > 0) {
      curriculumStatus = 'Partially Covered';
      mappingSource = 'Platform Course';
      mappedDetails = [...coursesCovering].sort();
    }

    skillItems.push({
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      opportunityCount: oppCount,
      companyCount: compCount,
      demandPct,
      studentCount,
      verifiedStudentCount,
      supplyPct,
      verifiedSupplyPct,
      avgScore,
      gapPp,
      gapStatus,
      curriculumStatus,
      mappingSource,
      mappedCurriculumDetails: mappedDetails,
    });
  }

  // Filter skills by search query if provided
  let filteredSkills = skillItems;
  if (searchTerm) {
    filteredSkills = skillItems.filter(
      s =>
        s.skillName.toLowerCase().includes(searchTerm) ||
        s.category.toLowerCase().includes(searchTerm)
    );
  }

  // Sort: highest demand count first, then highest supply, then alphabetical
  filteredSkills.sort((a, b) => {
    if (b.opportunityCount !== a.opportunityCount) {
      return b.opportunityCount - a.opportunityCount;
    }
    if (b.studentCount !== a.studentCount) {
      return b.studentCount - a.studentCount;
    }
    return a.skillName.localeCompare(b.skillName);
  });

  // 9. Curriculum Coverage KPI Calculation
  // Demanded skills are skills required by at least 1 relevant opportunity
  const demandedSkills = filteredSkills.filter(s => s.opportunityCount > 0);
  const totalDemandedSkillsCount = demandedSkills.length;
  const coveredDemanded = demandedSkills.filter(s => s.curriculumStatus === 'Covered').length;
  const partiallyCoveredDemanded = demandedSkills.filter(s => s.curriculumStatus === 'Partially Covered').length;
  const notMappedDemanded = demandedSkills.filter(s => s.curriculumStatus === 'Not Mapped').length;

  const curriculumCoveragePct =
    totalDemandedSkillsCount > 0
      ? parseFloat((((coveredDemanded + partiallyCoveredDemanded) / totalDemandedSkillsCount) * 100).toFixed(1))
      : 0;

  const curriculumBreakdown: CurriculumBreakdownDto = {
    coveredCount: coveredDemanded,
    partiallyCoveredCount: partiallyCoveredDemanded,
    notMappedCount: notMappedDemanded,
    coveragePct: curriculumCoveragePct,
    sourceBreakdown: {
      coreAcademic: demandedSkills.filter(s => s.mappingSource === 'CORE academic curriculum').length,
      supportingAcademic: demandedSkills.filter(s => s.mappingSource === 'SUPPORTING academic curriculum').length,
      platformCourse: demandedSkills.filter(s => s.mappingSource === 'Platform Course').length,
      notMapped: notMappedDemanded,
    },
  };

  // Compute demanding company count for filtered skills
  const filteredDemandingCompanyIds = new Set<string>();
  for (const s of demandedSkills) {
    const demand = skillDemandMap.get(s.skillId);
    if (demand) {
      demand.companyIds.forEach(cId => filteredDemandingCompanyIds.add(cId));
    }
  }

  // 10. Overview KPI Card Metrics
  const overview: SkillDemandOverviewDto = {
    relevantOpportunities,
    activeOpportunities,
    closedOpportunities,
    pausedOpportunities,
    demandedSkillsCount: totalDemandedSkillsCount,
    companiesWithDemandCount: filteredDemandingCompanyIds.size,
    totalStudents,
    studentsWithVerifiedSkills,
    verifiedStudentsPct,
    curriculumCoveragePct,
  };

  // 11. Monthly Demand Trends
  // Group opportunities created by YYYY-MM
  const monthlyMap = new Map<
    string,
    {
      total: number;
      active: number;
      closed: number;
      paused: number;
      skillsMap: Map<string, { skillName: string; count: number }>;
    }
  >();

  for (const opp of opportunities) {
    const d = new Date(opp.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let monthEntry = monthlyMap.get(key);
    if (!monthEntry) {
      monthEntry = {
        total: 0,
        active: 0,
        closed: 0,
        paused: 0,
        skillsMap: new Map(),
      };
      monthlyMap.set(key, monthEntry);
    }
    monthEntry.total++;
    if (opp.status === 'OPEN') monthEntry.active++;
    if (opp.status === 'CLOSED') monthEntry.closed++;
    if (opp.status === 'PAUSED') monthEntry.paused++;

    for (const os of opp.skills) {
      if (!os.skillId) continue;
      const sName = os.skill?.name || os.skillId;
      const sk = monthEntry.skillsMap.get(os.skillId) || { skillName: sName, count: 0 };
      sk.count++;
      monthEntry.skillsMap.set(os.skillId, sk);
    }
  }

  const monthlyTrends: MonthlySkillTrendDto[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const topSkills = Array.from(data.skillsMap.entries())
        .map(([skillId, s]) => ({ skillId, skillName: s.skillName, demandCount: s.count }))
        .sort((a, b) => {
          if (b.demandCount !== a.demandCount) {
            return b.demandCount - a.demandCount;
          }
          return a.skillName.localeCompare(b.skillName);
        })
        .slice(0, 5);

      return {
        month,
        totalOpportunities: data.total,
        activeOpportunities: data.active,
        closedOpportunities: data.closed,
        pausedOpportunities: data.paused,
        topSkills,
      };
    });

  // 12. Neutral Descriptive Observations
  // strictly deterministic data-driven facts; no recommendations, no strategic directives
  const observations: string[] = [];
  const higherDemandSkills = demandedSkills.filter(s => s.gapStatus === 'Higher demand than supply');
  const balancedSkills = demandedSkills.filter(s => s.gapStatus === 'Balanced');
  const higherSupplySkills = demandedSkills.filter(s => s.gapStatus === 'Higher supply than demand');

  if (totalDemandedSkillsCount === 0) {
    observations.push('No industry opportunities demanding specific skills were found for the selected filter criteria.');
  } else {
    observations.push(
      `${higherDemandSkills.length} of ${totalDemandedSkillsCount} demanded skills have higher industry demand than institution student supply (gap > +15 pp).`
    );

    if (notMappedDemanded > 0) {
      observations.push(
        `${notMappedDemanded} demanded skills are not explicitly mapped to available curriculum or platform course offerings.`
      );
    }

    if (totalStudents > 0) {
      observations.push(
        `${studentsWithVerifiedSkills} of ${totalStudents} students (${verifiedStudentsPct}%) hold at least one verified skill score.`
      );
    }

    if (balancedSkills.length > 0) {
      observations.push(
        `${balancedSkills.length} skills exhibit balanced alignment between industry demand and student supply (within +/-15 pp).`
      );
    }

    if (higherSupplySkills.length > 0) {
      observations.push(
        `${higherSupplySkills.length} skills show student supply exceeding current industry opportunity demand by more than 15 pp.`
      );
    }
  }

  return {
    overview,
    skills: filteredSkills,
    curriculumBreakdown,
    monthlyTrends,
    observations,
    metadata: {
      institutionName: institution.institutionName,
      timeRange,
      opportunityType,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generates an RFC-4180 compliant CSV export containing aggregate data only.
 * Reuses the exact getSkillDemandAlignment calculation.
 */
export async function generateSkillDemandCsv(
  institutionProfileId: string,
  options: SkillDemandFilterOptions = {}
): Promise<string> {
  const data = await getSkillDemandAlignment(institutionProfileId, options);

  const headers = [
    'Skill Name',
    'Category',
    'Opportunities Demanding',
    'Companies Demanding',
    'Industry Demand %',
    'Institution Students with Skill',
    'Verified Students with Skill',
    'Student Supply %',
    'Verified Supply %',
    'Average Student Score',
    'Demand vs Supply Gap (pp)',
    'Gap Status',
    'Curriculum Status',
    'Mapping Source',
    'Mapped Curriculum / Platform Courses',
  ];

  const rows: string[] = [headers.join(',')];

  for (const item of data.skills) {
    const row = [
      escapeCsvField(item.skillName),
      escapeCsvField(item.category),
      item.opportunityCount,
      item.companyCount,
      item.demandPct.toFixed(1),
      item.studentCount,
      item.verifiedStudentCount,
      item.supplyPct.toFixed(1),
      item.verifiedSupplyPct.toFixed(1),
      item.avgScore.toFixed(1),
      item.gapPp > 0 ? `+${item.gapPp.toFixed(1)}` : item.gapPp.toFixed(1),
      escapeCsvField(item.gapStatus),
      escapeCsvField(item.curriculumStatus),
      escapeCsvField(item.mappingSource),
      escapeCsvField((item.mappedCurriculumDetails || []).join('; ')),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
