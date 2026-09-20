import { prisma } from '../server/src/config/prisma.js';

/**
 * Targeted repair script for accounts affected by the Institution Admin registration bug.
 *
 * Usage:
 *   npx tsx scripts/correct-institution-admin-account.ts --email <email> [--dry-run | --repair]
 *   npx tsx scripts/correct-institution-admin-account.ts --id <userId> [--dry-run | --repair]
 *
 * Default mode is --dry-run (inspection and safety check only).
 * --repair must be explicitly passed to apply changes.
 */

async function main() {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email');
  const idIndex = args.indexOf('--id');
  const isRepair = args.includes('--repair');
  const isDryRun = args.includes('--dry-run') || !isRepair;

  const targetEmail = emailIndex !== -1 ? args[emailIndex + 1]?.trim().toLowerCase() : null;
  const targetId = idIndex !== -1 ? args[idIndex + 1]?.trim() : null;

  if (!targetEmail && !targetId) {
    console.error('❌ Error: You must specify an account to inspect/repair using --email <email> or --id <userId>.');
    console.error('Example: npx tsx scripts/correct-institution-admin-account.ts --email admin@university.edu --dry-run');
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`SKILLBRIDGE TARGETED ACCOUNT REPAIR AUDIT`);
  console.log(`Mode: ${isRepair ? '⚠️  REPAIR (WRITES TO DATABASE)' : '🔍 DRY-RUN (INSPECTION ONLY)'}`);
  console.log(`Target: ${targetEmail ? `Email: ${targetEmail}` : `ID: ${targetId}`}`);
  console.log(`============================================================\n`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(targetEmail ? [{ email: { equals: targetEmail, mode: 'insensitive' as const } }] : []),
        ...(targetId ? [{ id: targetId }] : []),
      ],
    },
    include: {
      studentProfile: {
        include: {
          skillScores: true,
          applications: true,
          enrollments: true,
        },
      },
      institutionProfile: true,
      industryProfile: true,
    },
  });

  if (!user) {
    console.error(`❌ User not found matching target.`);
    process.exit(1);
  }

  console.log(`User ID: ${user.id}`);
  console.log(`Email:   ${user.email}`);
  console.log(`Name:    ${user.name}`);
  console.log(`Role:    ${user.role}`);
  console.log(`StudentProfile:     ${user.studentProfile ? 'EXISTS' : 'NONE'}`);
  console.log(`InstitutionProfile: ${user.institutionProfile ? 'EXISTS' : 'NONE'}`);
  console.log(`IndustryProfile:    ${user.industryProfile ? 'EXISTS' : 'NONE'}`);

  // Safety Verification Check 1: Current role
  if (user.role === 'INSTITUTION_ADMIN') {
    console.log(`\nℹ️  Account is already INSTITUTION_ADMIN.`);
    if (!user.institutionProfile) {
      console.log(`⚠️  User is INSTITUTION_ADMIN but lacks InstitutionProfile.`);
      if (isRepair) {
        await prisma.institutionProfile.create({
          data: {
            userId: user.id,
            institutionName: user.name || 'Partner Institution',
            adminDesignation: 'Administrator',
          },
        });
        console.log(`✅ Provisioned missing InstitutionProfile.`);
      } else {
        console.log(`[DRY-RUN] Would create linked InstitutionProfile.`);
      }
    } else {
      console.log(`✅ Account is completely sound. No repair needed.`);
    }
    return;
  }

  if (user.role !== 'STUDENT') {
    console.error(`\n❌ ABORT: Account role is "${user.role}". This script only repairs accounts incorrectly stored as STUDENT.`);
    process.exit(1);
  }

  // Safety Verification Check 2: Verify placeholder student profile created by bug
  const sp = user.studentProfile;
  if (!sp) {
    console.error(`\n❌ ABORT: Account has role STUDENT but has no StudentProfile.`);
    process.exit(1);
  }

  const isBugPlaceholder =
    sp.institution === 'Unspecified University' &&
    sp.targetDomain === 'Full-Stack Web' &&
    sp.cgpa === null &&
    sp.bio === null &&
    sp.resumeUrl === null &&
    !sp.experiencesJson &&
    !sp.educationsJson &&
    !sp.projectsJson &&
    !sp.certificatesJson &&
    !sp.customSkillsJson;

  const hasLegitimateData =
    sp.skillScores.length > 0 ||
    sp.applications.length > 0 ||
    sp.enrollments.length > 0 ||
    !isBugPlaceholder;

  if (hasLegitimateData) {
    console.error(`\n❌ ABORT: This account contains legitimate student information:`);
    if (!isBugPlaceholder) console.error(`  - Profile was customized (Institution: "${sp.institution}", Domain: "${sp.targetDomain}")`);
    if (sp.skillScores.length > 0) console.error(`  - Has ${sp.skillScores.length} skill assessment score(s)`);
    if (sp.applications.length > 0) console.error(`  - Has ${sp.applications.length} submitted job/internship application(s)`);
    if (sp.enrollments.length > 0) console.error(`  - Has ${sp.enrollments.length} course enrollment(s)`);
    console.error(`Refusing to delete legitimate student data.`);
    process.exit(1);
  }

  console.log(`\n✅ Evidence verified: Account matches bug fingerprint:`);
  console.log(`  - Role: STUDENT`);
  console.log(`  - Placeholder institution: "${sp.institution}"`);
  console.log(`  - Placeholder domain: "${sp.targetDomain}"`);
  console.log(`  - Active applications/skills: 0 (no student data)`);

  const instName = user.name || 'Partner Institution';
  const adminDesig = 'Administrator';

  if (isDryRun) {
    console.log(`\n[DRY-RUN SUMMARY OF PROPOSED ACTIONS]`);
    console.log(`1. Update User ${user.id} role: 'STUDENT' -> 'INSTITUTION_ADMIN'`);
    console.log(`2. Create InstitutionProfile: { institutionName: '${instName}', adminDesignation: '${adminDesig}' }`);
    console.log(`3. Safely delete placeholder StudentProfile ${sp.id}`);
    console.log(`\nTo execute this targeted correction, re-run with:`);
    console.log(`npx tsx scripts/correct-institution-admin-account.ts ${targetEmail ? `--email ${targetEmail}` : `--id ${targetId}`} --repair\n`);
    return;
  }

  // Execute safe repair in a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Delete placeholder student profile
    await tx.studentProfile.delete({
      where: { id: sp.id },
    });

    // 2. Update user role
    await tx.user.update({
      where: { id: user.id },
      data: {
        role: 'INSTITUTION_ADMIN',
      },
    });

    // 3. Create institution profile if not exists
    if (!user.institutionProfile) {
      await tx.institutionProfile.create({
        data: {
          userId: user.id,
          institutionName: instName,
          adminDesignation: adminDesig,
        },
      });
    }
  });

  console.log(`\n🎉 SUCCESS: Account ${user.email} successfully repaired:`);
  console.log(`  - Role: INSTITUTION_ADMIN`);
  console.log(`  - Linked InstitutionProfile created`);
  console.log(`  - Placeholder StudentProfile safely removed`);
}

main()
  .catch((err) => {
    console.error('Fatal error during repair:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
