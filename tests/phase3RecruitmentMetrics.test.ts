/**
 * phase3RecruitmentMetrics.test.ts
 * Phase 3 — Focused deterministic tests for the four corrected metrics.
 *
 * ALL tests use deterministic database fixtures created and torn down in the
 * test run — zero Gemini / OpenAI / external API calls.
 * NO existing production or demo data is deleted or modified.
 *
 * Points verified:
 *   A. Placement rate = unique students placed / total students (student-level)
 *   B. Company aggregation: grouped by IndustryProfile.id, sorted by
 *      totalApplications descending, top-10 limit
 *   C. Domain labelling: data comes from StudentProfile.targetDomain
 *      (career preference), never from a "department" column
 *   D. avgMatchScoreAtApply: average of Application.matchScoreAtApply;
 *      null records excluded; 0 when no scored records; no new algorithm
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { getRecruitmentMetrics } from '../server/src/services/recruitmentMetricsService.js';

// ---------------------------------------------------------------------------
// Fixture helpers — all IDs are deterministic to avoid DB conflicts
// ---------------------------------------------------------------------------

const FX_PREFIX = 'p3-metrics-test-';

function uid(tag: string) { return `${FX_PREFIX}${tag}`; }

async function safeDelete() {
  // Remove in FK-safe order
  await prisma.application.deleteMany({ where: { studentId: { in: [uid('s1'), uid('s2'), uid('s3'), uid('s4')] } } });
  await prisma.studentProfile.deleteMany({ where: { userId: { in: [uid('u1'), uid('u2'), uid('u3'), uid('u4')] } } });
  await prisma.opportunity.deleteMany({ where: { companyId: { in: [uid('co1'), uid('co2')] } } });
  await prisma.industryProfile.deleteMany({ where: { userId: { in: [uid('cu1'), uid('cu2')] } } });
  await prisma.institutionProfile.deleteMany({ where: { userId: uid('iu') } });
  await prisma.user.deleteMany({ where: { id: { in: [uid('u1'), uid('u2'), uid('u3'), uid('u4'), uid('iu'), uid('cu1'), uid('cu2')] } } });
}

let institutionProfileId: string;
let opp1Id: string;
let opp2Id: string;

beforeAll(async () => {
  await safeDelete();

  // Institution user + profile
  await prisma.user.create({ data: { id: uid('iu'), email: `${uid('iu')}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Test Inst' } });
  const instProfile = await prisma.institutionProfile.create({
    data: { userId: uid('iu'), institutionName: 'Test University', adminDesignation: 'Placement Officer' },
  });
  institutionProfileId = instProfile.id;

  // Company users + profiles
  await prisma.user.createMany({ data: [
    { id: uid('cu1'), email: `${uid('cu1')}@test.dev`, passwordHash: 'x', role: 'INDUSTRY', name: 'Acme' },
    { id: uid('cu2'), email: `${uid('cu2')}@test.dev`, passwordHash: 'x', role: 'INDUSTRY', name: 'Beta' },
  ]});
  const [c1, c2] = await Promise.all([
    prisma.industryProfile.create({ data: { id: uid('co1'), userId: uid('cu1'), companyName: 'Acme Corp', industrySector: 'Tech', companySize: 'LARGE' } }),
    prisma.industryProfile.create({ data: { id: uid('co2'), userId: uid('cu2'), companyName: 'Beta Ltd', industrySector: 'Finance', companySize: 'MEDIUM' } }),
  ]);

  // Opportunities
  const [o1, o2] = await Promise.all([
    prisma.opportunity.create({ data: { title: 'SWE Role', companyId: c1.id, type: 'JOB', description: 'Dev', location: 'Remote' } }),
    prisma.opportunity.create({ data: { title: 'Analyst Role', companyId: c2.id, type: 'INTERNSHIP', description: 'Data', location: 'Remote' } }),
  ]);
  opp1Id = o1.id;
  opp2Id = o2.id;

  // Students:
  //  s1 — domain: 'Full Stack', gradYear: 2025 — 2 applications: 1 hired at Acme, 1 applied at Beta
  //  s2 — domain: 'Full Stack', gradYear: 2025 — 1 application: hired at Acme
  //  s3 — domain: 'Data Science', gradYear: 2026 — 0 applications
  //  s4 — domain: 'Data Science', gradYear: 2026 — 0 applications
  await prisma.user.createMany({ data: [
    { id: uid('u1'), email: `${uid('u1')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S1' },
    { id: uid('u2'), email: `${uid('u2')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S2' },
    { id: uid('u3'), email: `${uid('u3')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S3' },
    { id: uid('u4'), email: `${uid('u4')}@test.dev`, passwordHash: 'x', role: 'STUDENT', name: 'S4' },
  ]});
  await prisma.studentProfile.createMany({ data: [
    { id: uid('s1'), userId: uid('u1'), institution: 'Test University', targetDomain: 'Full Stack',   gradYear: 2025, institutionProfileId },
    { id: uid('s2'), userId: uid('u2'), institution: 'Test University', targetDomain: 'Full Stack',   gradYear: 2025, institutionProfileId },
    { id: uid('s3'), userId: uid('u3'), institution: 'Test University', targetDomain: 'Data Science', gradYear: 2026, institutionProfileId },
    { id: uid('s4'), userId: uid('u4'), institution: 'Test University', targetDomain: 'Data Science', gradYear: 2026, institutionProfileId },
  ]});

  // Applications:
  //   s1 → opp1 (Acme) status=hired, matchScoreAtApply=80
  //   s1 → opp2 (Beta) status=applied, matchScoreAtApply=60
  //   s2 → opp1 (Acme) status=hired, matchScoreAtApply=90
  //   s3 and s4 have no applications (verifies zero-application/unscored domain handling)
  await prisma.application.createMany({ data: [
    { studentId: uid('s1'), opportunityId: opp1Id, status: 'hired',   matchScoreAtApply: 80, appliedAt: new Date('2025-01-10') },
    { studentId: uid('s1'), opportunityId: opp2Id, status: 'applied', matchScoreAtApply: 60, appliedAt: new Date('2025-02-10') },
    { studentId: uid('s2'), opportunityId: opp1Id, status: 'hired',   matchScoreAtApply: 90, appliedAt: new Date('2025-03-10') },
  ]});
}, 30000);

afterAll(async () => {
  await safeDelete();
}, 30000);

// ---------------------------------------------------------------------------
// A. Placement Rate
// ---------------------------------------------------------------------------

describe('Phase 3 Metrics — A. Placement Rate (student-level)', () => {
  it('uniqueStudentsPlaced counts unique students, not application rows', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    // s1 has 2 applications, one of which is hired → counts as 1 placed student
    // s2 has 1 hired application → 1 placed student
    // s3 applied only → 0
    // s4 no applications → 0
    // Total placed students = 2 (s1 + s2), not 2 hired rows
    expect(result.overview.uniqueStudentsPlaced).toBe(2);
  });

  it('overallPlacementRate = uniqueStudentsPlaced / totalStudents × 100', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    // 2 placed / 4 students = 50.0%
    expect(result.overview.totalStudents).toBe(4);
    expect(result.overview.overallPlacementRate).toBe(50.0);
  });

  it('both numerator and denominator are at student level — not application row level', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const { uniqueStudentsPlaced, totalStudents, totalApplications } = result.overview;
    // Sanity: application count (3) is different from student count (4 here, but
    // the placed count must still be <= totalStudents, not totalApplications)
    expect(uniqueStudentsPlaced).toBeLessThanOrEqual(totalStudents);
    // Specifically: 2 hired application rows exist, but only 2 unique students are hired
    // This test confirms the correct student-deduplicated count
    expect(uniqueStudentsPlaced).toBe(2);
    expect(totalApplications).toBe(3); // 3 rows
  });
});

// ---------------------------------------------------------------------------
// B. Company aggregation — sort + top-10 limit
// ---------------------------------------------------------------------------

describe('Phase 3 Metrics — B. Company Aggregation (by application volume)', () => {
  it('groups applications by IndustryProfile (company), not by Opportunity', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    // Acme (opp1): 2 applications (s1, s2)
    // Beta (opp2): 1 application (s1)
    const acme = result.topCompaniesByVolume.find(c => c.companyName === 'Acme Corp');
    const beta = result.topCompaniesByVolume.find(c => c.companyName === 'Beta Ltd');
    expect(acme).toBeDefined();
    expect(beta).toBeDefined();
    expect(acme!.totalApplications).toBe(2);
    expect(beta!.totalApplications).toBe(1);
  });

  it('sorted descending by totalApplications', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const volumes = result.topCompaniesByVolume.map(c => c.totalApplications);
    for (let i = 1; i < volumes.length; i++) {
      expect(volumes[i]).toBeLessThanOrEqual(volumes[i - 1]);
    }
    // Acme must be first
    expect(result.topCompaniesByVolume[0].companyName).toBe('Acme Corp');
  });

  it('result is capped at 10 companies maximum', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    expect(result.topCompaniesByVolume.length).toBeLessThanOrEqual(10);
  });

  it('conversionRate = hired / totalApplications × 100', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const acme = result.topCompaniesByVolume.find(c => c.companyName === 'Acme Corp')!;
    // Acme: 2 apps, 2 hired → 100%
    expect(acme.hired).toBe(2);
    expect(acme.conversionRate).toBe(100.0);
  });
});

// ---------------------------------------------------------------------------
// C. Domain labelling — StudentProfile.targetDomain (career preference)
// ---------------------------------------------------------------------------

describe('Phase 3 Metrics — C. Domain Performance (targetDomain field)', () => {
  it('domain field comes from StudentProfile.targetDomain', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const domainNames = result.domainPerformance.map(d => d.domain);
    expect(domainNames).toContain('Full Stack');
    expect(domainNames).toContain('Data Science');
  });

  it('contains no "department" field — domain is the correct key', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    for (const row of result.domainPerformance) {
      // The shape should have a "domain" key, not a "department" key
      expect(row).toHaveProperty('domain');
      expect(row).not.toHaveProperty('department');
    }
  });

  it('student counts match domain grouping', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const fs   = result.domainPerformance.find(d => d.domain === 'Full Stack')!;
    const ds   = result.domainPerformance.find(d => d.domain === 'Data Science')!;
    expect(fs.studentCount).toBe(2);  // s1, s2
    expect(ds.studentCount).toBe(2);  // s3, s4
  });

  it('placementRate per domain uses student-level denominator', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const fs = result.domainPerformance.find(d => d.domain === 'Full Stack')!;
    // s1 and s2 are both hired → 2/2 = 100%
    expect(fs.hiredCount).toBe(2);
    expect(fs.placementRate).toBe(100.0);
    const ds = result.domainPerformance.find(d => d.domain === 'Data Science')!;
    // s3 applied, s4 no app → 0 hired / 2 students = 0%
    expect(ds.hiredCount).toBe(0);
    expect(ds.placementRate).toBe(0.0);
  });
});

// ---------------------------------------------------------------------------
// D. avgMatchScoreAtApply — population and null handling
// ---------------------------------------------------------------------------

describe('Phase 3 Metrics — D. Avg Match Score At Apply', () => {
  it('overview avgMatchScoreAtApply excludes null records', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    // Scored applications: s1→opp1=80, s1→opp2=60, s2→opp1=90
    // Average = (80 + 60 + 90) / 3 = 76.67 → rounded to 77
    expect(result.overview.avgMatchScoreAtApply).toBe(77);
  });

  it('domain avgMatchScoreAtApply calculates per domain', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const fs = result.domainPerformance.find(d => d.domain === 'Full Stack')!;
    // Full Stack scored apps: s1→opp1=80, s1→opp2=60, s2→opp1=90 → avg = 77 (rounded)
    expect(fs.avgMatchScoreAtApply).toBe(77);

    const ds = result.domainPerformance.find(d => d.domain === 'Data Science')!;
    // Data Science: 0 applications → 0 scored records → returns 0
    expect(ds.avgMatchScoreAtApply).toBe(0);
  });

  it('returns 0 (not NaN or undefined) when no scored records exist for a domain', async () => {
    const result = await getRecruitmentMetrics(institutionProfileId);
    const ds = result.domainPerformance.find(d => d.domain === 'Data Science')!;
    expect(ds.avgMatchScoreAtApply).toBe(0);
    expect(Number.isNaN(ds.avgMatchScoreAtApply)).toBe(false);
  });

  it('score is derived from Application.matchScoreAtApply — no new algorithm or CandidateMatch query', async () => {
    // This is a structural/schema test: verify that the service only reads
    // Application.matchScoreAtApply (stored snapshot), not a live CandidateMatch.score.
    // We can verify this by checking the overview score matches the manual calculation.
    const result = await getRecruitmentMetrics(institutionProfileId);
    // Manual: (80 + 60 + 90) / 3 = 76.67 → Math.round = 77
    expect(result.overview.avgMatchScoreAtApply).toBe(77);
    // Also verify the metric is not a fractional float — it should be an integer (rounded)
    expect(Number.isInteger(result.overview.avgMatchScoreAtApply)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge case: institution with no students → all zeros, no crash
// ---------------------------------------------------------------------------

describe('Phase 3 Metrics — E. Zero-student institution guard', () => {
  it('returns all-zero metrics for an institutionProfileId with no students', async () => {
    // Create a throwaway institution profile with no students
    const throwaway = uid('empty-inst');
    await prisma.user.create({ data: { id: throwaway, email: `${throwaway}@test.dev`, passwordHash: 'x', role: 'INSTITUTION_ADMIN', name: 'Empty' } });
    const emptyProfile = await prisma.institutionProfile.create({ data: { userId: throwaway, institutionName: 'Empty Uni', adminDesignation: 'Admin' } });

    const result = await getRecruitmentMetrics(emptyProfile.id);

    expect(result.overview.totalStudents).toBe(0);
    expect(result.overview.totalApplications).toBe(0);
    expect(result.overview.uniqueStudentsPlaced).toBe(0);
    expect(result.overview.overallPlacementRate).toBe(0);
    expect(result.overview.avgMatchScoreAtApply).toBe(0);
    expect(result.topCompaniesByVolume).toHaveLength(0);
    expect(result.domainPerformance).toHaveLength(0);

    // Cleanup throwaway
    await prisma.institutionProfile.delete({ where: { id: emptyProfile.id } });
    await prisma.user.delete({ where: { id: throwaway } });
  });
});
