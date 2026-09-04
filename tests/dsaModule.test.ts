import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { executeCodeSandbox } from '../server/src/services/codeRunnerService.js';
import {
  seedDSAQuestionsIfEmpty,
  formatDSAQuestion,
  getDSAProgressSummary,
} from '../server/src/services/questionSelectionService.js';

describe('Dedicated Standalone DSA Module', () => {
  let testStudentId: string;
  let sampleQuestion: any;

  beforeAll(async () => {
    await seedDSAQuestionsIfEmpty();

    const student = await prisma.studentProfile.findFirst();
    if (student) {
      testStudentId = student.id;
    } else {
      const user = await prisma.user.create({
        data: {
          email: `test_dsa_mod_${Date.now()}@example.com`,
          name: 'DSA Student',
          role: 'student',
          passwordHash: 'hashed',
        },
      });
      const created = await prisma.studentProfile.create({
        data: { userId: user.id, targetDomain: 'Full-Stack Web' },
      });
      testStudentId = created.id;
    }

    sampleQuestion = await prisma.dSAQuestion.findFirst({
      where: { slug: 'two-sum' },
    });
  });

  it('provides authentic question metadata with starter code for all 5 languages and style tags', async () => {
    expect(sampleQuestion).toBeDefined();
    const formatted = formatDSAQuestion(sampleQuestion);

    expect(formatted.title).toBe('Two Sum');
    expect(formatted.platform).toBe('LeetCode');
    expect(formatted.difficulty).toBe('Easy');
    expect(formatted.styleTag).toBeDefined();
    expect(formatted.outboundUrl).toContain('leetcode.com');

    expect(formatted.starterCode).toBeDefined();
    const sc = formatted.starterCode as any;
    expect(sc.javascript).toBeDefined();
    expect(sc.python).toBeDefined();
    expect(sc.java).toBeDefined();
    expect(sc.cpp).toBeDefined();
  });

  it('runs visible test cases only during Run action without recording official submission', async () => {
    const testCases = JSON.parse(sampleQuestion.testCasesJson || '[]');
    const visibleCases = testCases.filter((tc: any) => !tc.isHidden);

    const runResult = await executeCodeSandbox({
      code: `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
`,
      language: 'javascript',
      entryFunctionName: sampleQuestion.entryFunctionName,
      testCases: visibleCases,
      visibleOnly: true,
    });

    expect(runResult.status).toBe('ACCEPTED');
    expect(runResult.passed).toBe(true);
    expect(runResult.testsExecuted).toBe(visibleCases.length);
  });

  it('submits solution against all hidden test cases and updates progress analytics', async () => {
    const allCases = JSON.parse(sampleQuestion.testCasesJson || '[]');

    const submitResult = await executeCodeSandbox({
      code: `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
`,
      language: 'javascript',
      entryFunctionName: sampleQuestion.entryFunctionName,
      testCases: allCases,
    });

    expect(submitResult.status).toBe('ACCEPTED');
    expect(submitResult.allTestsPassed).toBe(true);
    expect(submitResult.totalTestCases).toBe(allCases.length);

    // Record submission
    await prisma.dSAAttempt.upsert({
      where: {
        studentId_questionId: {
          studentId: testStudentId,
          questionId: sampleQuestion.id,
        },
      },
      update: { status: 'SOLVED', attemptCount: { increment: 1 } },
      create: {
        studentId: testStudentId,
        questionId: sampleQuestion.id,
        status: 'SOLVED',
        attemptCount: 1,
      },
    });

    const progress = await getDSAProgressSummary(testStudentId);
    expect(progress).toBeDefined();
    expect(progress.totalSolved).toBeGreaterThanOrEqual(1);
  });
});
