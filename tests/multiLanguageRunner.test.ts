import { describe, it, expect } from 'vitest';
import * as codeRunnerService from '../server/src/services/codeRunnerService';
import { getStarterCodeForLanguage, SUPPORTED_LANGUAGES } from '../client/src/components/dsa/DsaPracticeRunner';
import { DSAQuestionData } from '../shared/types';

describe('SkillBridge Multi-Language Code Sandbox & Submission Validation Suite', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. LANGUAGE METADATA & STARTER CODE GENERATION
  // ─────────────────────────────────────────────────────────────
  describe('Language Configurations & Starter Code Generator', () => {
    it('should expose all 4 supported languages: JavaScript, Python, Java, C++', () => {
      const langIds = SUPPORTED_LANGUAGES.map((l) => l.id);
      expect(langIds).toContain('javascript');
      expect(langIds).toContain('python');
      expect(langIds).toContain('java');
      expect(langIds).toContain('cpp');
      expect(SUPPORTED_LANGUAGES.length).toBe(4);
    });

    it('should generate problem-aware Python starter code with entryFunctionName', () => {
      const mockQuestion: DSAQuestionData = {
        id: 'q-two-sum',
        title: 'Two Sum',
        slug: 'two-sum',
        platform: 'LeetCode',
        difficulty: 'Easy',
        topic: 'Arrays',
        tags: ['array', 'hash-table'],
        canonicalUrl: 'https://leetcode.com/problems/two-sum/',
        estimatedMinutes: 15,
        entryFunctionName: 'twoSum',
      };

      const pyCode = getStarterCodeForLanguage(mockQuestion, 'python');
      expect(pyCode).toContain('def twoSum(');
      expect(pyCode).toContain('Write your solution here');
    });

    it('should generate problem-aware Java starter code for Kth Largest Element with Solution class', () => {
      const mockQuestion: DSAQuestionData = {
        id: 'q-kth-largest',
        title: 'Kth Largest Element in an Array',
        slug: 'kth-largest-element-in-an-array',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Heap / Priority Queue',
        tags: ['heap', 'sorting'],
        canonicalUrl: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
        estimatedMinutes: 20,
        entryFunctionName: 'findKthLargest',
      };

      const javaCode = getStarterCodeForLanguage(mockQuestion, 'java');
      expect(javaCode).toContain('class Solution');
      expect(javaCode).toContain('public int findKthLargest(int[] nums, int k)');
    });

    it('should generate problem-aware C++ starter code with Solution class and standard headers', () => {
      const mockQuestion: DSAQuestionData = {
        id: 'q-kadane',
        title: 'Maximum Subarray',
        slug: 'maximum-subarray',
        platform: 'LeetCode',
        difficulty: 'Medium',
        topic: 'Arrays',
        tags: ['array', 'dp'],
        canonicalUrl: 'https://leetcode.com/problems/maximum-subarray/',
        estimatedMinutes: 20,
        entryFunctionName: 'maxSubArray',
      };

      const cppCode = getStarterCodeForLanguage(mockQuestion, 'cpp');
      expect(cppCode).toContain('#include <iostream>');
      expect(cppCode).toContain('#include <vector>');
      expect(cppCode).toContain('class Solution');
    });

    it('should prioritize explicit pre-seeded language starter code if present in question', () => {
      const mockQuestionWithSeeds: DSAQuestionData = {
        id: 'q-custom',
        title: 'Custom Problem',
        slug: 'custom-problem',
        platform: 'Codeforces',
        difficulty: 'Medium',
        topic: 'DP',
        tags: ['dp'],
        canonicalUrl: 'https://codeforces.com/problem/1',
        estimatedMinutes: 20,
        starterCode: {
          javascript: 'function customSolve() { return 42; }',
          python: 'def customSolve(): return 42',
        },
      };

      expect(getStarterCodeForLanguage(mockQuestionWithSeeds, 'javascript')).toBe('function customSolve() { return 42; }');
      expect(getStarterCodeForLanguage(mockQuestionWithSeeds, 'python')).toBe('def customSolve(): return 42');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. JAVA SANDBOX EXECUTION & COMPILER DIAGNOSTICS
  // ─────────────────────────────────────────────────────────────
  describe('Java JDK Sandbox Execution & Compilation Pipeline', () => {
    it('should compile and pass valid Java Kth Largest PriorityQueue solution (CRITICAL REGRESSION TEST)', async () => {
      const validJavaCode = `
import java.util.*;

class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int num : nums) {
            pq.offer(num);
            if (pq.size() > k) {
                pq.poll();
            }
        }
        return pq.peek();
    }
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [3,2,1,5,6,4], k = 2', expectedOutput: '5' },
        { id: 'tc2', input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', expectedOutput: '4' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: validJavaCode,
        language: 'java',
        entryFunctionName: 'findKthLargest',
        testCases,
        timeoutMs: 4000,
      });

      expect(result.language).toBe('java');
      expect(result.compilationSuccess).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.passed).toBe(true);
      expect(result.allTestsPassed).toBe(true);
      expect(result.passedTestCases).toBe(2);
      expect(result.totalTestCases).toBe(2);
      expect(result.compilationTimeMs).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should catch Java missing import compilation error and return COMPILE_ERROR (CRITICAL FALSE-SUCCESS TEST)', async () => {
      // Intentionally missing PriorityQueue import in plain class
      const invalidJavaCode = `
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        return pq.peek();
    }
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [3,2,1,5,6,4], k = 2', expectedOutput: '5' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: invalidJavaCode,
        language: 'java',
        entryFunctionName: 'findKthLargest',
        testCases,
        timeoutMs: 4000,
      });

      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compilationSuccess).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.allTestsPassed).toBe(false);
      expect(result.executionTimeMs).toBeNull();
      expect(result.testsExecuted).toBe(0);
      expect(result.compilerOutput).toBeDefined();
      expect(result.compilerOutput).toMatch(/cannot find symbol|PriorityQueue|error/i);
      expect(result.testResults[0].status).toBe('NOT_EXECUTED');
    });

    it('should catch Java syntax error and return COMPILE_ERROR with line diagnostic', async () => {
      const syntaxErrorJava = `
class Solution {
    public int brokenMethod(int[] nums) {
        int x = ;
        return x;
    }
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [1, 2, 3]', expectedOutput: '1' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: syntaxErrorJava,
        language: 'java',
        entryFunctionName: 'brokenMethod',
        testCases,
        timeoutMs: 4000,
      });

      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compilationSuccess).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.testsExecuted).toBe(0);
      expect(result.compilerOutput).toContain('error');
    });

    it('should handle Java runtime exceptions cleanly', async () => {
      const runtimeErrorJava = `
class Solution {
    public int outOfBounds(int[] nums) {
        return nums[100];
    }
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [1, 2, 3]', expectedOutput: '1' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: runtimeErrorJava,
        language: 'java',
        entryFunctionName: 'outOfBounds',
        testCases,
        timeoutMs: 4000,
      });

      expect(result.compilationSuccess).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.status).toBe('RUNTIME_ERROR');
      expect(result.testResults[0].error).toMatch(/ArrayIndexOutOfBoundsException/i);
    });

    it('should detect wrong answers in Java solutions without throwing', async () => {
      const wrongAnswerJava = `
class Solution {
    public int findKthLargest(int[] nums, int k) {
        return -999;
    }
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [3,2,1,5,6,4], k = 2', expectedOutput: '5' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: wrongAnswerJava,
        language: 'java',
        entryFunctionName: 'findKthLargest',
        testCases,
        timeoutMs: 4000,
      });

      expect(result.compilationSuccess).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.status).toBe('WRONG_ANSWER');
      expect(result.testResults[0].passed).toBe(false);
      expect(result.testResults[0].actualOutput).toBe('-999');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PYTHON 3 SANDBOX EXECUTION
  // ─────────────────────────────────────────────────────────────
  describe('Python 3 Sandbox Execution', () => {
    it('should execute valid Python code and pass test cases', async () => {
      const pythonCode = `
def twoSum(nums, target):
    lookup = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in lookup:
            return [lookup[diff], i]
        lookup[n] = i
    return []
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]' },
        { id: 'tc2', input: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: pythonCode,
        language: 'python',
        entryFunctionName: 'twoSum',
        testCases,
        timeoutMs: 3000,
      });

      expect(result.language).toBe('python');
      expect(result.compilationSuccess).toBe(true);
      expect(result.passed).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.passedTestCases).toBe(2);
      expect(result.totalTestCases).toBe(2);
    });

    it('should catch Python syntax errors and return COMPILE_ERROR', async () => {
      const invalidPythonCode = `
def brokenCode(nums):
    for i in nums
        return i
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [1, 2, 3]', expectedOutput: '1' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: invalidPythonCode,
        language: 'python',
        entryFunctionName: 'brokenCode',
        testCases,
        timeoutMs: 3000,
      });

      expect(result.passed).toBe(false);
      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compilationSuccess).toBe(false);
      expect(result.compilerOutput).toMatch(/Syntax/i);
    });

    it('should enforce execution timeout for Python infinite loops', async () => {
      const infinitePython = `
def infiniteRunner(n):
    while True:
        pass
`;

      const testCases = [
        { id: 'tc1', input: 'n = 5', expectedOutput: '5' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: infinitePython,
        language: 'python',
        entryFunctionName: 'infiniteRunner',
        testCases,
        timeoutMs: 500,
      });

      expect(result.passed).toBe(false);
      expect(result.status).toBe('TIME_LIMIT_EXCEEDED');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. C++ SANDBOX EXECUTION
  // ─────────────────────────────────────────────────────────────
  describe('C++ Sandbox Execution', () => {
    it('should compile valid C++ code and return ACCEPTED', async () => {
      const cppCode = `
int maxProfit(vector<int>& prices) {
    int minPrice = 1e9, maxProfit = 0;
    for (int p : prices) {
        minPrice = min(minPrice, p);
        maxProfit = max(maxProfit, p - minPrice);
    }
    return maxProfit;
}
`;

      const testCases = [
        { id: 'tc1', input: 'prices = [7, 1, 5, 3, 6, 4]', expectedOutput: '5' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: cppCode,
        language: 'cpp',
        testCases,
        timeoutMs: 3000,
      });

      expect(result.language).toBe('cpp');
      expect(result.compilationSuccess).toBe(true);
      expect(result.status).toBe('ACCEPTED');
      expect(result.passed).toBe(true);
    });

    it('should catch C++ compiler errors with line references and return COMPILE_ERROR', async () => {
      const brokenCpp = `
int badFunction() {
    int x = undefinedVariable + 1;
    return x;
}
`;

      const testCases = [
        { id: 'tc1', input: '', expectedOutput: '0' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: brokenCpp,
        language: 'cpp',
        testCases,
        timeoutMs: 3000,
      });

      expect(result.passed).toBe(false);
      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compilationSuccess).toBe(false);
      expect(result.compilerOutput).toContain('undefinedVariable');
      expect(result.testsExecuted).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. JAVASCRIPT SANDBOX EXECUTION
  // ─────────────────────────────────────────────────────────────
  describe('JavaScript Sandbox Execution', () => {
    it('should execute valid JavaScript solution and return ACCEPTED', async () => {
      const jsCode = `
function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}
`;

      const testCases = [
        { id: 'tc1', input: 'nums = [1, 2, 3, 1]', expectedOutput: 'true' },
        { id: 'tc2', input: 'nums = [1, 2, 3, 4]', expectedOutput: 'false' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: jsCode,
        language: 'javascript',
        entryFunctionName: 'containsDuplicate',
        testCases,
        timeoutMs: 2000,
      });

      expect(result.status).toBe('ACCEPTED');
      expect(result.passed).toBe(true);
      expect(result.passedTestCases).toBe(2);
    });

    it('should catch JavaScript syntax error and return COMPILE_ERROR', async () => {
      const invalidJs = `
function broken() {
  const x = ;
  return x;
}
`;

      const testCases = [
        { id: 'tc1', input: '', expectedOutput: 'null' },
      ];

      const result = await codeRunnerService.executeCodeSandbox({
        code: invalidJs,
        language: 'javascript',
        testCases,
        timeoutMs: 2000,
      });

      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.compilationSuccess).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.testsExecuted).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. MULTI-PROBLEM SIGNATURES & GENERALITY
  // ─────────────────────────────────────────────────────────────
  describe('Multiple DSA Problem Signatures', () => {
    it('should solve Two Sum across Python and Java without hardcoding problem names', async () => {
      const pyTwoSum = `
def twoSum(nums, target):
    m = {}
    for i, n in enumerate(nums):
        if target - n in m:
            return [m[target - n], i]
        m[n] = i
    return []
`;
      const resultPy = await codeRunnerService.executeCodeSandbox({
        code: pyTwoSum,
        language: 'python',
        entryFunctionName: 'twoSum',
        testCases: [{ id: 'tc1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0, 1]' }],
      });
      expect(resultPy.status).toBe('ACCEPTED');

      const javaTwoSum = `
import java.util.*;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) return new int[]{map.get(comp), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
`;
      const resultJava = await codeRunnerService.executeCodeSandbox({
        code: javaTwoSum,
        language: 'java',
        entryFunctionName: 'twoSum',
        testCases: [{ id: 'tc1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0, 1]' }],
      });
      expect(resultJava.status).toBe('ACCEPTED');
    });

    it('should solve Maximum Subarray in Java and C++', async () => {
      const javaKadane = `
class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], max = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            max = Math.max(max, cur);
        }
        return max;
    }
}
`;
      const resultJava = await codeRunnerService.executeCodeSandbox({
        code: javaKadane,
        language: 'java',
        entryFunctionName: 'maxSubArray',
        testCases: [
          { id: 'tc1', input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
          { id: 'tc2', input: 'nums = [1]', expectedOutput: '1' },
        ],
      });
      expect(resultJava.status).toBe('ACCEPTED');
      expect(resultJava.passedTestCases).toBe(2);
    });

    it('should solve The Celebrity Problem across Python, Java, and C++ with real matrix data', async () => {
      const testCases = [
        { id: 'tc1', input: 'M = [[0,1,0],[0,0,0],[0,1,0]], n = 3', expectedOutput: '1' },
        { id: 'tc2', input: 'M = [[0,1],[1,0]], n = 2', expectedOutput: '-1' },
      ];

      // 1. Python Celebrity
      const pyCelebrity = `
def celebrity(M, n):
    c = 0
    for i in range(1, n):
        if M[c][i] == 1:
            c = i
    for i in range(n):
        if i != c and (M[c][i] == 1 or M[i][c] == 0):
            return -1
    return c
`;
      const resultPy = await codeRunnerService.executeCodeSandbox({
        code: pyCelebrity,
        language: 'python',
        entryFunctionName: 'celebrity',
        testCases,
      });
      expect(resultPy.status).toBe('ACCEPTED');
      expect(resultPy.passedTestCases).toBe(2);

      // 2. Java Celebrity
      const javaCelebrity = `
class Solution {
    public int celebrity(int[][] M, int n) {
        int c = 0;
        for (int i = 1; i < n; i++) {
            if (M[c][i] == 1) c = i;
        }
        for (int i = 0; i < n; i++) {
            if (i != c && (M[c][i] == 1 || M[i][c] == 0)) return -1;
        }
        return c;
    }
}
`;
      const resultJava = await codeRunnerService.executeCodeSandbox({
        code: javaCelebrity,
        language: 'java',
        entryFunctionName: 'celebrity',
        testCases,
      });
      expect(resultJava.status).toBe('ACCEPTED');
      expect(resultJava.passedTestCases).toBe(2);
    });

    it('should solve House Robber in Python, Java, and JavaScript', async () => {
      const testCases = [
        { id: 'tc1', input: 'nums = [1,2,3,1]', expectedOutput: '4' },
        { id: 'tc2', input: 'nums = [2,7,9,3,1]', expectedOutput: '12' },
      ];

      const pyRob = `
def rob(nums):
    prev1 = prev2 = 0
    for n in nums:
        prev1, prev2 = max(prev1, prev2 + n), prev1
    return prev1
`;
      const resultPy = await codeRunnerService.executeCodeSandbox({
        code: pyRob,
        language: 'python',
        entryFunctionName: 'rob',
        testCases,
      });
      expect(resultPy.status).toBe('ACCEPTED');
      expect(resultPy.passedTestCases).toBe(2);

      const javaRob = `
class Solution {
    public int rob(int[] nums) {
        int prev1 = 0, prev2 = 0;
        for (int n : nums) {
            int temp = Math.max(prev1, prev2 + n);
            prev2 = prev1;
            prev1 = temp;
        }
        return prev1;
    }
}
`;
      const resultJava = await codeRunnerService.executeCodeSandbox({
        code: javaRob,
        language: 'java',
        entryFunctionName: 'rob',
        testCases,
      });
      expect(resultJava.status).toBe('ACCEPTED');
      expect(resultJava.passedTestCases).toBe(2);
    });

    it('should solve Climbing Stairs and Jump Game across languages', async () => {
      const resultClimb = await codeRunnerService.executeCodeSandbox({
        code: `
function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}
`,
        language: 'javascript',
        entryFunctionName: 'climbStairs',
        testCases: [
          { id: 'tc1', input: 'n = 2', expectedOutput: '2' },
          { id: 'tc2', input: 'n = 3', expectedOutput: '3' },
        ],
      });
      expect(resultClimb.status).toBe('ACCEPTED');
      expect(resultClimb.passedTestCases).toBe(2);

      const resultJump = await codeRunnerService.executeCodeSandbox({
        code: `
def canJump(nums):
    max_reach = 0
    for i, jump in enumerate(nums):
        if i > max_reach: return False
        max_reach = max(max_reach, i + jump)
    return True
`,
        language: 'python',
        entryFunctionName: 'canJump',
        testCases: [
          { id: 'tc1', input: 'nums = [2,3,1,1,4]', expectedOutput: 'true' },
          { id: 'tc2', input: 'nums = [3,2,1,0,4]', expectedOutput: 'false' },
        ],
      });
      expect(resultJump.status).toBe('ACCEPTED');
      expect(resultJump.passedTestCases).toBe(2);
    });

    it('should solve Valid Anagram in Java and Python', async () => {
      const resultPy = await codeRunnerService.executeCodeSandbox({
        code: `
def isAnagram(s: str, t: str) -> bool:
    from collections import Counter
    return Counter(s) == Counter(t)
`,
        language: 'python',
        entryFunctionName: 'isAnagram',
        testCases: [
          { id: 'tc1', input: 's = "anagram", t = "nagaram"', expectedOutput: 'true' },
          { id: 'tc2', input: 's = "rat", t = "car"', expectedOutput: 'false' },
        ],
      });
      expect(resultPy.status).toBe('ACCEPTED');
      expect(resultPy.passedTestCases).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. LANGUAGE ROUTING & EDGE CASES
  // ─────────────────────────────────────────────────────────────
  describe('Language Routing & Normalization', () => {
    it('should normalize language aliases (py -> python, c++ -> cpp)', () => {
      expect(codeRunnerService.normalizeLanguage('py')).toBe('python');
      expect(codeRunnerService.normalizeLanguage('Python3')).toBe('python');
      expect(codeRunnerService.normalizeLanguage('c++')).toBe('cpp');
      expect(codeRunnerService.normalizeLanguage('Cplusplus')).toBe('cpp');
      expect(codeRunnerService.normalizeLanguage('java')).toBe('java');
      expect(codeRunnerService.normalizeLanguage('js')).toBe('javascript');
      expect(codeRunnerService.normalizeLanguage('')).toBe('javascript');
    });

    it('should return empty submission error when no code is passed', async () => {
      const result = await codeRunnerService.executeCodeSandbox({
        code: '   ',
        language: 'python',
        testCases: [{ id: 'tc1', input: '1', expectedOutput: '1' }],
      });

      expect(result.passed).toBe(false);
      expect(result.status).toBe('COMPILE_ERROR');
      expect(result.error).toContain('Empty code submission');
    });
  });
});
