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
  DailyMixedPracticeSetData,
  DailyMixedSubmitResult,
  DSAQuestionData,
  DailyPracticeData,
} from '@shared/types';
import { CodingSandbox } from '../../components/CodingSandbox';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';
import { DsaDailyBanner } from '../../components/dsa/DsaDailyBanner';
import { MatchCard } from '../../components/MatchCard';
import { VerifiedActivityCard } from '../../components/VerifiedActivityCard';
import { ExamIntegrityGuard } from '../../components/integrity/ExamIntegrityGuard';
import { Code2 } from 'lucide-react';

// Code-split heavy DSA sub-components to eliminate initial tab lag
const DsaCustomGenerator = React.lazy(() => import('../../components/dsa/DsaCustomGenerator').then(m => ({ default: m.DsaCustomGenerator })));
const DsaProgressDashboard = React.lazy(() => import('../../components/dsa/DsaProgressDashboard').then(m => ({ default: m.DsaProgressDashboard })));
const DsaProblemExplorer = React.lazy(() => import('../../components/dsa/DsaProblemExplorer').then(m => ({ default: m.DsaProblemExplorer })));
const DsaPracticeRunner = React.lazy(() => import('../../components/dsa/DsaPracticeRunner').then(m => ({ default: m.DsaPracticeRunner })));

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

  // Daily Mixed Practice Session State
  const [isDailyMixedSession, setIsDailyMixedSession] = useState(false);
  const [dailyMixedData, setDailyMixedData] = useState<DailyMixedPracticeSetData | null>(null);
  const [dailyMixedResult, setDailyMixedResult] = useState<DailyMixedSubmitResult | null>(null);
  const [loadingDailyMixed, setLoadingDailyMixed] = useState(false);

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
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1500); // 25 minutes (1500s) default
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
      const limitMinutes = (!data.timeLimitMinutes || data.timeLimitMinutes <= 15) ? 25 : data.timeLimitMinutes;
      setSecondsRemaining(limitMinutes * 60);
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

  // Auto-start set from search param ?set=... or switch domain from ?domain=...
  useEffect(() => {
    const setParam = searchParams.get('set');
    if (setParam && !activeSet && !submissionResult && !startingSetId) {
      startAttemptMutation.mutate(setParam);
      setSearchParams({}, { replace: true });
    }
    const domainParam = searchParams.get('domain');
    if (domainParam && selectedDomain !== domainParam) {
      setSelectedDomain(domainParam);
      setMainCategory('domain');
    }
  }, [searchParams, activeSet, submissionResult, startingSetId, selectedDomain]);

  // Open DSA Runner with URL searchParam synchronization
  const openDsaRunner = (session: {
    mode: 'daily' | 'custom' | 'single';
    questions: DSAQuestionData[];
    dailyData?: DailyPracticeData;
    customTitle?: string;
  }) => {
    setDsaRunnerSession(session);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'dsa');
      next.set('runner', session.mode);
      return next;
    });
  };

  const handleExitDsaRunner = () => {
    setDsaRunnerSession(null);
    queryClient.invalidateQueries({ queryKey: ['dsaDailyPractice'] });
    queryClient.invalidateQueries({ queryKey: ['dsaProgress'] });
    queryClient.invalidateQueries({ queryKey: ['dsaQuestions'] });
    queryClient.invalidateQueries({ queryKey: ['radarData'] });

    if (searchParams.has('runner')) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('runner');
          return next;
        });
      }
    }
  };

  // Auto-start runner if URL specifies runner=daily or sync when browser back button is pressed
  useEffect(() => {
    const runnerParam = searchParams.get('runner');
    if (runnerParam === 'daily' && !dsaRunnerSession) {
      api.get<{ dailyPractice: DailyPracticeData }>('/dsa/daily').then((res) => {
        if (res.dailyPractice && res.dailyPractice.questions && res.dailyPractice.questions.length > 0) {
          setDsaRunnerSession({
            mode: 'daily',
            questions: res.dailyPractice.questions,
            dailyData: res.dailyPractice,
            customTitle: "Today's Daily Practice",
          });
          setMainCategory('dsa');
        }
      }).catch((err) => {
        console.error('Failed to auto-start daily runner from URL:', err);
      });
    } else if (!runnerParam && dsaRunnerSession) {
      setDsaRunnerSession(null);
    }
  }, [searchParams, dsaRunnerSession]);

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

  // Start Daily Mixed Practice Set
  const startDailyMixedPractice = async () => {
    try {
      setLoadingDailyMixed(true);
      const res = await api.get<{ mixedSet: DailyMixedPracticeSetData }>('/assessments/daily-mixed');
      if (res?.mixedSet) {
        const ms = res.mixedSet;
        setDailyMixedData(ms);
        setIsDailyMixedSession(true);
        setActiveSet({
          id: ms.id,
          title: `Daily Mixed Practice Set (${ms.date})`,
          description: `Mandatory daily practice set: ${ms.aptitudeCount} Aptitude + ${ms.domainCount} Domain Core + ${ms.dsaCount} DSA Coding questions.`,
          domainName: 'Daily Mixed Practice',
          type: 'domain',
          timeLimitMinutes: 30,
          passingScorePct: 60,
          difficulty: 'Mixed' as any,
          displayOrder: 1,
          questionCount: ms.totalQuestions,
        });
        setAttemptId(ms.id);
        setQuestions(
          ms.questions.map((q) => ({
            id: q.id,
            domain: (q as any).domain || 'Domain Core',
            skillId: (q as any).skillId || q.id,
            type: q.sourceType as any,
            questionType: q.questionType,
            prompt: q.prompt,
            options: q.options || [],
            weight: q.weight,
            passageText: q.passageText,
            listeningPassage: q.listeningPassage,
            starterCode: typeof q.starterCode === 'object' ? (q.starterCode as any).javascript : q.starterCode || '',
            entryFunctionName: q.entryFunctionName,
            testCases: q.testCases || [],
            constraints: q.constraints,
            externalLinks: q.externalLinks || [],
          }))
        );
        setCurrentQuestionIdx(0);
        setSelectedAnswers({});
        setWrittenAnswers({});
        setCodingAnswers({});
        setSecondsRemaining(30 * 60);
        setIsTimerRunning(true);
        setDailyMixedResult(null);
        setSubmissionResult(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      alert(`Could not start daily mixed practice: ${err?.message || 'Please try again.'}`);
    } finally {
      setLoadingDailyMixed(false);
    }
  };

  const submitDailyMixedAttempt = async () => {
    try {
      setIsTimerRunning(false);
      const codingPayload: Record<string, { code: string; language: string }> = {};
      Object.entries(codingAnswers).forEach(([qId, codeStr]) => {
        codingPayload[qId] = { code: codeStr, language: 'javascript' };
      });

      const res = await api.post<{ result: DailyMixedSubmitResult }>('/assessments/daily-mixed/submit', {
        answers: selectedAnswers,
        writtenAnswers: writtenAnswers,
        codingAnswers: codingPayload,
        timeSpentSeconds: 1800 - secondsRemaining,
      });

      if (res?.result) {
        setDailyMixedResult(res.result);
        queryClient.invalidateQueries({ queryKey: ['dailyPracticeStatus'] });
        queryClient.invalidateQueries({ queryKey: ['reportCard'] });
        queryClient.invalidateQueries({ queryKey: ['radarData'] });
        queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      }
    } catch (err: any) {
      alert(`Failed to submit daily mixed practice: ${err?.message || 'Please retry.'}`);
    }
  };

  const handleAutoSubmit = () => {
    if (isDailyMixedSession) {
      submitDailyMixedAttempt();
      return;
    }
    if (activeSet && attemptId && !submissionResult) {
      submitAttemptMutation.mutate({
        answers: selectedAnswers,
        writtenAnswers: writtenAnswers,
        codingAnswers: codingAnswers,
      });
    }
  };

  const handleManualSubmit = () => {
    if (isDailyMixedSession) {
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
      submitDailyMixedAttempt();
      return;
    }

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
    const safeSecs = Math.max(0, totalSecs);
    const mins = Math.floor(safeSecs / 60);
    const secs = safeSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────
  // VIEW 0: DSA ACTIVE PRACTICE RUNNER SCREEN
  // ─────────────────────────────────────────────────────────────
  if (dsaRunnerSession) {
    return (
      <React.Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading DSA coding runner...</div>}>
        <DsaPracticeRunner
          questions={dsaRunnerSession.questions}
          mode={dsaRunnerSession.mode}
          dailyPracticeData={dsaRunnerSession.dailyData}
          customSetTitle={dsaRunnerSession.customTitle}
          onExit={handleExitDsaRunner}
        />
      </React.Suspense>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 1a: DAILY MIXED PRACTICE RESULTS BREAKDOWN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (dailyMixedResult) {
    const passed = dailyMixedResult.passed;
    const scorePct = dailyMixedResult.overallScore;
    const streak = dailyMixedResult.currentStreak;
    const { aptitude, domain, dsa } = dailyMixedResult.categoryBreakdown;

    return (
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 font-sans animate-fade-in">
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Daily Mixed Practice • {dailyMixedResult.date}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {streak}-Day Streak {dailyMixedResult.streakUpdated ? '(+1 🔥)' : 'Active'}
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-console-text">
                {passed ? 'Daily Practice Completed! Streak Maintained' : 'Practice Set Finished — Keep Pushing!'}
              </h2>
              <p className="text-xs text-console-text-muted mt-0.5">
                Passing Threshold: 60% • Your Overall Score: <strong className="text-white">{scorePct}%</strong>
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
                setIsDailyMixedSession(false);
                setDailyMixedResult(null);
                setDailyMixedData(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-semibold border border-console-border transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* 3 Distinct Category Match Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MatchCard
            label="APTITUDE (MATHS & ENGLISH)"
            value={`${aptitude.score}%`}
            subtitle={`${aptitude.correct} of ${aptitude.total} questions correct`}
            status={aptitude.passed ? 'verified' : 'unverified'}
            progress={aptitude.score}
          />
          <MatchCard
            label="DOMAIN CORE SUBJECTS"
            value={`${domain.score}%`}
            subtitle={`${domain.correct} of ${domain.total} questions correct`}
            status={domain.passed ? 'verified' : 'unverified'}
            progress={domain.score}
          />
          <MatchCard
            label="DSA / CODING"
            value={`${dsa.score}%`}
            subtitle={`${dsa.solved} of ${dsa.total} problems solved`}
            status={dsa.passed ? 'verified' : 'unverified'}
            progress={dsa.score}
          />
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-serif text-console-text">
            Mixed Set Solutions & Breakdown ({dailyMixedResult.questionResults.length} Questions)
          </h3>

          <div className="space-y-4">
            {dailyMixedResult.questionResults.map((q, idx) => (
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
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold bg-slate-800 text-teal-300 border border-slate-700">
                      {q.sourceType === 'aptitude' ? 'Aptitude' : q.sourceType === 'domain' ? 'Domain Core' : 'DSA Coding'}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      q.isCorrect
                        ? 'bg-status-green/15 text-status-green border-status-green/30'
                        : 'bg-status-red/15 text-status-red border-status-red/30'
                    }`}
                  >
                    {q.isCorrect ? '✓ PASSED' : '✗ INCORRECT'} ({q.score}/{q.maxScore} pts)
                  </span>
                </div>

                <p className="text-xs text-console-text font-medium leading-relaxed">{q.prompt}</p>

                {q.userAnswer && (
                  <div className="text-xs text-slate-400 font-mono">
                    <span className="text-slate-500">Your Answer:</span> {q.userAnswer}
                  </div>
                )}

                {q.feedback && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200">
                    {q.feedback}
                  </div>
                )}

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
  // VIEW 1b: STANDARD ASSESSMENT RESULTS BREAKDOWN SCREEN
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
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 font-sans animate-fade-in">
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
                className="px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
                  key={delta.skillId || `delta-${idx}`}
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
    const answeredCount = questions.filter(q => {
      if (q.questionType === 'mcq') return Boolean(selectedAnswers[q.id]);
      if (q.questionType === 'written') return Boolean(writtenAnswers[q.id]?.trim());
      if (q.questionType === 'coding') return Boolean(codingAnswers[q.id]?.trim());
      return Boolean(selectedAnswers[q.id] || writtenAnswers[q.id] || codingAnswers[q.id]);
    }).length;
    const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const isUrgent = secondsRemaining < 120;

    return (
      <ExamIntegrityGuard
        sessionId={attemptId || activeSet.id}
        sessionType={isDailyMixedSession ? "DAILY_SET" : "PRACTICE_SET"}
      >
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 font-sans animate-fade-in">
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
              className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5"
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

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full touch-pan-x">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(
                (q.questionType === 'mcq' && selectedAnswers[q.id]) ||
                (q.questionType === 'written' && writtenAnswers[q.id]?.trim()) ||
                (q.questionType === 'coding' && codingAnswers[q.id]?.trim()) ||
                selectedAnswers[q.id] || writtenAnswers[q.id] || codingAnswers[q.id]
              );
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`min-w-[2.25rem] h-9 w-9 flex items-center justify-center shrink-0 rounded-lg text-xs font-semibold font-mono transition-all ${
                    isCurrent
                      ? 'bg-bridge-teal text-white shadow-md shadow-bridge-teal/20 font-bold ring-2 ring-bridge-teal/50'
                      : isAnswered
                      ? 'bg-status-green/20 text-status-green border border-status-green/40 font-bold'
                      : 'bg-console-panel text-console-text-muted border border-console-border hover:text-console-text hover:border-console-text-muted'
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
                    className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
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
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-200 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-console-bg border-console-border hover:border-console-text-muted text-console-text-muted hover:text-console-text'
                    }`}
                  >
                    <span className="text-xs font-medium leading-relaxed">{opt.text}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500'
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
                onChange={e => {
                  const text = e.target.value;
                  setWrittenAnswers(prev => ({ ...prev, [currentQ.id]: text }));
                }}
                placeholder="Write your structured technical explanation here. Be thorough with architecture concepts and tradeoffs..."
                className="w-full p-4 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-console-text-muted">
                <span>Evaluated on technical clarity, trade-off depth, and keyword accuracy.</span>
                <span className="font-semibold text-cyan-400">
                  {(() => {
                    const text = writtenAnswers[currentQ.id] || '';
                    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                    return `${wordCount} words`;
                  })()}
                </span>
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
                className="px-5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-bold transition-all shadow-md shadow-bridge-teal/20"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2 rounded-xl bg-status-green hover:bg-status-green/90 text-white text-xs font-bold transition-all shadow-md shadow-status-green/20"
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </ExamIntegrityGuard>
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
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 font-sans">
      {/* Daily Practice Mandatory Requirement Nudge */}
      <DailyPracticeBanner
        onStartSet={(setId) => startAttemptMutation.mutate(setId)}
      />

      {/* Top Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="tech-pill text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>STANDARDIZED SKILL VERIFICATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Assessment & Competency Calibration
            </h1>
          </div>

          <Link
            to="/report-card"
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#0b1222] hover:bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all group shadow-md"
          >
            <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>View Historical Report Card</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Complete timed technical practice sets and standalone aptitude modules to calibrate your mathematical radar vector, increase internship match scores, and unlock verified badges.
        </p>

        {/* Primary Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setMainCategory('domain')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              mainCategory === 'domain'
                ? 'bg-bridge-teal text-white shadow-md shadow-bridge-teal/20 font-bold'
                : 'bg-panel hover:bg-panel-raised text-text-muted hover:text-text-primary border border-border'
            }`}
          >
            Domain Competency Sets
          </button>

          <button
            onClick={() => setMainCategory('aptitude')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              mainCategory === 'aptitude'
                ? 'bg-bridge-teal text-white shadow-md shadow-bridge-teal/20 font-bold'
                : 'bg-panel hover:bg-panel-raised text-text-muted hover:text-text-primary border border-border'
            }`}
          >
            Dedicated Aptitude Module
          </button>

          <button
            onClick={() => setMainCategory('dsa')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainCategory === 'dsa'
                ? 'bg-bridge-teal text-white shadow-md shadow-bridge-teal/20 font-bold'
                : 'bg-panel hover:bg-panel-raised text-text-muted hover:text-text-primary border border-border'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>DSA Coding Practice</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {mainCategory === 'dsa' ? (
        <React.Suspense fallback={<div className="p-8 text-center text-xs font-mono text-text-muted">Loading DSA workspace...</div>}>
          <div className="space-y-5 sm:space-y-6 animate-fade-in">
            {/* A. Daily Mandatory DSA Practice */}
            <DsaDailyBanner
              onStartDailyPractice={(daily) => {
                openDsaRunner({
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
                openDsaRunner({
                  mode: 'custom',
                  questions: ((set as any).questions as any) || [],
                  customTitle: set.title,
                });
              }}
            />

            {/* E. DSA Progress Dashboard */}
            <DsaProgressDashboard />

            {/* C. DSA Problem Explorer */}
            <DsaProblemExplorer
              onPracticeQuestion={(q) => {
                openDsaRunner({
                  mode: 'single',
                  questions: [q],
                  customTitle: `Practice: ${q.title}`,
                });
              }}
            />
          </div>
        </React.Suspense>
      ) : (
        <>
          {/* Subcategory Pills */}
          {mainCategory === 'domain' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableDomains.map(dom => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDomain === dom
                      ? 'bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/40 font-semibold shadow-sm'
                      : 'bg-panel text-text-muted hover:text-text-primary border border-border'
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
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedAptitudeType === apt.id
                        ? 'bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/40 font-semibold shadow-sm'
                        : 'bg-panel text-text-muted hover:text-text-primary border border-border'
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
              <p className="text-xs font-mono text-text-muted">Loading available practice sets...</p>
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-panel border border-border text-center space-y-2">
              <CheckSquare className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs font-semibold text-text-primary">No practice sets available in this category.</p>
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
                    className="p-6 rounded-2xl bg-panel border border-border hover:border-bridge-teal/40 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="small-caps-label text-[10px] px-2.5 py-0.5 rounded-full bg-panel-raised border border-border text-text-muted">
                          {set.difficulty}
                        </span>

                        {hasPassed ? (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-signal-green/15 text-signal-green border border-signal-green/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Best: {set.previousBestScore?.toFixed(0)}%</span>
                          </span>
                        ) : hasAttempted ? (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-signal-amber/15 text-signal-amber border border-signal-amber/30">
                            Best: {set.previousBestScore?.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-text-muted">
                            Unattempted
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-text-primary group-hover:text-bridge-teal transition-colors font-sans">
                        {set.title}
                      </h3>

                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3 font-sans">
                        {set.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-bridge-teal" />
                          <span>{set.timeLimitMinutes <= 15 ? 25 : (set.timeLimitMinutes || 25)} Mins</span>
                        </div>
                        <div>Pass: {set.passingScorePct}%</div>
                      </div>

                      <button
                        onClick={() => startAttemptMutation.mutate(set.id)}
                        disabled={startAttemptMutation.isPending}
                        className="bridge-btn-primary w-full py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
