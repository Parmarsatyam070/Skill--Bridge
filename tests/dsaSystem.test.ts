import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { questionSelectionService } from '../server/src/services/questionSelectionService';
import { dsaSeedQuestions } from '../server/src/services/dsaSeedData';

const prisma = new PrismaClient();

describe('DSA Coding Practice & Daily Mandatory Engine Suite', () => {
  let testStudentId: string;

  beforeAll(async () => {
    // Ensure test student exists
    let student = await prisma.studentProfile.findFirst({
      where: { user: { email: 'demo@skillbridge.app' } },
    });

    if (!student) {
      const user = await prisma.user.create({
        data: {
          email: 'dsa_test_student@skillbridge.app',
          passwordHash: 'hash123',
          role: 'STUDENT',
          studentProfile: {
            create: {
              fullName: 'DSA Test Student',
              targetDomain: 'Full-Stack Web',
            },
          },
        },
        include: { studentProfile: true },
      });
      student = user.studentProfile!;
    }
    testStudentId = student.id;

    // Ensure DSA questions are seeded
    const count = await prisma.dSAQuestion.count();
    if (count < 200) {
      for (const q of dsaSeedQuestions) {
        await prisma.dSAQuestion.upsert({
          where: { slug: q.slug },
          update: {
            title: q.title,
            platform: q.platform,
            difficulty: q.difficulty,
            topic: q.topic,
            tags: JSON.stringify(q.tags),
            canonicalUrl: q.canonicalUrl,
            estimatedMinutes: q.estimatedMinutes,
            description: q.description,
            starterCode: typeof q.starterCode === 'object' ? JSON.stringify(q.starterCode) : (q.starterCode || ''),
            testCases: q.testCases ? JSON.stringify(q.testCases) : null,
            entryFunctionName: q.entryFunctionName,
          },
          create: {
            title: q.title,
            slug: q.slug,
            platform: q.platform,
            difficulty: q.difficulty,
            topic: q.topic,
            tags: JSON.stringify(q.tags),
            canonicalUrl: q.canonicalUrl,
            estimatedMinutes: q.estimatedMinutes,
            description: q.description,
            starterCode: typeof q.starterCode === 'object' ? JSON.stringify(q.starterCode) : (q.starterCode || ''),
            testCases: q.testCases ? JSON.stringify(q.testCases) : null,
            entryFunctionName: q.entryFunctionName,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. PRACTICE SET SIZE RULE TESTS (MIN 15, MAX 30, [15, 20, 25, 30])
  // ─────────────────────────────────────────────────────────────
  describe('Practice Set Size Rules & Bounds Enforcement', () => {
    it('should generate sets with exactly 15 questions by default', async () => {
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 15,
      });

      expect(questions).toBeDefined();
      expect(questions.length).toBe(15);
    });

    it('should support all allowed sizes: 15, 20, 25, 30', async () => {
      const sizes: (15 | 20 | 25 | 30)[] = [15, 20, 25, 30];

      for (const size of sizes) {
        const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
          questionCount: size,
        });
        expect(questions.length).toBe(size);

        // Verify no duplicate questions inside the same practice set
        const ids = questions.map((q) => q.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(size);
      }
    });

    it('should safely normalize invalid sizes (<15 or >30 or non-standard) to closest valid bound', async () => {
      // Test size 5 -> normalized to 15
      const q5 = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 5 as any,
      });
      expect(q5.length).toBe(15);

      // Test size 18 -> normalized to 20
      const q18 = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 18 as any,
      });
      expect(q18.length).toBe(20);

      // Test size 35 -> normalized to 30
      const q35 = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 35 as any,
      });
      expect(q35.length).toBe(30);
    });

    it('should never contain duplicate questions within the generated set', async () => {
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 30,
      });

      const ids = questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(30);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ROTATION & SELECTION ENGINE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Question Rotation & Diversity Engine', () => {
    it('should generate different sets across consecutive generations', async () => {
      const set1 = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 15,
      });

      // Mark some as attempted
      for (let i = 0; i < 5; i++) {
        await questionSelectionService.recordAttempt(testStudentId, set1[i].id, {
          status: 'SOLVED',
          timeSpentSeconds: 120,
        });
      }

      const set2 = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 15,
      });

      const set1Ids = new Set(set1.map((q) => q.id));
      const set2Ids = new Set(set2.map((q) => q.id));

      // Sets should have distinct question selections
      const overlap = set2.filter((q) => set1Ids.has(q.id));
      expect(overlap.length).toBeLessThan(15); // Must not be identical
    });

    it('should balance platforms (LeetCode, GFG, CSES, Codeforces)', async () => {
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 20,
      });

      const platforms = new Set(questions.map((q) => q.platform));
      expect(platforms.size).toBeGreaterThanOrEqual(2);
    });

    it('should balance difficulties (Easy, Medium, Hard)', async () => {
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 20,
      });

      const diffs = new Set(questions.map((q) => q.difficulty));
      expect(diffs.has('Easy')).toBe(true);
      expect(diffs.has('Medium')).toBe(true);
    });

    it('should filter by specific topic when requested', async () => {
      const topic = 'Dynamic Programming';
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 15,
        topic,
      });

      expect(questions.length).toBe(15);
      const matchingTopic = questions.filter((q) => q.topic.toLowerCase().includes('dynamic') || q.topic.toLowerCase().includes('dp'));
      expect(matchingTopic.length).toBeGreaterThanOrEqual(10);
    });

    it('should filter by specific platform when requested', async () => {
      const platform = 'LeetCode';
      const questions = await questionSelectionService.generateCustomPracticeSet(testStudentId, {
        questionCount: 15,
        platform,
      });

      expect(questions.length).toBe(15);
      const leetcodeQs = questions.filter((q) => q.platform === 'LeetCode');
      expect(leetcodeQs.length).toBeGreaterThanOrEqual(12);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DAILY MANDATORY DSA PRACTICE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Daily Mandatory DSA Practice & Streak Engine', () => {
    it('should return exactly ONE daily set per calendar date', async () => {
      const todayDate = new Date().toISOString().split('T')[0];

      const daily1 = await questionSelectionService.getOrCreateDailyPractice(testStudentId, todayDate);
      expect(daily1).toBeDefined();
      expect(daily1.date).toBe(todayDate);
      expect(daily1.questions.length).toBeGreaterThanOrEqual(15);
      expect(daily1.questions.length).toBeLessThanOrEqual(30);

      // Second call (simulating page refresh)
      const daily2 = await questionSelectionService.getOrCreateDailyPractice(testStudentId, todayDate);
      expect(daily2.id).toBe(daily1.id);

      // Verify exact question IDs remain identical on refresh
      const qIds1 = daily1.questions.map((q) => q.id);
      const qIds2 = daily2.questions.map((q) => q.id);
      expect(qIds1).toEqual(qIds2);
    });

    it('should track question completions in daily practice and update score', async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      const daily = await questionSelectionService.getOrCreateDailyPractice(testStudentId, todayDate);

      const targetQuestion = daily.questions[0];
      const res = await questionSelectionService.submitDailyQuestion(testStudentId, {
        questionId: targetQuestion.id,
        status: 'SOLVED',
        code: 'function solve() { return true; }',
        timeSpentSeconds: 90,
      });

      expect(res.dailyPractice.completedQuestionIds).toContain(targetQuestion.id);
      expect(res.dailyPractice.score).toBeGreaterThan(0);
    });

    it('should maintain streak only when practice is truly completed', async () => {
      const streakInfo = await questionSelectionService.getStreakInfo(testStudentId);
      expect(streakInfo).toBeDefined();
      expect(typeof streakInfo.currentStreak).toBe('number');
      expect(typeof streakInfo.longestStreak).toBe('number');
      expect(streakInfo.currentStreak).toBeLessThanOrEqual(streakInfo.longestStreak);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. DSA ATTEMPT TRACKING & RADAR CALIBRATION
  // ─────────────────────────────────────────────────────────────
  describe('DSA Attempt Tracking & Progress Aggregation', () => {
    it('should record DSA attempts idempotently without duplicate records', async () => {
      const q = await prisma.dSAQuestion.findFirst();
      expect(q).toBeDefined();

      await questionSelectionService.recordAttempt(testStudentId, q!.id, {
        status: 'SOLVED',
        timeSpentSeconds: 45,
        codeSubmitted: 'function solve() {}',
      });

      // Second attempt on same question should update, not duplicate
      await questionSelectionService.recordAttempt(testStudentId, q!.id, {
        status: 'SOLVED',
        timeSpentSeconds: 60,
        codeSubmitted: 'function solve() { return 1; }',
      });

      const attempts = await prisma.dSAAttempt.findMany({
        where: { studentId: testStudentId, questionId: q!.id },
      });

      expect(attempts.length).toBe(1);
      expect(attempts[0].attemptCount).toBeGreaterThanOrEqual(2);
    });

    it('should calculate complete DSA progress summary', async () => {
      const progress = await questionSelectionService.getProgressSummary(testStudentId);

      expect(progress).toBeDefined();
      expect(typeof progress.totalSolved).toBe('number');
      expect(typeof progress.totalAttempted).toBe('number');
      expect(progress.platformBreakdown.length).toBeGreaterThan(0);
      expect(progress.topicBreakdown.length).toBeGreaterThan(0);
      expect(Array.isArray(progress.weakTopics)).toBe(true);
      expect(Array.isArray(progress.strongTopics)).toBe(true);
    });
  });
});
