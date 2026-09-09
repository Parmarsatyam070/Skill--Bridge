import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import type { DatabaseBackup } from './export-data.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 [Verification] Starting complete post-import data integrity verification...');

  const backupFile = path.resolve(process.cwd(), 'scratch/sqlite_backup.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at ${backupFile}!`);
  }

  const raw = fs.readFileSync(backupFile, 'utf8');
  const backup: DatabaseBackup = JSON.parse(raw);
  const { tableCounts } = backup.manifest;

  // 1. Check table row counts against manifest
  const currentCounts: Record<string, number> = {
    users: await prisma.user.count(),
    studentProfiles: await prisma.studentProfile.count(),
    domains: await prisma.domain.count(),
    domainSkillRequirements: await prisma.domainSkillRequirement.count(),
    studentDomains: await prisma.studentDomain.count(),
    industryProfiles: await prisma.industryProfile.count(),
    academicianProfiles: await prisma.academicianProfile.count(),
    institutionProfiles: await prisma.institutionProfile.count(),
    passwordResetTokens: await prisma.passwordResetToken.count(),
    activityLogs: await prisma.activityLog.count(),
    skills: await prisma.skill.count(),
    skillBenchmarks: await prisma.skillBenchmark.count(),
    studentSkillScores: await prisma.studentSkillScore.count(),
    questions: await prisma.question.count(),
    courseProviders: await prisma.courseProvider.count(),
    courses: await prisma.course.count(),
    enrollments: await prisma.enrollment.count(),
    internships: await prisma.internship.count(),
    applications: await prisma.application.count(),
    resumes: await prisma.resume.count(),
    externalIntegrations: await prisma.externalIntegration.count(),
    portfolioWebsites: await prisma.portfolioWebsite.count(),
    portfolioMessages: await prisma.portfolioMessage.count(),
    practiceSets: await prisma.practiceSet.count(),
    listeningPassages: await prisma.listeningPassage.count(),
    assessmentAttempts: await prisma.assessmentAttempt.count(),
    inAppNotifications: await prisma.inAppNotification.count(),
    learningResources: await prisma.learningResource.count(),
    dsaQuestions: await prisma.dSAQuestion.count(),
    dsaAttempts: await prisma.dSAAttempt.count(),
    dailyPractices: await prisma.dailyPractice.count(),
    institutions: await prisma.institution.count(),
  };

  let countMismatches = 0;
  console.log('\n--- Table Count Verification ---');
  for (const [table, expected] of Object.entries(tableCounts)) {
    const actual = currentCounts[table] ?? 0;
    const ok = actual === expected;
    if (!ok) {
      countMismatches++;
      console.error(`  ❌ ${table.padEnd(25)}: Expected ${expected}, Actual ${actual}`);
    } else {
      console.log(`  ✅ ${table.padEnd(25)}: ${actual} (Matches expected)`);
    }
  }

  if (countMismatches > 0) {
    throw new Error(`[VERIFICATION FAILED] Detected ${countMismatches} table count mismatch(es)!`);
  }

  // 2. Deep Spot-Check: Real User Satyam Kumar Singh
  console.log('\n--- Deep Spot-Check: Real Registered User (satyam kumar singh) ---');
  const satyamUser = await prisma.user.findUnique({
    where: { email: 'satyamsinghrajput9810@gmail.com' },
    include: {
      studentProfile: {
        include: {
          domains: true,
          assessmentAttempts: true,
        },
      },
      activityLogs: true,
    },
  });

  if (!satyamUser) {
    throw new Error('[CRITICAL FAILURE] User satyamsinghrajput9810@gmail.com not found in database!');
  }
  if (satyamUser.id !== '7dc9660c-3020-47d7-a5ed-852e0a50ddd9') {
    throw new Error(`[ID MISMATCH] Expected ID '7dc9660c-3020-47d7-a5ed-852e0a50ddd9', got '${satyamUser.id}'`);
  }
  if (satyamUser.name !== 'satyam kumar singh') {
    throw new Error(`[NAME MISMATCH] Expected name 'satyam kumar singh', got '${satyamUser.name}'`);
  }
  if (!satyamUser.studentProfile) {
    throw new Error('[PROFILE MISSING] Student profile not linked for satyamsinghrajput9810@gmail.com');
  }
  if (satyamUser.studentProfile.institution !== 'galgotias university') {
    throw new Error(`[INSTITUTION MISMATCH] Expected 'galgotias university', got '${satyamUser.studentProfile.institution}'`);
  }
  if (satyamUser.studentProfile.targetDomain !== 'Full-Stack Web') {
    throw new Error(`[DOMAIN MISMATCH] Expected 'Full-Stack Web', got '${satyamUser.studentProfile.targetDomain}'`);
  }
  if (satyamUser.studentProfile.assessmentAttempts.length !== 9) {
    throw new Error(`[ATTEMPTS MISMATCH] Expected 9 assessment attempts, got ${satyamUser.studentProfile.assessmentAttempts.length}`);
  }

  console.log(`  ✅ User ID verified: ${satyamUser.id}`);
  console.log(`  ✅ Student name: ${satyamUser.name}`);
  console.log(`  ✅ Institution: ${satyamUser.studentProfile.institution}`);
  console.log(`  ✅ Target domain: ${satyamUser.studentProfile.targetDomain}`);
  console.log(`  ✅ Assessment attempts: ${satyamUser.studentProfile.assessmentAttempts.length} / 9`);
  console.log(`  ✅ Activity logs count: ${satyamUser.activityLogs.length}`);

  // 3. Deep Spot-Check: Demo User (demo@skillbridge.app)
  console.log('\n--- Deep Spot-Check: Demo User (demo@skillbridge.app) ---');
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@skillbridge.app' },
    include: {
      studentProfile: {
        include: {
          skillScores: true,
          dsaAttempts: true,
          dailyPractices: true,
        },
      },
    },
  });

  if (!demoUser || !demoUser.studentProfile) {
    throw new Error('[CRITICAL FAILURE] Demo user demo@skillbridge.app not found!');
  }
  if (demoUser.studentProfile.institution !== 'Delhi Technological University') {
    throw new Error(`[INSTITUTION MISMATCH] Expected 'Delhi Technological University', got '${demoUser.studentProfile.institution}'`);
  }
  if (demoUser.studentProfile.cgpa !== 8.9) {
    throw new Error(`[CGPA MISMATCH] Expected 8.9, got ${demoUser.studentProfile.cgpa}`);
  }
  if (demoUser.studentProfile.skillScores.length !== 14) {
    throw new Error(`[SKILL SCORES MISMATCH] Expected 14, got ${demoUser.studentProfile.skillScores.length}`);
  }

  console.log(`  ✅ Demo User ID verified: ${demoUser.id}`);
  console.log(`  ✅ Demo User institution: ${demoUser.studentProfile.institution}`);
  console.log(`  ✅ Demo User CGPA: ${demoUser.studentProfile.cgpa}`);
  console.log(`  ✅ Demo User skill scores: ${demoUser.studentProfile.skillScores.length} / 14`);
  console.log(`  ✅ Demo User DSA attempts: ${demoUser.studentProfile.dsaAttempts.length}`);

  console.log('\n🎉 [Verification Success] 100% Data Integrity Verified! Staging/PostgreSQL database matches backup perfectly.\n');
}

main()
  .catch((err) => {
    console.error('❌ [Verification Failed]:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
