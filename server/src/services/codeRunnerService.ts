import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { CodeExecutionResult, TestCaseData, TestResultData, SupportedLanguage, ExecutionStatus } from '../../../shared/types.js';

const execFileAsync = promisify(execFile);

export interface RunCodeOptions {
  code: string;
  language?: SupportedLanguage | string;
  entryFunctionName?: string;
  testCases: TestCaseData[];
  timeoutMs?: number;
  visibleOnly?: boolean;
}

/**
 * Normalizes language string identifier
 */
export function normalizeLanguage(raw?: string): SupportedLanguage {
  if (!raw) return 'javascript';
  const lower = raw.trim().toLowerCase();
  if (lower === 'python' || lower === 'py' || lower === 'python3') return 'python';
  if (lower === 'cpp' || lower === 'c++' || lower === 'cplusplus') return 'cpp';
  if (lower === 'c' || lower === 'c11' || lower === 'c99') return 'c';
  if (lower === 'java' || lower === 'jdk') return 'java';
  return 'javascript';
}

/**
 * Cleans string representation of expected output for comparison
 */
export function cleanExpected(expectedStr: string): string {
  if (expectedStr === undefined || expectedStr === null) return '';
  const trimmed = String(expectedStr).trim();
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed);
  } catch {
    return trimmed;
  }
}

/**
 * Normalizes values for comparison (handles JSON arrays, numbers, booleans, trimmed strings)
 */
export function normalizeOutput(val: any): string {
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
 * Checks equality between actual and expected output
 */
export function areOutputsEqual(actualStr: string, expectedStr: string): boolean {
  const normActual = normalizeOutput(actualStr);
  const normExpected = cleanExpected(expectedStr);

  if (normActual === normExpected || normActual === expectedStr.trim()) {
    return true;
  }

  // Case-insensitive boolean comparison
  if (normActual.toLowerCase() === normExpected.toLowerCase()) {
    return true;
  }

  // JSON deep equality check
  try {
    const aObj = JSON.parse(normActual);
    const eObj = JSON.parse(normExpected);
    if (JSON.stringify(aObj) === JSON.stringify(eObj)) {
      return true;
    }
    // Set/Array unordered equality for array of arrays or set outputs
    if (Array.isArray(aObj) && Array.isArray(eObj)) {
      if (aObj.length === eObj.length) {
        const sortedA = [...aObj].sort();
        const sortedE = [...eObj].sort();
        if (JSON.stringify(sortedA) === JSON.stringify(sortedE)) {
          return true;
        }
      }
    }
  } catch {}

  return false;
}

/**
 * Cleans file paths and temp dirs from compiler / runtime stderr for student-friendly display
 */
function cleanDiagnostics(rawStderr: string, tmpDir: string): string {
  if (!rawStderr) return '';
  let cleaned = rawStderr;
  if (tmpDir) {
    const escaped = tmpDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped + '[/\\\\]?', 'g'), '');
  }
  cleaned = cleaned.replace(/^Command failed:.*?\r?\n/i, '');
  return cleaned.trim();
}

let cachedJavacCmd: string | null = null;
let cachedJavaCmd: string | null = null;

export async function getJavaBinaries(): Promise<{ javac: string; java: string }> {
  if (cachedJavacCmd && cachedJavaCmd) {
    return { javac: cachedJavacCmd, java: cachedJavaCmd };
  }

  const candidateDirs = [
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin') : null,
    'C:\\Program Files\\JetBrains\\IntelliJ IDEA 2025.2.5\\jbr\\bin',
    'C:\\Program Files\\Java\\jdk-24\\bin',
    'C:\\Program Files\\Java\\jdk-21\\bin',
    'C:\\Program Files\\Java\\jdk-17\\bin',
    'C:\\Program Files (x86)\\Java\\jdk-21\\bin',
    'C:\\Program Files (x86)\\Java\\jdk-17\\bin',
  ].filter(Boolean) as string[];

  for (const dir of candidateDirs) {
    try {
      const jc = path.join(dir, os.platform() === 'win32' ? 'javac.exe' : 'javac');
      const jv = path.join(dir, os.platform() === 'win32' ? 'java.exe' : 'java');
      await fs.access(jc);
      await fs.access(jv);
      cachedJavacCmd = jc;
      cachedJavaCmd = jv;
      return { javac: jc, java: jv };
    } catch {}
  }

  cachedJavacCmd = 'javac';
  cachedJavaCmd = 'java';
  return { javac: 'javac', java: 'java' };
}

let cachedCppCmd: string | null = null;

export async function getCppBinary(): Promise<string> {
  if (cachedCppCmd) return cachedCppCmd;

  const candidateDirs = [
    'C:\\mingw64\\bin',
    'C:\\msys64\\mingw64\\bin',
    'C:\\msys64\\ucrt64\\bin',
    'C:\\MinGW\\bin',
  ];

  for (const dir of candidateDirs) {
    try {
      const exe = path.join(dir, os.platform() === 'win32' ? 'g++.exe' : 'g++');
      await fs.access(exe);
      cachedCppCmd = exe;
      return exe;
    } catch {}
  }

  cachedCppCmd = 'g++';
  return 'g++';
}

let cachedGccCmd: string | null = null;

export async function getGccBinary(): Promise<string> {
  if (cachedGccCmd) return cachedGccCmd;

  const candidateDirs = [
    'C:\\mingw64\\bin',
    'C:\\msys64\\mingw64\\bin',
    'C:\\msys64\\ucrt64\\bin',
    'C:\\MinGW\\bin',
  ];

  for (const dir of candidateDirs) {
    try {
      const exe = path.join(dir, os.platform() === 'win32' ? 'gcc.exe' : 'gcc');
      await fs.access(exe);
      cachedGccCmd = exe;
      return exe;
    } catch {}
  }

  cachedGccCmd = 'gcc';
  return 'gcc';
}

function parseInputToCppArgs(rawInput: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < rawInput.length; i++) {
    const c = rawInput[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } else if (!inQuotes && (c === '[' || c === '{' || c === '(')) {
      depth++;
      current += c;
    } else if (!inQuotes && (c === ']' || c === '}' || c === ')')) {
      depth--;
      current += c;
    } else if (!inQuotes && c === ',' && depth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) tokens.push(current.trim());

  return tokens.map((tok) => {
    let clean = tok.replace(/^[a-zA-Z_]\w*\s*=\s*/, '').trim();
    if (clean.startsWith('[') && clean.endsWith(']')) {
      try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return 'vector<int>{}';
          if (typeof parsed[0] === 'number') {
            return `vector<int>{${parsed.join(', ')}}`;
          }
          if (typeof parsed[0] === 'string') {
            return `vector<string>{${parsed.map((s) => JSON.stringify(s)).join(', ')}}`;
          }
          if (Array.isArray(parsed[0])) {
            return `vector<vector<int>>{${parsed.map((sub) => `{${sub.join(', ')}}`).join(', ')}}`;
          }
        }
      } catch {}
    }
    if (clean.startsWith('"') && clean.endsWith('"')) {
      return `string(${clean})`;
    }
    return clean;
  });
}

/**
 * Main dispatcher for executing code in the requested language sandbox
 */
export async function executeCodeSandbox(options: RunCodeOptions): Promise<CodeExecutionResult> {
  const { code, language: rawLang = 'javascript', entryFunctionName, testCases, timeoutMs = 3000, visibleOnly } = options;
  const language = normalizeLanguage(rawLang);

  const activeTestCases = visibleOnly ? testCases.filter((tc) => !tc.isHidden) : testCases;
  const effectiveTestCases = activeTestCases.length > 0 ? activeTestCases : testCases;

  if (!code || code.trim().length === 0) {
    return {
      status: 'COMPILE_ERROR',
      passed: false,
      compilationSuccess: false,
      executionCompleted: false,
      compilationTimeMs: 0,
      executionTimeMs: null,
      testsTotal: effectiveTestCases.length,
      testsExecuted: 0,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: effectiveTestCases.length,
      passedTestCases: 0,
      failedTestCases: effectiveTestCases.length,
      language,
      error: 'Empty code submission. Please write a solution before running.',
      compilerOutput: 'Empty code submission.',
      testResults: effectiveTestCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'NOT_EXECUTED',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'No code submitted',
        executionTimeMs: 0,
        error: 'Reason: No code submitted',
        isHidden: tc.isHidden,
      })),
      testCaseResults: effectiveTestCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'NOT_EXECUTED',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'No code submitted',
        executionTimeMs: 0,
        error: 'Reason: No code submitted',
        isHidden: tc.isHidden,
      })),
    };
  }

  switch (language) {
    case 'python':
      return executePythonSandbox({ code, entryFunctionName, testCases: effectiveTestCases, timeoutMs });
    case 'cpp':
      return executeCppSandbox({ code, entryFunctionName, testCases: effectiveTestCases, timeoutMs });
    case 'c':
      return executeCSandbox({ code, entryFunctionName, testCases: effectiveTestCases, timeoutMs });
    case 'java':
      return executeJavaSandbox({ code, entryFunctionName, testCases: effectiveTestCases, timeoutMs });
    case 'javascript':
    default:
      return executeJavaScriptSandbox({ code, entryFunctionName, testCases: effectiveTestCases, timeoutMs });
  }
}

// ─────────────────────────────────────────────────────────────
// 1. JAVASCRIPT SANDBOX
// ─────────────────────────────────────────────────────────────
export async function executeJavaScriptSandbox(
  options: Omit<RunCodeOptions, 'language'>
): Promise<CodeExecutionResult> {
  const { code, entryFunctionName, testCases, timeoutMs = 2500 } = options;
  const logs: string[] = [];
  const testResults: TestResultData[] = [];
  let totalExecTimeMs = 0;
  let passedCount = 0;
  let hasRuntimeError = false;
  let hasTimeout = false;
  let executionCompleted = true;

  // Step 1: Pre-compilation / syntax validation
  const compileStart = Date.now();
  try {
    new vm.Script(code);
  } catch (compileErr: any) {
    const compileTimeMs = Date.now() - compileStart;
    const errorMsg = compileErr.stack || compileErr.message || 'Syntax Error';
    return {
      status: 'COMPILE_ERROR',
      passed: false,
      compilationSuccess: false,
      executionCompleted: false,
      compilationTimeMs: compileTimeMs,
      executionTimeMs: null,
      testsTotal: testCases.length,
      testsExecuted: 0,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      language: 'javascript',
      compilerOutput: errorMsg,
      error: `JavaScript Syntax Error:\n${errorMsg}`,
      testResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'NOT_EXECUTED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: 'Not Executed',
        executionTimeMs: 0,
        error: 'Reason: Compilation / Syntax check failed',
        isHidden: tc.isHidden,
      })),
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'NOT_EXECUTED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: 'Not Executed',
        executionTimeMs: 0,
        error: 'Reason: Compilation / Syntax check failed',
        isHidden: tc.isHidden,
      })),
    };
  }
  const compileTimeMs = Math.max(1, Date.now() - compileStart);

  // Step 2: Test execution
  for (const tc of testCases) {
    const startTime = Date.now();
    let actualOutput = '';
    let tcError: string | undefined = undefined;
    let tcPassed = false;
    let tcStatus: 'PASSED' | 'FAILED' | 'NOT_EXECUTED' = 'FAILED';

    try {
      const sandboxLogs: string[] = [];
      const context = vm.createContext({
        console: {
          log: (...args: any[]) =>
            sandboxLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          warn: (...args: any[]) => sandboxLogs.push('[WARN] ' + args.map((a) => String(a)).join(' ')),
          error: (...args: any[]) => sandboxLogs.push('[ERROR] ' + args.map((a) => String(a)).join(' ')),
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

      // Prepare input: handle key=val format e.g. "nums = [2,7,11,15], target = 9" -> "[2,7,11,15], 9"
      const rawInput = tc.input || '';
      const strippedInput = rawInput.replace(/(^|,)\s*[a-zA-Z_]\w*\s*=\s*/g, '$1 ');

      const targetFnEscaped = entryFunctionName ? JSON.stringify(entryFunctionName) : 'null';

      const wrapperScript = `
        ${code}

        let __entryFn = null;
        const __targetName = ${targetFnEscaped};

        if (__targetName && typeof this[__targetName] === 'function') {
          __entryFn = this[__targetName];
        } else if (__targetName && typeof Solution === 'function' && typeof Solution.prototype[__targetName] === 'function') {
          const __inst = new Solution();
          __entryFn = __inst[__targetName].bind(__inst);
        } else if (__targetName) {
          try {
            const evalFn = eval(__targetName);
            if (typeof evalFn === 'function') __entryFn = evalFn;
          } catch {}
        }

        if (!__entryFn) {
          if (typeof solution === 'function') {
            __entryFn = solution;
          } else if (typeof solve === 'function') {
            __entryFn = solve;
          } else {
            const standardGlobals = new Set(['Array', 'Object', 'String', 'Number', 'Date', 'RegExp', 'Map', 'Set', 'Math', 'parseInt', 'parseFloat', 'isNaN', 'isFinite']);
            const keys = Object.keys(this).filter(k => typeof this[k] === 'function' && !standardGlobals.has(k));
            if (keys.length > 0) {
              __entryFn = this[keys[keys.length - 1]];
            }
          }
        }

        let __result = undefined;
        if (__entryFn) {
          try {
            __result = __entryFn(${rawInput});
          } catch (invokeErr) {
            __result = __entryFn(${strippedInput});
          }
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

      if (areOutputsEqual(actualOutput, tc.expectedOutput)) {
        tcPassed = true;
        tcStatus = 'PASSED';
        passedCount++;
      } else {
        tcPassed = false;
        tcStatus = 'FAILED';
      }
    } catch (err: any) {
      executionCompleted = false;
      if (err.message && err.message.includes('timed out')) {
        hasTimeout = true;
        tcError = `Time Limit Exceeded (${timeoutMs}ms)`;
      } else {
        hasRuntimeError = true;
        tcError = err.message || String(err);
      }
      actualOutput = `Error: ${tcError}`;
      tcPassed = false;
      tcStatus = 'FAILED';
    }

    const elapsed = Math.max(1, Date.now() - startTime);
    totalExecTimeMs += elapsed;

    testResults.push({
      id: tc.id,
      testCaseId: tc.id,
      passed: tcPassed,
      status: tcStatus,
      input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
      expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
      actualOutput: tc.isHidden ? (tcPassed ? '[Hidden - Passed]' : '[Hidden - Failed]') : actualOutput,
      executionTimeMs: elapsed,
      error: tcError,
      isHidden: tc.isHidden,
    });
  }

  const allPassed = passedCount === testCases.length && testCases.length > 0;
  let finalStatus: ExecutionStatus = 'ACCEPTED';

  if (hasTimeout) {
    finalStatus = 'TIME_LIMIT_EXCEEDED';
  } else if (hasRuntimeError && passedCount === 0) {
    finalStatus = 'RUNTIME_ERROR';
  } else if (!allPassed) {
    finalStatus = 'WRONG_ANSWER';
  }

  return {
    status: finalStatus,
    passed: allPassed,
    compilationSuccess: true,
    executionCompleted: !hasTimeout,
    compilationTimeMs: compileTimeMs,
    executionTimeMs: totalExecTimeMs,
    testsTotal: testCases.length,
    testsExecuted: testCases.length,
    testsPassed: passedCount,
    allTestsPassed: allPassed,
    totalTestCases: testCases.length,
    passedTestCases: passedCount,
    failedTestCases: testCases.length - passedCount,
    language: 'javascript',
    stdout: logs.join('\n'),
    testResults,
    testCaseResults: testResults,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. PYTHON SANDBOX
// ─────────────────────────────────────────────────────────────
export async function executePythonSandbox(
  options: Omit<RunCodeOptions, 'language'>
): Promise<CodeExecutionResult> {
  const { code, entryFunctionName, testCases, timeoutMs = 3000 } = options;

  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillbridge-py-'));
    const userCodePath = path.join(tmpDir, 'solution.py');
    const runnerPath = path.join(tmpDir, 'runner.py');

    await fs.writeFile(userCodePath, code, 'utf8');

    // Step 1: Python compilation & syntax pre-check
    const compileStart = Date.now();
    try {
      await execFileAsync('python', ['-m', 'py_compile', userCodePath], { timeout: 4000 });
    } catch (compileErr: any) {
      const compileTimeMs = Date.now() - compileStart;
      const rawStderr = compileErr.stderr || compileErr.stdout || compileErr.message || 'Syntax Error';
      const cleaned = cleanDiagnostics(rawStderr, tmpDir);

      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'python',
        compilerOutput: cleaned,
        error: `Python Syntax Error:\n${cleaned}`,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Syntax check failed',
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Syntax check failed',
          isHidden: tc.isHidden,
        })),
      };
    }
    const compileTimeMs = Math.max(1, Date.now() - compileStart);

    // Step 2: Build isolated test runner
    const serializedTestCases = JSON.stringify(testCases);
    const targetNameJson = JSON.stringify(entryFunctionName || null);

    const harness = `
import sys, json, time, re, io

# Import user code from solution.py
try:
    import solution as user_module
except Exception as e:
    print(json.dumps({"compileError": f"Import/Syntax Error: {str(e)}"}))
    sys.exit(0)

# Resolve target entry function
entry_fn = None
target_name = ${targetNameJson}

if target_name and hasattr(user_module, target_name) and callable(getattr(user_module, target_name)):
    entry_fn = getattr(user_module, target_name)
elif hasattr(user_module, 'Solution'):
    sol_class = getattr(user_module, 'Solution')
    try:
        inst = sol_class()
        if target_name and hasattr(inst, target_name):
            entry_fn = getattr(inst, target_name)
        else:
            # find first method
            methods = [getattr(inst, m) for m in dir(inst) if not m.startswith('_') and callable(getattr(inst, m))]
            if methods:
                entry_fn = methods[0]
    except Exception:
        pass

if not entry_fn:
    if hasattr(user_module, 'solution') and callable(getattr(user_module, 'solution')):
        entry_fn = getattr(user_module, 'solution')
    elif hasattr(user_module, 'solve') and callable(getattr(user_module, 'solve')):
        entry_fn = getattr(user_module, 'solve')
    else:
        user_funcs = [getattr(user_module, k) for k in dir(user_module) if callable(getattr(user_module, k)) and not k.startswith('_')]
        if user_funcs:
            entry_fn = user_funcs[-1]

if not entry_fn:
    print(json.dumps({"compileError": f"Entry function '{target_name or 'solution'}' was not found in submitted Python code."}))
    sys.exit(0)

test_cases = ${serializedTestCases}
results = []

for tc in test_cases:
    raw_input = tc.get('input', '')
    expected = tc.get('expectedOutput', '')
    tc_id = tc.get('id')
    is_hidden = tc.get('isHidden', False)
    
    start_t = time.time()
    actual_out = None
    tc_err = None
    tc_passed = False
    
    try:
        res = None
        # Try evaluating positional arguments
        stripped = re.sub(r'(^|,\\s*)[a-zA-Z_]\\w*\\s*=\\s*', r'\\g<1>', raw_input)
        try:
            res = eval(f"entry_fn({stripped})", {'entry_fn': entry_fn, '__builtins__': __builtins__})
        except Exception:
            # Fallback to direct raw input call
            res = eval(f"entry_fn({raw_input})", {'entry_fn': entry_fn, '__builtins__': __builtins__})

        if res is None:
            actual_out = 'null'
        elif isinstance(res, bool):
            actual_out = 'true' if res else 'false'
        elif isinstance(res, (dict, list)):
            actual_out = json.dumps(res)
        else:
            actual_out = str(res)
            
        norm_expected = str(expected).strip()
        norm_actual = str(actual_out).strip()
        
        try:
            if json.loads(norm_actual) == json.loads(norm_expected):
                tc_passed = True
        except:
            if norm_actual == norm_expected or norm_actual.lower() == norm_expected.lower():
                tc_passed = True
                
    except Exception as e:
        tc_err = f"{type(e).__name__}: {str(e)}"
        actual_out = f"Error: {tc_err}"
        
    elapsed = max(1, int((time.time() - start_t) * 1000))
    results.append({
        "id": tc_id,
        "passed": tc_passed,
        "status": "PASSED" if tc_passed else "FAILED",
        "actualOutput": actual_out,
        "executionTimeMs": elapsed,
        "error": tc_err,
        "isHidden": is_hidden
    })

print(json.dumps({"results": results}))
`;

    await fs.writeFile(runnerPath, harness, 'utf8');

    const execStart = Date.now();
    const { stdout, stderr } = await execFileAsync('python', [runnerPath], {
      cwd: tmpDir,
      timeout: timeoutMs + 1500,
      maxBuffer: 1024 * 512,
    });
    const totalExecTimeMs = Math.max(1, Date.now() - execStart);

    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new Error(stderr || 'No output received from Python runtime.');
    }

    const parsedOutput = JSON.parse(trimmed);

    if (parsedOutput.compileError) {
      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'python',
        error: parsedOutput.compileError,
        compilerOutput: parsedOutput.compileError,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: parsedOutput.compileError,
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: parsedOutput.compileError,
          isHidden: tc.isHidden,
        })),
      };
    }

    const testResults: TestResultData[] = (parsedOutput.results || []).map((r: any, idx: number) => {
      const tc = testCases[idx] || {};
      const isP = Boolean(r.passed);
      return {
        id: r.id || tc.id || `tc-${idx + 1}`,
        testCaseId: r.id || tc.id || `tc-${idx + 1}`,
        passed: isP,
        status: isP ? 'PASSED' : 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? (isP ? '[Hidden - Passed]' : '[Hidden - Failed]') : r.actualOutput,
        executionTimeMs: r.executionTimeMs || 1,
        error: r.error || undefined,
        isHidden: tc.isHidden,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const allPassed = passedCount === testCases.length && testCases.length > 0;
    const hasRuntimeErr = testResults.some((r) => r.error && !r.passed);

    let finalStatus: ExecutionStatus = 'ACCEPTED';
    if (!allPassed) {
      finalStatus = hasRuntimeErr && passedCount === 0 ? 'RUNTIME_ERROR' : 'WRONG_ANSWER';
    }

    return {
      status: finalStatus,
      passed: allPassed,
      compilationSuccess: true,
      executionCompleted: true,
      compilationTimeMs: compileTimeMs,
      executionTimeMs: totalExecTimeMs,
      testsTotal: testCases.length,
      testsExecuted: testResults.length,
      testsPassed: passedCount,
      allTestsPassed: allPassed,
      totalTestCases: testCases.length,
      passedTestCases: passedCount,
      failedTestCases: testCases.length - passedCount,
      language: 'python',
      testResults,
      testCaseResults: testResults,
    };
  } catch (err: any) {
    const isTimeout = err.killed || err.signal === 'SIGTERM' || (err.message && err.message.includes('timed out'));
    let errorMessage = '';

    if (isTimeout) {
      errorMessage = `Python Time Limit Exceeded (${timeoutMs}ms)`;
    } else if (err.stderr && err.stderr.trim()) {
      errorMessage = `Python Runtime Error:\n${cleanDiagnostics(err.stderr, tmpDir)}`;
    } else {
      errorMessage = err.message || 'Python execution failed';
    }

    return {
      status: isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
      passed: false,
      compilationSuccess: true,
      executionCompleted: false,
      compilationTimeMs: 10,
      executionTimeMs: isTimeout ? timeoutMs : 0,
      testsTotal: testCases.length,
      testsExecuted: testCases.length,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      language: 'python',
      error: errorMessage,
      testResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Execution error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: errorMessage,
        isHidden: tc.isHidden,
      })),
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Execution error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: errorMessage,
        isHidden: tc.isHidden,
      })),
    };
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 3. C++ SANDBOX (G++ 17 Compiler & Diagnostic Engine)
// ─────────────────────────────────────────────────────────────
export async function executeCppSandbox(
  options: Omit<RunCodeOptions, 'language'>
): Promise<CodeExecutionResult> {
  const { code, entryFunctionName, testCases, timeoutMs = 3000 } = options;

  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillbridge-cpp-'));
    const srcPath = path.join(tmpDir, 'solution.cpp');
    const exePath = path.join(tmpDir, os.platform() === 'win32' ? 'solution.exe' : 'solution');
    const gppCmd = await getCppBinary();

    let fnName = entryFunctionName || 'solution';
    let userCode = code;

    // Detect function name from user code if not provided or default
    if (!entryFunctionName || entryFunctionName === 'solution') {
      const fnMatch = code.match(/(?:int|bool|string|vector<[\w\s,<>]+>|void)\s+([a-zA-Z_]\w*)\s*\(/);
      if (fnMatch && fnMatch[1] && fnMatch[1] !== 'main') {
        fnName = fnMatch[1];
      }
    }

    // Ensure user code has class Solution wrapper if absent
    if (!userCode.includes('class Solution')) {
      userCode = `class Solution {\npublic:\n${userCode}\n};`;
    }

    let testCasesExecCode = '';
    testCases.forEach((tc, idx) => {
      const args = parseInputToCppArgs(tc.input || '');
      const argDefs = args.map((arg, aIdx) => `auto arg_${idx}_${aIdx} = ${arg};`).join('\n        ');
      const argNames = args.map((_, aIdx) => `arg_${idx}_${aIdx}`).join(', ');

      testCasesExecCode += `
    {
        auto start_t = chrono::high_resolution_clock::now();
        string actual_out = "";
        string error_msg = "";
        bool passed = false;
        try {
            ${argDefs}
            auto res = sol.${fnName}(${argNames});
            actual_out = serialize(res);
            passed = compareOutputs(actual_out, ${JSON.stringify(tc.expectedOutput || '')});
        } catch (const exception& e) {
            error_msg = e.what();
            actual_out = "Error: " + error_msg;
        } catch (...) {
            error_msg = "Runtime Exception";
            actual_out = "Error: Runtime Exception";
        }
        auto end_t = chrono::high_resolution_clock::now();
        long long elapsed = chrono::duration_cast<chrono::milliseconds>(end_t - start_t).count();
        if (elapsed < 1) elapsed = 1;
        results.push_back({${JSON.stringify(tc.id)}, passed, actual_out, elapsed, error_msg, ${Boolean(tc.isHidden)}});
    }
      `;
    });

    const cppSource = `
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
#include <cmath>
#include <queue>
#include <stack>
#include <sstream>
#include <cstdint>
#include <map>
#include <set>
#include <chrono>

using namespace std;

// ─── USER SUBMITTED CODE ───
${userCode}
// ────────────────────────────

struct TestResultItem {
    string id;
    bool passed;
    string actualOutput;
    long long executionTimeMs;
    string error;
    bool isHidden;
};

static string trim(const string& s) {
    size_t start = s.find_first_not_of(" \\t\\n\\r");
    if (start == string::npos) return "";
    size_t end = s.find_last_not_of(" \\t\\n\\r");
    return s.substr(start, end - start + 1);
}

static string serialize(int v) { return to_string(v); }
static string serialize(long long v) { return to_string(v); }
static string serialize(double v) { return to_string(v); }
static string serialize(bool v) { return v ? "true" : "false"; }
static string serialize(const string& v) { return "\\"" + v + "\\""; }
static string serialize(const char* v) { return "\\"" + string(v) + "\\""; }
template<typename T>
static string serialize(const vector<T>& vec) {
    string res = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) res += ", ";
        res += serialize(vec[i]);
    }
    res += "]";
    return res;
}
template<typename T>
static string serialize(const vector<vector<T>>& mat) {
    string res = "[";
    for (size_t i = 0; i < mat.size(); i++) {
        if (i > 0) res += ", ";
        res += serialize(mat[i]);
    }
    res += "]";
    return res;
}

static string escapeJson(const string& s) {
    string res = "";
    for (char c : s) {
        if (c == '\\\\') res += "\\\\\\\\";
        else if (c == '\"') res += "\\\\\\\"";
        else if (c == '\\n') res += "\\\\n";
        else if (c == '\\r') res += "\\\\r";
        else if (c == '\\t') res += "\\\\t";
        else res += c;
    }
    return res;
}

static bool compareOutputs(const string& actual, const string& expected) {
    string a = trim(actual);
    string e = trim(expected);
    if (a == e) return true;
    string aClean = "", eClean = "";
    for (char c : a) if (!isspace(c)) aClean += c;
    for (char c : e) if (!isspace(c)) eClean += c;
    return aClean == eClean;
}

int main() {
    Solution sol;
    vector<TestResultItem> results;

    ${testCasesExecCode}

    cout << "{\\"results\\":[";
    for (size_t i = 0; i < results.size(); i++) {
        if (i > 0) cout << ",";
        cout << "{\\"id\\":\\"" << escapeJson(results[i].id) << "\\","
             << "\\"passed\\":" << (results[i].passed ? "true" : "false") << ","
             << "\\"status\\":\\"" << (results[i].passed ? "PASSED" : "FAILED") << "\\","
             << "\\"actualOutput\\":\\"" << escapeJson(results[i].actualOutput) << "\\","
             << "\\"executionTimeMs\\":" << results[i].executionTimeMs;
        if (!results[i].error.empty()) {
            cout << ",\\"error\\":\\"" << escapeJson(results[i].error) << "\\"";
        }
        cout << ",\\"isHidden\\":" << (results[i].isHidden ? "true" : "false") << "}";
    }
    cout << "]}" << endl;
    return 0;
}
`;

    await fs.writeFile(srcPath, cppSource, 'utf8');

    // Step 1: Compilation Phase with G++
    const compileStart = Date.now();
    try {
      await execFileAsync(gppCmd, ['-std=c++17', '-O2', srcPath, '-o', exePath], {
        timeout: 6000,
        cwd: tmpDir,
      });
    } catch (compileErr: any) {
      const compileTimeMs = Date.now() - compileStart;
      const rawStderr = compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed';
      const cleaned = cleanDiagnostics(rawStderr, tmpDir);

      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'cpp',
        compilerOutput: cleaned,
        error: `C++ Compilation Error:\n${cleaned}`,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
      };
    }
    const compileTimeMs = Math.max(1, Date.now() - compileStart);

    // Step 2: Binary Execution Phase
    const execStart = Date.now();
    const { stdout, stderr } = await execFileAsync(exePath, [], {
      timeout: timeoutMs,
      cwd: tmpDir,
    });
    const totalExecTimeMs = Math.max(1, Date.now() - execStart);

    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new Error(stderr || 'No output from C++ runtime binary');
    }

    const parsedOutput = JSON.parse(trimmed);
    const testResults: TestResultData[] = (parsedOutput.results || []).map((r: any, idx: number) => {
      const tc = testCases[idx] || {};
      const isP = Boolean(r.passed);
      return {
        id: r.id || tc.id || `tc-${idx + 1}`,
        testCaseId: r.id || tc.id || `tc-${idx + 1}`,
        passed: isP,
        status: isP ? 'PASSED' : 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? (isP ? '[Hidden - Passed]' : '[Hidden - Failed]') : r.actualOutput,
        executionTimeMs: r.executionTimeMs || 1,
        error: r.error || undefined,
        isHidden: tc.isHidden,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const allPassed = passedCount === testCases.length && testCases.length > 0;
    const hasRuntimeErr = testResults.some((r) => r.error && !r.passed);

    let finalStatus: ExecutionStatus = 'ACCEPTED';
    if (!allPassed) {
      finalStatus = hasRuntimeErr && passedCount === 0 ? 'RUNTIME_ERROR' : 'WRONG_ANSWER';
    }

    return {
      status: finalStatus,
      passed: allPassed,
      compilationSuccess: true,
      executionCompleted: true,
      compilationTimeMs: compileTimeMs,
      executionTimeMs: totalExecTimeMs,
      testsTotal: testCases.length,
      testsExecuted: testResults.length,
      testsPassed: passedCount,
      allTestsPassed: allPassed,
      totalTestCases: testCases.length,
      passedTestCases: passedCount,
      failedTestCases: testCases.length - passedCount,
      language: 'cpp',
      stdout: stdout.trim(),
      testResults,
      testCaseResults: testResults,
    };
  } catch (err: any) {
    const isTimeout = err.killed || (err.message && err.message.includes('timed out'));
    const message = isTimeout ? `C++ Time Limit Exceeded (${timeoutMs}ms)` : cleanDiagnostics(err.message || 'C++ execution failed', tmpDir);

    return {
      status: isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
      passed: false,
      compilationSuccess: true,
      executionCompleted: false,
      compilationTimeMs: 15,
      executionTimeMs: isTimeout ? timeoutMs : 0,
      testsTotal: testCases.length,
      testsExecuted: testCases.length,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      language: 'cpp',
      error: message,
      testResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
    };
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 3b. C SANDBOX (GCC 11/15 C Compiler & Diagnostic Engine)
// ─────────────────────────────────────────────────────────────
export async function executeCSandbox(
  options: Omit<RunCodeOptions, 'language'>
): Promise<CodeExecutionResult> {
  const { code, entryFunctionName, testCases, timeoutMs = 3000 } = options;

  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillbridge-c-'));
    const srcPath = path.join(tmpDir, 'solution.c');
    const exePath = path.join(tmpDir, os.platform() === 'win32' ? 'solution.exe' : 'solution');
    const gccCmd = await getGccBinary();

    let fnName = entryFunctionName || 'solution';
    let userCode = code;

    // Detect function name from user code if not provided or default
    if (!entryFunctionName || entryFunctionName === 'solution') {
      const fnMatch = code.match(/(?:int|long|long\s+long|double|float|bool|char\*|int\*|void)\s+([a-zA-Z_]\w*)\s*\(/);
      if (fnMatch && fnMatch[1] && fnMatch[1] !== 'main') {
        fnName = fnMatch[1];
      }
    }

    let testCasesExecCode = '';
    testCases.forEach((tc, idx) => {
      const args = parseInputToCppArgs(tc.input || '');
      const argDefs = args.map((arg, aIdx) => `auto arg_${idx}_${aIdx} = ${arg};`).join('\n        ');
      const argNames = args.map((_, aIdx) => `arg_${idx}_${aIdx}`).join(', ');

      testCasesExecCode += `
    {
        auto start_t = chrono::high_resolution_clock::now();
        string actual_out = "";
        string error_msg = "";
        bool passed = false;
        try {
            ${argDefs}
            auto res = ${fnName}(${argNames});
            actual_out = serialize(res);
            passed = compareOutputs(actual_out, ${JSON.stringify(tc.expectedOutput || '')});
        } catch (const exception& e) {
            error_msg = e.what();
            actual_out = "Error: " + error_msg;
        } catch (...) {
            error_msg = "Runtime Exception";
            actual_out = "Error: Runtime Exception";
        }
        auto end_t = chrono::high_resolution_clock::now();
        long long elapsed = chrono::duration_cast<chrono::milliseconds>(end_t - start_t).count();
        if (elapsed < 1) elapsed = 1;
        results.push_back({${JSON.stringify(tc.id)}, passed, actual_out, elapsed, error_msg, ${Boolean(tc.isHidden)}});
    }
      `;
    });

    const cSource = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdbool>

using namespace std;

// Definition for singly-linked list
struct ListNode {
    int val;
    ListNode *next;
};

// Definition for a binary tree node
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
};

// ─── USER SUBMITTED CODE (C / C11) ───
extern "C" {
${userCode.replace(/#include\s+<[^>]+>/g, '')}
}
// ──────────────────────────────────────

struct TestResultItem {
    string id;
    bool passed;
    string actualOutput;
    long long executionTimeMs;
    string error;
    bool isHidden;
};

static string trim(const string& s) {
    size_t start = s.find_first_not_of(" \\t\\n\\r");
    if (start == string::npos) return "";
    size_t end = s.find_last_not_of(" \\t\\n\\r");
    return s.substr(start, end - start + 1);
}

static string serialize(int v) { return to_string(v); }
static string serialize(long long v) { return to_string(v); }
static string serialize(double v) { return to_string(v); }
static string serialize(bool v) { return v ? "true" : "false"; }
static string serialize(const string& v) { return "\\"" + v + "\\""; }
static string serialize(const char* v) { return v ? ("\\"" + string(v) + "\\"") : "null"; }
template<typename T>
static string serialize(const vector<T>& vec) {
    string res = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) res += ", ";
        res += serialize(vec[i]);
    }
    res += "]";
    return res;
}

static string escapeJson(const string& s) {
    string res = "";
    for (char c : s) {
        if (c == '\\\\') res += "\\\\\\\\";
        else if (c == '\"') res += "\\\\\\\"";
        else if (c == '\\n') res += "\\\\n";
        else if (c == '\\r') res += "\\\\r";
        else if (c == '\\t') res += "\\\\t";
        else res += c;
    }
    return res;
}

static bool compareOutputs(const string& actual, const string& expected) {
    string a = trim(actual);
    string e = trim(expected);
    if (a == e) return true;
    string aClean = "", eClean = "";
    for (char c : a) if (!isspace(c)) aClean += c;
    for (char c : e) if (!isspace(c)) eClean += c;
    return aClean == eClean;
}

int main() {
    vector<TestResultItem> results;

    ${testCasesExecCode}

    cout << "{\\"results\\":[";
    for (size_t i = 0; i < results.size(); i++) {
        if (i > 0) cout << ",";
        cout << "{\\"id\\":\\"" << escapeJson(results[i].id) << "\\","
             << "\\"passed\\":" << (results[i].passed ? "true" : "false") << ","
             << "\\"status\\":\\"" << (results[i].passed ? "PASSED" : "FAILED") << "\\","
             << "\\"actualOutput\\":\\"" << escapeJson(results[i].actualOutput) << "\\","
             << "\\"executionTimeMs\\":" << results[i].executionTimeMs;
        if (!results[i].error.empty()) {
            cout << ",\\"error\\":\\"" << escapeJson(results[i].error) << "\\"";
        }
        cout << ",\\"isHidden\\":" << (results[i].isHidden ? "true" : "false") << "}";
    }
    cout << "]}" << endl;
    return 0;
}
`;

    await fs.writeFile(srcPath, cSource, 'utf8');

    // Step 1: Compilation Phase with GCC
    const compileStart = Date.now();
    try {
      const gppCmd = await getCppBinary();
      await execFileAsync(gppCmd, ['-std=c++17', '-O2', srcPath, '-o', exePath], {
        timeout: 6000,
        cwd: tmpDir,
      });
    } catch (compileErr: any) {
      const compileTimeMs = Date.now() - compileStart;
      const rawStderr = compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed';
      const cleaned = cleanDiagnostics(rawStderr, tmpDir);

      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'c',
        compilerOutput: cleaned,
        error: `C Compilation Error:\n${cleaned}`,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
      };
    }
    const compileTimeMs = Math.max(1, Date.now() - compileStart);

    // Step 2: Binary Execution Phase
    const execStart = Date.now();
    const { stdout, stderr } = await execFileAsync(exePath, [], {
      timeout: timeoutMs,
      cwd: tmpDir,
    });
    const totalExecTimeMs = Math.max(1, Date.now() - execStart);

    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new Error(stderr || 'No output from C runtime binary');
    }

    const parsedOutput = JSON.parse(trimmed);
    const testResults: TestResultData[] = (parsedOutput.results || []).map((r: any, idx: number) => {
      const tc = testCases[idx] || {};
      const isP = Boolean(r.passed);
      return {
        id: r.id || tc.id || `tc-${idx + 1}`,
        testCaseId: r.id || tc.id || `tc-${idx + 1}`,
        passed: isP,
        status: isP ? 'PASSED' : 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? (isP ? '[Hidden - Passed]' : '[Hidden - Failed]') : r.actualOutput,
        executionTimeMs: r.executionTimeMs || 1,
        error: r.error || undefined,
        isHidden: tc.isHidden,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const allPassed = passedCount === testCases.length && testCases.length > 0;
    const hasRuntimeErr = testResults.some((r) => r.error && !r.passed);

    let finalStatus: ExecutionStatus = 'ACCEPTED';
    if (!allPassed) {
      finalStatus = hasRuntimeErr && passedCount === 0 ? 'RUNTIME_ERROR' : 'WRONG_ANSWER';
    }

    return {
      status: finalStatus,
      passed: allPassed,
      compilationSuccess: true,
      executionCompleted: true,
      compilationTimeMs: compileTimeMs,
      executionTimeMs: totalExecTimeMs,
      testsTotal: testCases.length,
      testsExecuted: testResults.length,
      testsPassed: passedCount,
      allTestsPassed: allPassed,
      totalTestCases: testCases.length,
      passedTestCases: passedCount,
      failedTestCases: testCases.length - passedCount,
      language: 'c',
      stdout: stdout.trim(),
      testResults,
      testCaseResults: testResults,
    };
  } catch (err: any) {
    const isTimeout = err.killed || (err.message && err.message.includes('timed out'));
    const message = isTimeout ? `C Time Limit Exceeded (${timeoutMs}ms)` : cleanDiagnostics(err.message || 'C execution failed', tmpDir);

    return {
      status: isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
      passed: false,
      compilationSuccess: true,
      executionCompleted: false,
      compilationTimeMs: 15,
      executionTimeMs: isTimeout ? timeoutMs : 0,
      testsTotal: testCases.length,
      testsExecuted: testCases.length,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      language: 'c',
      error: message,
      testResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
    };
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 4. JAVA SANDBOX (JDK Java Compiler & Reflection Test Engine)
// ─────────────────────────────────────────────────────────────
export async function executeJavaSandbox(
  options: Omit<RunCodeOptions, 'language'>
): Promise<CodeExecutionResult> {
  const { code, entryFunctionName, testCases, timeoutMs = 3000 } = options;

  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillbridge-java-'));
    const solPath = path.join(tmpDir, 'Solution.java');
    const mainPath = path.join(tmpDir, 'Main.java');

    // 1. Prepare Solution.java
    let solutionSource = code;
    if (!solutionSource.includes('class Solution')) {
      solutionSource = `public class Solution {\n${code}\n}`;
    }

    await fs.writeFile(solPath, solutionSource, 'utf8');

    // 2. Prepare Main.java test harness with reflection & dynamic type casting
    const targetFn = entryFunctionName || '';
    const serializedTestCases = JSON.stringify(testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expectedOutput,
      isHidden: tc.isHidden,
    })));

    const mainSource = `
import java.io.*;
import java.lang.reflect.*;
import java.util.*;

public class Main {

    // Simple JSON-like tokenizer for input arrays & primitives
    private static List<String> splitTokens(String input) {
        List<String> tokens = new ArrayList<>();
        if (input == null || input.trim().isEmpty()) return tokens;

        int depth = 0;
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (!inQuotes && (c == '[' || c == '{' || c == '(')) {
                depth++;
                current.append(c);
            } else if (!inQuotes && (c == ']' || c == '}' || c == ')')) {
                depth--;
                current.append(c);
            } else if (!inQuotes && c == ',' && depth == 0) {
                tokens.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            tokens.add(current.toString().trim());
        }
        return tokens;
    }

    private static String stripVarName(String token) {
        int eqIdx = token.indexOf('=');
        if (eqIdx != -1) {
            String prefix = token.substring(0, eqIdx).trim();
            if (prefix.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
                return token.substring(eqIdx + 1).trim();
            }
        }
        return token.trim();
    }

    private static Object parseArg(String rawToken, Class<?> targetType) {
        String token = stripVarName(rawToken);

        if (targetType == int.class || targetType == Integer.class) {
            return Integer.parseInt(token);
        } else if (targetType == long.class || targetType == Long.class) {
            return Long.parseLong(token);
        } else if (targetType == double.class || targetType == Double.class) {
            return Double.parseDouble(token);
        } else if (targetType == boolean.class || targetType == Boolean.class) {
            return Boolean.parseBoolean(token);
        } else if (targetType == String.class) {
            if (token.startsWith("\\"") && token.endsWith("\\"") && token.length() >= 2) {
                return token.substring(1, token.length() - 1);
            }
            return token;
        } else if (targetType == int[].class) {
            return parseIntArray(token);
        } else if (targetType == int[][].class) {
            return parseInt2DArray(token);
        } else if (targetType == String[].class) {
            return parseStringArray(token);
        } else if (targetType == List.class) {
            return parseList(token);
        }
        return token;
    }

    private static int[] parseIntArray(String s) {
        String clean = s.replaceAll("[\\\\[\\\\]\\\\s]", "");
        if (clean.isEmpty()) return new int[0];
        String[] parts = clean.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    private static int[][] parseInt2DArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> subArrays = splitTokens(s);
        int[][] res = new int[subArrays.size()][];
        for (int i = 0; i < subArrays.size(); i++) {
            res[i] = parseIntArray(subArrays.get(i));
        }
        return res;
    }

    private static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        String[] res = new String[items.size()];
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i).trim();
            if (item.startsWith("\\"") && item.endsWith("\\"") && item.length() >= 2) {
                item = item.substring(1, item.length() - 1);
            }
            res[i] = item;
        }
        return res;
    }

    private static List<Object> parseList(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        List<Object> list = new ArrayList<>();
        for (String item : items) {
            try {
                list.add(Integer.parseInt(item.trim()));
            } catch (Exception e) {
                list.add(item.trim());
            }
        }
        return list;
    }

    private static String formatOutput(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj);
        } else if (obj instanceof Object[]) {
            return Arrays.deepToString((Object[]) obj);
        } else if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj);
        } else if (obj instanceof double[]) {
            return Arrays.toString((double[]) obj);
        } else if (obj instanceof long[]) {
            return Arrays.toString((long[]) obj);
        } else if (obj instanceof String) {
            return (String) obj;
        }
        return String.valueOf(obj);
    }

    private static boolean compareOutputs(String actual, String expected) {
        if (actual == null || expected == null) return false;
        String a = actual.trim();
        String e = expected.trim();
        if (a.equals(e)) return true;
        if (a.equalsIgnoreCase(e)) return true;

        // Clean spaces inside brackets e.g. [0,1] vs [0, 1]
        String aClean = a.replaceAll("\\\\s+", "");
        String eClean = e.replaceAll("\\\\s+", "");
        return aClean.equals(eClean);
    }

    public static void main(String[] args) {
        String targetMethodName = "${targetFn}";
        
        try {
            Class<?> solClass = Class.forName("Solution");
            Object instance = null;
            try {
                Constructor<?> ctor = solClass.getDeclaredConstructor();
                ctor.setAccessible(true);
                instance = ctor.newInstance();
            } catch (Exception ignored) {}

            Method targetMethod = null;
            Method[] methods = solClass.getDeclaredMethods();

            if (!targetMethodName.isEmpty()) {
                for (Method m : methods) {
                    if (m.getName().equals(targetMethodName) && !Modifier.isPrivate(m.getModifiers())) {
                        targetMethod = m;
                        break;
                    }
                }
            }

            if (targetMethod == null) {
                for (Method m : methods) {
                    int mod = m.getModifiers();
                    if (Modifier.isPublic(mod) || !Modifier.isPrivate(mod)) {
                        String name = m.getName();
                        if (!name.equals("main") && !name.equals("equals") && !name.equals("hashCode") && !name.equals("toString")) {
                            targetMethod = m;
                            break;
                        }
                    }
                }
            }

            if (targetMethod == null) {
                System.out.println("{\\"error\\":\\"No executable public method found in Solution class.\\"}");
                return;
            }

            targetMethod.setAccessible(true);
            Class<?>[] paramTypes = targetMethod.getParameterTypes();

            // Test cases definition
            String rawJson = ${JSON.stringify(serializedTestCases)};
            // Read test cases passed via args or embedded
            // Run tests
            StringBuilder jsonResults = new StringBuilder("[");

            // We iterate over test cases passed as standard test cases
            // Test cases are embedded in JSON format
        } catch (Exception e) {
            System.out.println("{\\"error\\":\\"Reflection error: " + e.getMessage() + "\\"}");
        }
    }
}
`;

    // Write a standalone self-contained Java Test Runner
    const testCasesCode = testCases.map((tc, idx) => {
      const escapedInput = JSON.stringify(tc.input || '');
      const escapedExpected = JSON.stringify(tc.expectedOutput || '');
      const escapedId = JSON.stringify(tc.id || `tc-${idx + 1}`);
      const isHidden = Boolean(tc.isHidden);
      return `runCase(${escapedId}, ${escapedInput}, ${escapedExpected}, ${isHidden});`;
    }).join('\n        ');

    const completeMain = `
import java.io.*;
import java.lang.reflect.*;
import java.util.*;

public class Main {

    private static List<String> splitTokens(String input) {
        List<String> tokens = new ArrayList<>();
        if (input == null || input.trim().isEmpty()) return tokens;

        int depth = 0;
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (!inQuotes && (c == '[' || c == '{' || c == '(')) {
                depth++;
                current.append(c);
            } else if (!inQuotes && (c == ']' || c == '}' || c == ')')) {
                depth--;
                current.append(c);
            } else if (!inQuotes && c == ',' && depth == 0) {
                tokens.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            tokens.add(current.toString().trim());
        }
        return tokens;
    }

    private static String stripVarName(String token) {
        int eqIdx = token.indexOf('=');
        if (eqIdx != -1) {
            String prefix = token.substring(0, eqIdx).trim();
            if (prefix.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
                return token.substring(eqIdx + 1).trim();
            }
        }
        return token.trim();
    }

    private static Object parseArg(String rawToken, Class<?> targetType) {
        String token = stripVarName(rawToken);

        if (targetType == int.class || targetType == Integer.class) {
            return Integer.parseInt(token);
        } else if (targetType == long.class || targetType == Long.class) {
            return Long.parseLong(token);
        } else if (targetType == double.class || targetType == Double.class) {
            return Double.parseDouble(token);
        } else if (targetType == boolean.class || targetType == Boolean.class) {
            return Boolean.parseBoolean(token);
        } else if (targetType == String.class) {
            if (token.startsWith("\\"") && token.endsWith("\\"") && token.length() >= 2) {
                return token.substring(1, token.length() - 1);
            }
            return token;
        } else if (targetType == int[].class) {
            return parseIntArray(token);
        } else if (targetType == int[][].class) {
            return parseInt2DArray(token);
        } else if (targetType == String[].class) {
            return parseStringArray(token);
        } else if (targetType == List.class) {
            return parseList(token);
        }
        return token;
    }

    private static int[] parseIntArray(String s) {
        String clean = s.replaceAll("[\\\\[\\\\]\\\\s]", "");
        if (clean.isEmpty()) return new int[0];
        String[] parts = clean.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    private static int[][] parseInt2DArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> subArrays = splitTokens(s);
        int[][] res = new int[subArrays.size()][];
        for (int i = 0; i < subArrays.size(); i++) {
            res[i] = parseIntArray(subArrays.get(i));
        }
        return res;
    }

    private static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        String[] res = new String[items.size()];
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i).trim();
            if (item.startsWith("\\"") && item.endsWith("\\"") && item.length() >= 2) {
                item = item.substring(1, item.length() - 1);
            }
            res[i] = item;
        }
        return res;
    }

    private static List<Object> parseList(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        List<Object> list = new ArrayList<>();
        for (String item : items) {
            try {
                list.add(Integer.parseInt(item.trim()));
            } catch (Exception e) {
                list.add(item.trim());
            }
        }
        return list;
    }

    private static String formatOutput(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj);
        } else if (obj instanceof Object[]) {
            return Arrays.deepToString((Object[]) obj);
        } else if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj);
        } else if (obj instanceof double[]) {
            return Arrays.toString((double[]) obj);
        } else if (obj instanceof long[]) {
            return Arrays.toString((long[]) obj);
        } else if (obj instanceof String) {
            return (String) obj;
        }
        return String.valueOf(obj);
    }

    private static boolean compareOutputs(String actual, String expected) {
        if (actual == null || expected == null) return false;
        String a = actual.trim();
        String e = expected.trim();
        if (a.equals(e) || a.equalsIgnoreCase(e)) return true;

        String aClean = a.replaceAll("\\\\s+", "");
        String eClean = e.replaceAll("\\\\s+", "");
        return aClean.equals(eClean);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\\\", "\\\\\\\\")
                .replace("\\"", "\\\\\\\"")
                .replace("\\b", "\\\\b")
                .replace("\\f", "\\\\f")
                .replace("\\n", "\\\\n")
                .replace("\\r", "\\\\r")
                .replace("\\t", "\\\\t");
    }

    private static Method targetMethod;
    private static Object solutionInstance;
    private static Class<?>[] paramTypes;
    private static List<String> resultsJson = new ArrayList<>();

    private static void runCase(String id, String input, String expected, boolean isHidden) {
        long start = System.currentTimeMillis();
        String actualOutput = "";
        String errorMsg = null;
        boolean passed = false;

        try {
            List<String> tokens = splitTokens(input);
            Object[] args = new Object[paramTypes.length];

            for (int i = 0; i < paramTypes.length; i++) {
                String token = i < tokens.size() ? tokens.get(i) : "";
                args[i] = parseArg(token, paramTypes[i]);
            }

            Object result = targetMethod.invoke(solutionInstance, args);
            actualOutput = formatOutput(result);
            passed = compareOutputs(actualOutput, expected);
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
            errorMsg = cause.getClass().getName() + ": " + cause.getMessage();
            actualOutput = "Error: " + errorMsg;
        } catch (Exception e) {
            errorMsg = e.getClass().getName() + ": " + e.getMessage();
            actualOutput = "Error: " + errorMsg;
        }

        long elapsed = Math.max(1, System.currentTimeMillis() - start);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\\"id\\":\\"").append(escapeJson(id)).append("\\",");
        sb.append("\\"passed\\":").append(passed).append(",");
        sb.append("\\"status\\":\\"").append(passed ? "PASSED" : "FAILED").append("\\",");
        sb.append("\\"actualOutput\\":\\"").append(escapeJson(actualOutput)).append("\\",");
        sb.append("\\"executionTimeMs\\":").append(elapsed).append(",");
        if (errorMsg != null) {
            sb.append("\\"error\\":\\"").append(escapeJson(errorMsg)).append("\\",");
        }
        sb.append("\\"isHidden\\":").append(isHidden);
        sb.append("}");
        resultsJson.add(sb.toString());
    }

    public static void main(String[] args) {
        String targetMethodName = "${targetFn}";

        try {
            Class<?> solClass = Class.forName("Solution");
            try {
                Constructor<?> ctor = solClass.getDeclaredConstructor();
                ctor.setAccessible(true);
                solutionInstance = ctor.newInstance();
            } catch (Exception ignored) {}

            Method[] methods = solClass.getDeclaredMethods();

            if (!targetMethodName.isEmpty()) {
                for (Method m : methods) {
                    if (m.getName().equals(targetMethodName) && !Modifier.isPrivate(m.getModifiers())) {
                        targetMethod = m;
                        break;
                    }
                }
            }

            if (targetMethod == null) {
                for (Method m : methods) {
                    int mod = m.getModifiers();
                    if (Modifier.isPublic(mod) || !Modifier.isPrivate(mod)) {
                        String name = m.getName();
                        if (!name.equals("main") && !name.equals("equals") && !name.equals("hashCode") && !name.equals("toString")) {
                            targetMethod = m;
                            break;
                        }
                    }
                }
            }

            if (targetMethod == null) {
                System.out.println("{\\"compileError\\":\\"No executable public method found in Solution class.\\"}");
                return;
            }

            targetMethod.setAccessible(true);
            paramTypes = targetMethod.getParameterTypes();

            // Run all test cases
            ${testCasesCode}

            System.out.println("{\\"results\\":[" + String.join(",", resultsJson) + "]}");
        } catch (Exception e) {
            System.out.println("{\\"compileError\\":\\"Reflection initialization error: " + escapeJson(e.getMessage()) + "\\"}");
        }
    }
}
`;

    await fs.writeFile(mainPath, completeMain, 'utf8');

    const { javac: javacCmd, java: javaCmd } = await getJavaBinaries();

    // Step 3: Compilation Phase (javac Solution.java Main.java)
    const compileStart = Date.now();
    try {
      await execFileAsync(javacCmd, ['-encoding', 'UTF-8', solPath, mainPath], {
        timeout: 6000,
        cwd: tmpDir,
      });
    } catch (compileErr: any) {
      const compileTimeMs = Date.now() - compileStart;
      const rawStderr = compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation failed';
      const cleaned = cleanDiagnostics(rawStderr, tmpDir);

      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'java',
        compilerOutput: cleaned,
        error: `Java Compilation Error:\n${cleaned}`,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: 'Reason: Compilation failed',
          isHidden: tc.isHidden,
        })),
      };
    }
    const compileTimeMs = Math.max(1, Date.now() - compileStart);

    // Step 4: Execution Phase (java -Xmx256m -cp . Main)
    const execStart = Date.now();
    const { stdout, stderr } = await execFileAsync(javaCmd, ['-Xmx256m', '-cp', tmpDir, 'Main'], {
      timeout: timeoutMs,
      cwd: tmpDir,
    });
    const totalExecTimeMs = Math.max(1, Date.now() - execStart);

    const trimmed = stdout.trim();
    if (!trimmed) {
      throw new Error(stderr || 'No output from Java JVM runtime');
    }

    const parsedOutput = JSON.parse(trimmed);

    if (parsedOutput.compileError) {
      return {
        status: 'COMPILE_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: compileTimeMs,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: 'java',
        compilerOutput: parsedOutput.compileError,
        error: parsedOutput.compileError,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: parsedOutput.compileError,
          isHidden: tc.isHidden,
        })),
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
          expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
          actualOutput: 'Not Executed',
          executionTimeMs: 0,
          error: parsedOutput.compileError,
          isHidden: tc.isHidden,
        })),
      };
    }

    const testResults: TestResultData[] = (parsedOutput.results || []).map((r: any, idx: number) => {
      const tc = testCases[idx] || {};
      const isP = Boolean(r.passed);
      return {
        id: r.id || tc.id || `tc-${idx + 1}`,
        testCaseId: r.id || tc.id || `tc-${idx + 1}`,
        passed: isP,
        status: isP ? 'PASSED' : 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? (isP ? '[Hidden - Passed]' : '[Hidden - Failed]') : r.actualOutput,
        executionTimeMs: r.executionTimeMs || 1,
        error: r.error || undefined,
        isHidden: tc.isHidden,
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const allPassed = passedCount === testCases.length && testCases.length > 0;
    const hasRuntimeErr = testResults.some((r) => r.error && !r.passed);

    let finalStatus: ExecutionStatus = 'ACCEPTED';
    if (!allPassed) {
      finalStatus = hasRuntimeErr && passedCount === 0 ? 'RUNTIME_ERROR' : 'WRONG_ANSWER';
    }

    return {
      status: finalStatus,
      passed: allPassed,
      compilationSuccess: true,
      executionCompleted: true,
      compilationTimeMs: compileTimeMs,
      executionTimeMs: totalExecTimeMs,
      testsTotal: testCases.length,
      testsExecuted: testResults.length,
      testsPassed: passedCount,
      allTestsPassed: allPassed,
      totalTestCases: testCases.length,
      passedTestCases: passedCount,
      failedTestCases: testCases.length - passedCount,
      language: 'java',
      testResults,
      testCaseResults: testResults,
    };
  } catch (err: any) {
    const isTimeout = err.killed || (err.message && err.message.includes('timed out'));
    const message = isTimeout ? `Java Time Limit Exceeded (${timeoutMs}ms)` : cleanDiagnostics(err.message || 'Java execution failed', tmpDir);

    return {
      status: isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
      passed: false,
      compilationSuccess: true,
      executionCompleted: false,
      compilationTimeMs: 20,
      executionTimeMs: isTimeout ? timeoutMs : 0,
      testsTotal: testCases.length,
      testsExecuted: testCases.length,
      testsPassed: 0,
      allTestsPassed: false,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      language: 'java',
      error: message,
      testResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        testCaseId: tc.id,
        passed: false,
        status: 'FAILED',
        input: tc.isHidden ? '[Hidden Test Case]' : tc.input,
        expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
        actualOutput: isTimeout ? 'Time Limit Exceeded' : 'Runtime Error',
        executionTimeMs: isTimeout ? timeoutMs : 0,
        error: message,
        isHidden: tc.isHidden,
      })),
    };
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
