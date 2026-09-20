import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import * as explorer from '../server/src/services/candidateExplorerService.js';
import { requireRole, AuthRequest } from '../server/src/middleware/auth.js';
import { requireInstitutionProfile, requireOpportunityOwnership } from '../server/src/middleware/authorization.js';

// Helper: Lightweight mock Response object
function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    send(data: any) {
      this.body = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
}

describe('Phase 2 — Candidate Explorer Architecture & Invariants (N1–N9)', { timeout: 30000 }, () => {
  let testAdminUser: any;
  let testInstitutionProfile: any;
  let otherAdminUser: any;
  let otherInstitutionProfile: any;
  let studentInInstitution: any;
  let studentUnverifiedNameOnly: any;
  let studentInOtherInstitution: any;
  let testOpportunity: any;
  let testRecruiter: any;
  let otherRecruiter: any;
  let otherOpportunity: any;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Primary test institution admin + profile (Admin A)
    testAdminUser = await prisma.user.create({
      data: {
        email: `inst.admin.a.${timestamp}@testuniv.edu`,
        name: 'Dr. Placement Dean A',
        role: 'INSTITUTION_ADMIN',
      },
    });
    createdUserIds.push(testAdminUser.id);

    testInstitutionProfile = await prisma.institutionProfile.create({
      data: {
        userId: testAdminUser.id,
        institutionName: `Test University A ${timestamp}`,
        adminDesignation: 'Dean of Placements',
      },
    });

    // 2. Second institution admin + profile for cross-tenant isolation (Admin B)
    otherAdminUser = await prisma.user.create({
      data: {
        email: `other.admin.b.${timestamp}@otheruniv.edu`,
        name: 'Prof. Placement Dean B',
        role: 'INSTITUTION_ADMIN',
      },
    });
    createdUserIds.push(otherAdminUser.id);

    otherInstitutionProfile = await prisma.institutionProfile.create({
      data: {
        userId: otherAdminUser.id,
        institutionName: `Other University B ${timestamp}`,
        adminDesignation: 'Dean of Placements',
      },
    });

    // 3. Verified student affiliated with primary test institution (institutionProfileId populated)
    const studentUser1 = await prisma.user.create({
      data: {
        email: `student.verified.${timestamp}@testuniv.edu`,
        name: 'Alice Placement Star',
        role: 'STUDENT',
      },
    });
    createdUserIds.push(studentUser1.id);

    studentInInstitution = await prisma.studentProfile.create({
      data: {
        userId: studentUser1.id,
        institution: testInstitutionProfile.institutionName,
        institutionProfileId: testInstitutionProfile.id,
        targetDomain: 'Artificial Intelligence',
        cgpa: 8.8,
        gradYear: 2026,
      },
    });

    // 4. Student with matching institution name BUT NULL institutionProfileId
    // Requirement 1: MUST be excluded from Candidate Explorer until verified!
    const studentUserUnverified = await prisma.user.create({
      data: {
        email: `student.unverified.${timestamp}@testuniv.edu`,
        name: 'Charlie Unverified NameOnly',
        role: 'STUDENT',
      },
    });
    createdUserIds.push(studentUserUnverified.id);

    studentUnverifiedNameOnly = await prisma.studentProfile.create({
      data: {
        userId: studentUserUnverified.id,
        institution: testInstitutionProfile.institutionName,
        institutionProfileId: null, // Unverified affiliation
        targetDomain: 'Data Science',
        cgpa: 8.0,
        gradYear: 2026,
      },
    });

    // 5. Student affiliated with other institution (Institution B)
    const studentUser2 = await prisma.user.create({
      data: {
        email: `student.other.${timestamp}@otheruniv.edu`,
        name: 'Bob Outside Student',
        role: 'STUDENT',
      },
    });
    createdUserIds.push(studentUser2.id);

    studentInOtherInstitution = await prisma.studentProfile.create({
      data: {
        userId: studentUser2.id,
        institution: otherInstitutionProfile.institutionName,
        institutionProfileId: otherInstitutionProfile.id,
        targetDomain: 'Web Development',
        cgpa: 7.2,
        gradYear: 2025,
      },
    });

    // 6. Recruiter 1 (Owns Opportunity 1)
    testRecruiter = await prisma.user.create({
      data: {
        email: `recruiter1.${timestamp}@techcorp.com`,
        name: 'Lead Recruiter TechCorp',
        role: 'INDUSTRY',
      },
    });
    createdUserIds.push(testRecruiter.id);

    const indProfile1 = await prisma.industryProfile.create({
      data: {
        userId: testRecruiter.id,
        companyName: `TechCorp ${timestamp}`,
        industrySector: 'Software',
      },
    });

    testOpportunity = await prisma.opportunity.create({
      data: {
        companyId: indProfile1.id,
        title: 'Full Stack Engineer',
        description: 'Great opportunity',
        type: 'JOB',
        location: 'Remote',
        stipend: '1500000',
        status: 'OPEN',
      },
    });

    // 7. Recruiter 2 (Owns Opportunity 2)
    otherRecruiter = await prisma.user.create({
      data: {
        email: `recruiter2.${timestamp}@innovate.com`,
        name: 'Recruiter Innovate',
        role: 'INDUSTRY',
      },
    });
    createdUserIds.push(otherRecruiter.id);

    const indProfile2 = await prisma.industryProfile.create({
      data: {
        userId: otherRecruiter.id,
        companyName: `Innovate Labs ${timestamp}`,
        industrySector: 'Hardware',
      },
    });

    otherOpportunity = await prisma.opportunity.create({
      data: {
        companyId: indProfile2.id,
        title: 'Firmware Engineer',
        description: 'Embedded systems',
        type: 'JOB',
        location: 'Onsite',
        status: 'OPEN',
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    if (testOpportunity?.id) {
      await prisma.candidateRecommendation.deleteMany({ where: { opportunityId: testOpportunity.id } });
      await prisma.candidateMatch.deleteMany({ where: { opportunityId: testOpportunity.id } });
      await prisma.application.deleteMany({ where: { opportunityId: testOpportunity.id } });
      await prisma.opportunity.deleteMany({ where: { id: testOpportunity.id } });
    }
    if (otherOpportunity?.id) {
      await prisma.candidateRecommendation.deleteMany({ where: { opportunityId: otherOpportunity.id } });
      await prisma.candidateMatch.deleteMany({ where: { opportunityId: otherOpportunity.id } });
      await prisma.application.deleteMany({ where: { opportunityId: otherOpportunity.id } });
      await prisma.opportunity.deleteMany({ where: { id: otherOpportunity.id } });
    }

    if (testInstitutionProfile?.id) {
      await prisma.candidateTag.deleteMany({ where: { institutionId: testInstitutionProfile.id } });
      await prisma.candidateNote.deleteMany({ where: { institutionId: testInstitutionProfile.id } });
      await prisma.savedCandidateFilter.deleteMany({ where: { institutionId: testInstitutionProfile.id } });
    }
    if (otherInstitutionProfile?.id) {
      await prisma.candidateTag.deleteMany({ where: { institutionId: otherInstitutionProfile.id } });
      await prisma.candidateNote.deleteMany({ where: { institutionId: otherInstitutionProfile.id } });
      await prisma.savedCandidateFilter.deleteMany({ where: { institutionId: otherInstitutionProfile.id } });
    }

    if (studentInInstitution?.id) {
      await prisma.studentProfile.deleteMany({ where: { id: studentInInstitution.id } });
    }
    if (studentUnverifiedNameOnly?.id) {
      await prisma.studentProfile.deleteMany({ where: { id: studentUnverifiedNameOnly.id } });
    }
    if (studentInOtherInstitution?.id) {
      await prisma.studentProfile.deleteMany({ where: { id: studentInOtherInstitution.id } });
    }

    await prisma.industryProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.institutionProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  describe('1. Invariant N1 & N2: Fail-Closed Institution Isolation (No Name Fallback)', () => {
    it('only returns candidates strictly matching institutionProfileId (excludes name-only matches)', async () => {
      const result = await explorer.searchCandidates(testAdminUser.id, {});
      const returnedIds = result.candidates.map((c) => c.studentProfileId);

      // Must include verified student with matching institutionProfileId
      expect(returnedIds).toContain(studentInInstitution.id);

      // CRITICAL REQUIREMENT 1: Must NEVER include unverified student whose institutionProfileId is null,
      // even if student.institution text matches the institution's name!
      expect(returnedIds).not.toContain(studentUnverifiedNameOnly.id);

      // Must NEVER include student from another institution
      expect(returnedIds).not.toContain(studentInOtherInstitution.id);
    });

    it('returns candidate detail for own student, but null (404) for unverified or foreign students', async () => {
      // Accessing verified own student
      const ownStudent = await explorer.getCandidateDetail(testAdminUser.id, studentInInstitution.id);
      expect(ownStudent).not.toBeNull();
      expect(ownStudent?.studentProfileId).toBe(studentInInstitution.id);

      // Accessing unverified name-only student MUST return null (fail-closed)
      const unverifiedLookup = await explorer.getCandidateDetail(testAdminUser.id, studentUnverifiedNameOnly.id);
      expect(unverifiedLookup).toBeNull();

      // Accessing student from another institution MUST return null (fail-closed)
      const foreignLookup = await explorer.getCandidateDetail(testAdminUser.id, studentInOtherInstitution.id);
      expect(foreignLookup).toBeNull();
    });

    it('rejects candidate searches from a user who has no InstitutionProfile', async () => {
      await expect(
        explorer.searchCandidates(testRecruiter.id, {})
      ).rejects.toThrow('INSTITUTION_PROFILE_NOT_FOUND');
    });
  });

  describe('2. Explicit Non-Admin & Unauthenticated Access Rejection (Requirement 3)', () => {
    it('rejects STUDENT role with 403 Forbidden', () => {
      const req: AuthRequest = {
        user: { id: 'student-id', role: 'STUDENT' },
      } as any;
      const res = createMockRes();
      let nextCalled = false;

      const middleware = requireRole(['INSTITUTION_ADMIN']);
      middleware(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body?.error?.code).toBe('FORBIDDEN');
    });

    it('rejects INDUSTRY role with 403 Forbidden', () => {
      const req: AuthRequest = {
        user: { id: 'industry-id', role: 'INDUSTRY' },
      } as any;
      const res = createMockRes();
      let nextCalled = false;

      const middleware = requireRole(['INSTITUTION_ADMIN']);
      middleware(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body?.error?.code).toBe('FORBIDDEN');
    });

    it('rejects unauthenticated request with 401 Unauthorized', () => {
      const req: AuthRequest = {} as any; // No req.user
      const res = createMockRes();
      let nextCalled = false;

      const middleware = requireRole(['INSTITUTION_ADMIN']);
      middleware(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.body?.error?.code).toBe('UNAUTHORIZED');
    });

    it('rejects user without verified InstitutionProfile via requireInstitutionProfile', () => {
      const req: AuthRequest = {
        user: { id: 'admin-without-profile', role: 'INSTITUTION_ADMIN' },
      } as any;
      const res = createMockRes();
      let nextCalled = false;

      requireInstitutionProfile(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body?.error?.code).toBe('NO_INSTITUTION_PROFILE');
    });
  });

  describe('3. Saved Filter Ownership & Security (Requirement 4 & 5)', () => {
    let adminAFilterId: string;

    it('creates creator-private filter for Admin A by default', async () => {
      const saved = await explorer.saveFilter(
        testAdminUser.id,
        'Private AI Filter Admin A',
        JSON.stringify({ minCgpa: 8.5 }),
        'PRIVATE'
      );
      expect(saved.id).toBeDefined();
      expect(saved.createdBy).toBe(testAdminUser.id);
      expect(saved.visibility).toBe('PRIVATE');
      adminAFilterId = saved.id;
    });

    it('prevents Admin B from seeing Admin A’s private filter', async () => {
      const adminBFilters = await explorer.getSavedFilters(otherAdminUser.id);
      const hasAdminAFilter = adminBFilters.some((f) => f.id === adminAFilterId);
      expect(hasAdminAFilter).toBe(false);
    });

    it('prevents Admin B from deleting Admin A’s private filter (throws FORBIDDEN_NOT_OWNER)', async () => {
      await expect(
        explorer.deleteSavedFilter(otherAdminUser.id, adminAFilterId)
      ).rejects.toThrow(); // FILTER_NOT_FOUND or FORBIDDEN_NOT_OWNER
    });

    it('allows Admin A to delete their own private filter', async () => {
      const deleted = await explorer.deleteSavedFilter(testAdminUser.id, adminAFilterId);
      expect(deleted.id).toBe(adminAFilterId);
    });
  });

  describe('4. Candidate Detail & Evidence Privacy (Requirement 6 & 7)', () => {
    it('returns strictly sanitized DTO without passwords, tokens, or raw security blobs', async () => {
      const detail = await explorer.getCandidateDetail(testAdminUser.id, studentInInstitution.id);
      expect(detail).not.toBeNull();

      // Verified authorized fields
      expect(detail?.studentProfileId).toBe(studentInInstitution.id);
      expect(detail?.name).toBe('Alice Placement Star');
      expect(detail?.department).toBe('Artificial Intelligence');
      expect(detail?.cgpa).toBe(8.8);

      // Sensitive fields MUST NOT exist on the returned DTO
      const rawObject = detail as any;
      expect(rawObject.password).toBeUndefined();
      expect(rawObject.passwordHash).toBeUndefined();
      expect(rawObject.firebaseUid).toBeUndefined();
      expect(rawObject.refreshToken).toBeUndefined();
      expect(rawObject.verificationEvidenceJson).toBeUndefined();
    });
  });

  describe('5. Recommendation Ownership & Retention (Requirement 8 & 9)', () => {
    it('creates non-operative recommendation without creating or changing any Application', async () => {
      const recResult = await explorer.recommendCandidates({
        institutionId: testInstitutionProfile.id,
        opportunityId: testOpportunity.id,
        candidateIds: [studentInInstitution.id],
        notes: 'Endorsed for technical excellence',
        recommendedBy: testAdminUser.id,
      });

      expect(recResult.succeeded).toBe(1);
      expect(recResult.batchId).toBeDefined();

      // Verify recommendation record exists
      const rec = await prisma.candidateRecommendation.findFirst({
        where: {
          institutionId: testInstitutionProfile.id,
          candidateId: studentInInstitution.id,
          opportunityId: testOpportunity.id,
        },
      });
      expect(rec).not.toBeNull();
      expect(rec?.status).toBe('RECOMMENDED');

      // Requirement 9: No Application was created
      const autoApp = await prisma.application.findFirst({
        where: {
          studentId: studentInInstitution.id,
          opportunityId: testOpportunity.id,
        },
      });
      expect(autoApp).toBeNull();
    });

    it('enforces recruiter opportunity ownership via requireOpportunityOwnership', async () => {
      // Recruiter 2 trying to access Recruiter 1's opportunity recommendations
      const unauthReq: AuthRequest = {
        params: { id: testOpportunity.id },
        user: {
          id: otherRecruiter.id,
          role: 'INDUSTRY',
          industryProfileId: 'wrong-company-id',
        },
      } as any;
      const res = createMockRes();
      let nextCalled = false;

      await requireOpportunityOwnership(unauthReq, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body?.error?.code).toBe('FORBIDDEN_OWNERSHIP');
    });
  });

  describe('6. Privacy-Safe CSV Export (Requirement 14)', () => {
    it('generates privacy-safe CSV containing only institution-scoped candidate data', async () => {
      const csv = await explorer.exportCandidatesCsv(testAdminUser.id, {});

      // Headers check
      expect(csv).toContain('Student ID,Name,Email,Target Domain,Graduation Year,CGPA');

      // Content check
      expect(csv).toContain('Alice Placement Star');

      // Must NOT contain outside students or unverified students
      expect(csv).not.toContain('Bob Outside Student');
      expect(csv).not.toContain('Charlie Unverified NameOnly');

      // Security check: Must NOT contain password or token headers
      expect(csv.toLowerCase()).not.toContain('password');
      expect(csv.toLowerCase()).not.toContain('token');
      expect(csv.toLowerCase()).not.toContain('firebase');
    });
  });

  describe('7. Gap Analysis & Eligibility Separation (Requirement 10, 11, 12)', () => {
    it('identifies eligible candidates who have not yet applied', async () => {
      // Seed CandidateMatch
      await prisma.candidateMatch.upsert({
        where: {
          candidateId_opportunityId: {
            candidateId: studentInInstitution.id,
            opportunityId: testOpportunity.id,
          },
        },
        update: { score: 88, eligibility: true },
        create: {
          candidateId: studentInInstitution.id,
          opportunityId: testOpportunity.id,
          score: 88,
          eligibility: true,
          breakdownJson: JSON.stringify({ technicalSkills: 88 }),
          matchedSkillsJson: '[]',
          missingSkillsJson: '[]',
          strengthsJson: '[]',
          weaknessesJson: '[]',
          recommendationsJson: '[]',
        },
      });

      const gapBefore = await explorer.getGapAnalysis(testAdminUser.id, testOpportunity.id, 60);
      expect(gapBefore.some((c) => c.studentProfileId === studentInInstitution.id)).toBe(true);

      // Student applies
      const app = await prisma.application.create({
        data: {
          studentId: studentInInstitution.id,
          opportunityId: testOpportunity.id,
          status: 'applied',
          matchScoreAtApply: 88.0,
        },
      });

      // Gap after application: candidate removed from gap
      const gapAfter = await explorer.getGapAnalysis(testAdminUser.id, testOpportunity.id, 60);
      expect(gapAfter.some((c) => c.studentProfileId === studentInInstitution.id)).toBe(false);

      // Cleanup
      await prisma.application.delete({ where: { id: app.id } });
    });
  });
});
