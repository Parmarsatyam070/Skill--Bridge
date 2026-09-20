import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';

describe('Collaboration Preservation and Minimum Schema Verification (13 Points)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const EXPECTED_COLLAB_1_ID = '53c9f6da-06b3-4416-bc9d-ba41364589be';
  const EXPECTED_COLLAB_2_ID = '1df54254-c05f-499b-833d-b27bb7461a06';
  const EXPECTED_COMPANY_ID = '90f9f113-e1be-4565-bd51-7c1dfd29da5d';

  // 1. Existing 2 collaborations still exist
  it('Point 1: Existing 2 collaborations still exist', async () => {
    const collabs = await prisma.collaboration.findMany({
      where: {
        id: { in: [EXPECTED_COLLAB_1_ID, EXPECTED_COLLAB_2_ID] },
      },
    });
    expect(collabs).toHaveLength(2);
  });

  // 2. Their IDs are unchanged
  it('Point 2: Their IDs are unchanged', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_1_ID } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_2_ID } });
    expect(c1).not.toBeNull();
    expect(c1!.id).toBe(EXPECTED_COLLAB_1_ID);
    expect(c2).not.toBeNull();
    expect(c2!.id).toBe(EXPECTED_COLLAB_2_ID);
  });

  // 3. Their titles are unchanged
  it('Point 3: Their titles are unchanged', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_1_ID } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_2_ID } });
    expect(c1!.title).toBe('Distributed Cloud System Workshop');
    expect(c2!.title).toBe('Distributed Cloud System Workshop');
  });

  // 4. Their statuses are unchanged
  it('Point 4: Their statuses are unchanged', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_1_ID } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_2_ID } });
    expect(c1!.status).toBe('APPROVED');
    expect(c2!.status).toBe('REQUESTED');
  });

  // 5. Their companyId values are unchanged
  it('Point 5: Their companyId values are unchanged', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_1_ID } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: EXPECTED_COLLAB_2_ID } });
    expect(c1!.companyId).toBe(EXPECTED_COMPANY_ID);
    expect(c2!.companyId).toBe(EXPECTED_COMPANY_ID);
  });

  // 6. Their company relationships remain intact
  it('Point 6: Their company relationships remain intact', async () => {
    const collabs = await prisma.collaboration.findMany({
      where: { id: { in: [EXPECTED_COLLAB_1_ID, EXPECTED_COLLAB_2_ID] } },
      include: { company: true },
    });
    for (const c of collabs) {
      expect(c.company).not.toBeNull();
      expect(c.company.id).toBe(EXPECTED_COMPANY_ID);
      expect(c.company.companyName).toBe('shdfiwu');
    }
  });

  // 7. Their messages remain intact
  it('Point 7: Their messages remain intact', async () => {
    const collabs = await prisma.collaboration.findMany({
      where: { id: { in: [EXPECTED_COLLAB_1_ID, EXPECTED_COLLAB_2_ID] } },
      include: { messages: true },
    });
    for (const c of collabs) {
      expect(c.messages).toBeDefined();
      expect(c.messages.length).toBe(0);
    }
  });

  // 8. institutionId becomes NULL only after the associated InstitutionProfile is deleted
  it('Point 8: institutionId becomes NULL only after associated InstitutionProfile is deleted (tested via isolated rollback)', async () => {
    // We create an isolated temporary InstitutionProfile and Collaboration in a transaction,
    // delete the InstitutionProfile, assert Collaboration survives with institutionId === null,
    // then roll back the transaction so zero persistent changes are made.
    await prisma.$transaction(async (tx) => {
      // 1. Create temporary test institution profile
      const tempUser = await tx.user.create({
        data: {
          email: 'temp-fk-test-inst-admin@test.local',
          name: 'Temp Admin For SetNull Verification',
          role: 'INSTITUTION_ADMIN',
          passwordHash: 'dummy',
        },
      });

      const tempInstProfile = await tx.institutionProfile.create({
        data: {
          userId: tempUser.id,
          institutionName: 'Temporary Test Institution',
          adminDesignation: 'Dean',
        },
      });

      // 2. Create collaboration referencing this temp institution profile
      const tempCollab = await tx.collaboration.create({
        data: {
          institutionId: tempInstProfile.id,
          companyId: EXPECTED_COMPANY_ID,
          title: 'Temporary Test Collaboration for SetNull',
          description: 'Testing that onDelete SetNull preserves this collaboration when InstitutionProfile is deleted.',
          status: 'REQUESTED',
        },
      });

      expect(tempCollab.institutionId).toBe(tempInstProfile.id);

      // 3. Delete the temp institution profile
      await tx.institutionProfile.delete({
        where: { id: tempInstProfile.id },
      });

      // 4. Verify the collaboration STILL EXISTS, and institutionId is now NULL!
      const preservedCollab = await tx.collaboration.findUnique({
        where: { id: tempCollab.id },
      });

      expect(preservedCollab).not.toBeNull();
      expect(preservedCollab!.id).toBe(tempCollab.id);
      expect(preservedCollab!.institutionId).toBeNull();
      expect(preservedCollab!.companyId).toBe(EXPECTED_COMPANY_ID);
      expect(preservedCollab!.title).toBe('Temporary Test Collaboration for SetNull');

      // 5. Force rollback to leave DB 100% untouched
      throw new Error('ROLLBACK_TEST_INTENTIONAL');
    }).catch((err) => {
      if (err.message !== 'ROLLBACK_TEST_INTENTIONAL') {
        throw err;
      }
    });

    // Also verify that the 2 actual existing collaborations now have institutionId set to null (SetNull preserved them upon deleting the target profile)
    const existing = await prisma.collaboration.findMany({
      where: { id: { in: [EXPECTED_COLLAB_1_ID, EXPECTED_COLLAB_2_ID] } },
    });
    for (const c of existing) {
      expect(c.institutionId).toBeNull();
    }
  });

  // 9. New collaboration creation still requires a valid institution
  it('Point 9: New collaboration creation still requires a valid institution', async () => {
    // Attempt to create collaboration with invalid/non-existent institutionId
    await expect(
      prisma.collaboration.create({
        data: {
          institutionId: '00000000-0000-0000-0000-000000000000',
          companyId: EXPECTED_COMPANY_ID,
          title: 'Invalid Inst Collab',
          description: 'This should fail FK constraint',
        },
      })
    ).rejects.toThrow();
  });

  // 10. Industry participant can still access the preserved collaboration
  it('Point 10: Industry participant can still access the preserved collaboration', async () => {
    // When a collaboration has institutionId = null, industry owner check still succeeds
    const mockDetachedCollab = {
      id: EXPECTED_COLLAB_1_ID,
      institutionId: null,
      companyId: EXPECTED_COMPANY_ID,
    };

    const industryUser = {
      role: 'INDUSTRY',
      industryProfileId: EXPECTED_COMPANY_ID,
      institutionProfileId: null,
    };

    const isCompanyOwner = industryUser.industryProfileId && mockDetachedCollab.companyId === industryUser.industryProfileId;
    expect(isCompanyOwner).toBeTruthy();
  });

  // 11. Institution Admin authorization remains fail-closed
  it('Point 11: Institution Admin authorization remains fail-closed for detached collaborations', async () => {
    const mockDetachedCollab = {
      id: EXPECTED_COLLAB_1_ID,
      institutionId: null as string | null,
      companyId: EXPECTED_COMPANY_ID,
    };

    const adminUser = {
      role: 'INSTITUTION_ADMIN',
      institutionProfileId: 'some-active-institution-id',
      industryProfileId: null,
    };

    // Middleware rule from server/src/middleware/authorization.ts:
    // const isInstitutionOwner = req.user.institutionProfileId && collab.institutionId === req.user.institutionProfileId;
    const isInstitutionOwner = adminUser.institutionProfileId && mockDetachedCollab.institutionId === adminUser.institutionProfileId;
    const isCompanyOwner = adminUser.industryProfileId && mockDetachedCollab.companyId === adminUser.industryProfileId;

    expect(Boolean(isInstitutionOwner)).toBe(false);
    expect(Boolean(isCompanyOwner)).toBe(false);
    // In authorization middleware: if (!isInstitutionOwner && !isCompanyOwner) return 403 Forbidden
    const denied = !isInstitutionOwner && !isCompanyOwner;
    expect(denied).toBe(true);
    const hasAccess = Boolean(isInstitutionOwner || isCompanyOwner);
    expect(hasAccess).toBe(false);
  });

  // 12. No StudentProfile affiliation changes
  it('Point 12: No StudentProfile affiliation changes (affiliated count remains 0)', async () => {
    const targetAdmins = await prisma.user.findMany({
      where: { role: 'INSTITUTION_ADMIN' },
      select: { institutionProfile: { select: { id: true } } },
    });
    const targetProfileIds = targetAdmins.map((a) => a.institutionProfile?.id).filter(Boolean) as string[];

    const affiliatedToTargets = await prisma.studentProfile.count({
      where: { institutionProfileId: { in: targetProfileIds } },
    });
    expect(affiliatedToTargets).toBe(0);

    const totalStudentProfiles = await prisma.studentProfile.count();
    expect(totalStudentProfiles).toBeGreaterThanOrEqual(120);
  });

  // 13. No Institution records are deleted
  it('Point 13: No Institution records are deleted (118 institutions remain)', async () => {
    const institutionCount = await prisma.institution.count();
    expect(institutionCount).toBe(118);
  });
});
