import vm from 'node:vm';
import { CodeExecutionResult, TestCaseData } from '../../../shared/types.js';

interface RunCodeOptions {
  code: string;
  language?: 'javascript' | 'python' | 'typescript';
  testCases: TestCaseData[];
  timeoutMs?: number;
}

/**
 * Normalizes values for comparison (handles JSON arrays, numbers, booleans, trimmed strings)
 */
function normalizeOutput(val: any): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val).trim();
}

/**
 * Cleans string representation of expected output for comparison
 */
function cleanExpected(expectedStr: string): string {
  const trimmed = expectedStr.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed);
  } catch {
    return trimmed;
  }
}

/**
 * Executes a student code submission against a set of test cases safely in a VM sandbox.
 */
export async function executeCodeSandbox(options: RunCodeOptions): Promise<CodeExecutionResult> {
  const { code, language = 'javascript', testCases, timeoutMs = 2500 } = options;

  if (!code || code.trim().length === 0) {
    return {
      passed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      executionTimeMs: 0,
      error: 'Empty code submission. Please write a solution before running.',
      testCaseResults: testCases.map(tc => ({
        id: tc.id,
        passed: false,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'No code submitted',
        executionTimeMs: 0,
        error: 'No code submitted',
        isHidden: tc.isHidden,
      })),
    };
  }

  const logs: string[] = [];
  const testCaseResults: CodeExecutionResult['testCaseResults'] = [];
  let totalTimeMs = 0;
  let passedCount = 0;

  for (const tc of testCases) {
    const startTime = Date.now();
    let actualOutput = '';
    let tcError: string | undefined = undefined;
    let tcPassed = false;

    try {
      // Create isolated sandbox context
      const sandboxLogs: string[] = [];
      const context = vm.createContext({
        console: {
          log: (...args: any[]) => sandboxLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          warn: (...args: any[]) => sandboxLogs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
          error: (...args: any[]) => sandboxLogs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
        },
        Math,
        Number,
        String,
        Array,
        Object,
        Set,
        Map,
        RegExp,
        Date,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      });

      // Construct execution wrapper that invokes the defined function or entry point
      // If student defined a function (e.g. function twoSum(nums, target) ... or const solution = ...),
      // we inspect the sandbox for exported/defined functions and execute with tc.input
      const wrapperScript = `
        ${code}

        // Auto-detect entry function
        let __entryFn = null;
        if (typeof solution === 'function') __entryFn = solution;
        else if (typeof twoSum === 'function') __entryFn = twoSum;
        else if (typeof lengthOfLongestSubstring === 'function') __entryFn = lengthOfLongestSubstring;
        else if (typeof isPalindrome === 'function') __entryFn = isPalindrome;
        else if (typeof maxDepth === 'function') __entryFn = maxDepth;
        else if (typeof coinChange === 'function') __entryFn = coinChange;
        else if (typeof reverseList === 'function') __entryFn = reverseList;
        else if (typeof hasCycle === 'function') __entryFn = hasCycle;
        else if (typeof isValid === 'function') __entryFn = isValid;
        else if (typeof fib === 'function') __entryFn = fib;
        else {
          // Find any user-defined function in scope
          const keys = Object.keys(this).filter(k => typeof this[k] === 'function' && !['Array', 'Object', 'String', 'Number', 'Date', 'RegExp', 'Map', 'Set', 'Math'].includes(k));
          if (keys.length > 0) {
            __entryFn = this[keys[keys.length - 1]];
          }
        }

        let __result = undefined;
        if (__entryFn) {
          __result = __entryFn(${tc.input});
        }
        __result;
      `;

      const script = new vm.Script(wrapperScript);
      const rawResult = script.runInContext(context, { timeout: timeoutMs });

      if (sandboxLogs.length > 0) {
        logs.push(...sandboxLogs);
      }

      actualOutput = normalizeOutput(rawResult);
      const expectedNormalized = cleanExpected(tc.expectedOutput);
      const actualNormalized = cleanExpected(actualOutput);

      // Check equivalence
      if (actualNormalized === expectedNormalized || actualOutput === tc.expectedOutput.trim()) {
        tcPassed = true;
        passedCount++;
      } else {
        // Special case: arrays with same elements in different order or deep equals
        try {
          const aObj = JSON.parse(actualNormalized);
          const eObj = JSON.parse(expectedNormalized);
          if (JSON.stringify(aObj) === JSON.stringify(eObj)) {
            tcPassed = true;
            passedCount++;
          }
        } catch {}
      }
    } catch (err: any) {
      if (err.message && err.message.includes('timed out')) {
        tcError = `Time Limit Exceeded (${timeoutMs}ms)`;
      } else {
        tcError = err.message || String(err);
      }
      actualOutput = `Error: ${tcError}`;
    }

    const elapsed = Date.now() - startTime;
    totalTimeMs += elapsed;

    testCaseResults.push({
      id: tc.id,
      passed: tcPassed,
      input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
      expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      actualOutput: tc.isHidden ? (tcPassed ? '[Hidden - Passed]' : '[Hidden - Failed]') : actualOutput,
      executionTimeMs: elapsed,
      error: tcError,
      isHidden: tc.isHidden,
    });
  }

  const allPassed = passedCount === testCases.length && testCases.length > 0;

  return {
    passed: allPassed,
    totalTestCases: testCases.length,
    passedTestCases: passedCount,
    executionTimeMs: totalTimeMs,
    stdout: logs.join('\n'),
    testCaseResults,
  };
}
