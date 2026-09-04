import vm from 'node:vm';
import { CodeExecutionResult, TestCaseData } from '../../../shared/types.js';

/**
 * SECURITY NOTICE: Node's built-in `vm` module is designed for isolated context execution
 * within the Node process, but is NOT a full multi-tenant security barrier against prototype-
 * pollution or constructor-based sandbox escapes.
 * For production environments accepting arbitrary untrusted student code at scale, this runner
 * should be backed by containerized or microVM execution layers (e.g. Judge0, Piston, or Docker workers).
 */

interface RunCodeOptions {
  code: string;
  language?: 'javascript' | 'python' | 'typescript';
  entryFunctionName?: string;
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
  const { code, language = 'javascript', entryFunctionName, testCases, timeoutMs = 2500 } = options;

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

      // Construct execution wrapper that invokes the explicit entry function if provided,
      // or dynamically detects defined functions in scope without hardcoded whitelists.
      const targetFnEscaped = entryFunctionName ? JSON.stringify(entryFunctionName) : 'null';

      const wrapperScript = `
        ${code}

        let __entryFn = null;
        const __targetName = ${targetFnEscaped};

        if (__targetName && typeof this[__targetName] === 'function') {
          __entryFn = this[__targetName];
        } else if (__targetName) {
          try {
            const evalFn = eval(__targetName);
            if (typeof evalFn === 'function') __entryFn = evalFn;
          } catch {}
        }

        if (!__entryFn) {
          if (typeof solution === 'function') {
            __entryFn = solution;
          } else {
            // Find any user-defined function in global scope excluding standard globals
            const standardGlobals = new Set(['Array', 'Object', 'String', 'Number', 'Date', 'RegExp', 'Map', 'Set', 'Math', 'parseInt', 'parseFloat', 'isNaN', 'isFinite']);
            const keys = Object.keys(this).filter(k => typeof this[k] === 'function' && !standardGlobals.has(k));
            if (keys.length > 0) {
              __entryFn = this[keys[keys.length - 1]];
            }
          }
        }

        let __result = undefined;
        if (__entryFn) {
          __result = __entryFn(${tc.input});
        } else {
          throw new Error(__targetName ? 'Entry function "' + __targetName + '" is not defined in submitted code.' : 'No executable function found in submitted code.');
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
