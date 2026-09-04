import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Radar,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  Calculator,
  Headphones,
  Award,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  Flame,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  PracticeSetData,
  AssessmentQuestionData,
  AssessmentSubmitResult,
  ListeningPassageData,
} from '@shared/types';
import { CodingSandbox } from '../../components/CodingSandbox';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';
import { DsaDailyBanner } from '../../components/dsa/DsaDailyBanner';
import { DsaCustomGenerator } from '../../components/dsa/DsaCustomGenerator';
import { DsaProgressDashboard } from '../../components/dsa/DsaProgressDashboard';
import { DsaProblemExplorer } from '../../components/dsa/DsaProblemExplorer';
import { DsaPracticeRunner } from '../../components/dsa/DsaPracticeRunner';
import { Code2 } from 'lucide-react';
import { DSAQuestionData, DailyPracticeData } from '@shared/types';

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  // Primary Tab Category Switcher: 'domain' | 'aptitude' | 'dsa'
  const [mainCategory, setMainCategory] = useState<'domain' | 'aptitude' | 'dsa'>(
    searchParams.get('tab') === 'dsa' ? 'dsa' : 'domain'
  );

  // DSA Active Runner Session State
  const [dsaRunnerSession, setDsaRunnerSession] = useState<{
    mode: 'daily' | 'custom' | 'single';
    questions: DSAQuestionData[];
    dailyData?: DailyPracticeData;
    customTitle?: string;
  } | null>(null);

  // Sub-filter for domain or aptitude type
  const [selectedDomain, setSelectedDomain] = useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );
  const [selectedAptitudeType, setSelectedAptitudeType] = useState<
    'aptitude_quant' | 'aptitude_english_reading' | 'aptitude_english_listening'
  >('aptitude_quant');

  // Assessment Runner State
  const [activeSet, setActiveSet] = useState<PracticeSetData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestionData[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [codingAnswers, setCodingAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmitResult | null>(null);

  // Audio / Web Speech State for Listening Passages (Strict 2-Play Limit)
  const [playsUsed, setPlaysUsed] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Fetch all practice sets
  const { data: setsData, isLoading: loadingSets } = useQuery({
    queryKey: ['practiceSets'],
    queryFn: () => api.get<{ sets: PracticeSetData[] }>('/assessments/sets'),
  });

  // Filter sets based on selected category & sub-filter
  const allSets = setsData?.sets || [];
  const filteredSets = allSets.filter(s => {
    if (mainCategory === 'domain') {
      return s.type === 'domain' && s.domainName === selectedDomain;
    } else {
      return s.type === selectedAptitudeType;
    }
  });

  // Start Assessment Mutation
  const [startError, setStartError] = useState<string | null>(null);
  const [startingSetId, setStartingSetId] = useState<string | null>(null);

  const startAttemptMutation = useMutation({
    mutationFn: (setId: string) => {
      setStartingSetId(setId);
      setStartError(null);
      return api.post<{
        attemptId: string;
        practiceSet: PracticeSetData;
        timeLimitMinutes: number;
        questions: AssessmentQuestionData[];
        previousBestScore?: number;
      }>(`/assessments/sets/${setId}/start`);
    },
    onSuccess: (data) => {
      setStartingSetId(null);
      setActiveSet(data.practiceSet);
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setWrittenAnswers({});
      setCodingAnswers({});
      setSecondsRemaining(data.timeLimitMinutes * 60);
      setIsTimerRunning(true);
      setSubmissionResult(null);
      setPlaysUsed(0);
      setIsPlayingAudio(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      setStartingSetId(null);
      const msg = err?.message || 'Could not start assessment session. Please check your connection and try again.';
      setStartError(msg);
      alert(`Assessment Start Error: ${msg}`);
    },
  });

  // Auto-start set from search param ?set=...
  useEffect(() => {
    const setParam = searchParams.get('set');
    if (setParam && !activeSet && !submissionResult && !startingSetId) {
      startAttemptMutation.mutate(setParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, activeSet, submissionResult, startingSetId]);

  // Submit Assessment Mutation
  const submitAttemptMutation = useMutation({
    mutationFn: (payload: {
      answers: Record<string, string>;
      writtenAnswers: Record<string, string>;
      codingAnswers: Record<string, string>;
    }) =>
      api.post<{ result: AssessmentSubmitResult }>(`/assessments/sets/${activeSet?.id}/submit`, {
        attemptId,
        answers: payload.answers,
        writtenAnswers: payload.writtenAnswers,
        codingAnswers: payload.codingAnswers,
      }),
    onSuccess: (data) => {
      setIsTimerRunning(false);
      setSubmissionResult(data.result);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      // Invalidate relevant queries so radar, daily status, report card, and streaks update instantly
      queryClient.invalidateQueries({ queryKey: ['practiceSets'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPracticeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['inAppNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['radarData'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      queryClient.invalidateQueries({ queryKey: ['reportCard'] });
    },
    onError: (err: any) => {
      alert(`Submission error: ${err?.message || 'Failed to grade assessment. Please retry.'}`);
    },
  });

  // Countdown Timer Hook with Auto-Submission
  useEffect(() => {
    if (!isTimerRunning || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit immediately
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, secondsRemaining]);

  const handleAutoSubmit = () => {
    if (activeSet && attemptId && !submissionResult) {
      submitAttemptMutation.mutate({
        answers: selectedAnswers,
        writtenAnswers: writtenAnswers,
        codingAnswers: codingAnswers,
      });
    }
  };

  const handleManualSubmit = () => {
    if (!activeSet || !attemptId) return;
    const answeredCount =
      Object.keys(selectedAnswers).length +
      Object.keys(writtenAnswers).length +
      Object.keys(codingAnswers).length;
    if (answeredCount < questions.length) {
      const confirm = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit now?`
      );
      if (!confirm) return;
    }
    submitAttemptMutation.mutate({
      answers: selectedAnswers,
      writtenAnswers: writtenAnswers,
      codingAnswers: codingAnswers,
    });
  };

  // Voice Speech Audio Synthesis for Listening Passages (2 Plays Limit)
  const currentQ = questions[currentQuestionIdx];
  const listeningPassage = currentQ?.listeningPassage;

  const handlePlayVoicePassage = () => {
    if (!listeningPassage?.audioText) return;
    if (playsUsed >= 2) {
      alert('You have reached the maximum limit of 2 audio plays for this comprehension passage.');
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(listeningPassage.audioText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
        setPlaysUsed(prev => prev + 1);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Web Speech API is not supported in your browser.');
    }
  };

  const handleStopVoicePassage = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────
  // VIEW 0: DSA ACTIVE PRACTICE RUNNER SCREEN
  // ─────────────────────────────────────────────────────────────
  if (dsaRunnerSession) {
    return (
      <DsaPracticeRunner
        questions={dsaRunnerSession.questions}
        mode={dsaRunnerSession.mode}
        dailyPracticeData={dsaRunnerSession.dailyData}
        customSetTitle={dsaRunnerSession.customTitle}
        onExit={() => {
          setDsaRunnerSession(null);
          queryClient.invalidateQueries({ queryKey: ['dsaDailyPractice'] });
          queryClient.invalidateQueries({ queryKey: ['dsaProgress'] });
          queryClient.invalidateQueries({ queryKey: ['dsaQuestions'] });
          queryClient.invalidateQueries({ queryKey: ['radarData'] });
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: ASSESSMENT RESULTS BREAKDOWN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (submissionResult) {
    const passed = submissionResult.passed;
    const scorePct = submissionResult.scorePct ?? submissionResult.score ?? 0;
    const passingScorePct = submissionResult.practiceSet?.passingScorePct ?? submissionResult.passingScorePct ?? 60;
    const practiceSetTitle = submissionResult.practiceSet?.title ?? submissionResult.practiceSetTitle ?? 'Practice Set';
    const practiceSetId = submissionResult.practiceSet?.id ?? submissionResult.practiceSetId;
    const skillDeltas = submissionResult.skillDeltas || [];
    const questionBreakdown = submissionResult.questionBreakdown || (submissionResult.questionResults as any) || [];

    return (
      <div className="max-w-4xl mx-auto space-y-8 font-sans animate-fade-in p-4 sm:p-6">
        {/* Banner */}
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl ${
            passed
              ? 'bg-status-green/10 border-status-green/30 text-status-green'
              : 'bg-industry-amber/10 border-industry-amber/30 text-industry-amber'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                passed ? 'bg-status-green shadow-lg shadow-status-green/20' : 'bg-industry-amber shadow-lg shadow-industry-amber/20'
              }`}
            >
              {passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                {passed ? 'Assessment Passed' : 'Proficiency Threshold Not Reached'}
              </span>
              <h2 className="text-2xl font-serif font-bold text-console-text">
                {passed ? 'Congratulations! Competency Verified.' : 'Keep Practicing & Bridge the Gaps'}
              </h2>
              <p className="text-xs text-console-text-muted mt-0.5">
                {practiceSetTitle} • Passing Threshold: {passingScorePct}% • Your Score: {scorePct.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/report-card"
              className="px-4 py-2.5 rounded-xl bg-campus-blue/20 hover:bg-campus-blue/30 text-campus-blue text-xs font-semibold border border-campus-blue/40 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report Card</span>
            </Link>
            <button
              onClick={() => {
                setActiveSet(null);
                setSubmissionResult(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-semibold border border-console-border transition-colors"
            >
              All Sets
            </button>
            {practiceSetId && (
              <button
                onClick={() => startAttemptMutation.mutate(practiceSetId)}
                disabled={startAttemptMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Set</span>
              </button>
            )}
          </div>
        </div>

        {/* Skill Calibration Deltas */}
        {skillDeltas && skillDeltas.length > 0 && (
          <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-bridge-teal" />
              <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-console-text">
                Vector Recalibration Impact
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skillDeltas.map((delta, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-console-bg border border-console-border/80 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-console-text">{delta.skillName}</div>
                    <div className="text-[10px] font-mono text-console-text-muted">
                      Previous: {delta.previousScore.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-status-green">
                      {delta.newScore.toFixed(0)}%
                    </span>
                    <div className="text-[10px] font-mono text-status-green font-semibold">
                      +{delta.delta.toFixed(0)} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Review List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-serif text-console-text">
            Detailed Solution & Rubric Breakdown ({questionBreakdown.length} Questions)
          </h3>

          <div className="space-y-4">
            {questionBreakdown.map((q: any, idx: number) => (
              <div
                key={q.questionId}
                className={`p-5 rounded-2xl bg-console-panel border space-y-3 ${
                  q.isCorrect ? 'border-status-green/30' : 'border-status-red/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-console-panel-raised border border-console-border text-xs font-mono font-bold flex items-center justify-center text-console-text">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-console-text-muted uppercase">
                      {q.questionType === 'written' ? 'AI-Evaluated Subjective' : 'Multiple Choice'}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      q.isCorrect
                        ? 'bg-status-green/15 text-status-green border-status-green/30'
                        : 'bg-status-red/15 text-status-red border-status-red/30'
                    }`}
                  >
                    {q.pointsAwarded} / {q.maxPoints} pts
                  </span>
                </div>

                <p className="text-xs font-medium text-console-text leading-relaxed">
                  {q.prompt}
                </p>

                {/* Coding Test Cases Result & Outbound Links */}
                {q.questionType === 'coding' && (
                  <div className="space-y-3">
                    {q.codeResult && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-750 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">
                            Sandbox Test Results: {q.codeResult.passedTestCases}/{q.codeResult.totalTestCases} Passed
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Runtime: {q.codeResult.executionTimeMs}ms
                          </span>
                        </div>
                        {q.codeResult.testCaseResults && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.codeResult.testCaseResults.map((tc: any, tIdx: number) => (
                              <div
                                key={tIdx}
                                className={`p-2 rounded font-mono text-[11px] border ${
                                  tc.passed
                                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                                }`}
                              >
                                <span>Case {tIdx + 1}: {tc.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {q.externalLinks && q.externalLinks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium">Also practice on:</span>
                        {q.externalLinks.map((link: any, lIdx: number) => (
                          <a
                            key={lIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
                          >
                            <span>{link.platform}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Written Rubric Feedback */}
                {q.questionType === 'written' && q.feedback && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Evaluator Rubric Feedback</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {q.feedback}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 rounded-xl bg-console-bg border border-console-border text-[11px] text-console-text-muted leading-relaxed">
                    <span className="font-semibold text-bridge-teal font-mono">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: ACTIVE TIMED ASSESSMENT RUNNER SCREEN
  // ─────────────────────────────────────────────────────────────
  if (activeSet && currentQ) {
    const answeredCount = Object.keys(selectedAnswers).length + Object.keys(writtenAnswers).length;
    const progressPct = (answeredCount / questions.length) * 100;
    const isUrgent = secondsRemaining < 120;

    return (
      <div className="max-w-4xl mx-auto space-y-6 font-sans p-4 sm:p-6 animate-fade-in">
        {/* Sticky Runner Top Bar */}
        <div className="p-4 rounded-2xl bg-console-panel border border-console-border shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-bridge-teal font-semibold">
              {activeSet.domainName}
            </span>
            <h2 className="text-sm font-bold text-console-text font-serif">
              {activeSet.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                isUrgent
                  ? 'bg-status-red/15 text-status-red border-status-red/40 animate-pulse'
                  : 'bg-console-panel-raised text-bridge-teal border-console-border'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={submitAttemptMutation.isPending}
              className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5"
            >
              {submitAttemptMutation.isPending ? 'Grading...' : 'Submit Assessment'}
            </button>
          </div>
        </div>

        {/* Progress Bar & Question Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-console-text-muted">
            <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
            <span>{answeredCount} Answered ({progressPct.toFixed(0)}%)</span>
          </div>
          <div className="w-full h-1.5 bg-console-panel-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-bridge-teal transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] || writtenAnswers[q.id];
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-bridge-teal text-slate-950 shadow-md shadow-bridge-teal/20'
                      : isAnswered
                      ? 'bg-status-green/20 text-status-green border border-status-green/40'
                      : 'bg-console-panel text-console-text-muted border border-console-border hover:text-console-text'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-console-panel border border-console-border shadow-xl space-y-6">
          {/* Listening Audio Passage Box (If Voice Section) */}
          {listeningPassage && (
            <div className="p-5 rounded-2xl bg-[#0F172A] border border-teal-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-serif">
                      {listeningPassage.title}
                    </h4>
                    <span className="text-[10px] font-mono text-teal-400">
                      Audio Lecture Comprehension Clip
                    </span>
                  </div>
                </div>

                {/* 2 Plays Counter Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    playsUsed >= 2
                      ? 'bg-status-red/15 text-status-red border-status-red/30'
                      : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{playsUsed} of 2 plays used {playsUsed >= 2 ? '(Locked)' : ''}</span>
                </div>
              </div>

              {/* Audio Controls & Waveform Simulation */}
              <div className="flex items-center gap-4 bg-black/40 p-3.5 rounded-xl border border-slate-800">
                {isPlayingAudio ? (
                  <button
                    onClick={handleStopVoicePassage}
                    className="p-2.5 rounded-xl bg-status-red text-white hover:bg-status-red/90 transition-colors shadow-lg"
                    title="Stop Audio"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlayVoicePassage}
                    disabled={playsUsed >= 2}
                    className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={playsUsed >= 2 ? 'Plays exhausted' : 'Play audio'}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}

                <div className="flex-1 flex items-center gap-1 h-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-200 ${
                        isPlayingAudio
                          ? 'bg-teal-400 animate-pulse'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height: isPlayingAudio ? `${Math.sin(i * 0.4) * 14 + 10}px` : '4px',
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {isPlayingAudio ? 'Playing...' : playsUsed >= 2 ? 'Audio Locked' : 'Ready to Listen'}
                </span>
              </div>
            </div>
          )}

          {/* Reading Passage Text Box (If Reading Section) */}
          {currentQ.passageText && !listeningPassage && (
            <div className="p-5 rounded-2xl bg-console-bg border border-console-border space-y-2">
              <span className="text-[10px] font-mono text-bridge-teal uppercase tracking-wider font-semibold">
                Reading Comprehension Passage
              </span>
              <p className="text-xs text-console-text leading-relaxed whitespace-pre-line">
                {currentQ.passageText}
              </p>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-bridge-teal">
                Q{currentQuestionIdx + 1}.
              </span>
              {currentQ.questionType === 'written' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI-Evaluated Subjective
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-console-text leading-relaxed">
              {currentQ.prompt}
            </h3>
          </div>

          {/* MCQ Option Cards */}
          {currentQ.questionType === 'mcq' && (
            <div className="space-y-2.5">
              {currentQ.options.map(opt => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() =>
                      setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))
                    }
                    className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-bridge-teal/15 border-bridge-teal text-console-text shadow-sm'
                        : 'bg-console-bg border-console-border hover:border-console-text-muted text-console-text-muted hover:text-console-text'
                    }`}
                  >
                    <span className="text-xs font-medium leading-relaxed">{opt.text}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-bridge-teal bg-bridge-teal'
                          : 'border-console-border bg-console-panel-raised'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Written Subjective Textarea with Rubric Hint */}
          {currentQ.questionType === 'written' && (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={writtenAnswers[currentQ.id] || ''}
                onChange={e =>
                  setWrittenAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))
                }
                placeholder="Write your structured technical explanation here. Be thorough with architecture concepts and tradeoffs..."
                className="w-full p-4 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-console-text-muted">
                <span>Evaluated on technical clarity, trade-off depth, and keyword accuracy.</span>
                <span>{(writtenAnswers[currentQ.id] || '').split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          )}

          {/* Coding Problem & Isolated Sandbox Runner */}
          {currentQ.questionType === 'coding' && (
            <div className="space-y-3">
              <CodingSandbox
                question={currentQ}
                userCode={codingAnswers[currentQ.id]}
                onChangeCode={(code) => setCodingAnswers(prev => ({ ...prev, [currentQ.id]: code }))}
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-console-border">
            <button
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-xs font-semibold text-console-text border border-console-border disabled:opacity-30 transition-colors"
            >
              Previous Question
            </button>

            {currentQuestionIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold transition-all shadow-md shadow-bridge-teal/20"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2 rounded-xl bg-status-green hover:bg-status-green/90 text-slate-950 text-xs font-bold transition-all shadow-md shadow-status-green/20"
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 3: PRACTICE SET SELECTION & APTITUDE HUB SCREEN
  // ─────────────────────────────────────────────────────────────
  const availableDomains = [
    'Full-Stack Web',
    'AI/Data Science',
    'Cloud/DevOps',
    'UI/UX Product Design',
    'Embedded/IoT',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans p-4 sm:p-6">
      {/* Daily Practice Mandatory Requirement Nudge */}
      <DailyPracticeBanner
        onStartSet={(setId) => startAttemptMutation.mutate(setId)}
      />

      {/* Top Header */}
      <div className="space-y-3 border-b border-console-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-bridge-teal font-semibold">
                Standardized Skill Verification
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal" />
              <span className="text-xs font-mono text-console-text-muted">Timed Practice Sets & Aptitude</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-console-text">
              Assessment & Competency Calibration
            </h1>
          </div>

          <Link
            to="/report-card"
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-console-panel hover:bg-console-panel-raised border border-console-border text-xs font-semibold text-console-text flex items-center gap-2 transition-all hover:border-bridge-teal/40 group shadow-md"
          >
            <FileText className="w-4 h-4 text-bridge-teal group-hover:scale-110 transition-transform" />
            <span>View Historical Report Card</span>
            <ChevronRight className="w-3.5 h-3.5 text-console-text-muted" />
          </Link>
        </div>

        <p className="text-xs text-console-text-muted max-w-2xl leading-relaxed">
          Complete timed technical practice sets and standalone aptitude modules to calibrate your mathematical radar vector, increase internship match scores, and unlock verified badges.
        </p>

        {/* Primary Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setMainCategory('domain')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mainCategory === 'domain'
                ? 'bg-bridge-teal text-slate-950 shadow-md shadow-bridge-teal/20 font-bold'
                : 'bg-console-panel hover:bg-console-panel-raised text-console-text-muted border border-console-border'
            }`}
          >
            Domain Competency Sets
          </button>

          <button
            onClick={() => setMainCategory('aptitude')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mainCategory === 'aptitude'
                ? 'bg-campus-blue text-white shadow-md shadow-campus-blue/20 font-bold'
                : 'bg-console-panel hover:bg-console-panel-raised text-console-text-muted border border-console-border'
            }`}
          >
            Dedicated Aptitude Module
          </button>

          <button
            onClick={() => setMainCategory('dsa')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainCategory === 'dsa'
                ? 'bg-gradient-to-r from-bridge-teal to-emerald-400 text-slate-950 shadow-md shadow-bridge-teal/20 font-bold'
                : 'bg-console-panel hover:bg-console-panel-raised text-console-text-muted border border-console-border'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>DSA Coding Practice</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {mainCategory === 'dsa' ? (
        <div className="space-y-8 animate-fade-in">
          {/* A. Daily Mandatory DSA Practice */}
          <DsaDailyBanner
            onStartDailyPractice={(daily) => {
              setDsaRunnerSession({
                mode: 'daily',
                questions: daily.questions || [],
                dailyData: daily,
                customTitle: "Today's Daily Practice",
              });
            }}
          />

          {/* B. Custom DSA Practice Generator */}
          <DsaCustomGenerator
            onGenerateSet={(set) => {
              setDsaRunnerSession({
                mode: 'custom',
                questions: (set.questions as any) || [],
                customTitle: set.title,
              });
            }}
          />

          {/* E. DSA Progress Dashboard */}
          <DsaProgressDashboard />

          {/* C. DSA Problem Explorer */}
          <DsaProblemExplorer
            onPracticeQuestion={(q) => {
              setDsaRunnerSession({
                mode: 'single',
                questions: [q],
                customTitle: `Practice: ${q.title}`,
              });
            }}
          />
        </div>
      ) : (
        <>
          {/* Subcategory Pills */}
          {mainCategory === 'domain' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableDomains.map(dom => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDomain === dom
                      ? 'bg-console-panel-raised text-bridge-teal border border-bridge-teal/40 font-semibold'
                      : 'bg-console-panel text-console-text-muted hover:text-console-text border border-console-border'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'aptitude_quant', label: 'Quantitative Maths', icon: Calculator },
                { id: 'aptitude_english_reading', label: 'English Reading Comprehension', icon: BookOpen },
                { id: 'aptitude_english_listening', label: 'Voice-Based Listening (2 Plays Max)', icon: Headphones },
              ].map(apt => {
                const Icon = apt.icon;
                return (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAptitudeType(apt.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      selectedAptitudeType === apt.id
                        ? 'bg-campus-blue/20 text-campus-blue border border-campus-blue/40 font-semibold'
                        : 'bg-console-panel text-console-text-muted hover:text-console-text border border-console-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{apt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sets Grid */}
          {loadingSets ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-console-text-muted">Loading available practice sets...</p>
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-console-panel border border-console-border text-center space-y-2">
              <CheckSquare className="w-8 h-8 text-console-text-muted mx-auto" />
              <p className="text-xs font-semibold text-console-text">No practice sets available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSets.map(set => {
                const hasAttempted = set.previousBestScore !== undefined && set.previousBestScore !== null;
                const hasPassed = hasAttempted && (set.previousBestScore || 0) >= set.passingScorePct;
                const isStartingThis = startingSetId === set.id && startAttemptMutation.isPending;

                return (
                  <div
                    key={set.id}
                    className="p-6 rounded-2xl bg-console-panel border border-console-border hover:border-bridge-teal/40 transition-all duration-200 shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-console-panel-raised border border-console-border text-console-text-muted">
                          {set.difficulty}
                        </span>

                        {hasPassed ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Best: {set.previousBestScore?.toFixed(0)}%</span>
                          </span>
                        ) : hasAttempted ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-industry-amber/15 text-industry-amber border border-industry-amber/30">
                            Best: {set.previousBestScore?.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-console-text-muted">
                            Unattempted
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-bold text-sm text-console-text group-hover:text-bridge-teal transition-colors">
                        {set.title}
                      </h3>

                      <p className="text-xs text-console-text-muted leading-relaxed line-clamp-3">
                        {set.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-console-border/60">
                      <div className="flex items-center justify-between text-[11px] font-mono text-console-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-bridge-teal" />
                          <span>{set.timeLimitMinutes} Mins</span>
                        </div>
                        <div>Pass: {set.passingScorePct}%</div>
                      </div>

                      <button
                        onClick={() => startAttemptMutation.mutate(set.id)}
                        disabled={startAttemptMutation.isPending}
                        className="w-full py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isStartingThis ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Preparing Questions...</span>
                          </>
                        ) : (
                          <>
                            <span>{hasAttempted ? 'Retake Attempt' : 'Start Assessment'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
