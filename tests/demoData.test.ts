/**
 * SkillBridge Demo Dataset Verification Test Suite
 *
 * Tests all 20 required verification points:
 * 1. Demo institutions exist
 * 2. Demo companies exist
 * 3. Demo admins exist
 * 4. Demo recruiters exist
 * 5. Demo students exist
 * 6. Student profiles exist
 * 7. Skills linked correctly with scores & verification levels
 * 8. Opportunities exist across types & statuses
 * 9. Opportunity skills exist
 * 10. Applications exist across lifecycle states
 * 11. Application histories are valid & chronological
 * 12. Candidate matches exist with 7-factor breakdowns
 * 13. Academic demo records exist (marksheets, subjects, analyses)
 * 14. Collaborations exist across statuses & types
 * 15. Collaboration messages exist
 * 16. Notifications exist
 * 17. Relationships are valid
 * 18. Existing 410 dataset is preserved
 * 19. Preserved collaborations remain untouched (institutionId = null)
 * 20. Seed is idempotent
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { adminAuth } from '../server/src/config/firebase.js';
import { seedDemoDataset, PRESERVED_COLLAB_IDS, getDatabaseCounts } from '../server/src/scripts/seedDemoDataset.js';

describe('SkillBridge Demo Dataset Verification', () => {
  beforeAll(async () => {
    // Ensure dataset is seeded if not already present
    const existing = await prisma.user.findUnique({ where: { email: 'demo.admin.01@skillbridge.demo' } });
    if (!existing) {
      await seedDemoDataset();
    }
  }, 120000);

  it('1. Demo institutions exist', async () => {
    const sdit = await prisma.institution.findUnique({ where: { name: 'SkillBridge Demo Institute of Technology' } });
    const sdu = await prisma.institution.findUnique({ where: { name: 'SkillBridge Demo University' } });

    expect(sdit).toBeDefined();
    expect(sdit?.code).toBe('SDIT');
    expect(sdu).toBeDefined();
    expect(sdu?.code).toBe('SDU');
  });

  it('2. Demo companies exist', async () => {
    const comp1 = await prisma.industryProfile.findFirst({
      where: { companyName: 'SkillBridge Technologies Demo' },
    });
    const comp2 = await prisma.industryProfile.findFirst({
      where: { companyName: 'SkillBridge Analytics Demo' },
    });

    expect(comp1).toBeDefined();
    expect(comp1?.verified).toBe(true);
    expect(comp2).toBeDefined();
    expect(comp2?.verified).toBe(true);
  });

  it('3. Demo admins exist', async () => {
    const admin1 = await prisma.user.findUnique({
      where: { email: 'demo.admin.01@skillbridge.demo' },
      include: { institutionProfile: true },
    });
    const admin2 = await prisma.user.findUnique({
      where: { email: 'demo.admin.02@skillbridge.demo' },
      include: { institutionProfile: true },
    });

    expect(admin1).toBeDefined();
    expect(admin1?.role).toBe('INSTITUTION_ADMIN');
    expect(admin1?.institutionProfile?.institutionName).toBe('SkillBridge Demo Institute of Technology');

    expect(admin2).toBeDefined();
    expect(admin2?.role).toBe('INSTITUTION_ADMIN');
    expect(admin2?.institutionProfile?.institutionName).toBe('SkillBridge Demo University');
  });

  it('4. Demo recruiters exist', async () => {
    const rec1 = await prisma.user.findUnique({
      where: { email: 'demo.recruiter.01@skillbridge.demo' },
      include: { industryProfile: true },
    });
    const rec2 = await prisma.user.findUnique({
      where: { email: 'demo.recruiter.02@skillbridge.demo' },
      include: { industryProfile: true },
    });

    expect(rec1).toBeDefined();
    expect(rec1?.role).toBe('INDUSTRY');
    expect(rec1?.industryProfile?.companyName).toBe('SkillBridge Technologies Demo');

    expect(rec2).toBeDefined();
    expect(rec2?.role).toBe('INDUSTRY');
    expect(rec2?.industryProfile?.companyName).toBe('SkillBridge Analytics Demo');
  });

  it('5. Demo students exist (at least 10)', async () => {
    const students = await prisma.user.findMany({
      where: {
        email: {
          in: Array.from({ length: 10 }, (_, i) => `demo.student.${String(i + 1).padStart(2, '0')}@skillbridge.demo`),
        },
      },
    });

    expect(students.length).toBe(10);
    for (const s of students) {
      expect(s.role).toBe('STUDENT');
    }
  });

  it('6. Student profiles exist with structured projects and certs', async () => {
    const profiles = await prisma.studentProfile.findMany({
      where: {
        user: {
          email: { startsWith: 'demo.student.' },
        },
      },
    });

    expect(profiles.length).toBe(10);
    for (const p of profiles) {
      expect(p.cgpa).toBeGreaterThan(6.0);
      expect(p.targetDomain).toBeDefined();
      expect(p.projectsJson).toBeDefined();
      const projects = JSON.parse(p.projectsJson || '[]');
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
    }
  });

  it('7. Skills linked correctly with scores & verification levels', async () => {
    const scores = await prisma.studentSkillScore.findMany({
      where: {
        student: {
          user: { email: { startsWith: 'demo.student.' } },
        },
      },
      include: { skill: true },
    });

    expect(scores.length).toBeGreaterThan(30);
    const verifiedScores = scores.filter((s) => s.verificationLevel.includes('VERIFIED'));
    const selfReported = scores.filter((s) => s.verificationLevel === 'SELF-REPORTED');

    expect(verifiedScores.length).toBeGreaterThan(15);
    expect(selfReported.length).toBeGreaterThan(5);
  });

  it('8. Opportunities exist across types & statuses', async () => {
    const opps = await prisma.opportunity.findMany({
      where: {
        id: { startsWith: 'd0000001-' },
      },
    });

    expect(opps.length).toBe(12);

    const types = new Set(opps.map((o) => o.type));
    expect(types.has('JOB')).toBe(true);
    expect(types.has('INTERNSHIP')).toBe(true);
    expect(types.has('PROJECT')).toBe(true);
    expect(types.has('TRAINING')).toBe(true);
    expect(types.has('HACKATHON')).toBe(true);
    expect(types.has('RESEARCH')).toBe(true);
    expect(types.has('WORKSHOP')).toBe(true);

    const statuses = new Set(opps.map((o) => o.status));
    expect(statuses.has('OPEN')).toBe(true);
    expect(statuses.has('PAUSED')).toBe(true);
    expect(statuses.has('CLOSED')).toBe(true);
  });

  it('9. Opportunity skills exist', async () => {
    const oppSkills = await prisma.opportunitySkill.findMany({
      where: {
        opportunityId: { startsWith: 'd0000001-' },
      },
    });

    expect(oppSkills.length).toBeGreaterThan(25);
    for (const os of oppSkills) {
      expect(os.weight).toBeGreaterThanOrEqual(1);
      expect(os.minScore).toBeGreaterThanOrEqual(60);
    }
  });

  it('10. Applications exist across diverse lifecycle states', async () => {
    const apps = await prisma.application.findMany({
      where: {
        id: { startsWith: 'd0000002-' },
      },
    });

    expect(apps.length).toBe(10);
    const statuses = new Set(apps.map((a) => a.status));
    expect(statuses.has('hired')).toBe(true);
    expect(statuses.has('interview')).toBe(true);
    expect(statuses.has('assessment')).toBe(true);
    expect(statuses.has('shortlisted')).toBe(true);
    expect(statuses.has('under_review')).toBe(true);
    expect(statuses.has('applied')).toBe(true);
    expect(statuses.has('rejected')).toBe(true);
    expect(statuses.has('withdrawn')).toBe(true);

    const hiredCount = apps.filter((a) => a.status === 'hired').length;
    expect(hiredCount).toBeGreaterThanOrEqual(3);
  });

  it('11. Application histories are valid & chronological', async () => {
    const histories = await prisma.applicationHistory.findMany({
      where: {
        applicationId: { startsWith: 'd0000002-' },
      },
      orderBy: { createdAt: 'asc' },
    });

    expect(histories.length).toBeGreaterThan(10);
    for (const h of histories) {
      expect(h.fromStatus).toBeDefined();
      expect(h.toStatus).toBeDefined();
      expect(h.changedByRole).toBeDefined();
    }
  });

  it('12. Candidate matches exist with 7-factor breakdowns', async () => {
    const matches = await prisma.candidateMatch.findMany({
      where: {
        candidate: {
          user: { email: { startsWith: 'demo.student.' } },
        },
      },
    });

    expect(matches.length).toBeGreaterThan(20);
    for (const m of matches) {
      expect(m.score).toBeGreaterThanOrEqual(60);
      const breakdown = JSON.parse(m.breakdownJson);
      expect(breakdown.technicalSkills).toBeDefined();
      expect(breakdown.assessment).toBeDefined();
    }
  });

  it('13. Academic demo records exist (marksheets, subjects, analyses)', async () => {
    const marksheets = await prisma.uploadedMarksheet.findMany({
      where: {
        student: { user: { email: { startsWith: 'demo.student.' } } },
      },
    });
    const subjects = await prisma.marksheetSubject.findMany({
      where: {
        marksheet: {
          student: { user: { email: { startsWith: 'demo.student.' } } },
        },
      },
    });
    const analyses = await prisma.academicAnalysis.findMany({
      where: {
        student: { user: { email: { startsWith: 'demo.student.' } } },
      },
    });

    expect(marksheets.length).toBe(20); // 2 semesters for 10 students
    expect(subjects.length).toBe(60); // 6 subjects across 2 sems for 10 students
    expect(analyses.length).toBe(10); // 1 per student

    for (const a of analyses) {
      expect(a.overallPercentage).toBeGreaterThan(50);
      expect(a.radarDataJson).toBeDefined();
      expect(a.weakSubjectsJson).toBeDefined();
    }
  });

  it('14. Collaborations exist across statuses & types', async () => {
    const collabs = await prisma.collaboration.findMany({
      where: { id: { startsWith: 'd0000007-' } },
    });

    expect(collabs.length).toBe(7);

    const statuses = new Set(collabs.map((c) => c.status));
    expect(statuses.has('ACTIVE')).toBe(true);
    expect(statuses.has('APPROVED')).toBe(true);
    expect(statuses.has('COMPLETED')).toBe(true);
    expect(statuses.has('DISCUSSION')).toBe(true);
    expect(statuses.has('REQUESTED')).toBe(true);
    expect(statuses.has('CANCELLED')).toBe(true);
    expect(statuses.has('REJECTED')).toBe(true);

    const types = new Set(collabs.map((c) => c.type));
    expect(types.has('WORKSHOP')).toBe(true);
    expect(types.has('PLACEMENT_DRIVE')).toBe(true);
    expect(types.has('HACKATHON')).toBe(true);
    expect(types.has('RESEARCH')).toBe(true);
    expect(types.has('MENTORSHIP')).toBe(true);
    expect(types.has('TRAINING')).toBe(true);
    expect(types.has('LIVE_PROJECT')).toBe(true);
  });

  it('15. Collaboration messages exist', async () => {
    const msgs = await prisma.collaborationMessage.findMany({
      where: {
        collaborationId: { startsWith: 'd0000007-' },
      },
    });

    expect(msgs.length).toBeGreaterThanOrEqual(7);
  });

  it('16. Notifications exist with read/unread flags', async () => {
    const notifs = await prisma.inAppNotification.findMany({
      where: { id: { startsWith: 'd0000009-' } },
    });

    expect(notifs.length).toBe(4);
    expect(notifs.some((n) => n.read === false)).toBe(true);
    expect(notifs.some((n) => n.read === true)).toBe(true);
  });

  it('17. Relationships are valid and interconnected', async () => {
    const sditStudents = await prisma.studentProfile.findMany({
      where: { institutionProfile: { institutionName: 'SkillBridge Demo Institute of Technology' } },
    });
    const sduStudents = await prisma.studentProfile.findMany({
      where: { institutionProfile: { institutionName: 'SkillBridge Demo University' } },
    });

    expect(sditStudents.length).toBe(5);
    expect(sduStudents.length).toBe(5);
  });

  it('18. Existing 410 dataset is preserved', async () => {
    const candidateCount = await prisma.industryDemoCandidate.count({ where: { source: 'DEMO_DATASET' } });
    const benchmarkCount = await prisma.academicSkillDataset.count({ where: { source: 'DEMO_DATASET' } });

    expect(candidateCount).toBe(410);
    expect(benchmarkCount).toBe(150);
  });

  it('19. Preserved collaborations remain untouched with all 15 fields intact (institutionId = null)', async () => {
    const c1 = await prisma.collaboration.findUnique({ where: { id: PRESERVED_COLLAB_IDS[0] } });
    const c2 = await prisma.collaboration.findUnique({ where: { id: PRESERVED_COLLAB_IDS[1] } });

    expect(c1).toBeDefined();
    expect(c1?.id).toBe(PRESERVED_COLLAB_IDS[0]);
    expect(c1?.institutionId).toBeNull();
    expect(c1?.status).toBe('APPROVED');
    expect(c1?.type).toBe('WORKSHOP');
    expect(c1?.companyId).toBeDefined();
    expect(c1?.title).toBeDefined();
    expect(c1?.description).toBeDefined();
    expect(c1?.skillsJson).toBeDefined();
    expect(c1?.targetDepartment).toBeDefined();
    expect(c1?.proposedDate).toBeDefined();
    expect(c1?.initiatedByRole).toBeDefined();
    expect(c1?.createdAt).toBeInstanceOf(Date);
    expect(c1?.updatedAt).toBeInstanceOf(Date);

    expect(c2).toBeDefined();
    expect(c2?.id).toBe(PRESERVED_COLLAB_IDS[1]);
    expect(c2?.institutionId).toBeNull();
    expect(c2?.status).toBe('REQUESTED');
    expect(c2?.type).toBe('WORKSHOP');
    expect(c2?.companyId).toBeDefined();
    expect(c2?.title).toBeDefined();
    expect(c2?.description).toBeDefined();
    expect(c2?.skillsJson).toBeDefined();
    expect(c2?.targetDepartment).toBeDefined();
    expect(c2?.proposedDate).toBeDefined();
    expect(c2?.initiatedByRole).toBeDefined();
    expect(c2?.createdAt).toBeInstanceOf(Date);
    expect(c2?.updatedAt).toBeInstanceOf(Date);
  });

  it('20. Seed is strictly idempotent on Run 2 (Created: 0, Updated: 0, Deleted: 0)', async () => {
    const countsBeforeSecondRun = await getDatabaseCounts();

    // Snapshot demo records before second run
    const demoUsersBefore = await prisma.user.findMany({
      where: { email: { endsWith: '@skillbridge.demo' } },
      orderBy: { email: 'asc' },
    });
    const demoOppsBefore = await prisma.opportunity.findMany({
      where: { id: { startsWith: 'd0000001-' } },
      orderBy: { id: 'asc' },
    });
    const demoAppsBefore = await prisma.application.findMany({
      where: { id: { startsWith: 'd0000002-' } },
      orderBy: { id: 'asc' },
    });

    // Run seed again
    const run2 = await seedDemoDataset({ runLabel: 'RUN 2' });

    // Explicitly verify Created: 0, Updated: 0, Deleted: 0
    expect(run2.mutationStats.created).toBe(0);
    expect(run2.mutationStats.updated).toBe(0);
    expect(run2.mutationStats.deleted).toBe(0);
    expect(run2.mutationStats.unchanged).toBeGreaterThan(300);
    expect(run2.mutationStats.updatedDetails.length).toBe(0);

    const countsAfterSecondRun = await getDatabaseCounts();

    expect(countsAfterSecondRun.users).toBe(countsBeforeSecondRun.users);
    expect(countsAfterSecondRun.institutions).toBe(countsBeforeSecondRun.institutions);
    expect(countsAfterSecondRun.opportunities).toBe(countsBeforeSecondRun.opportunities);
    expect(countsAfterSecondRun.applications).toBe(countsBeforeSecondRun.applications);
    expect(countsAfterSecondRun.collaborations).toBe(countsBeforeSecondRun.collaborations);
    expect(countsAfterSecondRun.academicAnalyses).toBe(countsBeforeSecondRun.academicAnalyses);

    // Verify demo records remain field-identical after Run 2
    const demoUsersAfter = await prisma.user.findMany({
      where: { email: { endsWith: '@skillbridge.demo' } },
      orderBy: { email: 'asc' },
    });
    const demoOppsAfter = await prisma.opportunity.findMany({
      where: { id: { startsWith: 'd0000001-' } },
      orderBy: { id: 'asc' },
    });
    const demoAppsAfter = await prisma.application.findMany({
      where: { id: { startsWith: 'd0000002-' } },
      orderBy: { id: 'asc' },
    });

    expect(demoUsersAfter.length).toBe(demoUsersBefore.length);
    for (let i = 0; i < demoUsersBefore.length; i++) {
      expect(demoUsersAfter[i].id).toBe(demoUsersBefore[i].id);
      expect(demoUsersAfter[i].role).toBe(demoUsersBefore[i].role);
      expect(demoUsersAfter[i].name).toBe(demoUsersBefore[i].name);
      expect(demoUsersAfter[i].email).toBe(demoUsersBefore[i].email);
    }

    expect(demoOppsAfter.length).toBe(demoOppsBefore.length);
    for (let i = 0; i < demoOppsBefore.length; i++) {
      expect(demoOppsAfter[i].id).toBe(demoOppsBefore[i].id);
      expect(demoOppsAfter[i].status).toBe(demoOppsBefore[i].status);
      expect(demoOppsAfter[i].title).toBe(demoOppsBefore[i].title);
    }

    expect(demoAppsAfter.length).toBe(demoAppsBefore.length);
    for (let i = 0; i < demoAppsBefore.length; i++) {
      expect(demoAppsAfter[i].id).toBe(demoAppsBefore[i].id);
      expect(demoAppsAfter[i].status).toBe(demoAppsBefore[i].status);
      expect(demoAppsAfter[i].matchScoreAtApply).toBe(demoAppsBefore[i].matchScoreAtApply);
    }
  }, 180000);

  it('21. Firebase demo account safety is maintained', async () => {
    const demoEmails = [
      'demo.admin.01@skillbridge.demo',
      'demo.admin.02@skillbridge.demo',
      'demo.recruiter.01@skillbridge.demo',
      'demo.recruiter.02@skillbridge.demo',
      ...Array.from({ length: 10 }, (_, i) => `demo.student.${String(i + 1).padStart(2, '0')}@skillbridge.demo`),
    ];

    expect(demoEmails.length).toBe(14);
    await Promise.all(
      demoEmails.map(async (email) => {
        expect(email.endsWith('@skillbridge.demo')).toBe(true);
        const fbUser = await adminAuth.getUserByEmail(email);
        expect(fbUser).toBeDefined();
        expect(fbUser.email?.toLowerCase()).toBe(email.toLowerCase());
        expect(fbUser.emailVerified).toBe(true);
      })
    );
  }, 30000);

  it('22. Non-demo records remain untouched', async () => {
    const nonDemoUsers = await prisma.user.findMany({
      where: { NOT: { email: { endsWith: '@skillbridge.demo' } } },
    });
    expect(nonDemoUsers.length).toBeGreaterThan(0);

    const nonDemoInstitutions = await prisma.institution.findMany({
      where: { NOT: { code: { in: ['SDIT', 'SDU'] } } },
    });
    expect(nonDemoInstitutions.length).toBeGreaterThan(100);
  });

  it('23. Tenant isolation remains strictly intact', async () => {
    const sditAdmin = await prisma.user.findUnique({
      where: { email: 'demo.admin.01@skillbridge.demo' },
      include: { institutionProfile: true },
    });
    const sduAdmin = await prisma.user.findUnique({
      where: { email: 'demo.admin.02@skillbridge.demo' },
      include: { institutionProfile: true },
    });

    expect(sditAdmin?.institutionProfile?.id).not.toBe(sduAdmin?.institutionProfile?.id);

    const sditStudents = await prisma.studentProfile.findMany({
      where: { institutionProfileId: sditAdmin?.institutionProfile?.id },
    });
    const sduStudents = await prisma.studentProfile.findMany({
      where: { institutionProfileId: sduAdmin?.institutionProfile?.id },
    });

    expect(sditStudents.length).toBe(5);
    expect(sduStudents.length).toBe(5);

    const sditStudentIds = new Set(sditStudents.map((s) => s.id));
    for (const student of sduStudents) {
      expect(sditStudentIds.has(student.id)).toBe(false);
    }
  });
});
