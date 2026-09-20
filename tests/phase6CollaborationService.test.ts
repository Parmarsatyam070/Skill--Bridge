/**
 * phase6CollaborationService.test.ts
 * Phase 6 — Step 3: Collaboration Service Layer Verification Suite
 *
 * Verifies:
 * 1. Institution list is tenant-scoped.
 * 2. Institution metrics are tenant-scoped.
 * 3. Institution A cannot access Institution B collaboration.
 * 4. Institution A cannot modify Institution B collaboration.
 * 5. Status normalization works.
 * 6. Metrics do not double-count.
 * 7. Upcoming date logic rejects free-text dates.
 * 8. Null institutionId records are excluded.
 * 9. Partner DTO does not expose PII.
 * 10. Existing Industry collaboration behavior remains compatible.
 * 11. Existing preserved collaboration records remain unchanged.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import * as collaborationService from '../server/src/services/collaborationService.js';

const FX = 'p6-test-';
function uid(tag: string) {
  return `${FX}${tag}-${Date.now()}`;
}

const PRESERVED_COLLAB_1 = '53c9f6da-06b3-4416-bc9d-ba41364589be';
const PRESERVED_COLLAB_2 = '1df54254-c05f-499b-833d-b27bb7461a06';

let userInstAId: string;
let userInstBId: string;
let userIndId: string;
let instProfileAId: string;
let instProfileBId: string;
let indProfileId: string;
let collabAId: string;
let collabBId: string;

async function cleanupFixtures() {
  // Delete collaboration messages first
  await prisma.collaborationMessage.deleteMany({
    where: {
      collaboration: {
        title: { startsWith: FX },
      },
    },
  });

  // Delete test collaborations
  await prisma.collaboration.deleteMany({
    where: {
      title: { startsWith: FX },
    },
  });

  // Delete test profiles
  if (instProfileAId) {
    await prisma.institutionProfile.deleteMany({ where: { id: { in: [instProfileAId, instProfileBId] } } });
  }
  if (indProfileId) {
    await prisma.industryProfile.deleteMany({ where: { id: indProfileId } });
  }

  // Delete test users
  if (userInstAId) {
    await prisma.user.deleteMany({ where: { id: { in: [userInstAId, userInstBId, userIndId] } } });
  }
}

describe('Phase 6 — Collaboration Service Layer & Security Verification', { timeout: 30000 }, () => {
  beforeAll(async () => {
    // 1. Create test user and institution profile A
    const userA = await prisma.user.create({
      data: {
        email: `${uid('inst-a')}@test.local`,
        name: 'Dean Institution A',
        role: 'INSTITUTION_ADMIN',
        passwordHash: 'dummy',
      },
    });
    userInstAId = userA.id;

    const instA = await prisma.institutionProfile.create({
      data: {
        userId: userInstAId,
        institutionName: `${FX}Apex Institute of Technology`,
        adminDesignation: 'Dean of Academics',
      },
    });
    instProfileAId = instA.id;

    // 2. Create test user and institution profile B
    const userB = await prisma.user.create({
      data: {
        email: `${uid('inst-b')}@test.local`,
        name: 'Dean Institution B',
        role: 'INSTITUTION_ADMIN',
        passwordHash: 'dummy',
      },
    });
    userInstBId = userB.id;

    const instB = await prisma.institutionProfile.create({
      data: {
        userId: userInstBId,
        institutionName: `${FX}Beacon University`,
        adminDesignation: 'Director of Partnerships',
      },
    });
    instProfileBId = instB.id;

    // 3. Create test industry user and profile
    const userInd = await prisma.user.create({
      data: {
        email: `${uid('industry')}@test.local`,
        name: 'Tech Recruiter',
        role: 'INDUSTRY',
        passwordHash: 'dummy',
      },
    });
    userIndId = userInd.id;

    const ind = await prisma.industryProfile.create({
      data: {
        userId: userIndId,
        companyName: `${FX}NexGen Cloud Labs`,
        website: 'https://nexgencloud.example.com',
        industrySector: 'Cloud & DevOps',
        verified: true,
      },
    });
    indProfileId = ind.id;

    // 4. Create Collaborations
    // Collab 1 for Inst A: ACTIVE status, future startDate
    const cA1 = await prisma.collaboration.create({
      data: {
        institutionId: instProfileAId,
        companyId: indProfileId,
        type: 'WORKSHOP',
        title: `${FX}Cloud Native Masterclass A1`,
        description: 'Advanced Kubernetes and microservices for senior students.',
        status: 'ACTIVE',
        initiatedByRole: 'INDUSTRY',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
      },
    });
    collabAId = cA1.id;

    // Collab 2 for Inst A: DISCUSSION status with free-text proposedDate
    await prisma.collaboration.create({
      data: {
        institutionId: instProfileAId,
        companyId: indProfileId,
        type: 'HACKATHON',
        title: `${FX}Fintech AI Hackathon A2`,
        description: '48 hour hackathon with financial models.',
        status: 'UNDER_REVIEW', // legacy alias for DISCUSSION
        initiatedByRole: 'INSTITUTION_ADMIN',
        proposedDate: 'Nov 15–20, 2026', // Free-text date with en-dash
      },
    });

    // Collab 3 for Inst A: COMPLETED status
    await prisma.collaboration.create({
      data: {
        institutionId: instProfileAId,
        companyId: indProfileId,
        type: 'GUEST_LECTURE',
        title: `${FX}Guest Lecture A3`,
        description: 'Completed lecture on distributed computing.',
        status: 'COMPLETED',
        initiatedByRole: 'INDUSTRY',
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });

    // Collab 4 for Inst B: REQUESTED status
    const cB1 = await prisma.collaboration.create({
      data: {
        institutionId: instProfileBId,
        companyId: indProfileId,
        type: 'MENTORSHIP',
        title: `${FX}Career Mentorship B1`,
        description: 'Mentorship program for Institution B.',
        status: 'REQUESTED',
        initiatedByRole: 'INSTITUTION_ADMIN',
      },
    });
    collabBId = cB1.id;
  });

  afterAll(async () => {
    await cleanupFixtures();
    await prisma.$disconnect();
  });

  // 1. Institution list is tenant-scoped
  it('1. Institution list is tenant-scoped', async () => {
    const collabsA = await collaborationService.getInstitutionCollaborations(instProfileAId);
    expect(collabsA.length).toBe(3);
    for (const c of collabsA) {
      expect(c.institutionId).toBe(instProfileAId);
      expect(c.title).toContain(FX);
    }

    const collabsB = await collaborationService.getInstitutionCollaborations(instProfileBId);
    expect(collabsB.length).toBe(1);
    expect(collabsB[0].institutionId).toBe(instProfileBId);
    expect(collabsB[0].id).toBe(collabBId);
  });

  // 2. Institution metrics are tenant-scoped
  it('2. Institution metrics are tenant-scoped', async () => {
    const metricsA = await collaborationService.getInstitutionCollaborationMetrics(instProfileAId);
    expect(metricsA.totalCollaborations).toBe(3);
    expect(metricsA.activeCollaborations).toBe(1);
    expect(metricsA.completedCollaborations).toBe(1);

    const metricsB = await collaborationService.getInstitutionCollaborationMetrics(instProfileBId);
    expect(metricsB.totalCollaborations).toBe(1);
    expect(metricsB.activeCollaborations).toBe(0);
    expect(metricsB.completedCollaborations).toBe(0);
    expect(metricsB.statusBreakdown.REQUESTED).toBe(1);
  });

  // 3. Institution A cannot access Institution B collaboration
  it('3. Institution A cannot access Institution B collaboration', async () => {
    // Attempt to access Collab B as Institution A
    const forbiddenCollab = await collaborationService.getCollaborationById(collabBId, instProfileAId);
    expect(forbiddenCollab).toBeNull();

    // Valid access as Institution B succeeds
    const allowedCollab = await collaborationService.getCollaborationById(collabBId, instProfileBId);
    expect(allowedCollab).not.toBeNull();
    expect(allowedCollab!.id).toBe(collabBId);
  });

  // 4. Institution A cannot modify Institution B collaboration
  it('4. Institution A cannot modify Institution B collaboration', async () => {
    await expect(
      collaborationService.updateCollaborationStatus({
        collaborationId: collabBId,
        userId: userInstAId,
        data: { status: 'COMPLETED' },
        institutionProfileId: instProfileAId,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN_ACCESS',
    });

    // Verify status was NOT modified
    const untouched = await prisma.collaboration.findUnique({ where: { id: collabBId } });
    expect(untouched!.status).toBe('REQUESTED');
  });

  // 5. Status normalization works
  it('5. Status normalization works correctly for canonical and legacy aliases', () => {
    expect(collaborationService.normalizeStatus('REQUESTED')).toBe('REQUESTED');
    expect(collaborationService.normalizeStatus('DISCUSSION')).toBe('DISCUSSION');
    expect(collaborationService.normalizeStatus('UNDER_REVIEW')).toBe('DISCUSSION');
    expect(collaborationService.normalizeStatus('APPROVED')).toBe('APPROVED');
    expect(collaborationService.normalizeStatus('ACCEPTED')).toBe('APPROVED');
    expect(collaborationService.normalizeStatus('ACTIVE')).toBe('ACTIVE');
    expect(collaborationService.normalizeStatus('IN_PROGRESS')).toBe('ACTIVE');
    expect(collaborationService.normalizeStatus('COMPLETED')).toBe('COMPLETED');
    expect(collaborationService.normalizeStatus('REJECTED')).toBe('REJECTED');
    expect(collaborationService.normalizeStatus('CANCELLED')).toBe('CANCELLED');
    expect(collaborationService.normalizeStatus('unknown_status')).toBe('REQUESTED');
  });

  // 6. Metrics do not double-count
  it('6. Metrics do not double-count across status buckets', async () => {
    const metricsA = await collaborationService.getInstitutionCollaborationMetrics(instProfileAId);
    const breakdownSum = Object.values(metricsA.statusBreakdown).reduce((sum, count) => sum + count, 0);

    expect(breakdownSum).toBe(metricsA.totalCollaborations);
    expect(metricsA.statusBreakdown.ACTIVE).toBe(1);
    expect(metricsA.statusBreakdown.DISCUSSION).toBe(1); // UNDER_REVIEW normalized
    expect(metricsA.statusBreakdown.COMPLETED).toBe(1);
    expect(metricsA.statusBreakdown.REQUESTED).toBe(0);
  });

  // 7. Upcoming date logic rejects free-text dates
  it('7. Upcoming date logic rejects free-text dates and terminal records', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    // 1. Valid future startDate -> true
    expect(
      collaborationService.isUpcoming({
        status: 'ACTIVE',
        startDate: futureDate,
        proposedDate: null,
      })
    ).toBe(true);

    // 2. Strict ISO future date string in proposedDate -> true
    expect(
      collaborationService.isUpcoming({
        status: 'APPROVED',
        startDate: null,
        proposedDate: '2028-11-15',
      })
    ).toBe(true);

    // 3. Free-text date string -> MUST BE FALSE
    expect(
      collaborationService.isUpcoming({
        status: 'APPROVED',
        startDate: null,
        proposedDate: 'Nov 15–20, 2026',
      })
    ).toBe(false);

    expect(
      collaborationService.isUpcoming({
        status: 'APPROVED',
        startDate: null,
        proposedDate: 'TBD',
      })
    ).toBe(false);

    expect(
      collaborationService.isUpcoming({
        status: 'REQUESTED',
        startDate: null,
        proposedDate: 'Next semester',
      })
    ).toBe(false);

    // 4. Past date -> false
    expect(
      collaborationService.isUpcoming({
        status: 'ACTIVE',
        startDate: pastDate,
        proposedDate: null,
      })
    ).toBe(false);

    // 5. Terminal status with future date -> false
    expect(
      collaborationService.isUpcoming({
        status: 'COMPLETED',
        startDate: futureDate,
        proposedDate: null,
      })
    ).toBe(false);

    expect(
      collaborationService.isUpcoming({
        status: 'REJECTED',
        startDate: futureDate,
        proposedDate: null,
      })
    ).toBe(false);

    expect(
      collaborationService.isUpcoming({
        status: 'CANCELLED',
        startDate: futureDate,
        proposedDate: null,
      })
    ).toBe(false);

    // 6. Undated record -> false
    expect(
      collaborationService.isUpcoming({
        status: 'REQUESTED',
        startDate: null,
        proposedDate: null,
      })
    ).toBe(false);
  });

  // 8. Null institutionId records are excluded
  it('8. Null institutionId records are excluded from institution list and metrics', async () => {
    // The two preserved records have institutionId = null
    const collabsA = await collaborationService.getInstitutionCollaborations(instProfileAId);
    const hasNullRecord = collabsA.some((c) => c.id === PRESERVED_COLLAB_1 || c.id === PRESERVED_COLLAB_2);
    expect(hasNullRecord).toBe(false);

    const metricsA = await collaborationService.getInstitutionCollaborationMetrics(instProfileAId);
    expect(metricsA.totalCollaborations).toBe(3); // only the 3 created for Inst A
  });

  // 9. Partner DTO does not expose PII
  it('9. Partner DTO does not expose PII (recruiter email, phone, passwords)', async () => {
    const partners = await collaborationService.getCollaborationPartners(instProfileAId);
    expect(partners.length).toBeGreaterThanOrEqual(1);

    const testPartner = partners.find((p) => p.industryProfileId === indProfileId);
    expect(testPartner).toBeDefined();
    expect(testPartner!.companyName).toBe(`${FX}NexGen Cloud Labs`);
    expect(testPartner!.website).toBe('https://nexgencloud.example.com');
    expect(testPartner!.industrySector).toBe('Cloud & DevOps');

    // Strict PII audit
    expect((testPartner as any).email).toBeUndefined();
    expect((testPartner as any).phone).toBeUndefined();
    expect((testPartner as any).passwordHash).toBeUndefined();
    expect((testPartner as any).userId).toBeUndefined();
  });

  // 10. Existing Industry collaboration behavior remains compatible
  it('10. Existing Industry collaboration behavior remains compatible', async () => {
    // 1. Industry collaboration list
    const industryCollabs = await collaborationService.getIndustryCollaborations(indProfileId);
    expect(industryCollabs.length).toBe(4);

    // 2. Industry can create a collaboration
    const newCollab = await collaborationService.createCollaboration({
      initiator: {
        userId: userIndId,
        role: 'INDUSTRY',
        industryProfileId: indProfileId,
      },
      data: {
        type: 'WORKSHOP',
        title: `${FX}Industry Initiated Workshop`,
        description: 'Industry offering specialized training for Institution B students.',
        institutionId: instProfileBId,
      },
    });

    expect(newCollab).not.toBeNull();
    expect(newCollab!.initiatedByRole).toBe('INDUSTRY');
    expect(newCollab!.institutionId).toBe(instProfileBId);

    // 3. Industry can send message
    const message = await collaborationService.addCollaborationMessage({
      collaborationId: newCollab!.id,
      senderUserId: userIndId,
      message: 'Hello Institution B, looking forward to partnering!',
    });

    expect(message).toBeDefined();
    expect(message.message).toBe('Hello Institution B, looking forward to partnering!');
    expect(message.senderUser.name).toBe('Tech Recruiter');

    // 4. Industry/Institution can update status
    const updated = await collaborationService.updateCollaborationStatus({
      collaborationId: newCollab!.id,
      userId: userInstBId,
      data: { status: 'APPROVED' },
    });

    expect(updated.status).toBe('APPROVED');
  });

  // 11. Existing preserved collaboration records remain unchanged
  it('11. Existing preserved collaboration records remain unchanged', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: PRESERVED_COLLAB_1 } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: PRESERVED_COLLAB_2 } });

    expect(c1).not.toBeNull();
    expect(c1!.id).toBe(PRESERVED_COLLAB_1);
    expect(c1!.institutionId).toBeNull();
    expect(c1!.status).toBe('APPROVED');
    expect(c1!.title).toBe('Distributed Cloud System Workshop');
    expect(c1!.proposedDate).toBe('Nov 15–20, 2026');

    expect(c2).not.toBeNull();
    expect(c2!.id).toBe(PRESERVED_COLLAB_2);
    expect(c2!.institutionId).toBeNull();
    expect(c2!.status).toBe('REQUESTED');
    expect(c2!.title).toBe('Distributed Cloud System Workshop');
    expect(c2!.proposedDate).toBe('Nov 15–20, 2026');
  });
});
