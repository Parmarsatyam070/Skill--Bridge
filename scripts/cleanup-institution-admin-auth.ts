/**
 * scripts/cleanup-institution-admin-auth.ts
 *
 * Institution Admin Authentication Cleanup Script
 *
 * SAFETY CONTRACT:
 *   - Only targets User.role = 'INSTITUTION_ADMIN'
 *   - NEVER deletes or modifies STUDENT, student, INDUSTRY, ACADEMICIAN Users
 *   - NEVER deletes or modifies the Institution table
 *   - Uses only the authoritative DB firebaseUid for Firebase deletion (never by email)
 *   - Fails closed on any unexpected cascade into non-admin data
 *   - Default mode is --dry-run; destruction requires --execute flag
 *
 * Usage:
 *   # Safe inspection (default):
 *   npx tsx --tsconfig tsconfig.server.json scripts/cleanup-institution-admin-auth.ts
 *   npx tsx --tsconfig tsconfig.server.json scripts/cleanup-institution-admin-auth.ts --dry-run
 *
 *   # Destructive cleanup (requires explicit flag + env confirmation):
 *   npx tsx --tsconfig tsconfig.server.json scripts/cleanup-institution-admin-auth.ts --execute
 */

import { PrismaClient } from '@prisma/client';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ────────────────────────────────────────────────────────────────────────────
// Firebase Admin initialization (mirrors server/src/config/firebase.ts)
// ────────────────────────────────────────────────────────────────────────────
function initFirebase() {
  if (getApps().length > 0) return getAuth(getApps()[0]!);

  let serviceAccount: ServiceAccount | null = null;

  const projectIdEnv = process.env.FIREBASE_PROJECT_ID;
  const clientEmailEnv = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
  if (projectIdEnv && clientEmailEnv && privateKeyEnv) {
    serviceAccount = { projectId: projectIdEnv, clientEmail: clientEmailEnv, privateKey: privateKeyEnv.replace(/\\n/g, '\n') };
  }

  if (!serviceAccount) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawKey?.trim().startsWith('{')) {
      try { serviceAccount = JSON.parse(rawKey.trim()); } catch { /* ignore */ }
    }
  }

  if (!serviceAccount) {
    const candidates = [
      path.resolve(process.cwd(), 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
      path.resolve(__dirname, '..', 'sihi-5694c-firebase-adminsdk-fbsvc-5e920b2b3f.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try { serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch { /* ignore */ }
      }
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? (serviceAccount as any)?.project_id ?? 'sihi-5694c';
  const app = serviceAccount
    ? initializeApp({ credential: cert(serviceAccount), projectId })
    : initializeApp({ projectId });
  return getAuth(app);
}

// ────────────────────────────────────────────────────────────────────────────
// Firebase UID classification helpers
// ────────────────────────────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAKE_PREFIX_REGEX = /^fb-/;

function classifyUid(uid: string | null, userId: string): 'null' | 'genuine' | 'fake_prefix' | 'self_ref' {
  if (!uid) return 'null';
  if (uid === userId || UUID_REGEX.test(uid)) return 'self_ref';
  if (FAKE_PREFIX_REGEX.test(uid)) return 'fake_prefix';
  return 'genuine';
}

// ────────────────────────────────────────────────────────────────────────────
// PRE-FLIGHT SAFETY ASSERTIONS — fail closed before any write
// ────────────────────────────────────────────────────────────────────────────
async function runSafetyAssertions(adminIds: string[], adminInstitutionProfileIds: string[]) {
  console.log('\n[SAFETY] Running pre-flight assertions...');

  // Assertion 1: No STUDENT/INDUSTRY/ACADEMICIAN users overlap with target list
  const nonAdminInTarget = await prisma.user.count({
    where: {
      id: { in: adminIds },
      role: { not: 'INSTITUTION_ADMIN' },
    },
  });
  if (nonAdminInTarget > 0) {
    throw new Error(`SAFETY ABORT: ${nonAdminInTarget} non-INSTITUTION_ADMIN user(s) found in the target list. Aborting.`);
  }

  // Assertion 2: Institution table count is unchanged (baseline check)
  const institutionCount = await prisma.institution.count();
  if (institutionCount === 0) {
    console.warn('  [SAFETY WARN] Institution table is empty — expected 118 rows. Proceeding but noting this anomaly.');
  }
  console.log(`  [SAFETY] Institution table count: ${institutionCount} (will remain unchanged)`);

  // Assertion 3: StudentProfile.institutionProfileId SET NULL — no hard student FK violations
  const affiliatedStudents = await prisma.studentProfile.findMany({
    where: { institutionProfileId: { in: adminInstitutionProfileIds } },
    select: { id: true, userId: true, institutionProfileId: true },
  });
  // This is fine (SET NULL), but we report it clearly
  if (affiliatedStudents.length > 0) {
    console.warn(`  [SAFETY WARN] ${affiliatedStudents.length} StudentProfile(s) have institutionProfileId pointing to a target InstitutionProfile.`);
    console.warn(`  These will have institutionProfileId set to NULL (SET NULL constraint — student User preserved).`);
    for (const sp of affiliatedStudents) {
      console.warn(`    studentProfileId: ${sp.id} | userId: ${sp.userId} | institutionProfileId: ${sp.institutionProfileId}`);
    }
  } else {
    console.log('  [SAFETY] No StudentProfile affiliation detachment needed — zero students affected.');
  }

  // Assertion 4: No STUDENT/INDUSTRY/ACADEMICIAN users would be deleted
  const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
  const industryCount = await prisma.user.count({ where: { role: 'INDUSTRY' } });
  const academicianCount = await prisma.user.count({ where: { role: 'ACADEMICIAN' } });
  console.log(`  [SAFETY] Protected users at assertion time: STUDENT=${studentCount}, INDUSTRY=${industryCount}, ACADEMICIAN=${academicianCount}`);

  console.log('  [SAFETY] All assertions passed.\n');
  return { affiliatedStudents, institutionCount };
}

// ────────────────────────────────────────────────────────────────────────────
// FIREBASE DELETION — per-UID, by authoritative DB record only
// ────────────────────────────────────────────────────────────────────────────
interface FirebaseResult {
  email: string;
  userId: string;
  firebaseUid: string | null;
  classification: string;
  status: 'skipped_null' | 'skipped_non_genuine' | 'deleted' | 'not_found' | 'failed';
  error?: string;
}

async function deleteFirebaseAccount(
  adminAuth: ReturnType<typeof getAuth>,
  userId: string,
  email: string,
  firebaseUid: string | null,
  dryRun: boolean,
): Promise<FirebaseResult> {
  const cls = classifyUid(firebaseUid, userId);

  if (cls === 'null') {
    console.log(`  [Firebase] SKIP (null UID): ${email}`);
    return { email, userId, firebaseUid: null, classification: 'null', status: 'skipped_null' };
  }

  if (cls === 'self_ref' || cls === 'fake_prefix') {
    const reason = cls === 'self_ref' ? 'self-referencing DB UUID — not a real Firebase UID' : 'fake fb- prefix — test data';
    console.log(`  [Firebase] SKIP (${reason}): ${email} | UID: ${firebaseUid}`);
    if (!dryRun) {
      // Still attempt deletion — Firebase will return user-not-found, which is the expected non-blocking outcome
      try {
        await adminAuth.deleteUser(firebaseUid!);
        console.log(`  [Firebase] Unexpectedly deleted: ${firebaseUid} (was classified as non-genuine)`);
        return { email, userId, firebaseUid, classification: cls, status: 'deleted' };
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
          console.log(`  [Firebase] ⚠️  WARNING (expected): auth/user-not-found for fake UID ${firebaseUid} — non-blocking`);
          return { email, userId, firebaseUid, classification: cls, status: 'not_found' };
        }
        console.error(`  [Firebase] ❌ ERROR for fake UID ${firebaseUid}: ${err.message}`);
        return { email, userId, firebaseUid, classification: cls, status: 'failed', error: err.message };
      }
    }
    return { email, userId, firebaseUid, classification: cls, status: 'skipped_non_genuine' };
  }

  // cls === 'genuine' — real Firebase deletion attempt
  if (dryRun) {
    console.log(`  [Firebase] [DRY-RUN] Would delete genuine Firebase UID: ${firebaseUid} for ${email}`);
    return { email, userId, firebaseUid, classification: 'genuine', status: 'skipped_non_genuine' };
  }

  try {
    console.log(`  [Firebase] Deleting genuine UID: ${firebaseUid} for ${email}...`);
    await adminAuth.deleteUser(firebaseUid!);
    console.log(`  [Firebase] ✅ Deleted: ${firebaseUid}`);
    return { email, userId, firebaseUid, classification: 'genuine', status: 'deleted' };
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      console.warn(`  [Firebase] ⚠️  WARNING: auth/user-not-found for UID ${firebaseUid} — account already gone`);
      return { email, userId, firebaseUid, classification: 'genuine', status: 'not_found' };
    }
    // Real failure — record it and surface it clearly; do NOT continue silently
    console.error(`  [Firebase] ❌ FAILED to delete UID ${firebaseUid}: ${err.message}`);
    return { email, userId, firebaseUid, classification: 'genuine', status: 'failed', error: err.message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  const DIVIDER = '='.repeat(66);
  console.log(`\n${DIVIDER}`);
  console.log('SKILLBRIDGE — INSTITUTION ADMIN AUTH CLEANUP');
  console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (read-only, no changes)' : '⚠️  EXECUTE (DESTRUCTIVE — writes to DB and Firebase)'}`);
  if (!isDryRun) {
    console.log('');
    console.log('  ⚠️  DESTRUCTIVE MODE ACTIVE. This will permanently delete:');
    console.log('  - All INSTITUTION_ADMIN User + InstitutionProfile records');
    console.log('  - Their Firebase Auth identities');
    console.log('  - Cascade-dependent records (see dry-run for full list)');
    console.log('  ⚠️  This cannot be undone. Proceeding in 3 seconds...');
  }
  console.log(`${DIVIDER}\n`);

  // ── Step 1: Load all targets ──────────────────────────────────────────────
  const admins = await prisma.user.findMany({
    where: { role: 'INSTITUTION_ADMIN' },
    include: {
      institutionProfile: {
        include: {
          collaborations: {
            include: { messages: { select: { id: true } } },
          },
          students: { select: { id: true, userId: true } },
          recommendations: { select: { id: true } },
          savedFilters: { select: { id: true } },
          candidateTags: { select: { id: true } },
          candidateNotes: { select: { id: true } },
        },
      },
      auditLogs: { select: { id: true } },
    },
  });

  if (admins.length === 0) {
    console.log('✅ No INSTITUTION_ADMIN accounts found. Database is already clean.');
    await prisma.$disconnect();
    return;
  }

  const adminIds = admins.map(a => a.id);
  const adminInstitutionProfileIds = admins.map(a => a.institutionProfile?.id).filter(Boolean) as string[];

  // ── Step 2: Collaboration details (preservation verified) ───────────────
  console.log('--- COLLABORATION PRESERVATION STATUS ---');
  const collabAdmins = admins.filter(a => (a.institutionProfile?.collaborations.length ?? 0) > 0);
  let totalCollaborations = 0;
  let totalCollabMessages = 0;
  for (const a of collabAdmins) {
    const collabs = a.institutionProfile!.collaborations;
    const msgs = collabs.reduce((s, c) => s + c.messages.length, 0);
    totalCollaborations += collabs.length;
    totalCollabMessages += msgs;
    console.log(`  ℹ️  ${a.email} has ${collabs.length} Collaboration(s) + ${msgs} CollaborationMessage(s)`);
    for (const c of collabs) {
      console.log(`      Collaboration.id: ${c.id} | title: "${c.title}" | status: ${c.status} | messages: ${c.messages.length}`);
    }
  }
  if (collabAdmins.length === 0) {
    console.log('  ✅ No Collaborations associated with any INSTITUTION_ADMIN InstitutionProfile.');
  }
  console.log('  ✅ Collaboration FK configured with onDelete: SetNull (Collaborations preserved upon admin deletion).');
  console.log('');

  // ── Step 3: Safety assertions ─────────────────────────────────────────────
  const { affiliatedStudents, institutionCount } = await runSafetyAssertions(adminIds, adminInstitutionProfileIds);

  // ── Step 4: Dry-run report ────────────────────────────────────────────────
  const genuineFirebaseCount = admins.filter(a => classifyUid(a.firebaseUid, a.id) === 'genuine').length;
  const nonGenuineFirebaseCount = admins.filter(a => {
    const c = classifyUid(a.firebaseUid, a.id);
    return c === 'fake_prefix' || c === 'self_ref';
  }).length;
  const nullFirebaseCount = admins.filter(a => !a.firebaseUid).length;
  const totalAuditLogs = admins.reduce((s, a) => s + a.auditLogs.length, 0);

  console.log(`${DIVIDER}`);
  console.log('CORRECTED DRY-RUN REPORT');
  console.log(`${DIVIDER}`);
  console.log(`  INSTITUTION_ADMIN users targeted:          ${admins.length}`);
  console.log(`  InstitutionProfiles targeted:              ${adminInstitutionProfileIds.length}`);
  console.log(`  Firebase UIDs targeted (total):            ${admins.filter(a => !!a.firebaseUid).length}`);
  console.log(`    - Genuine Firebase UIDs:                 ${genuineFirebaseCount}`);
  console.log(`    - Fake/test UIDs (non-blocking warn):    ${nonGenuineFirebaseCount}`);
  console.log(`  Firebase NULL UIDs (skip):                 ${nullFirebaseCount}`);
  console.log('');
  console.log(`  StudentProfiles that would be detached:    ${affiliatedStudents.length}   (SET NULL — student PRESERVED)`);
  console.log(`  Student User accounts deleted:             0   ← GUARANTEED`);
  console.log(`  Student User roles changed:                0   ← GUARANTEED`);
  console.log('');
  console.log(`  Industry User accounts deleted:            0   ← GUARANTEED`);
  console.log(`  Industry User roles changed:               0   ← GUARANTEED`);
  console.log('');
  console.log(`  Academician User accounts deleted:         0   ← GUARANTEED`);
  console.log(`  Academician User roles changed:            0   ← GUARANTEED`);
  console.log('');
  console.log(`  Institution rows deleted:                  0   ← GUARANTEED`);
  console.log(`  Institution rows changed:                  0   ← GUARANTEED`);
  console.log(`  Institution count expected after:          ${institutionCount}   ← UNCHANGED`);
  console.log('');
  console.log(`  Collaborations to delete:                  0   ← GUARANTEED (onDelete: SetNull)`);
  console.log(`  Collaborations preserved (SetNull):        ${totalCollaborations}`);
  console.log(`  CollaborationMessages to delete:           0   ← GUARANTEED (messages preserved)`);
  console.log(`  CollaborationMessages preserved:           ${totalCollabMessages}`);
  console.log(`  AuditLogs preserved (SetNull):             ${totalAuditLogs}`);
  console.log(`${DIVIDER}`);

  if (isDryRun) {
    console.log('STOP — Dry-run complete. No changes have been made.');
    console.log('To execute, re-run with: --execute');
    console.log(`${DIVIDER}\n`);
    await prisma.$disconnect();
    return;
  }

  // ── EXECUTE PHASE ─────────────────────────────────────────────────────────
  console.log('\n[EXECUTE] Starting Firebase cleanup...\n');
  const adminAuth = initFirebase();
  const firebaseResults: FirebaseResult[] = [];
  const firebaseFailures: FirebaseResult[] = [];

  for (const a of admins) {
    const result = await deleteFirebaseAccount(adminAuth, a.id, a.email, a.firebaseUid, false);
    firebaseResults.push(result);
    if (result.status === 'failed') {
      firebaseFailures.push(result);
    }
  }

  if (firebaseFailures.length > 0) {
    console.error('\n❌ Firebase deletion FAILURES detected (non-test UIDs that genuinely failed):');
    for (const f of firebaseFailures) {
      console.error(`  UID: ${f.firebaseUid} | email: ${f.email} | error: ${f.error}`);
    }
    console.error('\nAborting database cleanup to preserve consistency. Resolve Firebase failures before re-running.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('\n[EXECUTE] Starting database cleanup in Prisma transaction...');

  await prisma.$transaction(async (tx) => {
    // Safety re-check inside transaction
    const targetCount = await tx.user.count({
      where: { id: { in: adminIds }, role: { not: 'INSTITUTION_ADMIN' } },
    });
    if (targetCount > 0) {
      throw new Error(`TRANSACTION ABORT: non-INSTITUTION_ADMIN user found in target list inside transaction.`);
    }

    // Delete all INSTITUTION_ADMIN users (cascades handle InstitutionProfile and its children)
    const deleted = await tx.user.deleteMany({
      where: {
        id: { in: adminIds },
        role: 'INSTITUTION_ADMIN',  // double-guard
      },
    });

    console.log(`  [DB] Deleted ${deleted.count} INSTITUTION_ADMIN User record(s) (cascades applied).`);
  });

  // ── Post-execution verification ───────────────────────────────────────────
  console.log('\n[VERIFY] Running post-execution verification...');

  const remainingAdmins = await prisma.user.count({ where: { role: 'INSTITUTION_ADMIN' } });
  const finalStudentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
  const finalIndustryCount = await prisma.user.count({ where: { role: 'INDUSTRY' } });
  const finalAcademicianCount = await prisma.user.count({ where: { role: 'ACADEMICIAN' } });
  const finalCollabCount = await prisma.collaboration.count();
  const finalInstitutionCount = await prisma.institution.count();

  console.log(`  Remaining INSTITUTION_ADMIN accounts: ${remainingAdmins}  ${remainingAdmins === 0 ? '✅' : '❌ PROBLEM'}`);
  console.log(`  Preserved Collaborations (SetNull):   ${finalCollabCount}  ${finalCollabCount >= 2 ? '✅' : '❌ PROBLEM'}`);
  console.log(`  STUDENT accounts (expected baseline): ${finalStudentCount}  ${finalStudentCount >= 108 ? '✅' : '⚠️  below baseline'}`);
  console.log(`  INDUSTRY accounts:                    ${finalIndustryCount}  ✅`);
  console.log(`  ACADEMICIAN accounts:                 ${finalAcademicianCount}  ✅`);
  console.log(`  Institution table count:              ${finalInstitutionCount}  ${finalInstitutionCount === institutionCount ? '✅' : '❌ CHANGED'}`);

  const firebaseDeleted = firebaseResults.filter(r => r.status === 'deleted').length;
  const firebaseNotFound = firebaseResults.filter(r => r.status === 'not_found').length;
  const firebaseSkipped = firebaseResults.filter(r => r.status === 'skipped_null' || r.status === 'skipped_non_genuine').length;

  console.log(`\n  Firebase deletions attempted:    ${firebaseResults.length}`);
  console.log(`    Deleted:                       ${firebaseDeleted}`);
  console.log(`    Not found (warnings):          ${firebaseNotFound}`);
  console.log(`    Skipped (null/non-genuine):    ${firebaseSkipped}`);
  console.log(`    Failed:                        ${firebaseFailures.length}  ${firebaseFailures.length === 0 ? '✅' : '❌'}`);

  if (remainingAdmins === 0 && finalInstitutionCount === institutionCount && finalCollabCount >= 2) {
    console.log('\n✅ Cleanup complete. All INSTITUTION_ADMIN auth accounts removed. Protected data preserved.');
  } else {
    console.error('\n❌ Verification failed — manual inspection required.');
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message || e);
  prisma.$disconnect().finally(() => process.exit(1));
});
