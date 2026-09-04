import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Flame,
  Award,
  AlertCircle,
  HelpCircle,
  Info,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  DSAQuestionData,
  CodeExecutionResult,
  TestCaseData,
  DSAPlatform,
  DSADifficulty,
  DailyPracticeData,
  PracticeSetData,
} from '@shared/types';

interface DsaPracticeRunnerProps {
  questions: DSAQuestionData[];
  mode: 'daily' | 'custom' | 'single';
  dailyPracticeData?: DailyPracticeData;
  customSetTitle?: string;
  onExit: () => void;
  onComplete?: () => void;
}

export const DsaPracticeRunner: React.FC<DsaPracticeRunnerProps> = ({
  questions,
  mode,
  dailyPracticeData,
  customSetTitle,
  onExit,
  onComplete,
}) => {
  const queryClient = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userCodes, setUserCodes] = useState<Record<string, string>>({});
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (mode === 'daily' && dailyPracticeData?.completedQuestionIds) {
      dailyPracticeData.completedQuestionIds.forEach((id) => {
        map[id] = true;
      });
    }
    return map;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'console'>('problem');
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    status: 'success' | 'failed';
    message: string;
  } | null>(null);

  const currentQ = questions[currentIdx];

  // Timer hook
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set default starter code for current question if not yet set
  const getInitialCode = (q: DSAQuestionData) => {
    if (userCodes[q.id] !== undefined) return userCodes[q.id];
    if (typeof q.starterCode === 'string' && q.starterCode.trim()) return q.starterCode;
    if (typeof q.starterCode === 'object' && q.starterCode !== null) {
      return q.starterCode['javascript'] || q.starterCode['js'] || Object.values(q.starterCode)[0] || '';
    }
    const funcName = q.entryFunctionName || 'solve';
    return `/**\n * @param {any} input\n * @return {any}\n */\nfunction ${funcName}() {\n  // Write your solution here\n  \n}`;
  };

  const currentCode = currentQ ? (userCodes[currentQ.id] !== undefined ? userCodes[currentQ.id] : getInitialCode(currentQ)) : '';
  const testCases: TestCaseData[] = currentQ?.testCases || [];

  const handleCodeChange = (newCode: string) => {
    if (!currentQ) return;
    setUserCodes((prev) => ({ ...prev, [currentQ.id]: newCode }));
  };

  const handleResetCode = () => {
    if (!currentQ) return;
    if (window.confirm('Reset this question editor to starter code?')) {
      const initial = getInitialCode(currentQ);
      setUserCodes((prev) => ({ ...prev, [currentQ.id]: initial }));
      setExecutionResult(null);
      setSubmissionFeedback(null);
    }
  };

  // Run code against test cases in VM
  const handleRunCode = async () => {
    if (!currentQ || isRunning) return;
    setIsRunning(true);
    setActiveTab('console');
    setSubmissionFeedback(null);

    try {
      const result = await api.post<CodeExecutionResult>('/assessments/run-code', {
        code: currentCode,
        language: 'javascript',
        entryFunctionName: currentQ.entryFunctionName,
        testCases,
      });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        passed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        executionTimeMs: 0,
        testCaseResults: [],
        error: err.message || 'Execution failed. Please check syntax.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Record Attempt / Submit Solution Mutation
  const submitSolutionMutation = useMutation({
    mutationFn: async (payload: { questionId: string; status: 'SOLVED' | 'ATTEMPTED'; code: string }) => {
      if (mode === 'daily') {
        return api.post<{ dailyPractice: DailyPracticeData; streak: number }>('/dsa/daily/submit-question', {
          questionId: payload.questionId,
          status: payload.status,
          code: payload.code,
          timeSpentSeconds: 60,
        });
      } else {
        return api.post<{ attempt: any }>('/dsa/questions/' + payload.questionId + '/attempt', {
          status: payload.status,
          timeSpentSeconds: 60,
          codeSubmitted: payload.code,
          language: 'javascript',
        });
      }
    },
    onSuccess: (res: any) => {
      setCompletedMap((prev) => ({ ...prev, [currentQ.id]: true }));
      queryClient.invalidateQueries({ queryKey: ['dsaDailyPractice'] });
      queryClient.invalidateQueries({ queryKey: ['dsaProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dsaQuestions'] });
      queryClient.invalidateQueries({ queryKey: ['radarData'] });

      setSubmissionFeedback({
        status: 'success',
        message: 'Solution verified and recorded! Skill Radar & DSA progress updated.',
      });
    },
    onError: (err: any) => {
      setSubmissionFeedback({
        status: 'failed',
        message: `Submission error: ${err.message || 'Could not record attempt'}`,
      });
    },
  });

  const handleSubmitSolution = () => {
    if (!currentQ) return;
    const isPassed = executionResult?.passed === true;
    submitSolutionMutation.mutate({
      questionId: currentQ.id,
      status: isPassed ? 'SOLVED' : 'ATTEMPTED',
      code: currentCode,
    });
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const progressPct = questions.length > 0 ? Math.round((completedCount / questions.length) * 100) : 0;

  if (!currentQ) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans p-4 sm:p-6 animate-fade-in">
      {/* Sticky Top Nav Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Exit Runner"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-bridge-teal font-bold">
                {mode === 'daily'
                  ? 'Daily Mandatory Challenge'
                  : customSetTitle || 'Custom DSA Practice Set'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {questions.length} Questions
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white font-serif">
              Q{currentIdx + 1}: {currentQ.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold bg-slate-850 text-bridge-teal border border-slate-750">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeSpentSeconds)}</span>
          </div>

          {/* Progress pill */}
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            <strong className="text-white">{completedCount}</strong>/{questions.length} Solved
          </span>

          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Exit Runner
          </button>
        </div>
      </div>

      {/* Question Selector Pills Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Practice Set Progress</span>
          <span>{progressPct}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-bridge-teal to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIdx;
            const isCompleted = completedMap[q.id];
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIdx(idx);
                  setExecutionResult(null);
                  setSubmissionFeedback(null);
                  setActiveTab('problem');
                }}
                className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-bridge-teal text-slate-950 shadow-lg shadow-bridge-teal/20 scale-105'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-850 text-slate-400 border border-slate-750 hover:text-white'
                }`}
                title={`Q${idx + 1}: ${q.title}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Column Sandbox View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem Details & Constraints (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-xl max-h-[640px] overflow-y-auto">
          <div className="space-y-4">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {currentQ.platform}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  currentQ.difficulty === 'Easy'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : currentQ.difficulty === 'Medium'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {currentQ.difficulty}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-750">
                {currentQ.topic}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ~{currentQ.estimatedMinutes} Mins
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-serif">{currentQ.title}</h3>

            {/* Description */}
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-2 bg-slate-850/60 p-4 rounded-xl border border-slate-800">
              {currentQ.description || 'Implement the algorithm efficiently satisfying standard constraints.'}
            </div>

            {/* Sample Test Cases */}
            {testCases.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase">
                  Sample Test Cases ({testCases.length})
                </span>
                <div className="space-y-2">
                  {testCases.slice(0, 2).map((tc, tcIdx) => (
                    <div
                      key={tcIdx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1"
                    >
                      <div className="text-slate-400">
                        <span className="text-slate-500">Input:</span> {tc.input}
                      </div>
                      <div className="text-emerald-400">
                        <span className="text-slate-500">Expected:</span> {tc.expectedOutput}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {currentQ.tags && currentQ.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                {currentQ.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-750"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Authentic Outbound Link */}
          <div className="pt-4 border-t border-slate-800">
            <a
              href={currentQ.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-bridge-teal group-hover:scale-110 transition-transform" />
                <span>Open original problem on {currentQ.platform}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">
                Platform Page →
              </span>
            </a>
          </div>
        </div>

        {/* Right Column: Code Editor & VM Execution Console (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between overflow-hidden shadow-xl min-h-[640px]">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-850 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase">
                JavaScript ES2022
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                Isolated VM Sandbox
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCode}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
                title="Reset code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-slate-950 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Running Tests...' : 'Run Test Cases'}</span>
              </button>
            </div>
          </div>

          {/* Editor Textarea */}
          <div className="p-4 flex-1 flex flex-col">
            <textarea
              rows={14}
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="// Write your algorithmic solution here..."
              className="w-full flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-bridge-teal resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Test Runner Results & Feedback Console */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-4">
            {/* Submission feedback alert */}
            {submissionFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                  submissionFeedback.status === 'success'
                    ? 'bg-status-green/15 text-status-green border-status-green/30'
                    : 'bg-status-red/15 text-status-red border-status-red/30'
                }`}
              >
                {submissionFeedback.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{submissionFeedback.message}</span>
              </div>
            )}

            {/* Test Case Execution Output */}
            {executionResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200">
                    Test Results: {executionResult.passedTestCases} / {executionResult.totalTestCases} Passed
                  </span>
                  <span className="text-slate-400">
                    Execution Time: {executionResult.executionTimeMs}ms
                  </span>
                </div>

                {executionResult.error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
                    Runtime Error: {executionResult.error}
                  </div>
                )}

                {executionResult.testCaseResults && executionResult.testCaseResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {executionResult.testCaseResults.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className={`p-2 rounded-lg font-mono text-[11px] border ${
                          tc.passed
                            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Case {tcIdx + 1}</span>
                          <span>{tc.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                        </div>
                        {!tc.passed && tc.actualOutput !== undefined && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Got: <span className="text-rose-400">{tc.actualOutput}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions: Submit Solution & Question Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIdx((prev) => Math.max(0, prev - 1));
                    setExecutionResult(null);
                    setSubmissionFeedback(null);
                  }}
                  disabled={currentIdx === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
                    setExecutionResult(null);
                    setSubmissionFeedback(null);
                  }}
                  disabled={currentIdx === questions.length - 1}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitSolution}
                  disabled={submitSolutionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-bridge-teal to-emerald-500 hover:from-bridge-teal/90 hover:to-emerald-450 text-slate-950 text-xs font-bold shadow-lg shadow-bridge-teal/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitSolutionMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
