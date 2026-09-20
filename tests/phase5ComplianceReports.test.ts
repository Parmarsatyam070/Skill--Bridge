/**
 * phase5ComplianceReports.test.ts
 * Phase 5 — Policy-Ready Compliance Reports Focused Test Suite
 *
 * Deterministic database fixtures prefixed with "p5-test-*".
 * Zero external/AI API calls. Zero production data mutation.
 * Complete teardown in afterAll.
 *
 * Suites:
 *   1. Query Parameter Validation & Error Handling (HTTP 400s)
 *   2. Server-Authoritative Tenant Isolation
 *   3. Authoritative Consistency with Phase 3 & Phase 4
 *   4. Reporting-Period Filtering & Baseline Semantics
 *   5. Zero-Data Institution Safety
 *   6. Aggregate Privacy Audit (Zero Student PII)
 *   7. RFC-4180 CSV Export Schema Verification
 *   8. PDF Binary & Structural Integrity
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  resolveReportingPeriod,
  getComplianceReportData,
  generateComplianceReportCsv,
  generateComplianceReportPdf,
  ReportValidationError,
} from '../server/src/services/complianceReportService.js';
import { getRecruitmentMetrics } from '../server/src/services/recruitmentMetricsService.js';
import { getSkillDemandAlignment } from '../server/src/services/skillDemandAlignmentService.js';

// ---------------------------------------------------------------------------
// Fixture Prefix & Helpers
// ---------------------------------------------------------------------------

const FX = 'p5-test-';
function uid(tag: string) {
  return `${FX}${tag}`;
}

let instAId: string;
let instBId: string;
let instZeroId: string;
let skill1Id: string;
let skill2Id: string;
let skill3Id: string;

async function teardownFixtures() {
  // FK-safe teardown
  await prisma.application.deleteMany({
    where: { student: { institution: { startsWith: 'P5 Test' } } },
  });
  await prisma.opportunitySkill.deleteMany({
    where: {
      OR: [
        { opportunity: { title: { startsWith: 'P5 Opp' } } },
        { skill: { name: { in: ['P5 TypeScript', 'P5 PostgreSQL', 'P5 Docker'] } } },
      ],
    },
  });
  await prisma.studentSkillScore.deleteMany({
    where: { student: { institution: { startsWith: 'P5 Test' } } },
  });
  await prisma.studentProfile.deleteMany({
    where: { institution: { startsWith: 'P5 Test' } },
  });
  await prisma.opportunity.deleteMany({
    where: { title: { startsWith: 'P5 Opp' } },
  });
  await prisma.course.deleteMany({
    where: { title: { startsWith: 'P5 Course' } },
  });
  await prisma.courseProvider.deleteMany({
    where: { name: { startsWith: 'P5 Provider' } },
  });
  await prisma.skill.deleteMany({
    where: { name: { in: ['P5 TypeScript', 'P5 PostgreSQL', 'P5 Docker'] } },
  });
  await prisma.industryProfile.deleteMany({
    where: { companyName: { in: ['P5 Corp Alpha', 'P5 Corp Beta'] } },
  });
  await prisma.institutionProfile.deleteMany({
    where: { institutionName: { startsWith: 'P5 Test University' } },
  });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'p5-test-' } },
        { email: { contains: 'p5-' } },
      ],
    },
  });
}

beforeAll(async () => {
  await teardownFixtures();

  // 1. Skills
  const s1 = await prisma.skill.create({ data: { name: 'P5 TypeScript', category: 'technical' } });
  const s2 = await prisma.skill.create({ data: { name: 'P5 PostgreSQL', category: 'technical' } });
  const s3 = await prisma.skill.create({ data: { name: 'P5 Docker', category: 'technical' } });
  skill1Id = s1.id;
  skill2Id = s2.id;
  skill3Id = s3.id;

  // 2. Institutions
  // Institution A (Main Test Institution with students and applications)
  const userInstA = await prisma.user.create({
    data: { id: uid('u-inst-a'), email: `${uid('inst-a')}@test.dev`, name: 'Admin Inst A', role: 'INSTITUTION_ADMIN' },
  });
  const profileInstA = await prisma.institutionProfile.create({
    data: { id: uid('prof-inst-a'), userId: userInstA.id, institutionName: 'P5 Test University A', adminDesignation: 'Dean' },
  });
  instAId = profileInstA.id;

  // Institution B (Foreign Institution for Tenant Isolation verification)
  const userInstB = await prisma.user.create({
    data: { id: uid('u-inst-b'), email: `${uid('inst-b')}@test.dev`, name: 'Admin Inst B', role: 'INSTITUTION_ADMIN' },
  });
  const profileInstB = await prisma.institutionProfile.create({
    data: { id: uid('prof-inst-b'), userId: userInstB.id, institutionName: 'P5 Test University B', adminDesignation: 'Director' },
  });
  instBId = profileInstB.id;

  // Institution Zero (Empty Institution with 0 students)
  const userInstZero = await prisma.user.create({
    data: { id: uid('u-inst-zero'), email: `${uid('inst-zero')}@test.dev`, name: 'Admin Zero', role: 'INSTITUTION_ADMIN' },
  });
  const profileInstZero = await prisma.institutionProfile.create({
    data: { id: uid('prof-inst-zero'), userId: userInstZero.id, institutionName: 'P5 Test University Zero', adminDesignation: 'Registrar' },
  });
  instZeroId = profileInstZero.id;

  // 3. Industry Companies
  const userComp1 = await prisma.user.create({
    data: { id: uid('u-comp-1'), email: `${uid('comp1')}@test.dev`, name: 'Recruiter Acme', role: 'INDUSTRY' },
  });
  const comp1 = await prisma.industryProfile.create({
    data: { id: uid('ind-comp-1'), userId: userComp1.id, companyName: 'P5 Corp Alpha', industrySector: 'Fintech' },
  });

  const userComp2 = await prisma.user.create({
    data: { id: uid('u-comp-2'), email: `${uid('comp2')}@test.dev`, name: 'Recruiter Beta', role: 'INDUSTRY' },
  });
  const comp2 = await prisma.industryProfile.create({
    data: { id: uid('ind-comp-2'), userId: userComp2.id, companyName: 'P5 Corp Beta', industrySector: 'Cloud' },
  });

  // 4. Opportunities with Skills
  // Opp 1 (OPEN, requires skill1 & skill2)
  const opp1 = await prisma.opportunity.create({
    data: {
      id: uid('opp-1'),
      companyId: comp1.id,
      title: 'P5 Opp Senior Full-Stack Engineer',
      description: 'Test description',
      status: 'OPEN',
      type: 'JOB',
    },
  });
  await prisma.opportunitySkill.createMany({
    data: [
      { opportunityId: opp1.id, skillId: skill1Id },
      { opportunityId: opp1.id, skillId: skill2Id },
    ],
  });

  // Opp 2 (CLOSED, requires skill1)
  const opp2 = await prisma.opportunity.create({
    data: {
      id: uid('opp-2'),
      companyId: comp2.id,
      title: 'P5 Opp Backend Engineer',
      description: 'Test description',
      status: 'CLOSED',
      type: 'JOB',
    },
  });
  await prisma.opportunitySkill.createMany({
    data: [
      { opportunityId: opp2.id, skillId: skill1Id },
    ],
  });

  // 5. Course with skillsCoveredJson (Priority 3 Platform Course for skill1)
  const provider = await prisma.courseProvider.create({
    data: { name: 'P5 Provider Academy', baseUrl: 'https://test.dev' },
  });
  await prisma.course.create({
    data: {
      providerId: provider.id,
      title: 'P5 Course Advanced TypeScript',
      description: 'TypeScript masterclass',
      skillsCoveredJson: JSON.stringify([{ skillId: skill1Id, pointsGain: 20 }]),
      externalUrl: 'https://test.dev/ts',
      duration: '4 weeks',
      level: 'Advanced',
    },
  });

  // 6. Students in Institution A
  // Student A1 (has verified score in skill1, unverified in skill2, placed)
  const uA1 = await prisma.user.create({
    data: { id: uid('u-std-a1'), email: 'p5-a1@test.dev', name: 'Student A1 SecretName', role: 'STUDENT' },
  });
  const spA1 = await prisma.studentProfile.create({
    data: {
      id: uid('sp-a1'),
      userId: uA1.id,
      institutionProfileId: instAId,
      institution: 'P5 Test University A',
      targetDomain: 'Full-Stack Web',
      gradYear: 2026,
    },
  });
  await prisma.studentSkillScore.createMany({
    data: [
      { studentId: spA1.id, skillId: skill1Id, score: 85, verificationLevel: 'ASSESSMENT-VERIFIED' },
      { studentId: spA1.id, skillId: skill2Id, score: 70, verificationLevel: 'SELF-REPORTED' },
    ],
  });

  // Student A2 (has verified score in skill1, applied, not placed)
  const uA2 = await prisma.user.create({
    data: { id: uid('u-std-a2'), email: 'p5-a2@test.dev', name: 'Student A2 SecretName', role: 'STUDENT' },
  });
  const spA2 = await prisma.studentProfile.create({
    data: {
      id: uid('sp-a2'),
      userId: uA2.id,
      institutionProfileId: instAId,
      institution: 'P5 Test University A',
      targetDomain: 'Data Science',
      gradYear: 2026,
    },
  });
  await prisma.studentSkillScore.create({
    data: { studentId: spA2.id, skillId: skill1Id, score: 90, verificationLevel: 'PROJECT-VERIFIED' },
  });

  // Student A3 (no skill scores, not applied)
  const uA3 = await prisma.user.create({
    data: { id: uid('u-std-a3'), email: 'p5-a3@test.dev', name: 'Student A3 SecretName', role: 'STUDENT' },
  });
  await prisma.studentProfile.create({
    data: {
      id: uid('sp-a3'),
      userId: uA3.id,
      institutionProfileId: instAId,
      institution: 'P5 Test University A',
      targetDomain: 'Full-Stack Web',
      gradYear: 2025,
    },
  });

  // 7. Applications for Institution A
  // App 1: spA1 -> opp1 (hired outcome, recent date)
  await prisma.application.create({
    data: {
      studentId: spA1.id,
      opportunityId: opp1.id,
      status: 'accepted', // normalizes to 'hired'
      matchScoreAtApply: 88,
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  // App 2: spA2 -> opp2 (interview outcome, recent date)
  await prisma.application.create({
    data: {
      studentId: spA2.id,
      opportunityId: opp2.id,
      status: 'interview_scheduled',
      matchScoreAtApply: 76,
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  });

  // 8. Students in Institution B (Foreign Institution)
  const uB1 = await prisma.user.create({
    data: { id: uid('u-std-b1'), email: 'p5-b1@test.dev', name: 'Foreign Student B1', role: 'STUDENT' },
  });
  const spB1 = await prisma.studentProfile.create({
    data: {
      id: uid('sp-b1'),
      userId: uB1.id,
      institutionProfileId: instBId,
      institution: 'P5 Test University B',
      targetDomain: 'Cloud/DevOps',
      gradYear: 2026,
    },
  });
  await prisma.application.create({
    data: {
      studentId: spB1.id,
      opportunityId: opp1.id,
      status: 'accepted',
      matchScoreAtApply: 95,
      appliedAt: new Date(),
    },
  });
}, 60000);

afterAll(async () => {
  await teardownFixtures();
}, 60000);

// ===========================================================================
// SUITE 1: Query Parameter Validation & Error Handling (HTTP 400s)
// ===========================================================================
describe('Suite 1: Query Parameter Validation & Error Handling', () => {
  it('throws ReportValidationError on invalid reportType', async () => {
    await expect(
      getComplianceReportData(instAId, { reportType: 'invalid_type' })
    ).rejects.toThrow(ReportValidationError);

    try {
      await getComplianceReportData(instAId, { reportType: 'invalid_type' });
    } catch (err: any) {
      expect(err.code).toBe('INVALID_REPORT_TYPE');
      expect(err.statusCode).toBe(400);
    }
  });

  it('throws ReportValidationError on invalid timePeriod', () => {
    expect(() => resolveReportingPeriod('invalid_period')).toThrow(ReportValidationError);
    try {
      resolveReportingPeriod('unknown_period');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_TIME_PERIOD');
      expect(err.statusCode).toBe(400);
    }
  });

  it('throws ReportValidationError when custom timePeriod is missing dates', () => {
    expect(() => resolveReportingPeriod('custom')).toThrow(ReportValidationError);
    try {
      resolveReportingPeriod('custom');
    } catch (err: any) {
      expect(err.code).toBe('MISSING_CUSTOM_DATES');
      expect(err.statusCode).toBe(400);
    }
  });

  it('throws ReportValidationError when custom dates are malformed', () => {
    expect(() => resolveReportingPeriod('custom', 'not-a-date', '2026-09-20')).toThrow(ReportValidationError);
    try {
      resolveReportingPeriod('custom', '2026/09/01', '2026/09/20');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_DATE_FORMAT');
      expect(err.statusCode).toBe(400);
    }
  });

  it('throws ReportValidationError when startDate > endDate', () => {
    expect(() => resolveReportingPeriod('custom', '2026-09-25', '2026-09-10')).toThrow(ReportValidationError);
    try {
      resolveReportingPeriod('custom', '2026-10-01', '2026-09-01');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_DATE_RANGE');
      expect(err.statusCode).toBe(400);
    }
  });

  it('successfully resolves valid custom date range', () => {
    const res = resolveReportingPeriod('custom', '2026-01-01', '2026-06-30');
    expect(res.startDate).toBeInstanceOf(Date);
    expect(res.endDate).toBeInstanceOf(Date);
    expect(res.label).toContain('2026-01-01 to 2026-06-30');
  });
});

// ===========================================================================
// SUITE 2: Server-Authoritative Tenant Isolation
// ===========================================================================
describe('Suite 2: Server-Authoritative Tenant Isolation', { timeout: 30000 }, () => {
  it('strictly scopes data to institution A and excludes foreign institution B records', async () => {
    const reportA = await getComplianceReportData(instAId, {
      reportType: 'recruitment_activity',
      timePeriod: 'all',
    });

    const reportB = await getComplianceReportData(instBId, {
      reportType: 'recruitment_activity',
      timePeriod: 'all',
    });

    if (reportA.reportType !== 'recruitment_activity' || reportB.reportType !== 'recruitment_activity') {
      throw new Error('Expected recruitment_activity report type');
    }

    // Institution A has 3 affiliated students, 2 applications, 1 placed
    expect(reportA.data.overview.totalStudents).toBe(3);
    expect(reportA.data.overview.totalApplications).toBe(2);
    expect(reportA.data.overview.uniqueStudentsPlaced).toBe(1);

    // Institution B has 1 affiliated student, 1 application, 1 placed
    expect(reportB.data.overview.totalStudents).toBe(1);
    expect(reportB.data.overview.totalApplications).toBe(1);
    expect(reportB.data.overview.uniqueStudentsPlaced).toBe(1);

    // Institution A placement rate: (1 / 3) * 100 = 33.3%
    expect(reportA.data.overview.overallPlacementRate).toBe(33.3);

    // Institution B placement rate: (1 / 1) * 100 = 100.0%
    expect(reportB.data.overview.overallPlacementRate).toBe(100.0);
  });

  it('fails with not found if institutionProfileId does not exist', async () => {
    await expect(
      getComplianceReportData('00000000-0000-0000-0000-000000000000', {
        reportType: 'recruitment_activity',
      })
    ).rejects.toThrow('Institution profile not found');
  });
});

// ===========================================================================
// SUITE 3: Authoritative Consistency with Phase 3 & Phase 4
// ===========================================================================
describe('Suite 3: Authoritative Consistency with Phase 3 & Phase 4', { timeout: 30000 }, () => {
  it('matches Phase 3 recruitment metrics calculations exactly', async () => {
    const phase3Direct = await getRecruitmentMetrics(instAId);
    const report = await getComplianceReportData(instAId, {
      reportType: 'recruitment_activity',
      timePeriod: 'all',
    });

    if (report.reportType !== 'recruitment_activity') throw new Error('Expected recruitment_activity');

    expect(report.data.overview.totalStudents).toBe(phase3Direct.overview.totalStudents);
    expect(report.data.overview.totalApplications).toBe(phase3Direct.overview.totalApplications);
    expect(report.data.overview.uniqueStudentsPlaced).toBe(phase3Direct.overview.uniqueStudentsPlaced);
    expect(report.data.overview.overallPlacementRate).toBe(phase3Direct.overview.overallPlacementRate);
    expect(report.data.overview.avgMatchScoreAtApply).toBe(phase3Direct.overview.avgMatchScoreAtApply);

    // Funnel counts match
    expect(report.data.funnel.length).toBe(phase3Direct.funnel.length);
    for (let i = 0; i < report.data.funnel.length; i++) {
      expect(report.data.funnel[i].count).toBe(phase3Direct.funnel[i].count);
      expect(report.data.funnel[i].pct).toBe(phase3Direct.funnel[i].pct);
    }
  });

  it('matches Phase 4 skill demand and curriculum alignment metrics exactly', async () => {
    const phase4Direct = await getSkillDemandAlignment(instAId, { timeRange: 'all' });
    const report = await getComplianceReportData(instAId, {
      reportType: 'curriculum_alignment',
      timePeriod: 'all',
    });

    if (report.reportType !== 'curriculum_alignment') throw new Error('Expected curriculum_alignment');

    expect(report.data.summary.totalDemandedSkills).toBe(phase4Direct.overview.demandedSkillsCount);
    expect(report.data.summary.curriculumCoveragePct).toBe(phase4Direct.overview.curriculumCoveragePct);
    expect(report.data.summary.coveredCount).toBe(phase4Direct.curriculumBreakdown.coveredCount);
    expect(report.data.summary.partiallyCoveredCount).toBe(phase4Direct.curriculumBreakdown.partiallyCoveredCount);
    expect(report.data.summary.notMappedCount).toBe(phase4Direct.curriculumBreakdown.notMappedCount);

    // Priority 3 platform course classification verified
    const tsSkill = report.data.demandedSkills.find(s => s.skillName === 'P5 TypeScript');
    expect(tsSkill).toBeDefined();
    expect(tsSkill?.curriculumStatus).toBe('Partially Covered');
    expect(tsSkill?.mappingSource).toBe('Platform Course');
  });

  it('calculates averageRecordedSkillScore as weighted average across demanded skills with scores', async () => {
    const report = await getComplianceReportData(instAId, {
      reportType: 'candidate_skills',
      timePeriod: 'all',
    });

    if (report.reportType !== 'candidate_skills') throw new Error('Expected candidate_skills');

    // In our fixture:
    // skill1 (TypeScript, demanded by opp1 & opp2): spA1 score 85, spA2 score 90 -> avgScore = 87.5, studentCount = 2
    // skill2 (PostgreSQL, demanded by opp1): spA1 score 70 -> avgScore = 70.0, studentCount = 1
    // Weighted sum = (87.5 * 2) + (70.0 * 1) = 175 + 70 = 245
    // Total students = 2 + 1 = 3
    // Expected weighted average = 245 / 3 = 81.7
    expect(report.data.summary.averageRecordedSkillScore).toBe(81.7);
  });
});

// ===========================================================================
// SUITE 4: Reporting-Period Filtering & Baseline Semantics
// ===========================================================================
describe('Suite 4: Reporting-Period Filtering & Baseline Semantics', { timeout: 30000 }, () => {
  it('preserves totalStudents cohort baseline when date window filters applications', async () => {
    // Reporting window: last 7 days (app1 was 5 days ago, app2 was 10 days ago)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = await getRecruitmentMetrics(instAId, {
      startDate: sevenDaysAgo,
      endDate: now,
    });

    // Baseline cohort must NOT change
    expect(filtered.overview.totalStudents).toBe(3);
    // Only app1 is within the last 7 days
    expect(filtered.overview.totalApplications).toBe(1);
    expect(filtered.overview.uniqueStudentsPlaced).toBe(1);
    // Placement rate in window: (1 / 3) * 100 = 33.3%
    expect(filtered.overview.overallPlacementRate).toBe(33.3);
  });

  it('returns 0 applications when date window covers a time with no application activity', async () => {
    const pastStart = new Date('2020-01-01');
    const pastEnd = new Date('2020-01-31');

    const filtered = await getRecruitmentMetrics(instAId, {
      startDate: pastStart,
      endDate: pastEnd,
    });

    expect(filtered.overview.totalStudents).toBe(3); // Cohort preserved
    expect(filtered.overview.totalApplications).toBe(0);
    expect(filtered.overview.uniqueStudentsPlaced).toBe(0);
    expect(filtered.overview.overallPlacementRate).toBe(0);
  });
});

// ===========================================================================
// SUITE 5: Zero-Data Institution Safety
// ===========================================================================
describe('Suite 5: Zero-Data Institution Safety', { timeout: 30000 }, () => {
  it('handles zero-student institution gracefully without NaN or exceptions in DTO', async () => {
    const report = await getComplianceReportData(instZeroId, {
      reportType: 'institutional_compliance_summary',
      timePeriod: 'all',
    });

    if (report.reportType !== 'institutional_compliance_summary') {
      throw new Error('Expected institutional_compliance_summary');
    }

    expect(report.data.scorecard.totalStudents).toBe(0);
    expect(report.data.scorecard.overallPlacementRate).toBe(0);
    expect(report.data.scorecard.totalApplications).toBe(0);
    expect(report.data.scorecard.averageRecordedSkillScore).toBe(0);
    expect(isNaN(report.data.scorecard.overallPlacementRate)).toBe(false);
  });

  it('generates non-empty CSV and PDF for zero-student institution', async () => {
    const report = await getComplianceReportData(instZeroId, {
      reportType: 'institutional_compliance_summary',
      timePeriod: 'all',
    });

    const csv = generateComplianceReportCsv(report);
    expect(csv.length).toBeGreaterThan(50);
    expect(csv).toContain('Total Enrolled Students,0');

    const pdfBuffer = await generateComplianceReportPdf(report);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});

// ===========================================================================
// SUITE 6: Aggregate Privacy Audit (Zero Student PII)
// ===========================================================================
describe('Suite 6: Aggregate Privacy Audit', { timeout: 30000 }, () => {
  it('contains zero student PII properties in all 4 report DTOs', async () => {
    const reportTypes = [
      'recruitment_activity',
      'candidate_skills',
      'curriculum_alignment',
      'institutional_compliance_summary',
    ];

    const forbiddenKeys = ['email', 'password', 'phone', 'studentId', 'userId', 'rollNumber'];

    for (const type of reportTypes) {
      const payload = await getComplianceReportData(instAId, { reportType: type });
      const serialized = JSON.stringify(payload);

      // Verify that no individual student identifiers exist in keys or values
      for (const key of forbiddenKeys) {
        expect(serialized).not.toMatch(new RegExp(`"${key}":`, 'i'));
      }

      // Assert that actual student names and emails from database are absent
      expect(serialized).not.toContain('Student A1 SecretName');
      expect(serialized).not.toContain('Student A2 SecretName');
      expect(serialized).not.toContain('p5-a1@test.dev');
      expect(serialized).not.toContain('p5-a2@test.dev');
    }
  });

  it('redacts internal institutionProfileId UUID from report metadata and CSV', async () => {
    const payload = await getComplianceReportData(instAId, {
      reportType: 'institutional_compliance_summary',
    });

    const csv = generateComplianceReportCsv(payload);
    expect(csv).not.toContain(instAId);
    expect(csv).toContain('P5 Test University A');
  });
});

// ===========================================================================
// SUITE 7: RFC-4180 CSV Export Schema Verification
// ===========================================================================
describe('Suite 7: RFC-4180 CSV Export Schema Verification', { timeout: 30000 }, () => {
  it('generates valid RFC-4180 CSV with CRLF line endings for all 4 report types', async () => {
    const types: Array<{ type: string; expectedHeader: string }> = [
      {
        type: 'recruitment_activity',
        expectedHeader: 'Section,Category,Metric / Item,Count,Percentage,Score / Rate,Details',
      },
      {
        type: 'candidate_skills',
        expectedHeader: 'Skill Name,Category,Opportunities Demanding,Industry Demand %,Student Supply Count,Student Supply %,Verified Supply Count,Verified Supply %,Average Student Score,Demand vs Supply Gap (pp),Gap Status',
      },
      {
        type: 'curriculum_alignment',
        expectedHeader: 'Skill Name,Category,Opportunities Demanding,Industry Demand %,Curriculum Status,Mapping Source,Mapped Offerings',
      },
      {
        type: 'institutional_compliance_summary',
        expectedHeader: 'Section,Category,Indicator,Recorded Value,Percentage,Benchmark / Reference,Methodology Note',
      },
    ];

    for (const item of types) {
      const payload = await getComplianceReportData(instAId, { reportType: item.type });
      const csv = generateComplianceReportCsv(payload);

      // CRLF line endings check
      expect(csv).toContain('\r\n');
      const lines = csv.split('\r\n');
      expect(lines[0]).toBe(item.expectedHeader);
      expect(lines.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ===========================================================================
// SUITE 8: PDF Binary & Structural Integrity
// ===========================================================================
describe('Suite 8: PDF Binary & Structural Integrity', { timeout: 30000 }, () => {
  it('generates valid PDF buffer with %PDF- header and %%EOF trailer for all 4 report types', async () => {
    const reportTypes = [
      'recruitment_activity',
      'candidate_skills',
      'curriculum_alignment',
      'institutional_compliance_summary',
    ];

    for (const type of reportTypes) {
      const payload = await getComplianceReportData(instAId, { reportType: type });
      const pdfBuffer = await generateComplianceReportPdf(payload);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(2000);

      // Magic bytes header
      const header = pdfBuffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');

      // Trailer EOF
      const trailer = pdfBuffer.subarray(pdfBuffer.length - 1024).toString('ascii');
      expect(trailer).toContain('%%EOF');
    }
  });
});
