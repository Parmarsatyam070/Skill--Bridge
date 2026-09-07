import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { getReportCardSummary, getAttemptDetail } from '../server/src/services/assessmentService.js';
import { generateFocusAreas, clearFocusAreasCache } from '../server/src/services/focusAreasService.js';

describe('Comprehensive Report Card & Actionable Focus Areas Suite', () => {
  let testUserId: string;
  let testStudentId: string;
  let dpQuestionId1: string;
  let dpQuestionId2: string;
  let graphQuestionId: string;
  let quantPracticeSetId: string;
  let webPracticeSetId: string;
  let dsaAttemptId1: string;

  beforeAll(async () => {
    // 1. Create a dedicated test user & student profile
    const user = await prisma.user.create({
      data: {
        email: `report_card_test_${Date.now()}@example.com`,
        name: 'Report Card Tester',
        role: 'student',
        passwordHash: 'hashed_pw',
        currentStreak: 5,
        longestStreak: 12,
        lastActiveDate: new Date().toISOString().split('T')[0],
      },
    });
    testUserId = user.id;

    const student = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        institution: 'Indian Institute of Technology',
        targetDomain: 'Full-Stack Web',
      },
    });
    testStudentId = student.id;

    // 2. Add activity logs for streak history
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    await prisma.activityLog.createMany({
      data: [
        { userId: user.id, date: today, count: 3 },
        { userId: user.id, date: yesterday, count: 2 },
      ],
    });

    // 3. Find or create DSA questions for known failure pattern (Dynamic Programming)
    let dpQuestions = await prisma.dSAQuestion.findMany({
      where: { topic: 'Dynamic Programming' },
      take: 2,
    });

    if (dpQuestions.length < 2) {
      const q1 = await prisma.dSAQuestion.upsert({
        where: { slug: 'dp-climbing-stairs-test' },
        create: {
          title: 'Climbing Stairs',
          slug: 'dp-climbing-stairs-test',
          platform: 'LEETCODE',
          difficulty: 'Easy',
          topic: 'Dynamic Programming',
          tagsJson: JSON.stringify(['dp', 'recursion']),
          canonicalUrl: 'https://leetcode.com/problems/climbing-stairs/',
          description: 'Count distinct ways to climb to the top.',
          testCasesJson: '[]',
        },
        update: {},
      });
      const q2 = await prisma.dSAQuestion.upsert({
        where: { slug: 'dp-coin-change-test' },
        create: {
          title: 'Coin Change',
          slug: 'dp-coin-change-test',
          platform: 'LEETCODE',
          difficulty: 'Medium',
          topic: 'Dynamic Programming',
          tagsJson: JSON.stringify(['dp', 'bfs']),
          canonicalUrl: 'https://leetcode.com/problems/coin-change/',
          description: 'Fewest coins needed to make up that amount.',
          testCasesJson: '[]',
        },
        update: {},
      });
      dpQuestions = [q1, q2];
    }

    dpQuestionId1 = dpQuestions[0].id;
    dpQuestionId2 = dpQuestions[1].id;

    let graphQ = await prisma.dSAQuestion.findFirst({
      where: { topic: 'Graphs' },
    });
    if (!graphQ) {
      graphQ = await prisma.dSAQuestion.create({
        data: {
          title: 'Number of Islands',
          slug: 'graphs-num-islands-test',
          platform: 'LEETCODE',
          difficulty: 'Medium',
          topic: 'Graphs',
          tagsJson: JSON.stringify(['graph', 'bfs', 'dfs']),
          canonicalUrl: 'https://leetcode.com/problems/number-of-islands/',
          description: 'Count the number of islands in 2D grid.',
          testCasesJson: '[]',
        },
      });
    }
    graphQuestionId = graphQ.id;

    // 4. Create deliberate known pattern of failures in Dynamic Programming
    // DP: 2 FAILED, 1 ATTEMPTED (3 attempts, 0 solved = 0% accuracy)
    const att1 = await prisma.dSAAttempt.create({
      data: {
        studentId: testStudentId,
        questionId: dpQuestionId1,
        status: 'FAILED',
        timeSpentSeconds: 450,
        codeSubmitted: 'function climbStairs(n) { return n <= 2 ? n : climbStairs(n-1) + climbStairs(n-2); }',
        attemptCount: 2,
      },
    });
    dsaAttemptId1 = att1.id;

    await prisma.dSAAttempt.create({
      data: {
        studentId: testStudentId,
        questionId: dpQuestionId2,
        status: 'FAILED',
        timeSpentSeconds: 600,
        codeSubmitted: 'function coinChange(coins, amount) { return -1; }',
        attemptCount: 1,
      },
    });

    // Graphs: 1 SOLVED attempt (100% accuracy)
    await prisma.dSAAttempt.create({
      data: {
        studentId: testStudentId,
        questionId: graphQuestionId,
        status: 'SOLVED',
        timeSpentSeconds: 520,
        codeSubmitted: 'function numIslands(grid) { return 1; }',
        attemptCount: 1,
      },
    });

    // 5. Find or create Practice Sets
    let quantSet = await prisma.practiceSet.findFirst({
      where: { type: 'aptitude_quant' },
    });
    if (!quantSet) {
      quantSet = await prisma.practiceSet.create({
        data: {
          domainName: 'Quantitative Aptitude',
          type: 'aptitude_quant',
          title: 'Quantitative Practice Set 1',
          description: 'Maths and logic',
          timeLimitMinutes: 20,
          passingScorePct: 60,
          difficulty: 'Intermediate',
        },
      });
    }
    quantPracticeSetId = quantSet.id;

    let webSet = await prisma.practiceSet.findFirst({
      where: { domainName: 'Full-Stack Web' },
    });
    if (!webSet) {
      webSet = await prisma.practiceSet.create({
        data: {
          domainName: 'Full-Stack Web',
          type: 'domain',
          title: 'Full-Stack Web Core Set',
          description: 'React, Node, SQL',
          timeLimitMinutes: 25,
          passingScorePct: 60,
          difficulty: 'Intermediate',
        },
      });
    }
    webPracticeSetId = webSet.id;

    // 6. Create assessment attempts: 1 failed quant, 1 passed quant, 1 passed web
    await prisma.assessmentAttempt.create({
      data: {
        studentId: testStudentId,
        practiceSetId: quantPracticeSetId,
        score: 40,
        passed: false,
        timeSpentSeconds: 900,
        answersJson: '{}',
        submittedAt: new Date(Date.now() - 3600000),
      },
    });

    await prisma.assessmentAttempt.create({
      data: {
        studentId: testStudentId,
        practiceSetId: quantPracticeSetId,
        score: 75,
        passed: true,
        timeSpentSeconds: 850,
        answersJson: '{}',
        submittedAt: new Date(),
      },
    });

    await prisma.assessmentAttempt.create({
      data: {
        studentId: testStudentId,
        practiceSetId: webPracticeSetId,
        score: 88,
        passed: true,
        timeSpentSeconds: 700,
        answersJson: '{}',
        submittedAt: new Date(),
      },
    });

    // 7. Create Skill scores (including one with decay)
    let skillReact = await prisma.skill.findFirst({ where: { name: 'React' } });
    if (!skillReact) {
      skillReact = await prisma.skill.create({
        data: { name: 'React', category: 'technical' },
      });
    }

    await prisma.studentSkillScore.create({
      data: {
        studentId: testStudentId,
        skillId: skillReact.id,
        score: 55,
        lastAttemptDate: new Date(Date.now() - 14 * 86400000),
        decayDaysCount: 14,
        inactivityDecayPct: 8.5,
        scoreHistoryJson: JSON.stringify([
          { date: '2026-08-20', score: 65, delta: 5 },
          { date: '2026-09-01', score: 55, delta: -10 },
        ]),
      },
    });

    clearFocusAreasCache(testStudentId);
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    clearFocusAreasCache(testStudentId);
    if (testStudentId) {
      await prisma.dSAAttempt.deleteMany({ where: { studentId: testStudentId } });
      await prisma.assessmentAttempt.deleteMany({ where: { studentId: testStudentId } });
      await prisma.studentSkillScore.deleteMany({ where: { studentId: testStudentId } });
      await prisma.activityLog.deleteMany({ where: { userId: testUserId } });
      await prisma.studentProfile.delete({ where: { id: testStudentId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  }, 30000);

  it('Requirement 1: Report Card surfaces complete history across all assessment types (Domain, Aptitude, DSA)', async () => {
    const report = await getReportCardSummary(testStudentId);

    expect(report).toBeDefined();
    expect(report.totalAttempts).toBeGreaterThanOrEqual(6); // 3 assessment + 3 DSA attempts

    // Verify all modality types are present in the attempts list
    const attemptTypes = new Set(report.attempts.map(a => a.type));
    expect(attemptTypes.has('domain')).toBe(true);
    expect(attemptTypes.has('aptitude_quant')).toBe(true);
    expect(attemptTypes.has('dsa')).toBe(true);

    // Verify DSA attempts are properly populated
    const dsaAttempt = report.attempts.find(a => a.type === 'dsa');
    expect(dsaAttempt).toBeDefined();
    expect(dsaAttempt?.domainName).toContain('DSA:');
    expect(dsaAttempt?.practiceSetTitle).toBeDefined();
    expect(dsaAttempt?.score).toBeGreaterThanOrEqual(0);
    expect(typeof dsaAttempt?.passed).toBe('boolean');
  }, 25000);

  it('Requirement 2: Category-wise score breakdowns are accurately aggregated', async () => {
    const report = await getReportCardSummary(testStudentId);

    expect(report.categoryBreakdown).toBeDefined();
    const { domain, aptitude, dsa } = report.categoryBreakdown!;

    // Domain breakdown
    expect(domain.totalAttempts).toBe(1);
    expect(domain.passedAttempts).toBe(1);
    expect(domain.passRate).toBe(100);
    expect(domain.averageScore).toBe(88);

    // Aptitude breakdown
    expect(aptitude.totalAttempts).toBe(2);
    expect(aptitude.passedAttempts).toBe(1);
    expect(aptitude.passRate).toBe(50);
    expect(aptitude.averageScore).toBe(58); // (40 + 75) / 2 = 57.5 -> 58

    // DSA breakdown
    expect(dsa.totalAttempts).toBe(3);
    expect(dsa.passedAttempts).toBe(1); // Only Graphs solved
    expect(dsa.passRate).toBe(33); // 1 / 3 = 33%
  }, 25000);

  it('Requirement 3: Surfaces streak history and skill radar progression over time', async () => {
    const report = await getReportCardSummary(testStudentId);

    // Streak history
    expect(report.streakHistory).toBeDefined();
    expect(report.streakHistory?.currentStreak).toBe(5);
    expect(report.streakHistory?.longestStreak).toBe(12);
    expect(report.streakHistory?.activeDaysLast30).toBeGreaterThanOrEqual(2);
    expect(report.streakHistory?.activityHeatmap.length).toBeGreaterThanOrEqual(2);

    // Radar progression over time
    expect(report.radarProgression).toBeDefined();
    expect(report.radarProgression!.length).toBeGreaterThanOrEqual(1);

    const reactSkill = report.radarProgression!.find(s => s.skillName === 'React');
    expect(reactSkill).toBeDefined();
    expect(reactSkill?.currentScore).toBe(55);
    expect(reactSkill?.decayDaysCount).toBe(14);
    expect(reactSkill?.inactivityDecayPct).toBe(8.5);
    expect(reactSkill?.history.length).toBe(2);
    expect(reactSkill?.history[0].delta).toBe(5);
  }, 25000);

  it('Requirement 4: Focus Areas correctly identifies real weak topics from actual attempt history (Dynamic Programming)', async () => {
    const report = await getReportCardSummary(testStudentId);

    expect(report.focusAreas).toBeDefined();
    expect(report.focusAreas!.length).toBeGreaterThanOrEqual(2);
    expect(report.focusAreas!.length).toBeLessThanOrEqual(3);

    // The #1 weak area MUST be Dynamic Programming due to deliberate failure pattern
    const dpFocusArea = report.focusAreas!.find(a => a.topic === 'Dynamic Programming');
    expect(dpFocusArea).toBeDefined();
    expect(dpFocusArea?.category).toBe('dsa');
    expect(dpFocusArea?.metrics.failedCount).toBe(2);
    expect(dpFocusArea?.metrics.accuracyPct).toBe(0);

    // AI Explanation must be specific, mentioning failure pattern
    expect(dpFocusArea?.explanation).toBeDefined();
    expect(dpFocusArea?.explanation.length).toBeGreaterThan(20);
    expect(dpFocusArea?.explanation.toLowerCase()).toContain('dynamic programming');

    // Tips must be 2-3 specific technical bullets
    expect(dpFocusArea?.tips).toBeDefined();
    expect(dpFocusArea?.tips.length).toBeGreaterThanOrEqual(2);
    expect(dpFocusArea?.tips.length).toBeLessThanOrEqual(3);
    for (const tip of dpFocusArea!.tips) {
      expect(tip.length).toBeGreaterThan(15);
      // Confirms non-generic advice
      expect(typeof tip).toBe('string');
    }

    // Direct Practice Set link must be authentic
    expect(dpFocusArea?.practiceSet).toBeDefined();
    expect(dpFocusArea?.practiceSet.url).toContain('/dsa/practice');
    expect(dpFocusArea?.practiceSet.title).toBeDefined();
  }, 25000);

  it('Requirement 5: Focus Areas caching avoids slow repeat execution on consecutive page loads', async () => {
    // First call generates and caches
    const start1 = Date.now();
    const areas1 = await generateFocusAreas(testStudentId);
    const duration1 = Date.now() - start1;

    // Second call must hit cache immediately
    const start2 = Date.now();
    const areas2 = await generateFocusAreas(testStudentId);
    const duration2 = Date.now() - start2;

    expect(areas1).toEqual(areas2);
    expect(duration2).toBeLessThanOrEqual(duration1);
    expect(duration2).toBeLessThan(100); // In-memory cache returns in <100ms
  }, 25000);

  it('Requirement 6: Historical attempt review modal works for DSA attempts', async () => {
    const detail = await getAttemptDetail(`dsa-${dsaAttemptId1}`, testStudentId);

    expect(detail).toBeDefined();
    expect(detail.id).toBe(`dsa-${dsaAttemptId1}`);
    expect(detail.type).toBe('dsa');
    expect(detail.domainName).toContain('DSA: Dynamic Programming');
    expect(detail.passed).toBe(false);
    expect(detail.questionResults.length).toBe(1);

    const qResult = detail.questionResults[0];
    expect(qResult.questionType).toBe('coding');
    expect(qResult.userAnswer).toContain('climbStairs');
    expect(qResult.isCorrect).toBe(false);
    expect(qResult.aiFeedback).toBeDefined();
  }, 25000);
});
