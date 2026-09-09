import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  ExternalLink,
  Code2,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { AssessmentQuestionData, CodeExecutionResult, TestCaseData, ExternalPlatformLink } from '@shared/types';

interface CodingSandboxProps {
  question: AssessmentQuestionData;
  userCode: string;
  onChangeCode: (code: string) => void;
  readOnly?: boolean;
}

export const CodingSandbox: React.FC<CodingSandboxProps> = ({
  question,
  userCode,
  onChangeCode,
  readOnly = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'console'>('problem');
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState<number>(0);

  const starterCode = question.starterCode || '// Write your solution here\nfunction solution() {\n  \n}';
  const currentCode = userCode !== undefined && userCode !== '' ? userCode : starterCode;
  const testCases: TestCaseData[] = question.testCases || [];

  const handleRunCode = async () => {
    if (readOnly || isRunning) return;
    setIsRunning(true);
    setActiveTab('console');

    try {
      const result = await api.post<CodeExecutionResult>('/assessments/run-code', {
        code: currentCode,
        language: 'javascript',
        entryFunctionName: question.entryFunctionName,
        testCases,
      });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        status: 'RUNTIME_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: null,
        executionTimeMs: 0,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        testResults: [],
        testCaseResults: [],
        error: err.message || 'Execution failed. Please verify syntax.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetCode = () => {
    if (readOnly) return;
    if (window.confirm('Reset editor to original starter code?')) {
      onChangeCode(starterCode);
      setExecutionResult(null);
    }
  };

  return (
    <div className="flex flex-col border border-[#1e293b] rounded-2xl bg-[#0b1329] shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Sandbox Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0f172a] border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Coding Sandbox & Test Runner
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                JavaScript ES2022
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Safe Isolated VM Sandbox • 2500ms Timeout Limit
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={handleResetCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1329] hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#1e293b] text-xs font-medium transition-colors"
              title="Reset starter template"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run Test Cases'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Problem Specification on Left / Editor & Console on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1e293b] min-h-[440px]">
        {/* Left Column: Problem Details & Constraints (5 cols) */}
        <div className="lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto max-h-[580px] space-y-4 bg-[#0b1329]">
          <div className="space-y-4">
            {/* Tabs for Problem & Samples */}
            <div className="flex border-b border-[#1e293b] pb-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('problem')}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'problem'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Problem Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('testcases')}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'testcases'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sample Test Cases ({testCases.filter(t => !t.isHidden).length})
              </button>
            </div>

            {activeTab === 'problem' ? (
              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b] font-sans text-sm text-slate-100 whitespace-pre-wrap">
                  {question.prompt}
                </div>

                {question.inputFormat && (
                  <div>
                    <h5 className="font-bold text-slate-200 mb-1 uppercase tracking-wider text-[10px]">
                      Input Format
                    </h5>
                    <div className="p-2.5 rounded-lg bg-[#030712] font-mono text-[11px] text-emerald-400 border border-[#1e293b]">
                      {question.inputFormat}
                    </div>
                  </div>
                )}

                {question.outputFormat && (
                  <div>
                    <h5 className="font-bold text-slate-200 mb-1 uppercase tracking-wider text-[10px]">
                      Output Format
                    </h5>
                    <div className="p-2.5 rounded-lg bg-[#030712] font-mono text-[11px] text-cyan-400 border border-[#1e293b]">
                      {question.outputFormat}
                    </div>
                  </div>
                )}

                {question.constraints && (
                  <div>
                    <h5 className="font-bold text-slate-200 mb-1 uppercase tracking-wider text-[10px]">
                      Constraints & Complexity Targets
                    </h5>
                    <div className="p-2.5 rounded-lg bg-[#030712] font-mono text-[11px] text-amber-300/90 border border-[#1e293b] whitespace-pre-line">
                      {question.constraints}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 pb-2 overflow-x-auto">
                  {testCases.map((tc, idx) => (
                    <button
                      key={tc.id || idx}
                      type="button"
                      onClick={() => setActiveTestCaseIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        activeTestCaseIdx === idx
                          ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 shadow-sm'
                          : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
                      }`}
                    >
                      Case {idx + 1} {tc.isHidden ? '(Hidden)' : ''}
                    </button>
                  ))}
                </div>

                {testCases[activeTestCaseIdx] && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-[#030712] border border-[#1e293b] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                        Input Parameters:
                      </span>
                      <div className="p-2 rounded bg-[#0b1329] text-emerald-400 border border-[#1e293b]">
                        {testCases[activeTestCaseIdx].input}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                        Expected Output:
                      </span>
                      <div className="p-2 rounded bg-[#0b1329] text-cyan-400 border border-[#1e293b]">
                        {testCases[activeTestCaseIdx].expectedOutput}
                      </div>
                    </div>

                    {testCases[activeTestCaseIdx].explanation && (
                      <p className="text-[11px] text-slate-400 font-sans italic">
                        💡 {testCases[activeTestCaseIdx].explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outbound Honest External Practice Links */}
          <div className="pt-3 border-t border-[#1e293b]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Also practice on:
              </span>
              <span className="text-[10px] font-medium text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                Phase 2 (requires partnership)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {question.externalLinks && question.externalLinks.length > 0 ? (
                question.externalLinks.map((link: ExternalPlatformLink, idx: number) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm group"
                  >
                    <span>{link.platform}</span>
                    <span className="text-slate-400 text-[11px]">({link.topic})</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="https://leetcode.com/problemset/all/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
                  >
                    <span>LeetCode</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://www.geeksforgeeks.org/explore?page=1&category=DSA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
                  >
                    <span>GeeksforGeeks</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Live Console Execution (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#030712]">
          {/* Editor Container */}
          <div className="relative flex-1 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a] border-b border-[#1e293b] text-[11px] text-slate-400 font-mono">
              <span>solution.js</span>
              <span>UTF-8 • JavaScript</span>
            </div>

            <textarea
              value={currentCode}
              onChange={e => onChangeCode(e.target.value)}
              disabled={readOnly}
              placeholder="// Write your JavaScript code here..."
              spellCheck={false}
              className="w-full flex-1 p-4 bg-[#030712] font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed selection:bg-blue-600/30"
              style={{ minHeight: '260px' }}
            />
          </div>

          {/* Execution Result & Console Panel */}
          <div className="border-t border-[#1e293b] bg-[#0b1329] p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Execution Console & Test Results
              </span>

              {executionResult && (
                <div className="flex items-center gap-2 text-xs">
                  {executionResult.passed ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      All Test Cases Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                      <XCircle className="w-3.5 h-3.5" />
                      {executionResult.passedTestCases}/{executionResult.totalTestCases} Passed
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {executionResult.executionTimeMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Console Output Detail */}
            {executionResult ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {executionResult.error && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{executionResult.error}</span>
                  </div>
                )}

                {executionResult.testCaseResults && executionResult.testCaseResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {executionResult.testCaseResults.map((tr: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                          tr.passed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>Case {idx + 1} {tr.isHidden ? '(Hidden)' : ''}</span>
                          <span>{tr.passed ? '✓ PASS' : '✗ FAIL'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Output: {tr.actualOutput}
                        </div>
                        {!tr.passed && !tr.isHidden && (
                          <div className="text-[10px] text-slate-400 truncate">
                            Expected: {tr.expectedOutput}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !executionResult.error && (
                    <p className="text-xs text-slate-400 italic">No test case breakdowns returned.</p>
                  )
                )}

                {executionResult.logs && executionResult.logs.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-[#030712] font-mono text-[11px] text-slate-300 border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Console Logs:
                    </span>
                    {executionResult.logs.map((l: string, i: number) => (
                      <div key={i} className="text-slate-300">{l}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#030712] border border-[#1e293b] text-center text-xs text-slate-500 font-mono">
                Click "Run Test Cases" above to execute your solution against test cases.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
