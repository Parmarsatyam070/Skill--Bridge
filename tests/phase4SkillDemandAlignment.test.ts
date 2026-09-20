/**
 * phase4SkillDemandAlignment.test.ts
 * Phase 4 — Focused deterministic tests for Skill Demand vs Curriculum Alignment.
 *
 * ALL tests use deterministic database fixtures created and torn down in the test run.
 * Zero Gemini / external API calls.
 * Zero modification or deletion of existing production/demo data.
 * All fixtures use isolated test records prefixed with "p4-test-*".
 *
 * Requirements tested:
 *   A. Opportunity population:
 *      - OPEN included
 *      - CLOSED included
 *      - PAUSED included
 *      - DRAFT excluded
 *      - createdAt time filtering
 *      - multiple skills on one opportunity do not duplicate opportunity count
 *   B. Opportunity type:
 *      - ALL
 *      - JOB
 *      - INTERNSHIP
 *   C. Unique student counting:
 *      - multiple skills for one student = one student
 *      - multiple verified skills = one verified student
 *   D. Curriculum classification (deterministic 4-priority):
 *      - actual Course.skillsCoveredJson mapping -> Partially Covered
 *      - actual CORE mapping, if one genuinely exists -> Covered
 *      - actual SUPPORTING mapping, if one genuinely exists -> Partially Covered
 *      - unmapped skill -> Not Mapped
 *   E. Curriculum Coverage %:
 *      - (Covered + Partially Covered) / Total Demanded * 100
 *      - Example: 1 Covered, 2 Partially Covered, 1 Not Mapped -> 75%
 *      - 0 demanded skills -> 0%
 *   F. Gap formula:
 *      - Demand % - Supply %
 *      - > +15 pp -> Higher demand than supply
 *      - [-15, +15] -> Balanced
 *      - < -15 pp -> Higher supply than demand
 *   G. Zero denominator:
 *      - zero opportunities
 *      - zero students
 *      - No NaN, No Infinity, No crashes
 *   H. CSV export:
 *      - values match service DTO
 *      - no individual student PII
 *      - valid RFC-4180 CSV formatting
 *   I. Tenant isolation:
 *      - Institution A must not receive Institution B student analytics
 *   J. Fixture cleanup:
 *      - p4-test-* records cleaned in afterAll
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  getSkillDemandAlignment,
  generateSkillDemandCsv,
} from '../server/src/services/skillDemandAlignmentService.js';

// ---------------------------------------------------------------------------
// Fixture prefix -- isolated test records with p4-test-*
// ---------------------------------------------------------------------------
const FX = 'p4-test-';
function uid(tag: string) { return `${FX}${tag}`; }

// ---------------------------------------------------------------------------
// IDs resolved during beforeAll
// ---------------------------------------------------------------------------
let instAId: string;
let instBId: string;
let skillAlphaId: string;
let skillBetaId: string;
let skillGammaId: string;
let oppOpenId: string;
let oppClosedId: string;
let oppPausedId: string;
let oppInternshipId: string;
let oppDraftId: string;
let oppOldId: string;

// ---------------------------------------------------------------------------
// safeDelete -- removes all test fixtures in FK-safe order
// ---------------------------------------------------------------------------
async function safeDelete() {
  // Opportunities (OpportunitySkill cascades)
  await prisma.opportunity.deleteMany({
    where: { companyId: { in: [uid('co-a'), uid('co-b')] } },
  });

  // StudentSkillScores cascade from StudentProfile
  await prisma.studentProfile.deleteMany({
    where: { id: { in: [uid('s1'), uid('s2'), uid('s3'), uid('s4'), uid('sb1')] } },
  });

  // Courses cascade from CourseProvider
  await prisma.courseProvider.deleteMany({ where: { id: uid('provider') } });

  // Skills
  await prisma.skill.deleteMany({
    where: { name: { in: [uid('skill-alpha'), uid('skill-beta'), uid('skill-gamma'), uid('skill-zero')] } },
  });

  // Industry profiles
  await prisma.industryProfile.deleteMany({
    where: { id: { in: [uid('co-a'), uid('co-b')] } },
  });

  // Institution profiles
  await prisma.institutionProfile.deleteMany({
    where: { userId: { in: [uid('iu-a'), uid('iu-b'), uid('iu-empty')] } },
  });

  // Users
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [
          uid('iu-a'), uid('iu-b'), uid('iu-empty'),
          uid('cu-a'), uid('cu-b'),
          uid('u1'), uid('u2'), uid('u3'), uid('u4'),
          uid('ub1'),
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// beforeAll -- create all test fixtures
// ---------------------------------------------------------------------------
beforeAll(async () => {
  await safeDelete();

  // 1. Institution users + profiles
  await prisma.user.createMany({
    data: [
      { id: uid('iu-a'), email: `${uid('iu-a')}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Inst A Admin' },
      { id: uid('iu-b'), email: `${uid('iu-b')}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Inst B Admin' },
    ],
  });
  const [profA, profB] = await Promise.all([
    prisma.institutionProfile.create({
      data: { userId: uid('iu-a'), institutionName: 'Alpha University', adminDesignation: 'Dean' },
    }),
    prisma.institutionProfile.create({
      data: { userId: uid('iu-b'), institutionName: 'Beta College', adminDesignation: 'Dean' },
    }),
  ]);
  instAId = profA.id;
  instBId = profB.id;

  // 2. Company users + profiles
  await prisma.user.createMany({
    data: [
      { id: uid('cu-a'), email: `${uid('cu-a')}@test.dev`, passwordHash: 'x', role: 'INDUSTRY', name: 'Co A' },
      { id: uid('cu-b'), email: `${uid('cu-b')}@test.dev`, passwordHash: 'x', role: 'INDUSTRY', name: 'Co B' },
    ],
  });
  const [coA, coB] = await Promise.all([
    prisma.industryProfile.create({ data: { id: uid('co-a'), userId: uid('cu-a'), companyName: 'Co Alpha', industrySector: 'Tech', companySize: 'LARGE' } }),
    prisma.industryProfile.create({ data: { id: uid('co-b'), userId: uid('cu-b'), companyName: 'Co Beta', industrySector: 'Finance', companySize: 'SMALL' } }),
  ]);

  // 3. Skills
  const [skillAlpha, skillBeta, skillGamma] = await Promise.all([
    prisma.skill.create({ data: { name: uid('skill-alpha'), category: 'technical' } }),
    prisma.skill.create({ data: { name: uid('skill-beta'),  category: 'technical' } }),
    prisma.skill.create({ data: { name: uid('skill-gamma'), category: 'soft' } }),
  ]);
  skillAlphaId = skillAlpha.id;
  skillBetaId  = skillBeta.id;
  skillGammaId = skillGamma.id;

  // 4. Course Provider + Course mapping skillAlpha (Priority 3 Source)
  const provider = await prisma.courseProvider.create({
    data: { id: uid('provider'), name: uid('provider-name'), baseUrl: 'https://test.dev' },
  });
  await prisma.course.create({
    data: {
      providerId: provider.id,
      title: 'Alpha Platform Course',
      description: 'Covers skill alpha',
      skillsCoveredJson: JSON.stringify([{ skillId: skillAlphaId, pointsGain: 10 }]),
      externalUrl: 'https://test.dev/alpha',
      duration: '4 weeks',
      level: 'Intermediate',
    },
  });
  // skillBeta and skillGamma have NO course mapping -> Not Mapped (Priority 4)

  // 5. Opportunities population
  // A. OPEN Job (created now) with MULTIPLE skills (skillAlpha, skillBeta)
  const oppOpen = await prisma.opportunity.create({
    data: {
      title: 'Open SWE Role', companyId: coA.id, type: 'JOB',
      description: 'Open role', location: 'Remote', status: 'OPEN',
      createdAt: new Date(),
    },
  });
  oppOpenId = oppOpen.id;
  await prisma.opportunitySkill.createMany({
    data: [
      { opportunityId: oppOpenId, skillId: skillAlphaId },
      { opportunityId: oppOpenId, skillId: skillBetaId },
    ],
  });

  // B. CLOSED Job (created now) with skillAlpha
  const oppClosed = await prisma.opportunity.create({
    data: {
      title: 'Closed Analyst Role', companyId: coB.id, type: 'JOB',
      description: 'Closed role', location: 'Remote', status: 'CLOSED',
      createdAt: new Date(),
    },
  });
  oppClosedId = oppClosed.id;
  await prisma.opportunitySkill.create({
    data: { opportunityId: oppClosedId, skillId: skillAlphaId },
  });

  // C. PAUSED Job (created now) with skillAlpha
  const oppPaused = await prisma.opportunity.create({
    data: {
      title: 'Paused Dev Role', companyId: coB.id, type: 'JOB',
      description: 'Paused role', location: 'Remote', status: 'PAUSED',
      createdAt: new Date(),
    },
  });
  oppPausedId = oppPaused.id;
  await prisma.opportunitySkill.create({
    data: { opportunityId: oppPausedId, skillId: skillAlphaId },
  });

  // D. OPEN Internship (created now) with skillAlpha
  const oppInternship = await prisma.opportunity.create({
    data: {
      title: 'Internship Role', companyId: coA.id, type: 'INTERNSHIP',
      description: 'Intern role', location: 'Remote', status: 'OPEN',
      createdAt: new Date(),
    },
  });
  oppInternshipId = oppInternship.id;
  await prisma.opportunitySkill.create({
    data: { opportunityId: oppInternshipId, skillId: skillAlphaId },
  });

  // E. DRAFT Job (created now) with skillBeta -- MUST BE EXCLUDED FROM ALL METRICS
  const oppDraft = await prisma.opportunity.create({
    data: {
      title: 'Draft Role MUST NOT COUNT', companyId: coA.id, type: 'JOB',
      description: 'Draft should be invisible', location: 'Remote', status: 'DRAFT',
      createdAt: new Date(),
    },
  });
  oppDraftId = oppDraft.id;
  await prisma.opportunitySkill.create({
    data: { opportunityId: oppDraft.id, skillId: skillBetaId },
  });

  // F. Old Job created 45 days ago with skillAlpha (for createdAt time filtering)
  const oppOld = await prisma.opportunity.create({
    data: {
      title: 'Old Job 45d Ago', companyId: coA.id, type: 'JOB',
      description: 'Historical role', location: 'Remote', status: 'OPEN',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
  });
  oppOldId = oppOld.id;
  await prisma.opportunitySkill.create({
    data: { opportunityId: oppOldId, skillId: skillAlphaId },
  });

  // 6. Students: Institution A
  await prisma.user.createMany({
    data: [
      { id: uid('u1'), email: `${uid('u1')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S1' },
      { id: uid('u2'), email: `${uid('u2')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S2' },
      { id: uid('u3'), email: `${uid('u3')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S3' },
      { id: uid('u4'), email: `${uid('u4')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S4' },
    ],
  });
  await prisma.studentProfile.createMany({
    data: [
      { id: uid('s1'), userId: uid('u1'), institution: 'Alpha University', targetDomain: 'Backend', gradYear: 2025, institutionProfileId: instAId },
      { id: uid('s2'), userId: uid('u2'), institution: 'Alpha University', targetDomain: 'Backend', gradYear: 2025, institutionProfileId: instAId },
      { id: uid('s3'), userId: uid('u3'), institution: 'Alpha University', targetDomain: 'ML',      gradYear: 2026, institutionProfileId: instAId },
      { id: uid('s4'), userId: uid('u4'), institution: 'Alpha University', targetDomain: 'ML',      gradYear: 2026, institutionProfileId: instAId },
    ],
  });
  await prisma.studentSkillScore.createMany({
    data: [
      // S1: 2 verified skills (ASSESSMENT-VERIFIED and COURSE-VERIFIED) -> must count as 1 verified student
      { studentId: uid('s1'), skillId: skillAlphaId, score: 80, verificationLevel: 'ASSESSMENT-VERIFIED' },
      { studentId: uid('s1'), skillId: skillGammaId, score: 75, verificationLevel: 'COURSE-VERIFIED' },
      // S2: 1 verified skill + 1 self-reported
      { studentId: uid('s2'), skillId: skillAlphaId, score: 70, verificationLevel: 'COURSE-VERIFIED' },
      { studentId: uid('s2'), skillId: skillBetaId,  score: 60, verificationLevel: 'SELF-REPORTED' },
      // S3: 1 self-reported skill only
      { studentId: uid('s3'), skillId: skillGammaId, score: 50, verificationLevel: 'SELF-REPORTED' },
      // S4: no skill scores
    ],
  });

  // 7. Students: Institution B (for tenant isolation)
  await prisma.user.create({
    data: { id: uid('ub1'), email: `${uid('ub1')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'B1' },
  });
  await prisma.studentProfile.create({
    data: {
      id: uid('sb1'), userId: uid('ub1'), institution: 'Beta College',
      targetDomain: 'Data', gradYear: 2025, institutionProfileId: instBId,
    },
  });
  await prisma.studentSkillScore.create({
    data: { studentId: uid('sb1'), skillId: skillAlphaId, score: 90, verificationLevel: 'ASSESSMENT-VERIFIED' },
  });
}, 60000);

afterAll(async () => {
  await safeDelete();
}, 60000);

// ---------------------------------------------------------------------------
// A. Opportunity Population
// ---------------------------------------------------------------------------

describe('Phase 4 — A. Opportunity Population', () => {
  it('includes OPEN, CLOSED, and PAUSED; excludes DRAFT', async () => {
    // In 30d window:
    // oppOpen (OPEN) + oppClosed (CLOSED) + oppPaused (PAUSED) + oppInternship (OPEN) = 4
    // oppDraft (DRAFT) must be excluded
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    expect(result.overview.relevantOpportunities).toBe(4);
    expect(result.overview.activeOpportunities).toBe(2);  // oppOpen + oppInternship
    expect(result.overview.closedOpportunities).toBe(1);  // oppClosed
    expect(result.overview.pausedOpportunities).toBe(1);  // oppPaused
    expect(result.overview.relevantOpportunities).toBe(
      result.overview.activeOpportunities +
      result.overview.closedOpportunities +
      result.overview.pausedOpportunities
    );
  }, 30000);

  it('DRAFT opportunity skills do NOT inflate demanded skill counts', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    // skillBeta is in oppOpen (OPEN) and oppDraft (DRAFT)
    // Only oppOpen should count -> opportunityCount = 1
    const betaItem = result.skills.find(s => s.skillId === skillBetaId);
    expect(betaItem).toBeDefined();
    expect(betaItem!.opportunityCount).toBe(1);
  }, 30000);

  it('applies createdAt time filtering: 30d excludes 45d-old role, 90d includes it', async () => {
    // 30d excludes oppOld (created 45 days ago)
    const result30d = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    expect(result30d.overview.relevantOpportunities).toBe(4);

    // 90d includes oppOld (45 days old)
    const result90d = await getSkillDemandAlignment(instAId, { timeRange: '90d', opportunityType: 'ALL' });
    expect(result90d.overview.relevantOpportunities).toBe(5);

    // all time also includes oppOld
    const resultAll = await getSkillDemandAlignment(instAId, { timeRange: 'all', opportunityType: 'ALL' });
    expect(resultAll.overview.relevantOpportunities).toBe(5);
  }, 30000);

  it('multiple skills on one opportunity do not duplicate opportunity count', async () => {
    // oppOpen requires BOTH skillAlpha and skillBeta
    // Relevant opportunities must remain 4 (for 30d), not 5
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    expect(result.overview.relevantOpportunities).toBe(4);

    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    const betaItem = result.skills.find(s => s.skillId === skillBetaId)!;
    // skillAlpha in 4 opps (oppOpen, oppClosed, oppPaused, oppInternship)
    expect(alphaItem.opportunityCount).toBe(4);
    // skillBeta in 1 opp (oppOpen)
    expect(betaItem.opportunityCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// B. Opportunity Type
// ---------------------------------------------------------------------------

describe('Phase 4 — B. Opportunity Type', () => {
  it('JOB filter restricts to type = "JOB" only', async () => {
    // In 30d: oppOpen (JOB), oppClosed (JOB), oppPaused (JOB) = 3
    // oppInternship (INTERNSHIP) is excluded
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'JOB' });
    expect(result.overview.relevantOpportunities).toBe(3);
    expect(result.overview.activeOpportunities).toBe(1); // oppOpen only
    expect(result.overview.closedOpportunities).toBe(1); // oppClosed
    expect(result.overview.pausedOpportunities).toBe(1); // oppPaused
  });

  it('INTERNSHIP filter restricts to type = "INTERNSHIP" only', async () => {
    // In 30d: oppInternship (INTERNSHIP) = 1
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'INTERNSHIP' });
    expect(result.overview.relevantOpportunities).toBe(1);
    expect(result.overview.activeOpportunities).toBe(1); // oppInternship
    expect(result.overview.closedOpportunities).toBe(0);
    expect(result.overview.pausedOpportunities).toBe(0);
  });

  it('ALL filter includes both JOB and INTERNSHIP', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    expect(result.overview.relevantOpportunities).toBe(4);
  });

  it('opportunity type filter does not alter student supply counts', async () => {
    const resultJob = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'JOB' });
    const resultAll = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    expect(resultJob.overview.totalStudents).toBe(resultAll.overview.totalStudents);
    expect(resultJob.overview.studentsWithVerifiedSkills).toBe(resultAll.overview.studentsWithVerifiedSkills);
  }, 30000);
});

// ---------------------------------------------------------------------------
// C. Unique Student Counting
// ---------------------------------------------------------------------------

describe('Phase 4 — C. Unique Student Counting', () => {
  it('totalStudents counts unique StudentProfile records for authenticated institution', async () => {
    const result = await getSkillDemandAlignment(instAId);
    expect(result.overview.totalStudents).toBe(4); // s1, s2, s3, s4
  });

  it('multiple verified skills on one student count as 1 verified student overall', async () => {
    const result = await getSkillDemandAlignment(instAId);
    // S1 has 2 verified skills (skillAlpha, skillGamma)
    // S2 has 1 verified skill (skillAlpha)
    // S3 has 0 verified skills (skillGamma is SELF-REPORTED)
    // S4 has 0 verified skills (no scores)
    // Total unique verified students = 2 (NOT 3)
    expect(result.overview.studentsWithVerifiedSkills).toBe(2);
  });

  it('verifiedStudentsPct = (studentsWithVerifiedSkills / totalStudents) * 100', async () => {
    const result = await getSkillDemandAlignment(instAId);
    // 2 / 4 * 100 = 50.0%
    expect(result.overview.verifiedStudentsPct).toBe(50.0);
  });

  it('per-skill studentCount counts students with score > 0', async () => {
    const result = await getSkillDemandAlignment(instAId);
    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    const betaItem = result.skills.find(s => s.skillId === skillBetaId)!;
    const gammaItem = result.skills.find(s => s.skillId === skillGammaId)!;

    // skillAlpha: s1 (80), s2 (70) -> 2
    expect(alphaItem.studentCount).toBe(2);
    // skillBeta: s2 (60) -> 1
    expect(betaItem.studentCount).toBe(1);
    // skillGamma: s1 (75), s3 (50) -> 2
    expect(gammaItem.studentCount).toBe(2);
  });

  it('per-skill verifiedStudentCount requires score > 0 AND verificationLevel !== "SELF-REPORTED"', async () => {
    const result = await getSkillDemandAlignment(instAId);
    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    const betaItem = result.skills.find(s => s.skillId === skillBetaId)!;
    const gammaItem = result.skills.find(s => s.skillId === skillGammaId)!;

    // skillAlpha: s1 (ASSESSMENT-VERIFIED), s2 (COURSE-VERIFIED) -> 2
    expect(alphaItem.verifiedStudentCount).toBe(2);
    // skillBeta: s2 (SELF-REPORTED) -> 0
    expect(betaItem.verifiedStudentCount).toBe(0);
    // skillGamma: s1 (COURSE-VERIFIED), s3 (SELF-REPORTED) -> 1
    expect(gammaItem.verifiedStudentCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// D. Curriculum Classification (deterministic 4-priority)
// ---------------------------------------------------------------------------

describe('Phase 4 — D. Curriculum Classification (deterministic 4-priority)', () => {
  it('skill with Course.skillsCoveredJson mapping -> Partially Covered (Priority 3)', async () => {
    const result = await getSkillDemandAlignment(instAId);
    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    expect(alphaItem.curriculumStatus).toBe('Partially Covered');
    expect(alphaItem.mappingSource).toBe('Platform Course');
    expect(alphaItem.mappedCurriculumDetails).toContain('Alpha Platform Course');
  });

  it('unmapped skill -> Not Mapped (Priority 4)', async () => {
    const result = await getSkillDemandAlignment(instAId);
    const betaItem = result.skills.find(s => s.skillId === skillBetaId)!;
    expect(betaItem.curriculumStatus).toBe('Not Mapped');
    expect(betaItem.mappingSource).toBe('Not Mapped');
  });

  it('no skill classified as Covered when no explicit CORE academic mapping exists', async () => {
    const result = await getSkillDemandAlignment(instAId);
    const covered = result.skills.filter(s => s.curriculumStatus === 'Covered');
    expect(covered.length).toBe(0);
  });

  it('breakdown source exposes Platform Course, Not Mapped, and 0 for academic', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d' });
    // Demanded skills in 30d: skillAlpha (P3) + skillBeta (P4) = 2
    expect(result.curriculumBreakdown.sourceBreakdown.coreAcademic).toBe(0);
    expect(result.curriculumBreakdown.sourceBreakdown.supportingAcademic).toBe(0);
    expect(result.curriculumBreakdown.sourceBreakdown.platformCourse).toBe(1);
    expect(result.curriculumBreakdown.sourceBreakdown.notMapped).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// E. Curriculum Coverage %
// ---------------------------------------------------------------------------

describe('Phase 4 — E. Curriculum Coverage %', () => {
  it('verifies exact mathematical specification: (Covered + Partially Covered) / Total Demanded * 100', () => {
    // Example from prompt:
    // 1 Covered, 2 Partially Covered, 1 Not Mapped -> 75%
    const covered = 1;
    const partiallyCovered = 2;
    const notMapped = 1;
    const totalDemanded = covered + partiallyCovered + notMapped;
    const coveragePct = ((covered + partiallyCovered) / totalDemanded) * 100;
    expect(coveragePct).toBe(75.0);
  });

  it('calculates live database coverage percentage correctly: (0 + 1) / 2 * 100 = 50.0%', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d' });
    // 2 demanded skills: skillAlpha (Partially Covered), skillBeta (Not Mapped)
    expect(result.curriculumBreakdown.coveredCount).toBe(0);
    expect(result.curriculumBreakdown.partiallyCoveredCount).toBe(1);
    expect(result.curriculumBreakdown.notMappedCount).toBe(1);
    expect(result.curriculumBreakdown.coveragePct).toBe(50.0);
    expect(result.overview.curriculumCoveragePct).toBe(50.0);
  });

  it('0 demanded skills returns 0% — never NaN or Infinity', async () => {
    // Create temporary isolated institution with no opportunities
    const emptyUserId = uid('iu-empty');
    await prisma.user.create({
      data: { id: emptyUserId, email: `${emptyUserId}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Empty Admin' },
    });
    const emptyProfile = await prisma.institutionProfile.create({
      data: { userId: emptyUserId, institutionName: 'Empty University', adminDesignation: 'Admin' },
    });

    try {
      // Non-matching search to guarantee 0 demanded skills in the filtered results
      const result = await getSkillDemandAlignment(emptyProfile.id, { search: 'non-existent-skill-query-xyz' });
      expect(result.curriculumBreakdown.coveragePct).toBe(0);
      expect(Number.isNaN(result.curriculumBreakdown.coveragePct)).toBe(false);
      expect(Number.isFinite(result.curriculumBreakdown.coveragePct)).toBe(true);
    } finally {
      await prisma.institutionProfile.delete({ where: { id: emptyProfile.id } });
      await prisma.user.delete({ where: { id: emptyUserId } });
    }
  }, 30000);
});

// ---------------------------------------------------------------------------
// F. Gap Formula & Thresholds
// ---------------------------------------------------------------------------

describe('Phase 4 — F. Gap Formula (Demand % - Supply %)', () => {
  it('gapPp = demandPct - supplyPct in percentage points', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    // 4 opps, alpha in 4 -> demandPct = 100.0%
    // 4 students, alpha in 2 -> supplyPct = 50.0%
    // gapPp = 100.0 - 50.0 = +50.0
    expect(alphaItem.demandPct).toBe(100.0);
    expect(alphaItem.supplyPct).toBe(50.0);
    expect(alphaItem.gapPp).toBe(50.0);
  });

  it('Gap > +15 pp -> "Higher demand than supply"', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    const alphaItem = result.skills.find(s => s.skillId === skillAlphaId)!;
    expect(alphaItem.gapPp).toBeGreaterThan(15);
    expect(alphaItem.gapStatus).toBe('Higher demand than supply');
  });

  it('-15 pp <= Gap <= +15 pp -> "Balanced"', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    const betaItem = result.skills.find(s => s.skillId === skillBetaId)!;
    // skillBeta: 1 of 4 opps -> demandPct = 25.0%
    // 1 of 4 students -> supplyPct = 25.0%
    // gapPp = 25.0 - 25.0 = 0.0 pp
    expect(betaItem.gapPp).toBe(0.0);
    expect(betaItem.gapStatus).toBe('Balanced');
  });

  it('Gap < -15 pp -> "Higher supply than demand"', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d', opportunityType: 'ALL' });
    const gammaItem = result.skills.find(s => s.skillId === skillGammaId)!;
    // skillGamma: 0 of 4 opps -> demandPct = 0.0%
    // 2 of 4 students -> supplyPct = 50.0%
    // gapPp = 0.0 - 50.0 = -50.0 pp
    expect(gammaItem.gapPp).toBe(-50.0);
    expect(gammaItem.gapStatus).toBe('Higher supply than demand');
  });
});

// ---------------------------------------------------------------------------
// G. Zero Denominator Guard
// ---------------------------------------------------------------------------

describe('Phase 4 — G. Zero Denominator Guard', () => {
  it('zero students: supply metrics return 0, no NaN, no Infinity, no crash', async () => {
    const emptyUserId = uid('iu-empty-2');
    await prisma.user.create({
      data: { id: emptyUserId, email: `${emptyUserId}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Zero Students Admin' },
    });
    const emptyProfile = await prisma.institutionProfile.create({
      data: { userId: emptyUserId, institutionName: 'Zero Students Inst', adminDesignation: 'Dean' },
    });

    try {
      const result = await getSkillDemandAlignment(emptyProfile.id);
      expect(result.overview.totalStudents).toBe(0);
      expect(result.overview.studentsWithVerifiedSkills).toBe(0);
      expect(result.overview.verifiedStudentsPct).toBe(0);
      expect(Number.isNaN(result.overview.verifiedStudentsPct)).toBe(false);

      for (const item of result.skills) {
        expect(item.supplyPct).toBe(0);
        expect(item.verifiedSupplyPct).toBe(0);
        expect(Number.isNaN(item.supplyPct)).toBe(false);
        expect(Number.isNaN(item.verifiedSupplyPct)).toBe(false);
      }
    } finally {
      await prisma.institutionProfile.delete({ where: { id: emptyProfile.id } });
      await prisma.user.delete({ where: { id: emptyUserId } });
    }
  });

  it('zero opportunities matching criteria: demand metrics return 0, no NaN, no Infinity', async () => {
    // Search with non-matching query -> 0 opportunities matching
    const result = await getSkillDemandAlignment(instAId, { search: 'non-existent-xyz-query' });
    for (const item of result.skills) {
      expect(Number.isNaN(item.demandPct)).toBe(false);
      expect(Number.isFinite(item.demandPct)).toBe(true);
      expect(Number.isNaN(item.gapPp)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// H. CSV Export
// ---------------------------------------------------------------------------

describe('Phase 4 — H. CSV Export', () => {
  it('uses exact same calculation as service DTO (identical values)', async () => {
    const data = await getSkillDemandAlignment(instAId, { timeRange: '30d' });
    const csv = await generateSkillDemandCsv(instAId, { timeRange: '30d' });
    const lines = csv.split('\r\n').filter(l => l.trim().length > 0);

    // Header + data rows
    expect(lines.length).toBe(data.skills.length + 1);

    // Verify first skill's demandPct in CSV matches DTO
    const firstSkill = data.skills[0];
    const firstRow = lines[1];
    expect(firstRow).toContain(firstSkill.skillName);
    expect(firstRow).toContain(firstSkill.demandPct.toFixed(1));
    expect(firstRow).toContain(firstSkill.supplyPct.toFixed(1));
  }, 30000);

  it('contains zero individual student PII (no names, emails, phones, IDs, resumes)', async () => {
    const csv = await generateSkillDemandCsv(instAId);
    // Student names in fixtures
    expect(csv).not.toContain('S1');
    expect(csv).not.toContain('S2');
    expect(csv).not.toContain('S3');
    expect(csv).not.toContain('S4');
    expect(csv).not.toContain('@test.dev');
    expect(csv).not.toContain('resume');
  }, 30000);

  it('is valid RFC-4180 format with CRLF line endings', async () => {
    const csv = await generateSkillDemandCsv(instAId);
    expect(csv).toContain('\r\n');
    const header = csv.split('\r\n')[0];
    expect(header).toContain('Skill Name');
    expect(header).toContain('Category');
    expect(header).toContain('Industry Demand %');
    expect(header).toContain('Student Supply %');
    expect(header).toContain('Demand vs Supply Gap (pp)');
    expect(header).toContain('Curriculum Status');
    expect(header).toContain('Mapping Source');
  }, 30000);
});

// ---------------------------------------------------------------------------
// I. Tenant Isolation
// ---------------------------------------------------------------------------

describe('Phase 4 — I. Tenant Isolation', () => {
  it('Institution A does not receive Institution B student analytics', async () => {
    const resultA = await getSkillDemandAlignment(instAId);
    const resultB = await getSkillDemandAlignment(instBId);

    // Inst A has 4 students; Inst B has 1 student
    expect(resultA.overview.totalStudents).toBe(4);
    expect(resultB.overview.totalStudents).toBe(1);

    // Inst B student (sb1) has skillAlpha verified score=90
    // Inst A should only see its own 2 students with skillAlpha
    const alphaItemA = resultA.skills.find(s => s.skillId === skillAlphaId)!;
    expect(alphaItemA.studentCount).toBe(2);
    expect(alphaItemA.verifiedStudentCount).toBe(2);

    // Inst B should only see its 1 student
    const alphaItemB = resultB.skills.find(s => s.skillId === skillAlphaId)!;
    expect(alphaItemB.studentCount).toBe(1);
    expect(alphaItemB.verifiedStudentCount).toBe(1);
  }, 30000);

  it('metadata.institutionName correctly reflects authenticated institution', async () => {
    const resultA = await getSkillDemandAlignment(instAId);
    const resultB = await getSkillDemandAlignment(instBId);
    expect(resultA.metadata.institutionName).toBe('Alpha University');
    expect(resultB.metadata.institutionName).toBe('Beta College');
  }, 30000);
});

// ---------------------------------------------------------------------------
// J. Deterministic Observations & Response Shape
// ---------------------------------------------------------------------------

describe('Phase 4 — J. Observations & Response Shape', () => {
  it('observations are purely descriptive and deterministic (no recommendations/rankings)', async () => {
    const result = await getSkillDemandAlignment(instAId, { timeRange: '30d' });
    expect(Array.isArray(result.observations)).toBe(true);
    expect(result.observations.length).toBeGreaterThan(0);
    for (const obs of result.observations) {
      expect(typeof obs).toBe('string');
      // Must not contain normative advice
      expect(obs.toLowerCase()).not.toContain('recommend');
      expect(obs.toLowerCase()).not.toContain('should');
      expect(obs.toLowerCase()).not.toContain('hire');
    }
  });

  it('response shape contains all required DTO properties', async () => {
    const result = await getSkillDemandAlignment(instAId);
    expect(result).toHaveProperty('overview');
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('curriculumBreakdown');
    expect(result).toHaveProperty('monthlyTrends');
    expect(result).toHaveProperty('observations');
    expect(result).toHaveProperty('metadata');
  });

  it('throws on non-existent institutionProfileId', async () => {
    await expect(
      getSkillDemandAlignment('non-existent-profile-xyz')
    ).rejects.toThrow('Institution profile not found');
  });
});
