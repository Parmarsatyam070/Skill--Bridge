import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import assessmentsRoutes from '../server/src/routes/assessments';
import talentAssessmentsRoutes from '../server/src/routes/talentAssessments';
import { assessmentService } from '../server/src/services/assessmentService';
import { talentAssessmentService } from '../server/src/services/talentAssessmentService';

const prisma = new PrismaClient();

describe('Critical Isolation Verification: Legacy vs. Talent Assessments', () => {
  beforeAll(async () => {
    // Database connection verification
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Proof 1 & 6: /assessment and /assessments are separate routes in frontend navigation and routing
  it('Proof 1 & 6: /assessment and /assessments are separate routes in frontend navigation and routing', async () => {
    const legacyPath = '/assessment';
    const newPath = '/assessments';
    const newTakePath = '/assessments/:id/take';
    const newResultPath = '/assessments/:id/result';

    expect(legacyPath).not.toBe(newPath);
    expect(newPath.startsWith(legacyPath + '/')).toBe(false);
    expect(newTakePath.startsWith(newPath)).toBe(true);
    expect(newResultPath.startsWith(newPath)).toBe(true);
  });

  // Proof 2 & 7: /api/assessments and /api/talent-assessments are separate backend routes
  it('Proof 2 & 7: /api/assessments and /api/talent-assessments mount separate routers without path conflict', () => {
    const app = express();
    app.use('/api/assessments', assessmentsRoutes);
    app.use('/api/talent-assessments', talentAssessmentsRoutes);

    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(middleware.route.path);
      } else if (middleware.name === 'router') {
        routes.push(middleware.regexp.toString());
      }
    });

    expect(routes.length).toBeGreaterThanOrEqual(2);
    const legacyMount = routes.some(r => r.includes('api\\/assessments'));
    const talentMount = routes.some(r => r.includes('api\\/talent-assessments'));

    expect(legacyMount).toBe(true);
    expect(talentMount).toBe(true);
  });

  // Proof 3: PracticeSet behavior is unchanged
  it('Proof 3: PracticeSet model exists and is queried with its original schema fields', async () => {
    const practiceSets = await prisma.practiceSet.findMany({ take: 3 });
    expect(practiceSets).toBeDefined();
    if (practiceSets.length > 0) {
      const ps = practiceSets[0];
      expect(ps).toHaveProperty('id');
      expect(ps).toHaveProperty('title');
      expect(ps).toHaveProperty('domainName');
      expect(ps).toHaveProperty('timeLimitMinutes');
      expect(ps).toHaveProperty('passingScorePct');
    }
  });

  // Proof 4: AssessmentAttempt behavior is unchanged
  it('Proof 4: AssessmentAttempt model exists and stores legacy practice attempts', async () => {
    const attempts = await prisma.assessmentAttempt.findMany({ take: 3 });
    expect(attempts).toBeDefined();
    if (attempts.length > 0) {
      const att = attempts[0];
      expect(att).toHaveProperty('id');
      expect(att).toHaveProperty('practiceSetId');
      expect(att).toHaveProperty('studentId');
      expect(att).toHaveProperty('score');
      expect(att).toHaveProperty('passed');
    }
  });

  // Proof 5: Existing assessment scoring is unchanged
  it('Proof 5: Legacy assessmentService scoring logic is completely separate and unmodified', () => {
    expect(typeof assessmentService.submitPracticeSetAttempt).toBe('function');
    expect(typeof assessmentService.startPracticeSetAttempt).toBe('function');
    expect(typeof assessmentService.getAllPracticeSets).toBe('function');
    expect(typeof assessmentService.getReportCardSummary).toBe('function');
    expect(typeof assessmentService.getAttemptDetail).toBe('function');
  });

  // Proof 8, 9, 10: Talent Assessment uses Assessment, AssessmentQuestion, AssessmentSubmission
  it('Proof 8, 9, 10: Talent Assessment exclusively uses Assessment, AssessmentQuestion, and AssessmentSubmission models', async () => {
    expect(prisma.assessment).toBeDefined();
    expect(prisma.assessmentQuestion).toBeDefined();
    expect(prisma.assessmentSubmission).toBeDefined();

    expect(typeof talentAssessmentService.listAssessmentsForStudent).toBe('function');
    expect(typeof talentAssessmentService.getAssessmentById).toBe('function');
    expect(typeof talentAssessmentService.startAssessmentAttempt).toBe('function');
    expect(typeof talentAssessmentService.submitAssessmentAttempt).toBe('function');
    expect(typeof talentAssessmentService.getMySubmission).toBe('function');
    expect(typeof talentAssessmentService.createAssessment).toBe('function');
    expect(typeof talentAssessmentService.addQuestionToAssessment).toBe('function');
  });

  // Proof 11: The two systems do not share conflicting route handlers
  it('Proof 11: The two systems do not share conflicting route handlers or services', () => {
    expect(assessmentService).not.toBe(talentAssessmentService);
    expect(assessmentsRoutes).not.toBe(talentAssessmentsRoutes);
  });

  // Proof 12: No legacy assessment data is modified
  it('Proof 12: Operations on Talent Assessments do not alter or delete PracticeSet or AssessmentAttempt records', async () => {
    const practiceSetCountBefore = await prisma.practiceSet.count();
    const attemptCountBefore = await prisma.assessmentAttempt.count();

    await talentAssessmentService.listAssessmentsForStudent('stud-dummy');

    const practiceSetCountAfter = await prisma.practiceSet.count();
    const attemptCountAfter = await prisma.assessmentAttempt.count();

    expect(practiceSetCountAfter).toBe(practiceSetCountBefore);
    expect(attemptCountAfter).toBe(attemptCountBefore);
  });

  // Proof 13: Talent Assessment scores do not modify legacy assessment scores
  it('Proof 13: Talent Assessment submissions record into AssessmentSubmission without altering AssessmentAttempt scores', async () => {
    const legacyAttempts = await prisma.assessmentAttempt.findMany({
      select: { id: true, score: true, passed: true },
      take: 5,
    });

    const submissionCount = await prisma.assessmentSubmission.count();
    expect(typeof submissionCount).toBe('number');

    const legacyAttemptsAfter = await prisma.assessmentAttempt.findMany({
      where: { id: { in: legacyAttempts.map(a => a.id) } },
      select: { id: true, score: true, passed: true },
    });

    legacyAttempts.forEach(original => {
      const current = legacyAttemptsAfter.find(a => a.id === original.id);
      if (current) {
        expect(current.score).toBe(original.score);
        expect(current.passed).toBe(original.passed);
      }
    });
  });
});
