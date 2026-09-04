import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  getOrCreateDailyMixedPractice,
  submitDailyMixedPractice,
} from '../server/src/services/dailyMixedPracticeService.js';
import { executeCodeSandbox } from '../server/src/services/codeRunnerService.js';

describe('Daily Mixed Practice Set & Standalone Code Runner', () => {
  let testStudentId: string;

  beforeAll(async () => {
    // Find or create test student profile
    const student = await prisma.studentProfile.findFirst({
      include: { user: true },
    });
    if (student) {
      testStudentId = student.id;
    } else {
      const user = await prisma.user.create({
        data: {
          email: `test_mixed_${Date.now()}@example.com`,
          name: 'Mixed Test Student',
          role: 'student',
          passwordHash: 'hashed',
        },
      });
      const createdStudent = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          targetDomain: 'Full-Stack Web',
        },
      });
      testStudentId = createdStudent.id;
    }
  });

  it('generates a mixed daily set containing Aptitude, Domain, and DSA questions', async () => {
    const testDate = `2099-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    const mixedSet = await getOrCreateDailyMixedPractice(testStudentId, testDate);

    expect(mixedSet).toBeDefined();
    expect(mixedSet.totalQuestions).toBeGreaterThanOrEqual(15);
    expect(mixedSet.questions.length).toBe(mixedSet.totalQuestions);

    // Verify source types presence
    const aptQs = mixedSet.questions.filter((q) => q.sourceType === 'aptitude');
    const domQs = mixedSet.questions.filter((q) => q.sourceType === 'domain');
    const dsaQs = mixedSet.questions.filter((q) => q.sourceType === 'dsa');

    expect(aptQs.length).toBeGreaterThan(0);
    expect(domQs.length).toBeGreaterThan(0);
    expect(dsaQs.length).toBeGreaterThan(0);

    // Verify question items do not leak correct answer options
    aptQs.forEach((q) => {
      if (q.options) {
        q.options.forEach((opt: any) => {
          expect(opt.isCorrect).toBeUndefined();
        });
      }
    });

    // Verify DSA questions contain authentic starter code and style tags
    dsaQs.forEach((q) => {
      expect(q.questionType).toBe('coding');
      expect(q.styleTag).toBeDefined();
      expect(q.outboundUrl).toBeDefined();
    });
  });

  it('submits a daily mixed set and returns per-category score breakdowns', async () => {
    const testDate = `2099-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    const mixedSet = await getOrCreateDailyMixedPractice(testStudentId, testDate);

    // Prepare simulated answers
    const answers: Record<string, string> = {};
    const writtenAnswers: Record<string, string> = {};
    const codingAnswers: Record<string, { code: string; language: string }> = {};

    mixedSet.questions.forEach((q) => {
      if (q.questionType === 'mcq' && q.options && q.options.length > 0) {
        answers[q.id] = q.options[0].id;
      } else if (q.questionType === 'written') {
        writtenAnswers[q.id] = 'Comprehensive architectural answer covering state management, performance, and API design.';
      } else if (q.questionType === 'coding') {
        codingAnswers[q.id] = {
          code: typeof q.starterCode === 'object' ? (q.starterCode as any)?.javascript || '' : '',
          language: 'javascript',
        };
      }
    });

    const submitResult = await submitDailyMixedPractice(testStudentId, {
      answers,
      writtenAnswers,
      codingAnswers,
      timeSpentSeconds: 900,
      date: testDate,
    });

    expect(submitResult).toBeDefined();
    expect(submitResult.categoryBreakdown).toBeDefined();
    expect(submitResult.categoryBreakdown.aptitude).toBeDefined();
    expect(submitResult.categoryBreakdown.domain).toBeDefined();
    expect(submitResult.categoryBreakdown.dsa).toBeDefined();

    expect(typeof submitResult.categoryBreakdown.aptitude.score).toBe('number');
    expect(typeof submitResult.categoryBreakdown.domain.score).toBe('number');
    expect(typeof submitResult.categoryBreakdown.dsa.score).toBe('number');

    expect(submitResult.questionResults.length).toBe(mixedSet.questions.length);
  });

  it('compiles and executes C (C11) code with gcc in codeRunnerService', async () => {
    const cResult = await executeCodeSandbox({
      code: `
#include <stdio.h>
#include <stdbool.h>

int twoSum(vector<int>& nums, int target) {
    for (size_t i = 0; i < nums.size(); i++) {
        for (size_t j = i + 1; j < nums.size(); j++) {
            if (nums[i] + nums[j] == target) return (int)i + (int)j;
        }
    }
    return 0;
}
`,
      language: 'c',
      entryFunctionName: 'twoSum',
      testCases: [
        { id: 'tc-1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '1' },
      ],
    });

    expect(cResult.compilationSuccess).toBe(true);
    expect(cResult.language).toBe('c');
    expect(cResult.testResults.length).toBe(1);
  }, 15000);
});
