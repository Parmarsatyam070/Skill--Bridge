import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { assessmentService } from '../server/src/services/assessmentService';

const prisma = new PrismaClient();

describe('Restructured Skill Assessment & Dedicated Aptitude System Suite', () => {
  let testStudentProfileId: string;
  let webSetId: string;
  let quantSetId: string;
  let listenSetId: string;

  beforeAll(async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { user: { email: 'demo@skillbridge.app' } },
    });
    if (student) {
      testStudentProfileId = student.id;
    }

    const sets = await prisma.practiceSet.findMany();
    webSetId = sets.find(s => s.domainName === 'Full-Stack Web')?.id || 'set-web-1';
    quantSetId = sets.find(s => s.type === 'aptitude_quant')?.id || 'set-quant-1';
    listenSetId = sets.find(s => s.type === 'aptitude_english_listening')?.id || 'set-eng-listen-1';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should list practice sets across all 5 domains and dedicated aptitude modules', async () => {
    const sets = await assessmentService.getAllPracticeSets(testStudentProfileId);
    expect(sets.length).toBeGreaterThanOrEqual(8);

    // Verify presence of domains
    const domains = sets.map(s => s.domainName);
    expect(domains).toContain('Full-Stack Web');
    expect(domains).toContain('Quantitative Aptitude');
    expect(domains).toContain('English Reading');
    expect(domains).toContain('English Listening');
  }, 25000);

  it('should initialize a dynamic assessment attempt with startPracticeSetAttempt', async () => {
    const startRes = await assessmentService.startPracticeSetAttempt(webSetId, testStudentProfileId);

    expect(startRes).toBeDefined();
    expect(startRes.attemptId).toBeDefined();
    expect(startRes.practiceSet.id).toBe(webSetId);
    expect(startRes.timeLimitMinutes).toBeGreaterThan(0);
    expect(startRes.questions.length).toBeGreaterThan(0);

    // Verify questions are sanitized (no isCorrect leaked)
    for (const q of startRes.questions) {
      for (const opt of q.options) {
        expect((opt as any).isCorrect).toBeUndefined();
      }
    }
  }, 25000);

  it('should rotate listening passages and attach passage questions on listening sets', async () => {
    const startRes = await assessmentService.startPracticeSetAttempt(listenSetId, testStudentProfileId);

    expect(startRes.questions.length).toBeGreaterThan(0);
    const listeningQ = startRes.questions[0];

    expect(listeningQ.listeningPassage).toBeDefined();
    expect(listeningQ.listeningPassage?.audioText).toBeDefined();
    expect(listeningQ.listeningPassage?.audioText.length).toBeGreaterThan(20);
    expect(listeningQ.listeningPassage?.durationSeconds).toBeGreaterThan(0);
  }, 25000);

  it('should evaluate MCQ and written rubric questions on submission and store persistent attempt record', async () => {
    const startRes = await assessmentService.startPracticeSetAttempt(webSetId, testStudentProfileId);
    const questions = startRes.questions;

    // Fetch actual questions with correct answer keys for verification
    const rawQuestions = await prisma.question.findMany({
      where: { id: { in: questions.map(q => q.id) } },
    });

    const answers: Record<string, string> = {};
    const writtenAnswers: Record<string, string> = {};
    const codingAnswers: Record<string, string> = {};

    for (const q of rawQuestions) {
      if (q.questionType === 'mcq') {
        const opts = JSON.parse(q.optionsJson);
        const correctOpt = opts.find((o: any) => o.isCorrect);
        if (correctOpt) {
          answers[q.id] = correctOpt.id;
        }
      } else if (q.questionType === 'written') {
        writtenAnswers[q.id] =
          'React uses a Virtual DOM diffing algorithm with the Fiber reconciler tree to compute minimal DOM mutations with O(n) heuristic complexity. The key prop allows React to stably identify items across list re-renders.';
      } else if (q.questionType === 'coding') {
        codingAnswers[q.id] = q.starterCode || 'function solution() { return true; }';
      }
    }

    const result = await assessmentService.submitPracticeSetAttempt(
      testStudentProfileId,
      {
        practiceSetId: webSetId,
        attemptId: startRes.attemptId,
        timeSpentSeconds: 420,
        answers,
        writtenAnswers,
        codingAnswers,
      }
    );

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.passed).toBe(true);
    expect(result.questionBreakdown).toBeDefined();
    expect(result.questionBreakdown?.length).toBe(questions.length);

    // Verify written question received AI rubric evaluation
    const writtenReview = result.questionBreakdown?.find(q => q.questionType === 'written');
    if (writtenReview) {
      expect(writtenReview.score).toBeGreaterThan(0);
      expect(writtenReview.aiFeedback).toBeDefined();
    }
  }, 25000);

  it('should generate persistent Report Card summary with KPI metrics and historical attempts', async () => {
    const reportCard = await assessmentService.getReportCardSummary(testStudentProfileId);

    expect(reportCard).toBeDefined();
    expect(reportCard.totalAttempts).toBeGreaterThan(0);
    expect(reportCard.passRate).toBeGreaterThanOrEqual(0);
    expect(reportCard.averageScore).toBeGreaterThan(0);
    expect(['improving', 'steady', 'declining']).toContain(reportCard.performanceTrend);
    expect(reportCard.attempts.length).toBe(reportCard.totalAttempts);

    // Check attempt structure
    const firstAttempt = reportCard.attempts[0];
    expect(firstAttempt.practiceSetTitle).toBeDefined();
    expect(firstAttempt.score).toBeGreaterThanOrEqual(0);
    expect(typeof firstAttempt.passed).toBe('boolean');
    expect(typeof firstAttempt.isBestScore).toBe('boolean');
  }, 25000);

  it('should fetch in-depth historical attempt detail transcript with answers and solutions', async () => {
    const reportCard = await assessmentService.getReportCardSummary(testStudentProfileId);
    const targetAttemptId = reportCard.attempts[0].id;

    const detail = await assessmentService.getAttemptDetail(targetAttemptId, testStudentProfileId);

    expect(detail).toBeDefined();
    expect(detail.id).toBe(targetAttemptId);
    expect(detail.questionResults.length).toBeGreaterThan(0);

    for (const qr of detail.questionResults) {
      expect(qr.prompt).toBeDefined();
      expect(qr.userAnswer).toBeDefined();
      expect(typeof qr.isCorrect).toBe('boolean');
    }
  }, 25000);
});
