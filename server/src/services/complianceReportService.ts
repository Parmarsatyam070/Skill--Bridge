/**
 * complianceReportService.ts
 * Phase 5 — Policy-Ready Compliance Reports
 *
 * Deterministic, institution-scoped compliance reporting engine for INSTITUTION_ADMIN.
 * Reuses authoritative calculations from Phase 1, Phase 2, Phase 3, and Phase 4.
 * Zero duplicate pipelines, zero student PII, strictly aggregate data.
 * Adheres to RFC-4180 CSV standard and generates server-side vector PDFs via jsPDF.
 */

import { jsPDF } from 'jspdf';
import { prisma } from '../config/prisma.js';
import { getRecruitmentMetrics } from './recruitmentMetricsService.js';
import { getSkillDemandAlignment } from './skillDemandAlignmentService.js';
import {
  ComplianceReportType,
  ComplianceTimePeriod,
  ComplianceReportMetadata,
  RecruitmentActivityReportDto,
  CandidateSkillsReportDto,
  CurriculumAlignmentReportDto,
  InstitutionalComplianceSummaryDto,
  ComplianceReportPayload,
} from '../../../shared/types.js';

// ---------------------------------------------------------------------------
// Custom HTTP Errors for Validation
// ---------------------------------------------------------------------------

export class ReportValidationError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReportValidationError';
    this.code = code;
    this.statusCode = 400;
  }
}

// ---------------------------------------------------------------------------
// Helpers & Reporting-Period Resolver
// ---------------------------------------------------------------------------

export interface ResolvedReportingPeriod {
  startDate: Date | null;
  endDate: Date | null;
  label: string;
  timeRangeForSkillDemand: '30d' | '90d' | '6m' | '12m' | 'all';
}

/**
 * Validates and normalizes reporting-period parameters across services.
 */
export function resolveReportingPeriod(
  timePeriod?: string,
  rawStartDate?: string,
  rawEndDate?: string
): ResolvedReportingPeriod {
  const normalizedPeriod = (timePeriod || 'all').toLowerCase();
  const allowedPeriods = ['30d', '90d', '6m', '12m', 'all', 'custom'];

  if (!allowedPeriods.includes(normalizedPeriod)) {
    throw new ReportValidationError(
      'INVALID_TIME_PERIOD',
      `Invalid timePeriod '${timePeriod}'. Allowed values: ${allowedPeriods.join(', ')}.`
    );
  }

  const now = new Date();

  if (normalizedPeriod === 'custom') {
    if (!rawStartDate || !rawEndDate || rawStartDate.trim() === '' || rawEndDate.trim() === '') {
      throw new ReportValidationError(
        'MISSING_CUSTOM_DATES',
        "For 'custom' timePeriod, both 'startDate' and 'endDate' query parameters are strictly required."
      );
    }

    const isoRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
    if (!isoRegex.test(rawStartDate.trim()) || !isoRegex.test(rawEndDate.trim())) {
      throw new ReportValidationError(
        'INVALID_DATE_FORMAT',
        "'startDate' and 'endDate' must be valid dates in YYYY-MM-DD format."
      );
    }

    const start = new Date(rawStartDate.trim());
    const end = new Date(rawEndDate.trim());

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ReportValidationError(
        'INVALID_DATE_FORMAT',
        "'startDate' and 'endDate' must be valid dates in YYYY-MM-DD format."
      );
    }

    if (start > end) {
      throw new ReportValidationError(
        'INVALID_DATE_RANGE',
        "'startDate' must be earlier than or equal to 'endDate'."
      );
    }

    // Set end of day for end date
    end.setHours(23, 59, 59, 999);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    return {
      startDate: start,
      endDate: end,
      label: `Custom Range (${startStr} to ${endStr})`,
      timeRangeForSkillDemand: 'all', // Phase 4 queries all, bounded by date if supported
    };
  }

  switch (normalizedPeriod) {
    case '30d': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: start,
        endDate: now,
        label: `Last 30 Days (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
        timeRangeForSkillDemand: '30d',
      };
    }
    case '90d': {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return {
        startDate: start,
        endDate: now,
        label: `Last 90 Days (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
        timeRangeForSkillDemand: '90d',
      };
    }
    case '6m': {
      const start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      return {
        startDate: start,
        endDate: now,
        label: `Last 6 Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
        timeRangeForSkillDemand: '6m',
      };
    }
    case '12m': {
      const start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return {
        startDate: start,
        endDate: now,
        label: `Last 12 Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
        timeRangeForSkillDemand: '12m',
      };
    }
    case 'all':
    default: {
      return {
        startDate: null,
        endDate: null,
        label: 'All Available Historical Data',
        timeRangeForSkillDemand: 'all',
      };
    }
  }
}

/**
 * Escapes an RFC-4180 CSV field with CRLF compatibility.
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getReportTitle(reportType: ComplianceReportType): string {
  switch (reportType) {
    case 'recruitment_activity':
      return 'Recruitment Activity & Student Placement Report';
    case 'candidate_skills':
      return 'Candidate Skill Readiness & Verification Audit Report';
    case 'curriculum_alignment':
      return 'Skill Demand vs Curriculum Alignment Audit Report';
    case 'institutional_compliance_summary':
      return 'Institutional Compliance & Performance Summary Report';
  }
}

// ---------------------------------------------------------------------------
// Core Data Gathering & Transformation
// ---------------------------------------------------------------------------

export async function getComplianceReportData(
  institutionProfileId: string,
  options: {
    reportType: string;
    timePeriod?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ComplianceReportPayload> {
  const allowedReportTypes: ComplianceReportType[] = [
    'recruitment_activity',
    'candidate_skills',
    'curriculum_alignment',
    'institutional_compliance_summary',
  ];

  if (!allowedReportTypes.includes(options.reportType as ComplianceReportType)) {
    throw new ReportValidationError(
      'INVALID_REPORT_TYPE',
      `Invalid reportType '${options.reportType}'. Allowed values: ${allowedReportTypes.join(', ')}.`
    );
  }

  const reportType = options.reportType as ComplianceReportType;
  const resolvedPeriod = resolveReportingPeriod(options.timePeriod, options.startDate, options.endDate);

  // 1. Resolve institution identity (server-authoritative)
  const institution = await prisma.institutionProfile.findUnique({
    where: { id: institutionProfileId },
    select: { institutionName: true },
  });

  if (!institution) {
    throw new Error('Institution profile not found.');
  }

  // 2. Query Authoritative Phase 3 Recruitment Metrics
  const recruitmentMetrics = await getRecruitmentMetrics(institutionProfileId, {
    startDate: resolvedPeriod.startDate,
    endDate: resolvedPeriod.endDate,
  });

  // 3. Query Authoritative Phase 4 Skill Demand vs Curriculum Alignment
  const skillData = await getSkillDemandAlignment(institutionProfileId, {
    timeRange: resolvedPeriod.timeRangeForSkillDemand,
    startDate: resolvedPeriod.startDate,
    endDate: resolvedPeriod.endDate,
  });

  // 4. Derive averageRecordedSkillScore in memory:
  // Weighted average of recorded student skill scores across included demanded-skill records
  const demandedWithScores = skillData.skills.filter(
    s => s.opportunityCount > 0 && s.studentCount > 0 && s.avgScore > 0
  );
  let totalWeightedScore = 0;
  let totalStudentWeights = 0;
  for (const s of demandedWithScores) {
    totalWeightedScore += s.avgScore * s.studentCount;
    totalStudentWeights += s.studentCount;
  }
  const averageRecordedSkillScore =
    totalStudentWeights > 0
      ? parseFloat((totalWeightedScore / totalStudentWeights).toFixed(1))
      : 0.0;

  // 5. Build Standardized Report Metadata (UUID redacted for privacy)
  const metadata: ComplianceReportMetadata = {
    reportType,
    reportTitle: getReportTitle(reportType),
    institutionName: institution.institutionName,
    reportingPeriod: resolvedPeriod.label,
    startDate: resolvedPeriod.startDate ? resolvedPeriod.startDate.toISOString() : null,
    endDate: resolvedPeriod.endDate ? resolvedPeriod.endDate.toISOString() : null,
    generatedAt: new Date().toISOString(),
    dataScope: 'Official Institution-Affiliated Cohort Data (Aggregate Only)',
    methodologyNote:
      'Compiled deterministically from recorded institutional student records, submitted applications, verified skill credentials, and mapped curriculum catalogs.',
  };

  // 6. Build Specific Report Payload
  if (reportType === 'recruitment_activity') {
    const data: RecruitmentActivityReportDto = {
      metadata,
      overview: recruitmentMetrics.overview,
      funnel: recruitmentMetrics.funnel,
      employersByVolume: recruitmentMetrics.topCompaniesByVolume,
      domainPerformance: recruitmentMetrics.domainPerformance,
      statusDistribution: recruitmentMetrics.statusDistribution,
    };
    return { reportType, data };
  }

  if (reportType === 'candidate_skills') {
    const data: CandidateSkillsReportDto = {
      metadata,
      summary: {
        totalStudents: recruitmentMetrics.overview.totalStudents,
        studentsWithVerifiedSkills: skillData.overview.studentsWithVerifiedSkills,
        verifiedStudentsPct: skillData.overview.verifiedStudentsPct,
        averageRecordedSkillScore,
        demandedSkillsCount: skillData.overview.demandedSkillsCount,
      },
      domainDistribution: recruitmentMetrics.domainPerformance,
      skills: skillData.skills,
    };
    return { reportType, data };
  }

  if (reportType === 'curriculum_alignment') {
    const demandedSkills = skillData.skills.filter(s => s.opportunityCount > 0);
    const data: CurriculumAlignmentReportDto = {
      metadata,
      summary: {
        totalDemandedSkills: skillData.overview.demandedSkillsCount,
        curriculumCoveragePct: skillData.overview.curriculumCoveragePct,
        coveredCount: skillData.curriculumBreakdown.coveredCount,
        partiallyCoveredCount: skillData.curriculumBreakdown.partiallyCoveredCount,
        notMappedCount: skillData.curriculumBreakdown.notMappedCount,
        sourceBreakdown: skillData.curriculumBreakdown.sourceBreakdown,
      },
      demandedSkills,
    };
    return { reportType, data };
  }

  // institutional_compliance_summary
  const higherDemandCount = skillData.skills.filter(
    s => s.opportunityCount > 0 && s.gapStatus === 'Higher demand than supply'
  ).length;
  const balancedCount = skillData.skills.filter(
    s => s.opportunityCount > 0 && s.gapStatus === 'Balanced'
  ).length;
  const higherSupplyCount = skillData.skills.filter(
    s => s.opportunityCount > 0 && s.gapStatus === 'Higher supply than demand'
  ).length;

  const summaryData: InstitutionalComplianceSummaryDto = {
    metadata,
    scorecard: {
      totalStudents: recruitmentMetrics.overview.totalStudents,
      overallPlacementRate: recruitmentMetrics.overview.overallPlacementRate,
      totalApplications: recruitmentMetrics.overview.totalApplications,
      activeApplications: recruitmentMetrics.overview.activeApplications,
      avgMatchScoreAtApply: recruitmentMetrics.overview.avgMatchScoreAtApply,
      studentsWithVerifiedSkills: skillData.overview.studentsWithVerifiedSkills,
      verifiedStudentsPct: skillData.overview.verifiedStudentsPct,
      averageRecordedSkillScore,
      totalDemandedSkills: skillData.overview.demandedSkillsCount,
      curriculumCoveragePct: skillData.overview.curriculumCoveragePct,
      employersWithActivityCount: recruitmentMetrics.topCompaniesByVolume.length,
    },
    funnelSummary: recruitmentMetrics.funnel,
    skillGapSummary: {
      higherDemandCount,
      balancedCount,
      higherSupplyCount,
      unmappedCount: skillData.curriculumBreakdown.notMappedCount,
    },
    domainSummary: recruitmentMetrics.domainPerformance,
    topDemandedSkills: skillData.skills.filter(s => s.opportunityCount > 0).slice(0, 10),
  };

  return { reportType, data: summaryData };
}

// ---------------------------------------------------------------------------
// RFC-4180 CSV Generator (Aggregate-Only, CRLF line endings)
// ---------------------------------------------------------------------------

export function generateComplianceReportCsv(payload: ComplianceReportPayload): string {
  const lines: string[] = [];

  if (payload.reportType === 'recruitment_activity') {
    const { data } = payload;
    lines.push(['Section', 'Category', 'Metric / Item', 'Count', 'Percentage', 'Score / Rate', 'Details'].map(escapeCsv).join(','));

    // Metadata & Overview rows
    lines.push(['Metadata', 'Institution', 'Institution Name', data.metadata.institutionName, '', '', 'Reporting institution'].map(escapeCsv).join(','));
    lines.push(['Overview', 'Student Population', 'Enrolled Students', data.overview.totalStudents, '100.0%', '', 'Total affiliated student profiles'].map(escapeCsv).join(','));
    lines.push(['Overview', 'Applications', 'Total Submitted', data.overview.totalApplications, '', '', 'Total applications submitted by affiliated students'].map(escapeCsv).join(','));
    lines.push(['Overview', 'Placements', 'Unique Students Placed', data.overview.uniqueStudentsPlaced, `${data.overview.overallPlacementRate.toFixed(1)}%`, '', 'Placement rate = (unique placed / total students) * 100'].map(escapeCsv).join(','));
    lines.push(['Overview', 'Applications', 'Active Applications', data.overview.activeApplications, data.overview.totalApplications > 0 ? `${((data.overview.activeApplications / data.overview.totalApplications) * 100).toFixed(1)}%` : '0.0%', '', 'Applications currently in progress'].map(escapeCsv).join(','));
    lines.push(['Overview', 'Applicant Match', 'Avg Match Score at Apply', '', '', data.overview.avgMatchScoreAtApply.toFixed(1), 'Average snapshotted 7-factor match score'].map(escapeCsv).join(','));

    // Funnel rows
    for (const f of data.funnel) {
      lines.push(['Funnel', 'Application Stage', f.label, f.count, `${f.pct.toFixed(1)}%`, '', ''].map(escapeCsv).join(','));
    }

    // Employers by Volume rows
    for (const c of data.employersByVolume) {
      lines.push(['Employers by Volume', 'Application Volume', c.companyName, c.totalApplications, '', `${c.conversionRate.toFixed(1)}%`, `Hired: ${c.hired}; Advanced: ${c.advancedApplications}`].map(escapeCsv).join(','));
    }

    // Domain Performance rows
    for (const d of data.domainPerformance) {
      lines.push(['Domain Performance', 'Student Career Preference', d.domain, d.studentCount, '', `${d.placementRate.toFixed(1)}%`, `Applications: ${d.applicationCount}; Hired: ${d.hiredCount}; Avg Match: ${d.avgMatchScoreAtApply.toFixed(1)}`].map(escapeCsv).join(','));
    }
  } else if (payload.reportType === 'candidate_skills') {
    const { data } = payload;
    lines.push([
      'Skill Name',
      'Category',
      'Opportunities Demanding',
      'Industry Demand %',
      'Student Supply Count',
      'Student Supply %',
      'Verified Supply Count',
      'Verified Supply %',
      'Average Student Score',
      'Demand vs Supply Gap (pp)',
      'Gap Status',
    ].map(escapeCsv).join(','));

    for (const s of data.skills) {
      lines.push([
        s.skillName,
        s.category,
        s.opportunityCount,
        `${s.demandPct.toFixed(1)}%`,
        s.studentCount,
        `${s.supplyPct.toFixed(1)}%`,
        s.verifiedStudentCount,
        `${s.verifiedSupplyPct.toFixed(1)}%`,
        s.avgScore.toFixed(1),
        s.gapPp > 0 ? `+${s.gapPp.toFixed(1)}` : s.gapPp.toFixed(1),
        s.gapStatus,
      ].map(escapeCsv).join(','));
    }
  } else if (payload.reportType === 'curriculum_alignment') {
    const { data } = payload;
    lines.push([
      'Skill Name',
      'Category',
      'Opportunities Demanding',
      'Industry Demand %',
      'Curriculum Status',
      'Mapping Source',
      'Mapped Offerings',
    ].map(escapeCsv).join(','));

    for (const s of data.demandedSkills) {
      lines.push([
        s.skillName,
        s.category,
        s.opportunityCount,
        `${s.demandPct.toFixed(1)}%`,
        s.curriculumStatus,
        s.mappingSource,
        (s.mappedCurriculumDetails || []).join('; '),
      ].map(escapeCsv).join(','));
    }
  } else if (payload.reportType === 'institutional_compliance_summary') {
    const { data } = payload;
    lines.push(['Section', 'Category', 'Indicator', 'Recorded Value', 'Percentage', 'Benchmark / Reference', 'Methodology Note'].map(escapeCsv).join(','));

    lines.push(['Metadata', 'Institution', 'Institution Name', data.metadata.institutionName, '', '', 'Reporting institution'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Enrollment', 'Total Enrolled Students', data.scorecard.totalStudents, '100.0%', '', 'Affiliated student profiles'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Employment', 'Overall Placement Rate', data.scorecard.totalStudents > 0 ? Math.round((data.scorecard.overallPlacementRate * data.scorecard.totalStudents) / 100) : 0, `${data.scorecard.overallPlacementRate.toFixed(1)}%`, '', '(Unique placed / total students) * 100'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Applications', 'Total Submitted', data.scorecard.totalApplications, '', '', 'Total student applications'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Competency', 'Verified Skills Ratio', data.scorecard.studentsWithVerifiedSkills, `${data.scorecard.verifiedStudentsPct.toFixed(1)}%`, '', 'Unique students with >=1 verified skill score'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Competency', 'Average Recorded Skill Score', data.scorecard.averageRecordedSkillScore.toFixed(1), '', '', 'Weighted average of recorded skill scores across demanded skills'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Curriculum', 'Curriculum Coverage Rate', '', `${data.scorecard.curriculumCoveragePct.toFixed(1)}%`, '', '(Covered + Partially Covered) / Demanded * 100'].map(escapeCsv).join(','));
    lines.push(['Executive Scorecard', 'Employer Activity', 'Employers with Applications', data.scorecard.employersWithActivityCount, '', '', 'Unique employers with submitted student applications'].map(escapeCsv).join(','));

    for (const f of data.funnelSummary) {
      lines.push(['Recruitment Funnel', 'Conversion', f.label, f.count, `${f.pct.toFixed(1)}%`, '', 'Stage conversion count and percentage'].map(escapeCsv).join(','));
    }

    lines.push(['Skill Alignment', 'Demand vs Supply', 'Higher Demand than Supply', data.skillGapSummary.higherDemandCount, '', '', 'Industry demand exceeds student supply by >15 pp'].map(escapeCsv).join(','));
    lines.push(['Skill Alignment', 'Demand vs Supply', 'Balanced Alignment', data.skillGapSummary.balancedCount, '', '', 'Supply and demand within +/-15 pp'].map(escapeCsv).join(','));
    lines.push(['Skill Alignment', 'Demand vs Supply', 'Higher Supply than Demand', data.skillGapSummary.higherSupplyCount, '', '', 'Student supply exceeds industry demand by >15 pp'].map(escapeCsv).join(','));
    lines.push(['Skill Alignment', 'Curriculum Mapping', 'Unmapped Demanded Skills', data.skillGapSummary.unmappedCount, '', '', 'Demanded skills lacking curriculum or course coverage'].map(escapeCsv).join(','));
  }

  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// Server-Side Vector PDF Generator (jsPDF ^2.5.2, A4 portrait, pure aggregate)
// ---------------------------------------------------------------------------

export async function generateComplianceReportPdf(payload: ComplianceReportPayload): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;
  let pageNumber = 1;

  function addFooter() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    const footerText = 'Official Institutional Audit Report • Generated by SkillBridge Platform • Aggregate Data Only';
    doc.text(footerText, margin, pageHeight - 20);
    const pageStr = `Page ${pageNumber}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 20);
  }

  function checkAddPage(neededHeight: number) {
    if (y + neededHeight > pageHeight - 40) {
      addFooter();
      doc.addPage();
      pageNumber++;
      y = margin;
    }
  }

  // 1. Formal Institutional Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, y, contentWidth, 54, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(payload.data.metadata.institutionName.toUpperCase(), margin + 14, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(payload.data.metadata.reportTitle, margin + 14, y + 42);
  y += 66;

  // 2. Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 48, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Reporting Window:', margin + 10, y + 18);
  doc.text('Data Scope:', margin + 10, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.text(payload.data.metadata.reportingPeriod, margin + 95, y + 18);
  doc.text(payload.data.metadata.dataScope, margin + 95, y + 36);

  const genAtText = `Generated: ${new Date(payload.data.metadata.generatedAt).toUTCString()}`;
  doc.text(genAtText, pageWidth - margin - 10 - doc.getTextWidth(genAtText), y + 18);
  y += 60;

  // 3. Section Renderer
  function renderSectionHeader(title: string) {
    checkAddPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y + 12);
    doc.setDrawColor(59, 130, 246); // Blue accent
    doc.setLineWidth(1.5);
    doc.line(margin, y + 17, margin + 36, y + 17);
    y += 26;
  }

  // Helper for KPI Cards (2x2 or 4x1)
  function renderKpiRow(cards: Array<{ label: string; value: string; sub?: string }>) {
    checkAddPage(50);
    const cardWidth = (contentWidth - (cards.length - 1) * 8) / cards.length;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cx = margin + i * (cardWidth + 8);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cx, y, cardWidth, 42, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cx + 8, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, cx + 8, y + 32);
    }
    y += 50;
  }

  // 4. Report-Type Specific Content
  if (payload.reportType === 'recruitment_activity') {
    const { data } = payload;
    renderSectionHeader('Recruitment & Placement Overview');
    renderKpiRow([
      { label: 'Enrolled Students', value: String(data.overview.totalStudents) },
      { label: 'Applications Submitted', value: String(data.overview.totalApplications) },
      { label: 'Students Placed', value: String(data.overview.uniqueStudentsPlaced) },
      { label: 'Overall Placement Rate', value: `${data.overview.overallPlacementRate.toFixed(1)}%` },
    ]);

    renderSectionHeader('Application Pipeline Funnel');
    for (const f of data.funnel) {
      checkAddPage(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(f.label, margin + 6, y + 11);
      const valStr = `${f.count} (${f.pct.toFixed(1)}%)`;
      doc.text(valStr, pageWidth - margin - 6 - doc.getTextWidth(valStr), y + 11);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 16, pageWidth - margin, y + 16);
      y += 18;
    }
    y += 10;

    renderSectionHeader('Employers with Application Activity (Top 10 by Volume)');
    for (const c of data.employersByVolume.slice(0, 8)) {
      checkAddPage(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(c.companyName, margin + 6, y + 11);
      const valStr = `Apps: ${c.totalApplications} | Hired: ${c.hired} | Rate: ${c.conversionRate.toFixed(1)}%`;
      doc.text(valStr, pageWidth - margin - 6 - doc.getTextWidth(valStr), y + 11);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 16, pageWidth - margin, y + 16);
      y += 18;
    }
  } else if (payload.reportType === 'candidate_skills') {
    const { data } = payload;
    renderSectionHeader('Candidate Skill Supply & Verification Summary');
    renderKpiRow([
      { label: 'Enrolled Students', value: String(data.summary.totalStudents) },
      { label: 'Verified Skills Students', value: String(data.summary.studentsWithVerifiedSkills) },
      { label: 'Verified Student Ratio', value: `${data.summary.verifiedStudentsPct.toFixed(1)}%` },
      { label: 'Avg Recorded Skill Score', value: data.summary.averageRecordedSkillScore.toFixed(1) },
    ]);

    renderSectionHeader('Itemized Skill Demand vs Student Supply');
    for (const s of data.skills.slice(0, 15)) {
      checkAddPage(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(s.skillName, margin + 6, y + 11);
      const valStr = `Demand: ${s.opportunityCount} (${s.demandPct.toFixed(1)}%) | Supply: ${s.studentCount} (${s.supplyPct.toFixed(1)}%) | Gap: ${s.gapPp > 0 ? '+' : ''}${s.gapPp.toFixed(1)} pp`;
      doc.text(valStr, pageWidth - margin - 6 - doc.getTextWidth(valStr), y + 11);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 16, pageWidth - margin, y + 16);
      y += 18;
    }
  } else if (payload.reportType === 'curriculum_alignment') {
    const { data } = payload;
    renderSectionHeader('Curriculum Coverage Overview');
    renderKpiRow([
      { label: 'Demanded Skills', value: String(data.summary.totalDemandedSkills) },
      { label: 'Curriculum Coverage', value: `${data.summary.curriculumCoveragePct.toFixed(1)}%` },
      { label: 'Covered Offerings', value: String(data.summary.coveredCount + data.summary.partiallyCoveredCount) },
      { label: 'Unmapped Skills', value: String(data.summary.notMappedCount) },
    ]);

    renderSectionHeader('Demanded Skills Curriculum Mapping Matrix');
    for (const s of data.demandedSkills.slice(0, 15)) {
      checkAddPage(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(s.skillName, margin + 6, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const sourceStr = `Status: ${s.curriculumStatus} (${s.mappingSource})`;
      doc.text(sourceStr, margin + 6, y + 21);

      const valStr = `Demand: ${s.opportunityCount} opps (${s.demandPct.toFixed(1)}%)`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(valStr, pageWidth - margin - 6 - doc.getTextWidth(valStr), y + 11);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 24, pageWidth - margin, y + 24);
      y += 26;
    }
  } else if (payload.reportType === 'institutional_compliance_summary') {
    const { data } = payload;
    renderSectionHeader('Executive Institutional Scorecard');
    renderKpiRow([
      { label: 'Enrolled Students', value: String(data.scorecard.totalStudents) },
      { label: 'Placement Rate', value: `${data.scorecard.overallPlacementRate.toFixed(1)}%` },
      { label: 'Verified Skills Ratio', value: `${data.scorecard.verifiedStudentsPct.toFixed(1)}%` },
      { label: 'Curriculum Coverage', value: `${data.scorecard.curriculumCoveragePct.toFixed(1)}%` },
    ]);

    renderSectionHeader('Core Indicator Summary');
    const summaryRows = [
      { label: 'Total Applications Submitted', value: String(data.scorecard.totalApplications) },
      { label: 'Active Pipeline Applications', value: String(data.scorecard.activeApplications) },
      { label: 'Average Match Score at Apply', value: `${data.scorecard.avgMatchScoreAtApply.toFixed(1)} / 100` },
      { label: 'Average Recorded Skill Score', value: `${data.scorecard.averageRecordedSkillScore.toFixed(1)} / 100` },
      { label: 'Industry Demanded Skills', value: String(data.scorecard.totalDemandedSkills) },
      { label: 'Employers with Activity', value: String(data.scorecard.employersWithActivityCount) },
      { label: 'Skills with Higher Demand than Supply', value: String(data.skillGapSummary.higherDemandCount) },
      { label: 'Skills with Balanced Alignment', value: String(data.skillGapSummary.balancedCount) },
      { label: 'Unmapped Demanded Skills', value: String(data.skillGapSummary.unmappedCount) },
    ];

    for (const row of summaryRows) {
      checkAddPage(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(row.label, margin + 6, y + 11);
      doc.setFont('helvetica', 'bold');
      doc.text(row.value, pageWidth - margin - 6 - doc.getTextWidth(row.value), y + 11);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 16, pageWidth - margin, y + 16);
      y += 18;
    }
  }

  // 5. Methodology & Disclaimer Box
  checkAddPage(50);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y + 8, contentWidth, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const disclaimer =
    'Methodology Note: This report compiles recorded institutional administrative data according to established platform calculation methodology. It does not constitute a legal, formal accreditation, or regulatory certification.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth - 16);
  doc.text(splitDisclaimer, margin + 8, y + 21);

  addFooter();

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
