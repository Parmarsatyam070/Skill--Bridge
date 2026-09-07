import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { processChat } from '../server/src/services/aiAssistant.js';
import {
  detectDsaContext,
  checkDailyMandatoryUnattempted,
  determineDsaHintTier,
  generateDeterministicDsaGuidance,
  isSubstantiveCodeSubmission,
} from '../server/src/services/dsaTutorService.js';
import { getTodayDateString } from '../server/src/services/streakService.js';

describe('Sash Socratic DSA TA Mode & Daily Mandatory Integrity Guard Suite', { timeout: 25000 }, () => {
  let testStudentId: string;
  let testUserId: string;
  const todayDate = getTodayDateString();

  beforeAll(async () => {
    // Find or create test student
    let student = await prisma.studentProfile.findFirst({
      include: { user: true },
    });

    if (!student) {
      const user = await prisma.user.create({
        data: {
          email: `sash_dsa_test_${Date.now()}@example.com`,
          name: 'DSA Test Student',
          role: 'student',
          passwordHash: 'hashed_pw',
        },
      });
      student = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          targetDomain: 'Full-Stack Web',
        },
        include: { user: true },
      });
    }

    testStudentId = student.id;
    testUserId = student.userId;

    // Clean up any test attempts and daily practice for today
    await prisma.dSAAttempt.deleteMany({
      where: {
        studentId: testStudentId,
        questionId: { in: ['test-q-daily-1', 'two_sum', 'two-sum'] },
      },
    });

    await prisma.dailyPractice.deleteMany({
      where: {
        studentId: testStudentId,
        date: todayDate,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.dSAAttempt.deleteMany({
      where: {
        studentId: testStudentId,
        questionId: { in: ['test-q-daily-1', 'two_sum', 'two-sum'] },
      },
    });

    await prisma.dailyPractice.deleteMany({
      where: {
        studentId: testStudentId,
        date: todayDate,
      },
    });
  });

  describe('1. DSA Context Detection & Routing', () => {
    it('detects DSA context from problem names in user prompt', () => {
      const detection1 = detectDsaContext('How do I solve Two Sum?');
      expect(detection1.isDsaContext).toBe(true);
      expect(detection1.problemTitle).toBe('Two Sum');

      const detection2 = detectDsaContext('Give me a hint for Binary Search');
      expect(detection2.isDsaContext).toBe(true);
      expect(detection2.problemTitle).toBe('Binary Search');

      const detection3 = detectDsaContext('I am trying to reverse linked list');
      expect(detection3.isDsaContext).toBe(true);
      expect(detection3.problemTitle).toBe('Reverse Linked List');
    });

    it('detects DSA context from pageContext when user is on a coding route', () => {
      const detection = detectDsaContext('I am stuck on this test case', {
        path: '/dsa/problem/two-sum',
        problemTitle: 'Two Sum',
        problemId: 'two_sum',
      });
      expect(detection.isDsaContext).toBe(true);
      expect(detection.problemTitle).toBe('Two Sum');
    });

    it('returns false for non-DSA career / platform queries', () => {
      const nonDsa = detectDsaContext('What are my verified skill gaps for full-stack?');
      expect(nonDsa.isDsaContext).toBe(false);
    });
  });

  describe('2. Progressive Socratic Escalation Tiers', () => {
    it('Tier 1: Defaults to conceptual hint and refuses to dump code on initial ask', async () => {
      // Even if the user asks directly "give me the code for Two Sum", a good TA holds the line!
      const hintTier = determineDsaHintTier([], 'Give me the code for Two Sum');
      expect(hintTier).toBe(1);

      const response = await processChat(
        'How do I solve Two Sum?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        'Full-Stack Web'
      );

      // Verify Tier 1 conceptual hint characteristics
      expect(response.message).toContain('Conceptual Hint');
      expect(response.message).toContain('Hash Table');
      expect(response.message).toContain('Invariant');
      // Must NOT contain full code implementation block
      expect(response.message).not.toContain('function twoSum');
      expect(response.message).not.toContain('```typescript');
      expect(response.suggestedPrompts).toBeDefined();
      expect(response.suggestedPrompts![0]).toContain("I'm still stuck");
    });

    it('Tier 2: Reveals step-by-step approach outline when student asks for more detail / is stuck', async () => {
      const history = [
        { role: 'user', content: 'How do I solve Two Sum?' },
        {
          role: 'assistant',
          content: '### 💡 Conceptual Hint: Two Sum\nAlgorithmic Pattern: Hash Table Lookup\nCore Invariant: complement = target - x',
        },
      ];

      const hintTier = determineDsaHintTier(history, "I'm still stuck, show me the approach step by step");
      expect(hintTier).toBe(2);

      const response = await processChat(
        "I'm still stuck, show me the approach step by step",
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        history,
        'Full-Stack Web',
        { problemTitle: 'Two Sum' }
      );

      // Verify Tier 2 outline characteristics
      expect(response.message).toContain('Step-by-Step Approach Outline');
      expect(response.message).toContain('seen');
      expect(response.message).toContain('complement');
      // Still no full code function
      expect(response.message).not.toContain('function twoSum(nums: number[], target: number)');
      expect(response.suggestedPrompts![0]).toContain('code implementation');
    });

    it('Tier 3: Reveals full code implementation with complexity and edge cases only after Tier 2', async () => {
      const history = [
        { role: 'user', content: 'How do I solve Two Sum?' },
        {
          role: 'assistant',
          content: '### 💡 Conceptual Hint: Two Sum\nAlgorithmic Pattern: Hash Table Lookup\nCore Invariant: complement = target - x',
        },
        { role: 'user', content: "I'm still stuck, show me the approach step by step" },
        {
          role: 'assistant',
          content: '### 📋 Step-by-Step Approach Outline: Two Sum\n1. Initialize hash map seen\n2. Iterate through array',
        },
      ];

      const hintTier = determineDsaHintTier(history, 'Show me the code implementation');
      expect(hintTier).toBe(3);

      const response = await processChat(
        'Show me the code implementation',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        history,
        'Full-Stack Web',
        { problemTitle: 'Two Sum' }
      );

      // Verify Tier 3 code characteristics
      expect(response.message).toContain('Implementation Walkthrough');
      expect(response.message).toContain('function twoSum');
      expect(response.message).toContain('Complexity & Trade-offs');
    });
  });

  describe('3. Daily Mandatory Practice Integrity Guard', () => {
    it('blocks solution and code when the problem is in today’s unattempted Daily Mandatory practice set', async () => {
      // 1. Seed today's DailyPractice for this student containing a daily challenge
      await prisma.dailyPractice.create({
        data: {
          studentId: testStudentId,
          date: todayDate,
          questionIdsJson: JSON.stringify({
            questions: [
              {
                id: 'test-q-daily-1',
                title: 'Two Sum',
                prompt: 'Given an array of integers nums and an integer target...',
              },
            ],
          }),
          completedQuestionIdsJson: JSON.stringify([]),
          score: 0,
        },
      });

      // 2. Verify checkDailyMandatoryUnattempted correctly identifies it
      const status = await checkDailyMandatoryUnattempted(testStudentId, 'Two Sum');
      expect(status.isDailyMandatory).toBe(true);
      expect(status.hasAttempted).toBe(false);

      // 3. Request help via processChat
      const response = await processChat(
        'How do I solve Two Sum? Give me the code.',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        'Full-Stack Web',
        { problemTitle: 'Two Sum', problemId: 'test-q-daily-1' }
      );

      // 4. Verify the Daily Mandatory Integrity Guard activated
      expect(response.message).toContain('Daily Mandatory Challenge Integrity Guard');
      expect(response.message).toContain('protects the integrity of your daily challenge');
      expect(response.message).toContain('cannot reveal the direct solution or code until you have submitted an initial attempt');
      // Should give only a conceptual hint to help them start
      expect(response.message).toContain('Hash Table');
      expect(response.message).not.toContain('function twoSum');
      expect(response.suggestedPrompts).toBeDefined();
      expect(response.suggestedPrompts![0]).toContain('code editor');
    });

    it('permits standard Socratic tutoring once the student has submitted a genuine attempt in the editor', async () => {
      // 1. Ensure test question exists in DSAQuestion
      await prisma.dSAQuestion.upsert({
        where: { slug: 'test-two-sum-daily-integrity' },
        update: {},
        create: {
          id: 'test-q-daily-1',
          title: 'Two Sum',
          slug: 'test-two-sum-daily-integrity',
          platform: 'LEETCODE',
          difficulty: 'Easy',
          topic: 'Arrays',
          tagsJson: '["hash-table"]',
          canonicalUrl: 'https://leetcode.com/problems/two-sum',
        },
      });

      // 2. Record a genuine substantive attempt in DSAAttempt table
      const substantiveCode = `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) return [seen.get(comp)!, i];
    seen.set(nums[i], i);
  }
  return [];
}`;

      await prisma.dSAAttempt.upsert({
        where: { studentId_questionId: { studentId: testStudentId, questionId: 'test-q-daily-1' } },
        update: {
          codeSubmitted: substantiveCode,
          status: 'ATTEMPTED',
          timeSpentSeconds: 120,
        },
        create: {
          studentId: testStudentId,
          questionId: 'test-q-daily-1',
          codeSubmitted: substantiveCode,
          status: 'ATTEMPTED',
          timeSpentSeconds: 120,
        },
      });

      // 3. Verify checkDailyMandatoryUnattempted now reflects hasAttempted: true
      const status = await checkDailyMandatoryUnattempted(testStudentId, 'Two Sum');
      expect(status.isDailyMandatory).toBe(true);
      expect(status.hasAttempted).toBe(true);

      // 4. Ask Sash for guidance now that an attempt is submitted
      const response = await processChat(
        'How do I solve Two Sum?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        'Full-Stack Web',
        { problemTitle: 'Two Sum', problemId: 'test-q-daily-1' }
      );

      // 5. The refusal guard should NOT trigger; standard Tier 1 conceptual guidance is provided
      expect(response.message).not.toContain('🔒 **Daily Mandatory Challenge Integrity Guard**');
      expect(response.message).toContain('💡 Conceptual Hint: Two Sum');
    });
  });

  describe('4. Anti-Bypass Guard & Substantive Attempt Enforcement', () => {
    it('rejects trivial, empty, or comment-only code as non-substantive', () => {
      // Empty code
      expect(isSubstantiveCodeSubmission('')).toBe(false);
      expect(isSubstantiveCodeSubmission('   ')).toBe(false);

      // Comments only (trying to fool length check)
      expect(isSubstantiveCodeSubmission('// Just give me the answer please I really need the daily streak')).toBe(false);
      expect(isSubstantiveCodeSubmission('/* Long multiline comment that contains many words but no code */')).toBe(false);
      expect(isSubstantiveCodeSubmission('# python comment without any logic')).toBe(false);

      // Trivial empty skeletons
      expect(isSubstantiveCodeSubmission('function twoSum() {}')).toBe(false);
      expect(isSubstantiveCodeSubmission('function twoSum(nums, target) { return []; }')).toBe(false);
      expect(isSubstantiveCodeSubmission('def twoSum(nums, target):\n  pass')).toBe(false);
      expect(isSubstantiveCodeSubmission('console.log("hello world");')).toBe(false);

      // Substantive algorithmic attempt
      const realAttempt = `function twoSum(nums: number[], target: number) {
        let map = new Map();
        for (let i = 0; i < nums.length; i++) {
          let diff = target - nums[i];
          if (map.has(diff)) return [map.get(diff), i];
          map.set(nums[i], i);
        }
        return [];
      }`;
      expect(isSubstantiveCodeSubmission(realAttempt)).toBe(true);
    });

    it('explicitly blocks a student who tries to bypass the guard by submitting trivial or junk code', async () => {
      // 1. Reset daily practice to uncompleted
      await prisma.dailyPractice.update({
        where: {
          studentId_date: {
            studentId: testStudentId,
            date: todayDate,
          },
        },
        data: {
          completedQuestionIdsJson: JSON.stringify([]),
        },
      });

      // 2. Ensure test question exists in DSAQuestion
      await prisma.dSAQuestion.upsert({
        where: { slug: 'test-two-sum-daily-integrity' },
        update: {},
        create: {
          id: 'test-q-daily-1',
          title: 'Two Sum',
          slug: 'test-two-sum-daily-integrity',
          platform: 'LEETCODE',
          difficulty: 'Easy',
          topic: 'Arrays',
          tagsJson: '["hash-table"]',
          canonicalUrl: 'https://leetcode.com/problems/two-sum',
        },
      });

      // 3. Bypass Attempt 1: Student submits only comments to bypass length checks
      await prisma.dSAAttempt.upsert({
        where: { studentId_questionId: { studentId: testStudentId, questionId: 'test-q-daily-1' } },
        update: {
          codeSubmitted: '// I am submitting junk comments to trick the streak verification',
          status: 'ATTEMPTED',
        },
        create: {
          studentId: testStudentId,
          questionId: 'test-q-daily-1',
          codeSubmitted: '// I am submitting junk comments to trick the streak verification',
          status: 'ATTEMPTED',
        },
      });

      // Verify checkDailyMandatoryUnattempted detects the trivial submission and keeps hasAttempted: false
      let status = await checkDailyMandatoryUnattempted(testStudentId, 'Two Sum');
      expect(status.isDailyMandatory).toBe(true);
      expect(status.hasAttempted).toBe(false);

      // Student asks Sash for the direct solution: MUST STILL BE BLOCKED
      let response = await processChat(
        'Give me the complete code for Two Sum',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        'Full-Stack Web',
        { problemTitle: 'Two Sum', problemId: 'test-q-daily-1' }
      );

      expect(response.message).toContain('🔒 **Daily Mandatory Challenge Integrity Guard**');
      expect(response.message).toContain('cannot reveal the direct solution or code until you have submitted an initial attempt');
      expect(response.message).not.toContain('function twoSum');

      // 4. Bypass Attempt 2: Student submits empty function shell `function twoSum() {}`
      await prisma.dSAAttempt.update({
        where: { studentId_questionId: { studentId: testStudentId, questionId: 'test-q-daily-1' } },
        data: {
          codeSubmitted: 'function twoSum(nums, target) { return []; }',
          status: 'ATTEMPTED',
        },
      });

      status = await checkDailyMandatoryUnattempted(testStudentId, 'Two Sum');
      expect(status.hasAttempted).toBe(false);

      response = await processChat(
        'Show me the solution for Two Sum',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        'Full-Stack Web',
        { problemTitle: 'Two Sum', problemId: 'test-q-daily-1' }
      );

      // Still firmly blocked!
      expect(response.message).toContain('🔒 **Daily Mandatory Challenge Integrity Guard**');
      expect(response.message).not.toContain('const seen = new Map');
    });
  });
});
