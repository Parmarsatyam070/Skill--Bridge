import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { DatabaseBackup } from './export-data.js';

const prisma = new PrismaClient();

function parseDates(row: any, dateFields: string[]): any {
  const cloned = { ...row };
  for (const field of dateFields) {
    if (cloned[field]) {
      cloned[field] = new Date(cloned[field]);
    }
  }
  return cloned;
}

async function main() {
  const backupFile = path.resolve(process.cwd(), 'scratch/sqlite_backup.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at ${backupFile}! Run 'npm run db:export' first.`);
  }

  console.log(`📦 [Data Import] Reading backup file from: ${backupFile}`);
  const raw = fs.readFileSync(backupFile, 'utf8');
  const backup: DatabaseBackup = JSON.parse(raw);

  // Validate SHA256 Checksum
  const computedSha = crypto.createHash('sha256').update(JSON.stringify(backup.data)).digest('hex');
  if (computedSha !== backup.manifest.sha256Checksum) {
    throw new Error(`[CHECKSUM MISMATCH] Expected ${backup.manifest.sha256Checksum} but computed ${computedSha}. Backup may be corrupted!`);
  }
  console.log(`🔒 [Integrity] Backup SHA-256 verified successfully: ${computedSha}`);

  const { data } = backup;
  console.log(`🚀 [Data Import] Starting dependency-ordered insertion into database...`);

  // 1. Core Reference Tables
  console.log('  -> Importing Skills...');
  for (const item of data.skills) {
    await prisma.skill.upsert({ where: { id: item.id }, update: item, create: item });
  }

  console.log('  -> Importing Domains...');
  for (const item of data.domains) {
    await prisma.domain.upsert({ where: { id: item.id }, update: item, create: item });
  }

  console.log('  -> Importing DomainSkillRequirements & SkillBenchmarks...');
  for (const item of data.domainSkillRequirements) {
    await prisma.domainSkillRequirement.upsert({
      where: { domainId_skillId: { domainId: item.domainId, skillId: item.skillId } },
      update: item,
      create: item,
    });
  }
  for (const item of data.skillBenchmarks) {
    await prisma.skillBenchmark.upsert({
      where: { domain_skillId: { domain: item.domain, skillId: item.skillId } },
      update: item,
      create: item,
    });
  }

  console.log('  -> Importing CourseProviders & Courses...');
  for (const item of data.courseProviders) {
    await prisma.courseProvider.upsert({ where: { id: item.id }, update: item, create: item });
  }
  for (const item of data.courses) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.course.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  console.log('  -> Importing PracticeSets, ListeningPassages, and Questions...');
  for (const item of data.practiceSets) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.practiceSet.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.listeningPassages) {
    await prisma.listeningPassage.upsert({ where: { id: item.id }, update: item, create: item });
  }
  for (const item of data.questions) {
    await prisma.question.upsert({ where: { id: item.id }, update: item, create: item });
  }

  console.log('  -> Importing DSAQuestions, Institutions, LearningResources, AcademicOpportunities...');
  for (const item of data.dsaQuestions) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.dSAQuestion.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.institutions) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.institution.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.learningResources) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.learningResource.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  // 2. Core Users (Including satyam kumar singh and demo users)
  console.log('  -> Importing Users...');
  for (const item of data.users) {
    const parsed = parseDates(item, ['createdAt', 'updatedAt']);
    await prisma.user.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  // 3. User Profiles
  console.log('  -> Importing User Profiles (Student, Industry, Academician, Institution)...');
  for (const item of data.studentProfiles) {
    await prisma.studentProfile.upsert({ where: { id: item.id }, update: item, create: item });
  }
  for (const item of data.industryProfiles) {
    await prisma.industryProfile.upsert({ where: { id: item.id }, update: item, create: item });
  }
  for (const item of data.academicianProfiles) {
    await prisma.academicianProfile.upsert({ where: { id: item.id }, update: item, create: item });
  }
  for (const item of data.institutionProfiles) {
    await prisma.institutionProfile.upsert({ where: { id: item.id }, update: item, create: item });
  }

  // 4. Relational Child Records
  console.log('  -> Importing Student Domains & Skill Scores...');
  for (const item of data.studentDomains) {
    const parsed = parseDates(item, ['addedAt']);
    await prisma.studentDomain.upsert({
      where: { studentId_domainId: { studentId: item.studentId, domainId: item.domainId } },
      update: parsed,
      create: parsed,
    });
  }
  for (const item of data.studentSkillScores) {
    const parsed = parseDates(item, ['lastAttemptDate', 'updatedAt']);
    await prisma.studentSkillScore.upsert({
      where: { studentId_skillId: { studentId: item.studentId, skillId: item.skillId } },
      update: parsed,
      create: parsed,
    });
  }

  console.log('  -> Importing Enrollments, Internships, Resumes, Applications...');
  for (const item of data.enrollments) {
    const parsed = parseDates(item, ['enrolledAt', 'completedAt']);
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: item.studentId, courseId: item.courseId } },
      update: parsed,
      create: parsed,
    });
  }
  for (const item of data.internships) {
    const parsed = parseDates(item, ['postedAt']);
    await prisma.internship.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.resumes) {
    const parsed = parseDates(item, ['createdAt', 'updatedAt']);
    await prisma.resume.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.applications) {
    const parsed = parseDates(item, ['appliedAt']);
    await prisma.application.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  console.log('  -> Importing Portfolios & Messages...');
  for (const item of data.portfolioWebsites) {
    const parsed = parseDates(item, ['createdAt', 'updatedAt']);
    await prisma.portfolioWebsite.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.portfolioMessages) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.portfolioMessage.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  console.log('  -> Importing Assessment Attempts, DSA Attempts, Daily Practices...');
  for (const item of data.assessmentAttempts) {
    const parsed = parseDates(item, ['startedAt', 'submittedAt']);
    await prisma.assessmentAttempt.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.dsaAttempts) {
    const parsed = parseDates(item, ['createdAt', 'updatedAt']);
    await prisma.dSAAttempt.upsert({
      where: { studentId_questionId: { studentId: item.studentId, questionId: item.questionId } },
      update: parsed,
      create: parsed,
    });
  }
  for (const item of data.dailyPractices) {
    const parsed = parseDates(item, ['startedAt', 'completedAt', 'createdAt', 'updatedAt']);
    await prisma.dailyPractice.upsert({
      where: { studentId_date: { studentId: item.studentId, date: item.date } },
      update: parsed,
      create: parsed,
    });
  }

  console.log('  -> Importing In-App Notifications, Activity Logs, External Integrations...');
  for (const item of data.inAppNotifications) {
    const parsed = parseDates(item, ['createdAt']);
    await prisma.inAppNotification.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }
  for (const item of data.activityLogs) {
    const parsed = parseDates(item, ['loggedInAt']);
    await prisma.activityLog.upsert({
      where: { userId_date: { userId: item.userId, date: item.date } },
      update: parsed,
      create: parsed,
    });
  }
  for (const item of data.externalIntegrations) {
    const parsed = parseDates(item, ['connectedAt']);
    await prisma.externalIntegration.upsert({
      where: { userId_platform: { userId: item.userId, platform: item.platform } },
      update: parsed,
      create: parsed,
    });
  }
  for (const item of data.passwordResetTokens) {
    const parsed = parseDates(item, ['expiresAt', 'usedAt', 'createdAt']);
    await prisma.passwordResetToken.upsert({ where: { id: item.id }, update: parsed, create: parsed });
  }

  console.log(`\n🎉 [Import Complete] All tables successfully populated from verified backup!`);
}

main()
  .catch((err) => {
    console.error('❌ [Import Failed]:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
