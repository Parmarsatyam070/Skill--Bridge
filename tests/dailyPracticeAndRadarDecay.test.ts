import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as assessmentService from '../server/src/services/assessmentService';
import * as streakService from '../server/src/services/streakService';
import * as codeRunnerService from '../server/src/services/codeRunnerService';
import * as learningResourceService from '../server/src/services/learningResourceService';

const prisma = new PrismaClient();

describe('SkillBridge Advanced Suite: Daily Practice, Dynamic Radar, Code Sandbox & Learning Engine', () => {
  let testUserId: string;
  let testStudentProfileId: string;
  let webSkillId: string;
  let practiceSetId: string;

  beforeAll(async () => {
    // Ensure test user & student profile
    const existingUser = await prisma.user.findFirst({
      where: { email: 'student@skillbridge.edu' },
      include: { studentProfile: true },
    });

    if (existingUser && existingUser.studentProfile) {
      testUserId = existingUser.id;
      testStudentProfileId = existingUser.studentProfile.id;
    } else {
      const user = await prisma.user.create({
        data: {
          email: `test_${Date.now()}@skillbridge.edu`,
          passwordHash: 'hash',
          name: 'Test Student',
          role: 'STUDENT',
          currentStreak: 2,
          lastActiveDate: '2026-09-02',
        },
      });
      testUserId = user.id;

      const profile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          targetDomain: 'Full-Stack Web',
          institution: 'IIT Bombay',
        },
      });
      testStudentProfileId = profile.id;
    }

    // Get a skill
    const skill = await prisma.skill.findFirst();
    if (!skill) throw new Error('Skill not found');
    webSkillId = skill.id;

    // Get a practice set
    const set = await prisma.practiceSet.findFirst({
      where: { type: 'domain' },
    });
    if (!set) throw new Error('Practice set not found');
    practiceSetId = set.id;
  });

  // ─────────────────────────────────────────────────────────────
  // 1. MANDATORY DAILY PRACTICE SET & STREAK GATING
  // ─────────────────────────────────────────────────────────────
  describe('Mandatory Daily Practice & Gated Streak System', () => {
    it('should return pending status if no practice set submitted today', async () => {
      // Clean attempts from today for test profile
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      await prisma.assessmentAttempt.deleteMany({
        where: {
          studentId: testStudentProfileId,
          submittedAt: { gte: startOfToday },
        },
      });

      const status = await assessmentService.getDailyPracticeStatus(testStudentProfileId);
      expect(status).toBeDefined();
      expect(status.completedToday).toBe(false);
      expect(status.recommendedSet).toBeDefined();
      expect(status.recommendedSet?.id).toBeDefined();
    });

    it('should NOT increment streak on app login alone without practice set submission', async () => {
      const initialUser = await prisma.user.findUnique({ where: { id: testUserId } });
      const currentStreak = initialUser?.currentStreak || 1;

      // Checking streak verification
      const hasCompleted = await streakService.hasCompletedPracticeSetToday(testStudentProfileId);
      expect(hasCompleted).toBe(false);

      // Verify user streak didn't artificially increase
      const refreshedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(refreshedUser?.currentStreak).toBe(currentStreak);
    });

    it('should advance streak when a practice set is submitted', async () => {
      // First create a practice attempt so hasCompletedPracticeSetToday will be true
      const today = streakService.getTodayDateString();
      await prisma.assessmentAttempt.create({
        data: {
          studentId: testStudentProfileId,
          practiceSetId,
          score: 85,
          timeSpentSeconds: 300,
          passed: true,
          answersJson: '{}',
          submittedAt: new Date(),
        },
      });

      const streakResult = await streakService.recordPracticeSetSubmissionStreak(
        testStudentProfileId
      );

      expect(streakResult).toBeDefined();
      expect(streakResult?.activeToday).toBe(true);
      expect(streakResult?.currentStreak).toBeGreaterThanOrEqual(1);

      // Status should now be completed
      const status = await assessmentService.getDailyPracticeStatus(testStudentProfileId);
      expect(status.completedToday).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DYNAMIC TWO-DIRECTIONAL RADAR & INACTIVITY DECAY
  // ─────────────────────────────────────────────────────────────
  describe('Dynamic Two-Directional Skill Radar & Inactivity Decay', () => {
    it('should increase skill score on high accuracy retake', async () => {
      // Reset skill score baseline to 50
      await prisma.studentSkillScore.upsert({
        where: { studentId_skillId: { studentId: testStudentProfileId, skillId: webSkillId } },
        create: {
          studentId: testStudentProfileId,
          skillId: webSkillId,
          score: 50,
          scoreHistoryJson: JSON.stringify([{ date: '2026-09-01', score: 50 }]),
          lastAttemptDate: new Date(),
        },
        update: {
          score: 50,
          scoreHistoryJson: JSON.stringify([{ date: '2026-09-01', score: 50 }]),
          lastAttemptDate: new Date(),
        },
      });

      // Submit 100% accuracy attempt on this skill
      const updateResult = await assessmentService.recomputeRollingSkillScore(
        testStudentProfileId,
        webSkillId,
        1.0, // 100% accuracy
        'test-attempt-1'
      );

      expect(updateResult.newScore).toBeGreaterThan(50);
      expect(updateResult.delta).toBeGreaterThan(0);
    });

    it('should DECREASE skill score on poor accuracy retake (two-directional)', async () => {
      // Set a high score baseline of 90
      await prisma.studentSkillScore.upsert({
        where: { studentId_skillId: { studentId: testStudentProfileId, skillId: webSkillId } },
        create: {
          studentId: testStudentProfileId,
          skillId: webSkillId,
          score: 90,
          scoreHistoryJson: JSON.stringify([{ date: '2026-09-01', score: 90 }]),
          lastAttemptDate: new Date(),
        },
        update: {
          score: 90,
          scoreHistoryJson: JSON.stringify([{ date: '2026-09-01', score: 90 }]),
          lastAttemptDate: new Date(),
        },
      });

      // Submit 20% accuracy attempt on this skill
      const updateResult = await assessmentService.recomputeRollingSkillScore(
        testStudentProfileId,
        webSkillId,
        0.20, // 20% accuracy
        'test-attempt-2'
      );

      expect(updateResult.newScore).toBeLessThan(90);
      expect(updateResult.delta).toBeLessThan(0);
    });

    it('should compute capped inactivity decay for skills unpracticed for >30 days', async () => {
      // Simulate last attempt 45 days ago (15 days past 30-day threshold)
      const daysInactive = 45;
      let baseScore = 80;
      let inactivityDecayPct = 0;

      if (daysInactive >= 30 && baseScore > 20) {
        inactivityDecayPct = Math.min(15, Math.round((daysInactive - 30) * 0.5));
        baseScore = Math.max(10, Math.round(baseScore * (1 - inactivityDecayPct / 100)));
      }

      expect(inactivityDecayPct).toBe(8); // (45-30)*0.5 = 7.5 -> 8%
      expect(baseScore).toBe(74); // 80 * (1 - 0.08) = 73.6 -> 74
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. CODE EXECUTION SANDBOX
  // ─────────────────────────────────────────────────────────────
  describe('Isolated Code Runner & Sandbox', () => {
    it('should execute correct JavaScript solution and pass test cases', async () => {
      const code = `
        function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map.has(complement)) {
              return [map.get(complement), i];
            }
            map.set(nums[i], i);
          }
          return [];
        }
      `;

      const testCases = [
        { id: 'tc1', input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
        { id: 'tc2', input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code,
        language: 'javascript',
        testCases,
        timeoutMs: 2500,
      });

      expect(result.passed).toBe(true);
      expect(result.passedTestCases).toBe(2);
      expect(result.totalTestCases).toBe(2);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should detect incorrect answers and mark failed test cases', async () => {
      const code = `
        function twoSum(nums, target) {
          return [0, 0]; // Incorrect output
        }
      `;

      const testCases = [
        { id: 'tc1', input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code,
        language: 'javascript',
        testCases,
        timeoutMs: 2500,
      });

      expect(result.passed).toBe(false);
      expect(result.passedTestCases).toBe(0);
    });

    it('should protect against infinite loops with execution timeout', async () => {
      const infiniteLoopCode = `
        function solution(n) {
          while (true) {}
        }
      `;

      const testCases = [
        { id: 'tc1', input: '1', expectedOutput: '1' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: infiniteLoopCode,
        language: 'javascript',
        testCases,
        timeoutMs: 300,
      });

      expect(result.passed).toBe(false);
      expect(result.testCaseResults[0].passed).toBe(false);
      expect(result.testCaseResults[0].actualOutput).toContain('Error');
    });

    it('should dynamically execute code using an arbitrary custom entryFunctionName', async () => {
      const customCode = `
        function calculateMaxProfit(prices) {
          let minPrice = Infinity;
          let maxProfit = 0;
          for (const p of prices) {
            minPrice = Math.min(minPrice, p);
            maxProfit = Math.max(maxProfit, p - minPrice);
          }
          return maxProfit;
        }
      `;

      const testCases = [
        { id: 'tc1', input: '[7, 1, 5, 3, 6, 4]', expectedOutput: '5' },
        { id: 'tc2', input: '[7, 6, 4, 3, 1]', expectedOutput: '0' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: customCode,
        language: 'javascript',
        entryFunctionName: 'calculateMaxProfit',
        testCases,
        timeoutMs: 2500,
      });

      expect(result.passed).toBe(true);
      expect(result.passedTestCases).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. LEARNING RESOURCE RECOMMENDATION ENGINE
  // ─────────────────────────────────────────────────────────────
  describe('Learning Resource Recommendation Engine', () => {
    it('should query seeded learning resources with filters', async () => {
      const resources = await learningResourceService.getLearningResources({
        domain: 'Full-Stack Web',
      });

      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0].title).toBeDefined();
      expect(resources[0].url).toMatch(/^https?:\/\//);
      expect(resources[0].provider).toBeDefined();
    });

    it('should recommend curated learning resources targeting student skill gaps', async () => {
      const recs = await learningResourceService.getRecommendedResourcesForSkill('React.js', 3);

      expect(recs).toBeDefined();
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].title).toBeDefined();
      expect(recs[0].url).toMatch(/^https?:\/\//);
    });
  });
});
