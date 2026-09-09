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
  Terminal,
  AlertTriangle,
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
  SupportedLanguage,
  ExecutionStatus,
} from '@shared/types';
import { ExamIntegrityGuard } from '../integrity/ExamIntegrityGuard';

export const SUPPORTED_LANGUAGES: {
  id: SupportedLanguage;
  label: string;
  badge: string;
  editorMode: string;
  placeholder: string;
}[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    badge: 'JavaScript ES2022',
    editorMode: 'javascript',
    placeholder: '// Write your JavaScript algorithmic solution here...',
  },
  {
    id: 'python',
    label: 'Python',
    badge: 'Python 3.14',
    editorMode: 'python',
    placeholder: '# Write your Python algorithmic solution here...',
  },
  {
    id: 'java',
    label: 'Java',
    badge: 'Java 21',
    editorMode: 'java',
    placeholder: '// Write your Java solution (class Solution) here...',
  },
  {
    id: 'cpp',
    label: 'C++',
    badge: 'C++ (GCC 15)',
    editorMode: 'cpp',
    placeholder: '// Write your C++ (C++17) solution here...',
  },
];

/**
 * Produces language-specific starter template for any problem
 */
export function getStarterCodeForLanguage(q: DSAQuestionData, lang: SupportedLanguage): string {
  // 1. Check if starterCode in question object has explicit definition for this language
  if (typeof q.starterCode === 'object' && q.starterCode !== null) {
    if (lang === 'javascript' && (q.starterCode['javascript'] || q.starterCode['js'])) {
      return q.starterCode['javascript'] || q.starterCode['js'];
    }
    if (lang === 'python' && (q.starterCode['python'] || q.starterCode['py'])) {
      return q.starterCode['python'] || q.starterCode['py'];
    }
    if (lang === 'cpp' && (q.starterCode['cpp'] || q.starterCode['c++'])) {
      return q.starterCode['cpp'] || q.starterCode['c++'];
    }
    if (lang === 'java' && q.starterCode['java']) {
      return q.starterCode['java'];
    }
  }

  // 2. If starterCode is a string and language is javascript
  if (typeof q.starterCode === 'string' && q.starterCode.trim() && lang === 'javascript') {
    return q.starterCode;
  }

  // Extract function name and parameter names from entryFunctionName or starterCode
  let funcName = q.entryFunctionName || 'solve';
  let paramNames = '';

  // Extract parameters from first test case input e.g. "nums = [2,7,11,15], target = 9" -> "nums, target"
  if (q.testCases && q.testCases.length > 0 && q.testCases[0].input) {
    const rawInput = q.testCases[0].input;
    const matches = rawInput.match(/([a-zA-Z_]\w*)\s*=/g);
    if (matches && matches.length > 0) {
      paramNames = matches.map((m) => m.replace(/\s*=/, '').trim()).join(', ');
    }
  }

  if (!paramNames && typeof q.starterCode === 'string' && q.starterCode.trim()) {
    const fnMatch = q.starterCode.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (fnMatch) {
      if (!q.entryFunctionName) funcName = fnMatch[1];
      paramNames = fnMatch[2].trim();
    }
  }

  // Canonical Problem Signatures
  if (funcName === 'findKthLargest') {
    if (lang === 'java') {
      return `import java.util.*;\n\nclass Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n}\n`;
    }
    if (lang === 'cpp') {
      return `#include <iostream>\n#include <vector>\n#include <queue>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n};\n`;
    }
    if (lang === 'python') {
      return `class Solution:\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        # Write your solution here\n        return 0\n`;
    }
    if (lang === 'javascript') {
      return `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nfunction findKthLargest(nums, k) {\n  // Write your solution here\n  return 0;\n}`;
    }
  }

  if (funcName === 'twoSum') {
    if (lang === 'java') {
      return `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n`;
    }
    if (lang === 'cpp') {
      return `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n`;
    }
    if (lang === 'python') {
      return `def twoSum(nums, target):\n    # Write your solution here\n    return []\n`;
    }
    if (lang === 'javascript') {
      return `function twoSum(nums, target) {\n  // Write your solution here\n  return [];\n}`;
    }
  }

  const pNames = paramNames || 'nums';

  if (lang === 'javascript') {
    return `/**\n * Solution for ${q.title}\n */\nfunction ${funcName}(${pNames}) {\n  // Write your solution here\n  \n}`;
  }

  if (lang === 'python') {
    return `class Solution:\n    def ${funcName}(self, ${pNames}):\n        # Write your solution here\n        pass\n`;
  }

  if (lang === 'java') {
    return `import java.util.*;\n\nclass Solution {\n    public int ${funcName}(${pNames.split(',').map((p) => 'int ' + p.trim()).join(', ')}) {\n        // Write your solution here\n        return 0;\n    }\n}\n`;
  }

  if (lang === 'cpp') {
    return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int ${funcName}(${pNames.split(',').map((p) => 'int ' + p.trim()).join(', ')}) {\n        // Write your solution here\n        return 0;\n    }\n};\n`;
  }

  return '';
}

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

  // Language selection with local persistence
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('skillbridge_dsa_preferred_language') as SupportedLanguage;
      if (saved && ['javascript', 'python', 'java', 'cpp'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'javascript';
  });

  // Multi-language code preservation: questionId -> language -> user written code
  const [userCodes, setUserCodes] = useState<Record<string, Partial<Record<SupportedLanguage, string>>>>({});

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
  const [executionStage, setExecutionStage] = useState<'idle' | 'compiling' | 'running' | 'done'>('idle');
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'console'>('problem');
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

  // Retrieve current code for current question and selected language
  const getCurrentCode = (q: DSAQuestionData, lang: SupportedLanguage): string => {
    const qSaved = userCodes[q.id];
    if (qSaved && qSaved[lang] !== undefined) {
      return qSaved[lang]!;
    }
    return getStarterCodeForLanguage(q, lang);
  };

  const currentCode = currentQ ? getCurrentCode(currentQ, selectedLanguage) : '';
  const testCases: TestCaseData[] = currentQ?.testCases || [];
  const activeLangConfig = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleCodeChange = (newCode: string) => {
    if (!currentQ) return;
    setUserCodes((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        [selectedLanguage]: newCode,
      },
    }));
  };

  // Language change handler: preserves written code across languages and updates state
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    try {
      localStorage.setItem('skillbridge_dsa_preferred_language', newLang);
    } catch {}
    setExecutionResult(null);
    setSubmissionFeedback(null);
    setExecutionStage('idle');
  };

  // Reset button: resets ONLY the active language's code for current problem
  const handleResetCode = () => {
    if (!currentQ) return;
    if (
      window.confirm(
        `Reset ${activeLangConfig.label} code for "${currentQ.title}" to its default starter template?`
      )
    ) {
      const defaultTemplate = getStarterCodeForLanguage(currentQ, selectedLanguage);
      setUserCodes((prev) => ({
        ...prev,
        [currentQ.id]: {
          ...(prev[currentQ.id] || {}),
          [selectedLanguage]: defaultTemplate,
        },
      }));
      setExecutionResult(null);
      setSubmissionFeedback(null);
      setExecutionStage('idle');
    }
  };

  // Run code against test cases in Sandbox with strict execution state machine
  const handleRunCode = async () => {
    if (!currentQ || isRunning) return;
    setIsRunning(true);
    setExecutionStage('compiling');
    setActiveTab('console');
    setSubmissionFeedback(null);

    try {
      const result = await api.post<CodeExecutionResult>('/assessments/run-code', {
        code: currentCode,
        language: selectedLanguage,
        entryFunctionName: currentQ.entryFunctionName,
        testCases,
      });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        status: 'RUNNER_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: 0,
        executionTimeMs: null,
        testsTotal: testCases.length,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCases: testCases.length,
        language: selectedLanguage,
        testResults: testCases.map((tc) => ({
          id: tc.id,
          testCaseId: tc.id,
          passed: false,
          status: 'NOT_EXECUTED',
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: 'Runner Error',
          executionTimeMs: 0,
          error: err.message || 'Execution failed. Please check syntax.',
        })),
        testCaseResults: [],
        error: err.message || 'Execution failed. Please check syntax.',
      });
    } finally {
      setIsRunning(false);
      setExecutionStage('done');
    }
  };

  // Record Attempt / Submit Solution Mutation with authoritative backend verification
  const submitSolutionMutation = useMutation({
    mutationFn: async (payload: {
      questionId: string;
      status: 'SOLVED' | 'ATTEMPTED';
      code: string;
      language: SupportedLanguage;
    }) => {
      if (mode === 'daily') {
        return api.post<{
          dailyPractice: DailyPracticeData;
          attempt: any;
          streak: number;
          isAccepted?: boolean;
          executionResult?: CodeExecutionResult;
        }>('/dsa/daily/submit-question', {
          questionId: payload.questionId,
          status: payload.status,
          code: payload.code,
          codeSubmitted: payload.code,
          language: payload.language,
          timeSpentSeconds: 60,
        });
      } else {
        return api.post<{
          attempt: any;
          isAccepted?: boolean;
          executionResult?: CodeExecutionResult;
        }>('/dsa/questions/' + payload.questionId + '/attempt', {
          status: payload.status,
          timeSpentSeconds: 60,
          codeSubmitted: payload.code,
          language: payload.language,
        });
      }
    },
    onSuccess: (data: any) => {
      const execRes = data?.executionResult || data?.result || data?.attempt?.executionResult;
      const isAccepted = Boolean(
        data?.isAccepted === true ||
        data?.attempt?.isAccepted === true ||
        data?.status === 'ACCEPTED' ||
        data?.attempt?.status === 'SOLVED' ||
        execRes?.status === 'ACCEPTED' ||
        (execRes?.compilationSuccess === true && execRes?.allTestsPassed === true && (execRes?.testsTotal ?? 0) > 0)
      );

      if (execRes) {
        setExecutionResult(execRes);
      }

      if (isAccepted) {
        setCompletedMap((prev) => ({ ...prev, [currentQ.id]: true }));
        queryClient.invalidateQueries({ queryKey: ['dsaDailyPractice'] });
        queryClient.invalidateQueries({ queryKey: ['dsaProgress'] });
        queryClient.invalidateQueries({ queryKey: ['dsaQuestions'] });
        queryClient.invalidateQueries({ queryKey: ['radarData'] });

        setSubmissionFeedback({
          status: 'success',
          message: `✅ Solution Accepted! All test cases passed in ${activeLangConfig.label}. Progress and Skill Radar updated.`,
        });
      } else {
        const statusStr = execRes?.status || data?.status || 'FAILED';
        let reason = 'Some test cases failed';
        if (execRes?.compilationSuccess === false) {
          reason = 'Compilation failed';
        } else if (statusStr === 'TIME_LIMIT_EXCEEDED') {
          reason = 'Time Limit Exceeded';
        } else if (statusStr === 'RUNTIME_ERROR') {
          reason = 'Runtime Error occurred';
        } else if (execRes && execRes.testsPassed !== undefined && execRes.testsTotal !== undefined) {
          reason = `${execRes.testsPassed}/${execRes.testsTotal} tests passed`;
        }

        setSubmissionFeedback({
          status: 'failed',
          message: `❌ Solution Not Accepted (${reason}). Attempt was recorded, but progress and Skill Radar were not updated.`,
        });
      }
    },
    onError: (err: any) => {
      setSubmissionFeedback({
        status: 'failed',
        message: `❌ Submission error: ${err.message || 'Could not record attempt'}`,
      });
    },
  });

  const handleSubmitSolution = () => {
    if (!currentQ || submitSolutionMutation.isPending) return;
    setSubmissionFeedback(null);
    submitSolutionMutation.mutate({
      questionId: currentQ.id,
      status: 'SOLVED',
      code: currentCode,
      language: selectedLanguage,
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
    <ExamIntegrityGuard
      sessionId={currentQ.id || 'dsa-runner'}
      sessionType="DSA"
    >
      <div className="w-full flex-1 min-h-0 flex flex-col space-y-3 sm:space-y-4 font-sans animate-fade-in">
        {/* Top Nav Bar (In-Flow Pinned Card, No Sticky Jitter) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-panel border border-border shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="small-caps-label text-[10px] text-bridge-teal font-bold">
                {mode === 'daily'
                  ? 'Daily Mandatory Challenge'
                  : customSetTitle || 'Custom DSA Practice Set'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-panel-raised text-text-muted border border-border">
                {questions.length} Questions
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-text-primary font-sans mt-0.5">
              Q{currentIdx + 1}: {currentQ.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold bg-panel-raised text-bridge-teal border border-border">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeSpentSeconds)}</span>
          </div>

          {/* Progress pill */}
          <span className="text-xs font-mono text-text-muted hidden sm:inline">
            <strong className="text-text-primary">{completedCount}</strong>/{questions.length} Solved
          </span>

          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-panel-raised hover:bg-border text-text-primary text-xs font-semibold border border-border transition-colors cursor-pointer"
          >
            Exit Runner
          </button>
        </div>
      </div>

      {/* Question Selector Pills Grid & Progress (In-flow Pinned, Shrink-0) */}
      <div className="px-4 py-2.5 rounded-2xl bg-panel/70 border border-border shadow-sm shrink-0 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted">
          <span>Practice Set Progress</span>
          <span>{progressPct}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-panel-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-bridge-gradient transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full touch-pan-x">
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
                className={`min-w-[2.25rem] h-8 w-8 flex items-center justify-center shrink-0 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-bridge-teal text-white shadow-lg shadow-bridge-teal/20 font-bold ring-2 ring-bridge-teal/50'
                    : isCompleted
                    ? 'bg-signal-green/20 text-signal-green border border-signal-green/40 font-bold'
                    : 'bg-panel-raised text-text-muted border border-border hover:text-text-primary'
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
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 overflow-hidden">
        {/* Left Column: Problem Details & Constraints (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-panel border border-border shadow-xl flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex-1 min-h-0 p-5 sm:p-6 overflow-y-auto touch-scroll overscroll-contain space-y-6">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="small-caps-label px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-signal-amber/15 text-signal-amber border border-signal-amber/30">
                {currentQ.platform}
              </span>
              <span
                className={`small-caps-label px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  currentQ.difficulty === 'Easy'
                    ? 'bg-signal-green/15 text-signal-green border-signal-green/30'
                    : currentQ.difficulty === 'Medium'
                    ? 'bg-signal-amber/15 text-signal-amber border-signal-amber/30'
                    : 'bg-signal-red/15 text-signal-red border-signal-red/30'
                }`}
              >
                {currentQ.difficulty}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-panel-raised text-text-muted border border-border">
                {currentQ.topic}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-2 font-sans">{currentQ.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap font-sans">
                {currentQ.description}
              </p>
            </div>

            {/* Test Cases / Examples */}
            {testCases.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="small-caps-label text-[11px] font-mono text-text-muted font-bold block">
                  Sample Test Cases:
                </span>
                <div className="space-y-2">
                  {testCases.slice(0, 3).map((tc, tcIdx) => (
                    <div
                      key={tc.id || tcIdx}
                      className="p-2.5 rounded-xl bg-void border border-border font-mono text-[11px] space-y-1"
                    >
                      <div className="text-text-muted">
                        <span className="text-bridge-teal font-semibold">Input:</span>{' '}
                        <code className="text-text-primary">{tc.input}</code>
                      </div>
                      <div className="text-text-muted">
                        <span className="text-signal-green font-semibold">Expected:</span>{' '}
                        <code className="text-text-primary">{tc.expectedOutput}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {currentQ.tags && currentQ.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                {currentQ.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-text-muted bg-panel-raised px-2 py-0.5 rounded border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Authentic Outbound Link */}
            <div className="pt-4 border-t border-border">
              <a
                href={currentQ.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-between p-3 rounded-xl bg-panel-raised hover:bg-border text-text-primary border border-border text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-bridge-teal group-hover:scale-110 transition-transform" />
                  <span>Open original problem on {currentQ.platform}</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted group-hover:text-text-primary">
                  Platform Page →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Multi-Language Sandbox Console (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-panel border border-border shadow-xl flex flex-col min-h-0 h-full overflow-hidden">
          {/* Header Controls with Language Selector */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-panel-raised border-b border-border">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Language dropdown selector */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="dsa-language-select"
                  className="small-caps-label text-xs font-mono text-text-muted font-bold flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5 text-bridge-teal" />
                  <span>Language:</span>
                </label>
                <select
                  id="dsa-language-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="px-2.5 py-1 rounded-lg bg-panel border border-border text-xs font-mono font-bold text-bridge-teal hover:border-bridge-teal focus:outline-none focus:ring-2 focus:ring-bridge-teal/40 cursor-pointer transition-all shadow-inner"
                  aria-label="Select programming language"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              {/* Active runtime mode badge */}
              <span className="text-xs font-mono font-bold text-text-primary uppercase hidden md:inline">
                {activeLangConfig.badge}
              </span>
              <span className="text-[10px] font-mono text-signal-green bg-signal-green/10 px-2 py-0.5 rounded border border-signal-green/30 hidden sm:inline">
                Isolated Sandbox
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCode}
                className="px-2.5 py-1.5 rounded-lg bg-panel hover:bg-border text-text-muted hover:text-text-primary text-xs font-medium border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Reset ${activeLangConfig.label} code`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="bridge-btn-primary px-4 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-slate-950 ${isRunning ? 'animate-spin' : ''}`} />
                <span>
                  {isRunning
                    ? executionStage === 'compiling'
                      ? 'Compiling...'
                      : 'Running Tests...'
                    : 'Run Test Cases'}
                </span>
              </button>
            </div>
          </div>

          {/* Editor Textarea */}
          <div className="p-3 sm:p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
            <textarea
              rows={12}
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={activeLangConfig.placeholder}
              className="w-full flex-1 p-3.5 sm:p-4 rounded-xl bg-void border border-border text-xs font-mono text-emerald-300 focus:outline-none focus:border-bridge-teal resize-none leading-relaxed overscroll-contain"
              spellCheck={false}
              aria-label="Code Editor"
            />
          </div>

          {/* Test Runner Results & Feedback Console */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-border bg-void/90 space-y-3.5 max-h-[240px] overflow-y-auto touch-scroll overscroll-contain">
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
              <div className="space-y-3">
                {/* Header Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-bridge-teal" />
                      <span>{executionResult.language ? executionResult.language.toUpperCase() : ''} TEST RESULTS</span>
                    </span>

                    {/* Compilation status badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        executionResult.compilationSuccess
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                          : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                      }`}
                    >
                      Compilation: {executionResult.compilationSuccess ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Compilation Time:{' '}
                      <strong className="text-slate-200">
                        {executionResult.compilationTimeMs !== null
                          ? `${executionResult.compilationTimeMs}ms`
                          : 'N/A'}
                      </strong>
                    </span>
                    <span>
                      Execution Time:{' '}
                      <strong className="text-slate-200">
                        {executionResult.executionTimeMs !== null
                          ? `${executionResult.executionTimeMs}ms`
                          : 'N/A'}
                      </strong>
                    </span>
                    <span>
                      Tests Executed:{' '}
                      <strong
                        className={
                          executionResult.testsPassed === executionResult.testsTotal && executionResult.testsTotal > 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {executionResult.testsExecuted ?? executionResult.passedTestCases} / {executionResult.testsTotal ?? executionResult.totalTestCases}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Compilation Error Output */}
                {!executionResult.compilationSuccess && (executionResult.compilerOutput || executionResult.error) && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono space-y-1.5">
                    <div className="font-bold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>COMPILATION FAILED:</span>
                    </div>
                    <div className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed pl-1 text-rose-200/90 max-h-40 overflow-y-auto">
                      {executionResult.compilerOutput || executionResult.error}
                    </div>
                  </div>
                )}

                {/* Runtime Error or Timeout Banner */}
                {executionResult.compilationSuccess && executionResult.error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                    {executionResult.error}
                  </div>
                )}

                {/* Test Results Cards */}
                {executionResult.testResults && executionResult.testResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {executionResult.testResults.map((tc, tcIdx) => {
                      const isNotExecuted = tc.status === 'NOT_EXECUTED';
                      const isPassed = tc.status === 'PASSED' || tc.passed;

                      return (
                        <div
                          key={tc.id || tcIdx}
                          className={`p-2.5 rounded-lg font-mono text-[11px] border ${
                            isNotExecuted
                              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                              : isPassed
                              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                              : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Case {tcIdx + 1}</span>
                            <span className="flex items-center gap-1">
                              {isNotExecuted ? (
                                <span className="text-slate-400 text-[10px]">NOT EXECUTED</span>
                              ) : isPassed ? (
                                <span className="text-emerald-400">✓ PASSED</span>
                              ) : (
                                <span className="text-rose-400">✗ FAILED</span>
                              )}
                            </span>
                          </div>

                          {isNotExecuted && (
                            <div className="text-[10px] text-slate-500 mt-1 italic">
                              {tc.error || 'Reason: Compilation failed'}
                            </div>
                          )}

                          {!isNotExecuted && !isPassed && (
                            <div className="text-[10px] text-slate-300 mt-1 space-y-0.5">
                              {tc.expectedOutput && (
                                <div>
                                  Expected: <span className="text-emerald-400">{tc.expectedOutput}</span>
                                </div>
                              )}
                              {tc.actualOutput !== undefined && (
                                <div>
                                  Actual: <span className="text-rose-400">{tc.actualOutput}</span>
                                </div>
                              )}
                              {tc.error && (
                                <div className="text-rose-400 font-semibold truncate">
                                  {tc.error}
                                </div>
                              )}
                            </div>
                          )}

                          {!isNotExecuted && isPassed && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Time: {tc.executionTimeMs}ms
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-bridge-teal to-emerald-500 hover:from-bridge-teal/90 hover:to-emerald-450 text-white text-xs font-bold shadow-lg shadow-bridge-teal/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitSolutionMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit Solution ({activeLangConfig.label})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ExamIntegrityGuard>
);
};

export default DsaPracticeRunner;
