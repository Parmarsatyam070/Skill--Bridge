/**
 * SkillBridge Surgical Demo Dataset Cleaner
 *
 * Safety Invariants:
 * 1. ONLY deletes records created by the demo seed script (matching exact deterministic IDs and demo emails).
 * 2. NEVER deletes or modifies real user accounts or non-demo data.
 * 3. NEVER touches the 410-record DEMO_DATASET in academicSkillDataset or industryDemoCandidate.
 * 4. PERMANENTLY PROTECTS collaborations 53c9f6da-06b3-4416-bc9d-ba41364589be & 1df54254-c05f-499b-833d-b27bb7461a06.
 */

import { prisma } from '../config/prisma.js';
import { adminAuth } from '../config/firebase.js';
import { PRESERVED_COLLAB_IDS, getPreservedCollaborationsSnapshot } from './seedDemoDataset.js';

export const EXACT_DEMO_EMAILS = [
  'demo.admin.01@skillbridge.demo',
  'demo.admin.02@skillbridge.demo',
  'demo.recruiter.01@skillbridge.demo',
  'demo.recruiter.02@skillbridge.demo',
  'demo.student.01@skillbridge.demo',
  'demo.student.02@skillbridge.demo',
  'demo.student.03@skillbridge.demo',
  'demo.student.04@skillbridge.demo',
  'demo.student.05@skillbridge.demo',
  'demo.student.06@skillbridge.demo',
  'demo.student.07@skillbridge.demo',
  'demo.student.08@skillbridge.demo',
  'demo.student.09@skillbridge.demo',
  'demo.student.10@skillbridge.demo',
];

export async function cleanDemoDataset() {
  console.log('\n======================================================');
  console.log('   SKILLBRIDGE CONSERVATIVE DEMO DATASET CLEANER     ');
  console.log('======================================================\n');

  // 1. Verify preserved records exist and are intact before proceeding
  const preservedBefore = await getPreservedCollaborationsSnapshot();
  if (preservedBefore.length !== 2) {
    throw new Error(`CRITICAL INVARIANT VIOLATION: Preserved collaborations not found before cleanup!`);
  }

  // 2. Find exact demo users
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: EXACT_DEMO_EMAILS } },
    select: { id: true, email: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);
  console.log(`Found ${demoUsers.length} verified demo users to clean.`);

  // 3. Delete deterministic demo notifications
  const deletedNotifications = await prisma.inAppNotification.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'd0000009-' } },
        { userId: { in: demoUserIds } },
      ],
    },
  });
  console.log(`🗑️ Deleted ${deletedNotifications.count} demo notifications.`);

  // 4. Delete demo collaborations (strictly excluding preserved IDs)
  const deletedCollabMessages = await prisma.collaborationMessage.deleteMany({
    where: {
      collaboration: {
        id: { startsWith: 'd0000007-' },
        NOT: { id: { in: PRESERVED_COLLAB_IDS } },
      },
    },
  });
  console.log(`🗑️ Deleted ${deletedCollabMessages.count} demo collaboration messages.`);

  const deletedCollabs = await prisma.collaboration.deleteMany({
    where: {
      id: { startsWith: 'd0000007-' },
      NOT: { id: { in: PRESERVED_COLLAB_IDS } },
    },
  });
  console.log(`🗑️ Deleted ${deletedCollabs.count} demo collaborations.`);

  // 5. Delete recruiter / admin notes, tags, filters, recommendations
  const deletedNotes = await prisma.candidateNote.deleteMany({
    where: { id: { startsWith: 'd0000005-' } },
  });
  const deletedTags = await prisma.candidateTag.deleteMany({
    where: {
      institution: {
        user: { email: { in: EXACT_DEMO_EMAILS } },
      },
    },
  });
  const deletedFilters = await prisma.savedCandidateFilter.deleteMany({
    where: { id: { startsWith: 'd0000004-' } },
  });
  const deletedRecs = await prisma.candidateRecommendation.deleteMany({
    where: {
      institution: {
        user: { email: { in: EXACT_DEMO_EMAILS } },
      },
    },
  });
  console.log(`🗑️ Deleted notes (${deletedNotes.count}), tags (${deletedTags.count}), filters (${deletedFilters.count}), recommendations (${deletedRecs.count}).`);

  // 6. Delete demo candidate matches
  const deletedMatches = await prisma.candidateMatch.deleteMany({
    where: {
      candidate: {
        user: { email: { in: EXACT_DEMO_EMAILS } },
      },
    },
  });
  console.log(`🗑️ Deleted ${deletedMatches.count} demo candidate matches.`);

  // 7. Delete demo application histories and applications
  const deletedAppHistories = await prisma.applicationHistory.deleteMany({
    where: {
      id: { startsWith: 'd0000003-' },
    },
  });
  const deletedApps = await prisma.application.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'd0000002-' } },
        { student: { user: { email: { in: EXACT_DEMO_EMAILS } } } },
      ],
    },
  });
  console.log(`🗑️ Deleted application histories (${deletedAppHistories.count}) and applications (${deletedApps.count}).`);

  // 8. Delete demo opportunities and opportunity skills
  const deletedOppSkills = await prisma.opportunitySkill.deleteMany({
    where: {
      opportunity: { id: { startsWith: 'd0000001-' } },
    },
  });
  const deletedOpps = await prisma.opportunity.deleteMany({
    where: { id: { startsWith: 'd0000001-' } },
  });
  console.log(`🗑️ Deleted opportunity skills (${deletedOppSkills.count}) and opportunities (${deletedOpps.count}).`);

  // 9. Delete academic records for demo students
  const demoStudentProfiles = await prisma.studentProfile.findMany({
    where: { user: { email: { in: EXACT_DEMO_EMAILS } } },
    select: { id: true },
  });
  const demoStudentProfileIds = demoStudentProfiles.map((p) => p.id);

  const deletedAnalysis = await prisma.academicAnalysis.deleteMany({
    where: { studentProfileId: { in: demoStudentProfileIds } },
  });
  const deletedSubjects = await prisma.marksheetSubject.deleteMany({
    where: { marksheet: { studentProfileId: { in: demoStudentProfileIds } } },
  });
  const deletedMarksheets = await prisma.uploadedMarksheet.deleteMany({
    where: { studentProfileId: { in: demoStudentProfileIds } },
  });
  const deletedScores = await prisma.studentSkillScore.deleteMany({
    where: { studentId: { in: demoStudentProfileIds } },
  });
  console.log(`🗑️ Deleted academic analyses (${deletedAnalysis.count}), subjects (${deletedSubjects.count}), marksheets (${deletedMarksheets.count}), skill scores (${deletedScores.count}).`);

  // 10. Delete demo users (Cascades to StudentProfile, IndustryProfile, InstitutionProfile)
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: EXACT_DEMO_EMAILS } },
  });
  console.log(`🗑️ Deleted ${deletedUsers.count} verified demo users.`);

  // 11. Delete demo institutions
  const deletedInsts = await prisma.institution.deleteMany({
    where: {
      code: { in: ['SDIT', 'SDU'] },
      name: { in: ['SkillBridge Demo Institute of Technology', 'SkillBridge Demo University'] },
    },
  });
  console.log(`🗑️ Deleted ${deletedInsts.count} demo institutions.`);

  // 12. Optional Firebase Auth cleanup for exact demo emails
  for (const email of EXACT_DEMO_EMAILS) {
    try {
      const fbUser = await adminAuth.getUserByEmail(email).catch(() => null);
      if (fbUser) {
        await adminAuth.deleteUser(fbUser.uid);
      }
    } catch {
      // Non-blocking
    }
  }

  // 13. Re-verify preserved collaborations after cleanup
  const preservedAfter = await getPreservedCollaborationsSnapshot();
  if (preservedAfter.length !== 2) {
    throw new Error(`CRITICAL POST-CLEANUP FAILURE: Preserved collaborations count changed!`);
  }
  for (const c of preservedAfter) {
    if (c.institutionId !== null) {
      throw new Error(`CRITICAL POST-CLEANUP FAILURE: Preserved collaboration ${c.id} institutionId became non-null!`);
    }
  }
  console.log('🔒 Verified both preserved collaborations remain 100% UNTOUCHED (institutionId = null)!');

  console.log('\n✅ [CLEANUP COMPLETE] Demo dataset safely and surgically removed.\n');
}

// Direct CLI execution
if (process.argv[1]?.endsWith('cleanDemoDataset.ts') || process.argv[1]?.endsWith('cleanDemoDataset.js')) {
  cleanDemoDataset()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Demo Dataset Cleanup Error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
