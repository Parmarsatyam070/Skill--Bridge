import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Building2,
  Terminal,
  FileCode,
  History,
  Check,
  ArrowUpRight,
  RefreshCw,
  Award,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import {
  DSAQuestionData,
  SupportedLanguage,
  CodeExecutionResult,
  DSASubmissionItem,
} from '@shared/types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const SUPPORTED_LANGUAGES: { id: SupportedLanguage; label: string; monacoLang: string; version: string }[] = [
  { id: 'cpp', label: 'C++', monacoLang: 'cpp', version: 'C++17' },
  { id: 'java', label: 'Java', monacoLang: 'java', version: 'Java 21' },
  { id: 'python', label: 'Python', monacoLang: 'python', version: 'Python 3.14' },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript', version: 'ES2022' },
  { id: 'c', label: 'C', monacoLang: 'c', version: 'C11' },
];

const PLATFORM_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  LeetCode: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  GeeksforGeeks: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  CSES: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Codeforces: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

const DIFFICULTY_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  Easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Hard: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

const DSA_TOPICS = [
  'All Topics',
  'Arrays',
  'Strings',
  'Two Pointers',
  'Sliding Window',
  'Linked Lists',
  'Stack & Queue',
  'Binary Search',
  'Trees & Graphs',
  'Heap / Priority Queue',
  'Backtracking',
  'Dynamic Programming',
  'Graphs',
  'Greedy',
  'Bit Manipulation',
  'Mathematical Algorithms',
  'Sorting',
];

export const DsaCodingPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Problem list and filtering state
  const [questions, setQuestions] = useState<DSAQuestionData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [showDrawer, setShowDrawer] = useState(false);

  // Active Problem state
  const [activeQuestion, setActiveQuestion] = useState<DSAQuestionData | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Code editor state
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');

  // Runner & Submission state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'testcases' | 'result' | 'submissions'>('testcases');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [lastExecutionResult, setLastExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [verdictBanner, setVerdictBanner] = useState<{ status: string; isAccepted: boolean; message?: string } | null>(null);
  const [submissions, setSubmissions] = useState<DSASubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Solved statistics
  const [stats, setStats] = useState({ solved: 0, total: 0 });

  // 1. Fetch questions list
  const fetchQuestions = useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const data = await api.get<{ success: boolean; questions: DSAQuestionData[]; total: number }>('/dsa/questions?limit=100');

      if (data && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        const solvedCount = data.questions.filter((q) => q.userAttemptStatus === 'SOLVED').length;
        setStats({ solved: solvedCount, total: data.questions.length });

        // If no slug in URL, select the first question
        if (!slug && data.questions.length > 0) {
          navigate(`/dsa/${data.questions[0].slug}`, { replace: true });
        }
      } else {
        setQuestions([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch DSA questions list:', err);
      setListError(err.message || 'Failed to connect to question bank. Please retry.');
    } finally {
      setLoadingList(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const loadSubmissions = useCallback(async (questionId: string) => {
    try {
      setLoadingSubmissions(true);
      const data = await api.get<{ success: boolean; submissions: DSASubmissionItem[] }>(
        `/dsa/questions/${questionId}/submissions`
      );
      if (data && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // 2. Fetch specific question when slug changes
  useEffect(() => {
    if (!slug) return;
    const loadQuestionDetail = async () => {
      try {
        setLoadingQuestion(true);
        setQuestionError(null);
        setVerdictBanner(null);
        setLastExecutionResult(null);

        const data = await api.get<{ success: boolean; question: DSAQuestionData }>(`/dsa/questions/${slug}`);
        if (data && data.question) {
          const q = data.question;
          setActiveQuestion(q);

          // Set starter template for currently selected language
          let initialCode = '';
          if (q.starterCode && typeof q.starterCode === 'object') {
            initialCode = (q.starterCode as any)[selectedLanguage] || (q.starterCode as any).javascript || '';
          }
          setCode(initialCode);
          setSelectedTestCaseIndex(0);

          // Fetch submissions for this question
          loadSubmissions(q.id);
        } else {
          setQuestionError('Problem not found in question bank.');
        }
      } catch (err: any) {
        console.error('Failed to load DSA question detail:', err);
        setQuestionError(err.message || 'Failed to load question details.');
      } finally {
        setLoadingQuestion(false);
      }
    };

    loadQuestionDetail();
  }, [slug, loadSubmissions]);

  // Language switch handler
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    if (activeQuestion?.starterCode && typeof activeQuestion.starterCode === 'object') {
      const langCode =
        (activeQuestion.starterCode as any)[newLang] ||
        (activeQuestion.starterCode as any).javascript ||
        '';
      setCode(langCode);
    }
  };

  // Reset code handler
  const handleResetCode = () => {
    if (!activeQuestion) return;
    if (activeQuestion.starterCode && typeof activeQuestion.starterCode === 'object') {
      const starter =
        (activeQuestion.starterCode as any)[selectedLanguage] ||
        (activeQuestion.starterCode as any).javascript ||
        '';
      setCode(starter);
    }
  };

  // 3. RUN action (Visible sample cases only)
  const handleRunCode = async () => {
    if (!activeQuestion || isRunning) return;
    try {
      setIsRunning(true);
      setActiveBottomTab('result');
      setVerdictBanner(null);

      const data = await api.post<{ success: boolean; result: CodeExecutionResult }>('/dsa/run', {
        code,
        language: selectedLanguage,
        questionId: activeQuestion.id,
        entryFunctionName: activeQuestion.entryFunctionName,
      });

      if (data && data.result) {
        setLastExecutionResult(data.result);
      }
    } catch (err: any) {
      console.error('Run failed:', err);
      setLastExecutionResult({
        status: 'RUNTIME_ERROR',
        passed: false,
        compilationSuccess: false,
        executionCompleted: false,
        compilationTimeMs: null,
        executionTimeMs: null,
        testsTotal: 0,
        testsExecuted: 0,
        testsPassed: 0,
        allTestsPassed: false,
        totalTestCases: 0,
        passedTestCases: 0,
        failedTestCases: 0,
        error: err.message || 'Execution failed. Check your network or syntax.',
        testResults: [],
        testCaseResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 4. SUBMIT action (Full hidden test suite + score evaluation)
  const handleSubmitCode = async () => {
    if (!activeQuestion || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setActiveBottomTab('result');

      const data = await api.post<{
        success: boolean;
        result: CodeExecutionResult;
        isAccepted: boolean;
        attempt?: any;
      }>('/dsa/submit', {
        code,
        language: selectedLanguage,
        questionId: activeQuestion.id,
        timeSpentSeconds: 120,
      });

      if (data && data.result) {
        setLastExecutionResult(data.result);
        const isAccepted = Boolean(data.isAccepted || data.result.status === 'ACCEPTED');
        setVerdictBanner({
          status: data.result.status,
          isAccepted,
          message: isAccepted
            ? 'Accepted! All test cases passed. DSA Skill Score updated.'
            : `${data.result.status.replace(/_/g, ' ')}: Some test cases did not pass.`,
        });

        // Refresh submissions
        loadSubmissions(activeQuestion.id);

        // Update solved state in question list
        if (isAccepted) {
          setQuestions((prev) =>
            prev.map((q) => (q.id === activeQuestion.id ? { ...q, userAttemptStatus: 'SOLVED' } : q))
          );
          setStats((prev) => ({ ...prev, solved: prev.solved + 1 }));
        }
      }
    } catch (err: any) {
      console.error('Submit failed:', err);
      setVerdictBanner({
        status: 'SUBMISSION_ERROR',
        isAccepted: false,
        message: err.message || 'Submission failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions for sidebar drawer
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !searchQuery ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'All Topics' || q.topic === selectedTopic;
    const matchesPlatform = selectedPlatform === 'All' || q.platform === selectedPlatform;
    const matchesDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesTopic && matchesPlatform && matchesDiff;
  });

  const visibleTestCases = activeQuestion?.testCases?.filter((tc) => !tc.isHidden) || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-blue-500/30 rounded-2xl border border-[#1e293b] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-[#1e293b] bg-[#0b1329] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link to="/assessment" className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1">
            <span>Assessments</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h1 className="text-sm font-semibold text-white tracking-wide">DSA & Algorithm Practice</h1>
          </div>

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="ml-2 px-2.5 py-1 text-xs rounded-md bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-[#1e293b] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Problem Explorer</span>
            <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {filteredQuestions.length}
            </span>
          </button>

          <Link
            to="/assessment?tab=dsa&runner=daily"
            className="ml-1.5 px-2.5 py-1 text-xs rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition font-medium"
            title="Start Daily Mandatory Challenge"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Daily Challenge</span>
          </Link>
        </div>

        {/* Global Progress Pill & Outbound Link indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] text-xs">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Solved:</span>
            <span className="text-white font-medium">
              {stats.solved} / {stats.total}
            </span>
          </div>

          {activeQuestion?.outboundUrl && (
            <a
              href={activeQuestion.outboundUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 flex items-center gap-1 transition"
              title="Solve the authentic original problem on platform"
            >
              <span>Original on {activeQuestion.platform}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </header>

      {/* Main Workspace Layout (Drawer + Split Screen) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Problem Explorer Drawer */}
        {showDrawer && (
          <aside className="w-80 border-r border-[#1e293b] bg-[#0b1329] flex flex-col z-30 shadow-2xl absolute inset-y-0 left-0">
            <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                Problem Explorer ({filteredQuestions.length})
              </h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-[#0f172a] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Filter Controls */}
            <div className="p-3 border-b border-[#1e293b] space-y-2.5 bg-[#0b1329]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search problem or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Platforms</option>
                  <option value="LeetCode">LeetCode</option>
                  <option value="GeeksforGeeks">GeeksforGeeks</option>
                  <option value="CSES">CSES</option>
                  <option value="Codeforces">Codeforces</option>
                </select>
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/60 p-1">
              {loadingList ? (
                <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Loading questions...</span>
                </div>
              ) : listError ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-rose-400">{listError}</p>
                  <button
                    onClick={fetchQuestions}
                    className="px-3 py-1 text-xs bg-[#0f172a] hover:bg-[#1e293b] text-white rounded border border-[#1e293b]"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No questions match your current filter.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = activeQuestion?.id === q.id;
                  const isSolved = q.userAttemptStatus === 'SOLVED';

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        navigate(`/dsa/${q.slug}`);
                        setShowDrawer(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-md transition flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15 border border-blue-500/40 text-blue-300'
                          : 'hover:bg-[#0f172a] text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isSolved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />
                          )}
                          <span className="text-xs font-medium truncate">{q.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className={DIFFICULTY_THEMES[q.difficulty]?.text || 'text-slate-400'}>
                            {q.difficulty}
                          </span>
                          <span>•</span>
                          <span>{q.topic}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          PLATFORM_THEMES[q.platform]?.bg || 'bg-[#0f172a]'
                        } ${PLATFORM_THEMES[q.platform]?.text || 'text-slate-300'} ${
                          PLATFORM_THEMES[q.platform]?.border || 'border-[#1e293b]'
                        }`}
                      >
                        {q.platform}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Left Panel: Problem Statement & Context */}
        <div className="w-1/2 border-r border-[#1e293b] flex flex-col bg-[#030712] overflow-y-auto">
          {loadingQuestion ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-500 gap-3 min-h-[400px]">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-xs">Loading problem statement...</p>
            </div>
          ) : questionError ? (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[400px]">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-xs text-rose-300">{questionError}</p>
              <button
                onClick={() => fetchQuestions()}
                className="px-3 py-1.5 text-xs bg-[#0f172a] hover:bg-[#1e293b] text-white rounded border border-[#1e293b]"
              >
                Reload Questions
              </button>
            </div>
          ) : activeQuestion ? (
            <div className="p-6 space-y-6">
              {/* Problem Header & Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-medium ${
                      DIFFICULTY_THEMES[activeQuestion.difficulty]?.bg
                    } ${DIFFICULTY_THEMES[activeQuestion.difficulty]?.text} ${
                      DIFFICULTY_THEMES[activeQuestion.difficulty]?.border
                    }`}
                  >
                    {activeQuestion.difficulty}
                  </span>

                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-medium ${
                      PLATFORM_THEMES[activeQuestion.platform]?.bg
                    } ${PLATFORM_THEMES[activeQuestion.platform]?.text} ${
                      PLATFORM_THEMES[activeQuestion.platform]?.border
                    }`}
                  >
                    {activeQuestion.styleTag || `${activeQuestion.platform}-style`}
                  </span>

                  <span className="text-xs px-2 py-0.5 rounded bg-[#0f172a] text-slate-300 border border-[#1e293b]">
                    {activeQuestion.topic}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">{activeQuestion.title}</h2>
              </div>

              {/* Honest Outbound Link Banner */}
              {activeQuestion.outboundUrl && (
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-200">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>
                      Original problem verified across <strong>{activeQuestion.platform}</strong>.
                    </span>
                  </div>
                  <a
                    href={activeQuestion.outboundUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium flex items-center gap-1 transition"
                  >
                    <span>Solve on {activeQuestion.platform}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Description */}
              <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                <p className="whitespace-pre-line">{activeQuestion.description}</p>
              </div>

              {/* Sample Test Cases / Examples */}
              {visibleTestCases.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Examples</h3>
                  {visibleTestCases.map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className="p-3 rounded-lg bg-[#0b1329] border border-[#1e293b] font-mono text-xs space-y-1.5"
                    >
                      <div className="text-slate-400">
                        <span className="text-blue-400 font-bold">Input:</span> {tc.input}
                      </div>
                      <div className="text-slate-300">
                        <span className="text-emerald-400 font-bold">Output:</span> {tc.expectedOutput}
                      </div>
                      {tc.explanation && (
                        <div className="text-slate-500 text-[11px] font-sans pt-1 border-t border-[#1e293b]">
                          <span className="text-slate-400">Explanation:</span> {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Company Tags */}
              {activeQuestion.companyTags && activeQuestion.companyTags.length > 0 && (
                <div className="pt-4 border-t border-[#1e293b]">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Targeted Companies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeQuestion.companyTags.map((company) => (
                      <span
                        key={company}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#0f172a] text-slate-300 border border-[#1e293b]"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center min-h-[400px] gap-2">
              <HelpCircle className="w-6 h-6 text-slate-600" />
              <span>Select a problem from the Problem Explorer to start coding.</span>
              <button
                onClick={() => setShowDrawer(true)}
                className="mt-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded text-xs font-medium cursor-pointer"
              >
                Open Problem Explorer
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Monaco Editor & Execution Console */}
        <div className="w-1/2 flex flex-col bg-[#0b1329]">
          {/* Editor Header: Language Switcher & Actions */}
          <div className="h-11 border-b border-[#1e293b] bg-[#0b1329] px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-[#0f172a] border border-[#1e293b] text-blue-300 font-medium text-xs rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label} ({lang.version})
                  </option>
                ))}
              </select>

              <button
                onClick={handleResetCode}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#0f172a] rounded transition cursor-pointer"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Run and Submit Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting || !activeQuestion}
                className="px-3 py-1.5 text-xs font-medium rounded bg-[#0f172a] hover:bg-[#1e293b] text-slate-200 border border-[#1e293b] flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                {isRunning ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                ) : (
                  <Play className="w-3 h-3 text-blue-400 fill-blue-400" />
                )}
                <span>Run</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting || !activeQuestion}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Submit</span>
              </button>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              theme="vs-dark"
              language={SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage)?.monacoLang || 'javascript'}
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                fontFamily: `'Fira Code', 'Cascadia Code', Consolas, monospace`,
                fontLigatures: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
              }}
            />
          </div>

          {/* Lower Panel: Test Cases & Execution Results */}
          <div className="h-64 border-t border-[#1e293b] bg-[#030712] flex flex-col">
            {/* Tabs Bar */}
            <div className="h-9 border-b border-[#1e293b] bg-[#0b1329] px-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveBottomTab('testcases')}
                  className={`text-xs font-medium flex items-center gap-1.5 pb-0.5 border-b-2 transition cursor-pointer ${
                    activeBottomTab === 'testcases'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Test Cases</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab('result')}
                  className={`text-xs font-medium flex items-center gap-1.5 pb-0.5 border-b-2 transition cursor-pointer ${
                    activeBottomTab === 'result'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Test Result</span>
                  {lastExecutionResult && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        lastExecutionResult.passed || lastExecutionResult.status === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {lastExecutionResult.status}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveBottomTab('submissions')}
                  className={`text-xs font-medium flex items-center gap-1.5 pb-0.5 border-b-2 transition cursor-pointer ${
                    activeBottomTab === 'submissions'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Submissions ({submissions.length})</span>
                </button>
              </div>

              {lastExecutionResult?.executionTimeMs && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{lastExecutionResult.executionTimeMs} ms</span>
                </div>
              )}
            </div>

            {/* Tab Body Content */}
            <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
              {/* TAB 1: Testcases */}
              {activeBottomTab === 'testcases' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {visibleTestCases.map((tc, idx) => (
                      <button
                        key={tc.id || idx}
                        onClick={() => setSelectedTestCaseIndex(idx)}
                        className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                          selectedTestCaseIndex === idx
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                            : 'bg-[#0f172a] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {visibleTestCases[selectedTestCaseIndex] ? (
                    <div className="space-y-2">
                      <div className="text-slate-400 text-[11px]">Input:</div>
                      <div className="p-2 rounded bg-[#0b1329] border border-[#1e293b] text-slate-200 font-mono">
                        {visibleTestCases[selectedTestCaseIndex].input}
                      </div>
                      <div className="text-slate-400 text-[11px]">Expected Output:</div>
                      <div className="p-2 rounded bg-[#0b1329] border border-[#1e293b] text-emerald-400 font-mono">
                        {visibleTestCases[selectedTestCaseIndex].expectedOutput}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500">No test cases available.</div>
                  )}
                </div>
              )}

              {/* TAB 2: Test Result */}
              {activeBottomTab === 'result' && (
                <div className="space-y-3">
                  {/* Official Verdict Banner */}
                  {verdictBanner && (
                    <div
                      className={`p-3 rounded-lg border flex items-center gap-3 ${
                        verdictBanner.isAccepted
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-800 text-rose-300'
                      }`}
                    >
                      {verdictBanner.isAccepted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm tracking-wide">{verdictBanner.status}</div>
                        <div className="text-xs opacity-90">{verdictBanner.message}</div>
                      </div>
                    </div>
                  )}

                  {/* Compile Error or Runtime Error Output */}
                  {lastExecutionResult?.error && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900 text-rose-300 whitespace-pre-wrap font-mono text-[11px]">
                      {lastExecutionResult.error}
                    </div>
                  )}

                  {/* Individual Test Results */}
                  {lastExecutionResult?.testResults && lastExecutionResult.testResults.length > 0 && (
                    <div className="space-y-2">
                      {lastExecutionResult.testResults.map((tr, idx) => (
                        <div
                          key={tr.id || idx}
                          className={`p-2.5 rounded border text-xs space-y-1 ${
                            tr.passed
                              ? 'bg-emerald-950/20 border-emerald-900/50'
                              : 'bg-rose-950/20 border-rose-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300">
                              Test Case #{idx + 1} {tr.isHidden ? '(Hidden)' : ''}
                            </span>
                            <span className={`font-semibold ${tr.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {tr.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          {!tr.isHidden && (
                            <>
                              <div className="text-slate-400 text-[11px]">Input: {tr.input}</div>
                              <div className="text-emerald-400 text-[11px]">Expected: {tr.expectedOutput}</div>
                              <div className={`${tr.passed ? 'text-emerald-300' : 'text-rose-300'} text-[11px]`}>
                                Actual: {tr.actualOutput}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!lastExecutionResult && !isRunning && !isSubmitting && (
                    <div className="text-slate-500 py-6 text-center font-sans text-xs">
                      Run your code to test sample cases or submit for evaluation.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Submissions History */}
              {activeBottomTab === 'submissions' && (
                <div className="space-y-2">
                  {loadingSubmissions ? (
                    <div className="py-4 text-center text-slate-500">Loading submission history...</div>
                  ) : submissions.length > 0 ? (
                    submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded bg-[#0b1329] border border-[#1e293b] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              sub.status === 'SOLVED' || sub.status === 'ACCEPTED'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-200">{sub.status}</span>
                            <span className="text-slate-500 text-[10px] ml-2">[{sub.language}]</span>
                          </div>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 py-6 text-center font-sans text-xs">
                      No submissions recorded for this problem yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DsaCodingPage;
