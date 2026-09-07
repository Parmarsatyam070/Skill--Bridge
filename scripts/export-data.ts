import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface ExportManifest {
  exportedAt: string;
  totalTables: number;
  totalRecords: number;
  tableCounts: Record<string, number>;
  sha256Checksum: string;
}

export interface DatabaseBackup {
  manifest: ExportManifest;
  data: {
    users: any[];
    studentProfiles: any[];
    domains: any[];
    domainSkillRequirements: any[];
    studentDomains: any[];
    industryProfiles: any[];
    academicianProfiles: any[];
    institutionProfiles: any[];
    passwordResetTokens: any[];
    activityLogs: any[];
    skills: any[];
    skillBenchmarks: any[];
    studentSkillScores: any[];
    questions: any[];
    courseProviders: any[];
    courses: any[];
    enrollments: any[];
    internships: any[];
    applications: any[];
    resumes: any[];
    academicOpportunities: any[];
    externalIntegrations: any[];
    portfolioWebsites: any[];
    portfolioMessages: any[];
    practiceSets: any[];
    listeningPassages: any[];
    assessmentAttempts: any[];
    inAppNotifications: any[];
    learningResources: any[];
    dsaQuestions: any[];
    dsaAttempts: any[];
    dailyPractices: any[];
    institutions: any[];
  };
}

async function exportTable<T>(
  modelName: string,
  fetchFn: () => Promise<T[]>,
  countFn: () => Promise<number>
): Promise<T[]> {
  const expectedCount = await countFn();
  const rows = await fetchFn();

  if (rows.length !== expectedCount) {
    throw new Error(
      `[CRITICAL EXPORT FAILURE] Model '${modelName}': expected ${expectedCount} rows but retrieved ${rows.length}. Halting export immediately to prevent partial data dump.`
    );
  }

  // Verify serialization of every row
  for (let i = 0; i < rows.length; i++) {
    try {
      JSON.stringify(rows[i]);
    } catch (err: any) {
      throw new Error(
        `[CRITICAL SERIALIZATION ERROR] Model '${modelName}', index ${i}: ${err.message}. Halting export.`
      );
    }
  }

  return rows;
}

async function main() {
  console.log('🚀 [Data Export] Starting complete SQLite database export...');
  const startTime = Date.now();

  const backupData: DatabaseBackup['data'] = {
    users: await exportTable('User', () => prisma.user.findMany(), () => prisma.user.count()),
    studentProfiles: await exportTable('StudentProfile', () => prisma.studentProfile.findMany(), () => prisma.studentProfile.count()),
    domains: await exportTable('Domain', () => prisma.domain.findMany(), () => prisma.domain.count()),
    domainSkillRequirements: await exportTable('DomainSkillRequirement', () => prisma.domainSkillRequirement.findMany(), () => prisma.domainSkillRequirement.count()),
    studentDomains: await exportTable('StudentDomain', () => prisma.studentDomain.findMany(), () => prisma.studentDomain.count()),
    industryProfiles: await exportTable('IndustryProfile', () => prisma.industryProfile.findMany(), () => prisma.industryProfile.count()),
    academicianProfiles: await exportTable('AcademicianProfile', () => prisma.academicianProfile.findMany(), () => prisma.academicianProfile.count()),
    institutionProfiles: await exportTable('InstitutionProfile', () => prisma.institutionProfile.findMany(), () => prisma.institutionProfile.count()),
    passwordResetTokens: await exportTable('PasswordResetToken', () => prisma.passwordResetToken.findMany(), () => prisma.passwordResetToken.count()),
    activityLogs: await exportTable('ActivityLog', () => prisma.activityLog.findMany(), () => prisma.activityLog.count()),
    skills: await exportTable('Skill', () => prisma.skill.findMany(), () => prisma.skill.count()),
    skillBenchmarks: await exportTable('SkillBenchmark', () => prisma.skillBenchmark.findMany(), () => prisma.skillBenchmark.count()),
    studentSkillScores: await exportTable('StudentSkillScore', () => prisma.studentSkillScore.findMany(), () => prisma.studentSkillScore.count()),
    questions: await exportTable('Question', () => prisma.question.findMany(), () => prisma.question.count()),
    courseProviders: await exportTable('CourseProvider', () => prisma.courseProvider.findMany(), () => prisma.courseProvider.count()),
    courses: await exportTable('Course', () => prisma.course.findMany(), () => prisma.course.count()),
    enrollments: await exportTable('Enrollment', () => prisma.enrollment.findMany(), () => prisma.enrollment.count()),
    internships: await exportTable('Internship', () => prisma.internship.findMany(), () => prisma.internship.count()),
    applications: await exportTable('Application', () => prisma.application.findMany(), () => prisma.application.count()),
    resumes: await exportTable('Resume', () => prisma.resume.findMany(), () => prisma.resume.count()),
    academicOpportunities: await exportTable('AcademicOpportunity', () => prisma.academicOpportunity.findMany(), () => prisma.academicOpportunity.count()),
    externalIntegrations: await exportTable('ExternalIntegration', () => prisma.externalIntegration.findMany(), () => prisma.externalIntegration.count()),
    portfolioWebsites: await exportTable('PortfolioWebsite', () => prisma.portfolioWebsite.findMany(), () => prisma.portfolioWebsite.count()),
    portfolioMessages: await exportTable('PortfolioMessage', () => prisma.portfolioMessage.findMany(), () => prisma.portfolioMessage.count()),
    practiceSets: await exportTable('PracticeSet', () => prisma.practiceSet.findMany(), () => prisma.practiceSet.count()),
    listeningPassages: await exportTable('ListeningPassage', () => prisma.listeningPassage.findMany(), () => prisma.listeningPassage.count()),
    assessmentAttempts: await exportTable('AssessmentAttempt', () => prisma.assessmentAttempt.findMany(), () => prisma.assessmentAttempt.count()),
    inAppNotifications: await exportTable('InAppNotification', () => prisma.inAppNotification.findMany(), () => prisma.inAppNotification.count()),
    learningResources: await exportTable('LearningResource', () => prisma.learningResource.findMany(), () => prisma.learningResource.count()),
    dsaQuestions: await exportTable('DSAQuestion', () => prisma.dSAQuestion.findMany(), () => prisma.dSAQuestion.count()),
    dsaAttempts: await exportTable('DSAAttempt', () => prisma.dSAAttempt.findMany(), () => prisma.dSAAttempt.count()),
    dailyPractices: await exportTable('DailyPractice', () => prisma.dailyPractice.findMany(), () => prisma.dailyPractice.count()),
    institutions: await exportTable('Institution', () => prisma.institution.findMany(), () => prisma.institution.count()),
  };

  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const [key, rows] of Object.entries(backupData)) {
    tableCounts[key] = rows.length;
    totalRecords += rows.length;
  }

  // Spot-check real registered student satyam kumar singh
  const satyamUser = backupData.users.find(u => u.email === 'satyamsinghrajput9810@gmail.com');
  if (!satyamUser) {
    throw new Error('[CRITICAL INTEGRITY FAILURE] Real user satyamsinghrajput9810@gmail.com not found in User export!');
  }
  const satyamProfile = backupData.studentProfiles.find(p => p.userId === satyamUser.id);
  if (!satyamProfile) {
    throw new Error('[CRITICAL INTEGRITY FAILURE] Student profile for satyamsinghrajput9810@gmail.com not found in export!');
  }
  const satyamAttempts = backupData.assessmentAttempts.filter(a => a.studentId === satyamProfile.id);
  if (satyamAttempts.length !== 9) {
    throw new Error(`[CRITICAL INTEGRITY FAILURE] Expected 9 assessment attempts for Satyam, found ${satyamAttempts.length}`);
  }

  console.log(`✅ [Verification] Verified Satyam Kumar Singh data integrity: ID=${satyamUser.id}, Attempts=${satyamAttempts.length}`);

  const rawJson = JSON.stringify(backupData);
  const sha256 = crypto.createHash('sha256').update(rawJson).digest('hex');

  const fullBackup: DatabaseBackup = {
    manifest: {
      exportedAt: new Date().toISOString(),
      totalTables: Object.keys(backupData).length,
      totalRecords,
      tableCounts,
      sha256Checksum: sha256,
    },
    data: backupData,
  };

  const outDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tmpPath = path.join(outDir, 'sqlite_backup.json.tmp');
  const finalPath = path.join(outDir, 'sqlite_backup.json');

  fs.writeFileSync(tmpPath, JSON.stringify(fullBackup, null, 2), 'utf8');
  fs.renameSync(tmpPath, finalPath);

  const durationMs = Date.now() - startTime;
  console.log(`\n🎉 [Export Complete] Successfully exported ${totalRecords} records across ${Object.keys(backupData).length} tables in ${durationMs}ms`);
  console.log(`📁 Backup File: ${finalPath}`);
  console.log(`🔒 SHA256 Checksum: ${sha256}`);
  console.log('\n--- Table Record Counts ---');
  for (const [table, count] of Object.entries(tableCounts)) {
    console.log(`  • ${table.padEnd(25)}: ${count}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ [Export Failed]:', err.message);
    const tmpPath = path.resolve(process.cwd(), 'scratch/sqlite_backup.json.tmp');
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
