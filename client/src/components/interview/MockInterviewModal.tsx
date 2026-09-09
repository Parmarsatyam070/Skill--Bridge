import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen,
  ArrowRight,
  Quote,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  MockInterviewQuestionItem,
  MockInterviewAnswerItem,
  MockInterviewEvaluation,
} from '@shared/types';
import { ExamIntegrityGuard } from '../integrity/ExamIntegrityGuard';
import { ExamSuspensionOverlay } from '../integrity/ExamSuspensionOverlay';
import { MockInterviewCamera } from './MockInterviewCamera';

interface MockInterviewModalProps {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onFinishSuccess?: () => void;
}

export const MockInterviewModal: React.FC<MockInterviewModalProps> = ({
  internshipId,
  internshipTitle,
  companyName,
  isOpen,
  onClose,
  onFinishSuccess,
}) => {
  // Session State
  const [session, setSession] = useState<any | null>(null);
  const [questions, setQuestions] = useState<MockInterviewQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionTimers, setQuestionTimers] = useState<Record<number, number>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<MockInterviewEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suspensionData, setSuspensionData] = useState<{
    isSuspended: boolean;
    remainingSeconds: number;
    reason?: string;
    suspendedUntil?: string;
  } | null>(null);

  // 30-Minute Timer (1800 seconds total)
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(30 * 60);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Audio / Speech State
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(true);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  // Start/Initialize Session
  const initSession = async () => {
    try {
      setIsInitializing(true);
      setErrorMsg(null);
      setSuspensionData(null);
      setEvaluation(null);
      setCurrentIndex(0);
      setAnswers({});
      setQuestionTimers({});
      setTotalSecondsLeft(30 * 60);
      setIsTimedOut(false);
      setShowSubmitConfirm(false);

      const res = await api.post<{
        session: any;
        questions: MockInterviewQuestionItem[];
        sashGreeting: string;
        dailySessionsRemaining: number;
      }>('/mock-interview/start', { internshipId });

      setSession(res.session);
      setQuestions(res.questions);

      // Auto-speak Sash greeting if speech enabled
      if ('speechSynthesis' in window && voiceAudioEnabled) {
        speakText(res.sashGreeting);
      }
    } catch (err: any) {
      const errData = err?.response?.data?.error;
      if (errData?.code === 'EXAM_ACCESS_SUSPENDED') {
        setSuspensionData({
          isSuspended: true,
          remainingSeconds: errData.remainingSeconds || 259200,
          reason: errData.reason || 'Integrity violations detected.',
          suspendedUntil: errData.suspendedUntil,
        });
      }
      const msg = errData?.message || err?.message || 'Could not start mock interview session.';
      setErrorMsg(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !session && !isInitializing && !evaluation) {
      initSession();
    }
    if (!isOpen) {
      stopVoiceRecognition();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  // 30-Minute Global Timer & Auto-Submit on Expiration
  useEffect(() => {
    if (!isOpen || !session || evaluation || isSubmitting) return;

    const interval = setInterval(() => {
      setTotalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });

      // Increment per-question time counter
      setQuestionTimers((prev) => ({
        ...prev,
        [currentIndex + 1]: (prev[currentIndex + 1] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session, currentIndex, evaluation, isSubmitting]);

  // Web Speech API Voice Synthesis (Sash speaks questions)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Speech-to-Text Voice Recognition
  const toggleVoiceRecognition = () => {
    if (isListeningVoice) {
      stopVoiceRecognition();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your answer directly.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setAnswers((prev) => {
            const currentVal = prev[currentIndex + 1] || '';
            const spacer = currentVal.length > 0 && !currentVal.endsWith(' ') ? ' ' : '';
            return {
              ...prev,
              [currentIndex + 1]: currentVal + spacer + finalTranscript,
            };
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setIsListeningVoice(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListeningVoice(false);
  };

  // Save intermediate answer to server
  const saveCurrentAnswerToServer = async (qIdx: number) => {
    if (!session?.id) return;
    const q = questions[qIdx - 1];
    if (!q) return;

    try {
      await api.post(`/mock-interview/${session.id}/submit-answer`, {
        questionIndex: qIdx,
        questionText: q.questionText,
        category: q.category,
        skillTag: q.skillTag,
        studentAnswer: answers[qIdx] || '',
        timeTakenSeconds: questionTimers[qIdx] || 0,
      });
    } catch {}
  };

  // Navigate Questions
  const handleNext = async () => {
    stopVoiceRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    await saveCurrentAnswerToServer(currentIndex + 1);

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (voiceAudioEnabled && questions[nextIdx]) {
        speakText(questions[nextIdx].questionText);
      }
    }
  };

  const handlePrev = async () => {
    stopVoiceRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    await saveCurrentAnswerToServer(currentIndex + 1);

    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (voiceAudioEnabled && questions[prevIdx]) {
        speakText(questions[prevIdx].questionText);
      }
    }
  };

  // Conclude & Submit Interview
  const handleFinish = async (timedOut = false) => {
    if (!session?.id) return;
    stopVoiceRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setIsSubmitting(true);
    setShowSubmitConfirm(false);
    setErrorMsg(null);

    try {
      // Save current question's answer if active
      await saveCurrentAnswerToServer(currentIndex + 1);

      // Bundle answers with complete question set
      const formattedAnswers: MockInterviewAnswerItem[] = questions.map((q) => {
        const text = answers[q.questionIndex] || '';
        return {
          questionIndex: q.questionIndex,
          questionText: q.questionText,
          category: q.category,
          skillTag: q.skillTag,
          studentAnswer: text,
          timeTakenSeconds: questionTimers[q.questionIndex] || 0,
          isSkipped: text.trim().length === 0,
        };
      });

      const totalDuration = Math.max(1, (30 * 60) - totalSecondsLeft);

      const res = await api.post<{
        message: string;
        sessionId: string;
        evaluation: MockInterviewEvaluation;
      }>(`/mock-interview/${session.id}/finish`, {
        answers: formattedAnswers,
        durationSeconds: totalDuration,
        isTimedOut: timedOut,
      });

      setEvaluation(res.evaluation);
      if (onFinishSuccess) {
        onFinishSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to analyze interview transcript.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Explicit 30-Minute Timeout Handler
  const handleTimeExpired = () => {
    setIsTimedOut(true);
    handleFinish(true);
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Answer completeness checks for early submission gating
  const isQuestionAnswered = (qIndex: number) => {
    const text = answers[qIndex];
    return Boolean(text && text.trim().length > 0);
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.questionIndex)).length;
  const allQuestionsAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-console-panel border border-console-border rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden text-xs text-console-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-console-border flex items-center justify-between gap-4 bg-console-panel-raised">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-bridge-teal/15 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-base text-console-text">
                  AI Mock Interview with Sash
                </span>
                {session && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30">
                    {session.retakeNumber === 1 ? 'Initial Attempt' : `Retake #${session.retakeNumber}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-console-text-muted">
                {internshipTitle} • {companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live 30-Minute Timer Badge */}
            {!evaluation && session && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border transition-colors ${
                  totalSecondsLeft <= 300
                    ? 'bg-status-red/15 text-status-red border-status-red/40 animate-pulse'
                    : 'bg-console-bg text-bridge-teal border-console-border'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(totalSecondsLeft)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-bg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-status-red/10 border border-status-red/30 text-status-red flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs">Interview Session Alert</div>
                <div className="text-[11px] opacity-90 mt-0.5">{errorMsg}</div>
              </div>
            </div>
          )}

          {isInitializing ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-serif font-bold text-sm text-console-text">
                Sash is tailoring role-specific questions for {internshipTitle}...
              </div>
              <p className="text-[11px] text-console-text-muted">
                Analyzing required skills, benchmarking your gaps, and rotating question banks.
              </p>
            </div>
          ) : isSubmitting ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-bridge-teal/15 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal mx-auto animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-console-text">
                  Sash is Running the LLM Transcript Analysis Pass...
                </h3>
                <p className="text-[11px] text-console-text-muted max-w-md mx-auto">
                  Evaluating content relevance, technical depth, communication clarity, and STAR-method structure with specific quoted feedback.
                </p>
              </div>
            </div>
          ) : evaluation ? (
            /* ── Scored Feedback & Review View ── */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Overall Score Banner */}
              <div className="p-5 rounded-2xl bg-console-panel-raised border border-console-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bridge-teal to-bridge-teal/70 text-white flex flex-col items-center justify-center font-bold shadow-lg shadow-bridge-teal/20">
                    <span className="text-xl leading-none">{evaluation.overallScore}</span>
                    <span className="text-[10px] font-mono opacity-80 mt-0.5">/ 100</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-console-text">
                        Interview Readiness: {evaluation.readinessTier}
                      </span>
                      {isTimedOut && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-status-amber/15 text-status-amber border border-status-amber/30">
                          Auto-Submitted on 30m Timeout
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-console-text-muted max-w-md leading-relaxed">
                      {evaluation.overallSummary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t sm:border-t-0 sm:border-l border-console-border pt-3 sm:pt-0 sm:pl-4 text-center">
                  <div className="p-2 rounded-xl bg-console-bg border border-console-border">
                    <span className="text-[10px] font-mono text-console-text-muted block">Technical</span>
                    <span className="text-sm font-bold font-mono text-bridge-teal">{evaluation.technicalScore}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-console-bg border border-console-border">
                    <span className="text-[10px] font-mono text-console-text-muted block">Communication</span>
                    <span className="text-sm font-bold font-mono text-campus-blue">{evaluation.communicationScore}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-console-bg border border-console-border">
                    <span className="text-[10px] font-mono text-console-text-muted block">STAR Structure</span>
                    <span className="text-sm font-bold font-mono text-status-green">{evaluation.structureScore}%</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Weak Areas Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-status-green/10 border border-status-green/25 space-y-2">
                  <div className="flex items-center gap-2 text-status-green font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Strengths Identified by Sash</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-console-text">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-status-green">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-status-amber/10 border border-status-amber/25 space-y-2">
                  <div className="flex items-center gap-2 text-status-amber font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Identified Weak Areas (Fed into Roadmap & Daily Prep)</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-console-text">
                    {evaluation.weakAreas.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-status-amber">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Question Transcript & Quoted Feedback */}
              <div className="space-y-3">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-console-text-muted font-bold">
                  Detailed Question Transcript & Quoted Rubric Feedback
                </h4>

                {evaluation.questionFeedback.map((fb) => {
                  const q = questions.find((item) => item.questionIndex === fb.questionIndex);
                  const studentAns = answers[fb.questionIndex] || '[Unanswered / Skipped]';

                  return (
                    <div
                      key={fb.questionIndex}
                      className="p-4 rounded-xl bg-console-bg border border-console-border space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-console-panel-raised border border-console-border font-mono font-bold flex items-center justify-center text-[10px] text-console-text">
                            {fb.questionIndex}
                          </span>
                          <span className="font-mono text-[10px] text-console-text-muted uppercase">
                            {q?.category === 'behavioral' ? 'Behavioral (STAR)' : `Technical: ${q?.skillTag}`}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                            fb.score >= 15
                              ? 'bg-status-green/15 text-status-green border-status-green/30'
                              : fb.score >= 10
                              ? 'bg-bridge-teal/15 text-bridge-teal border-bridge-teal/30'
                              : 'bg-status-red/15 text-status-red border-status-red/30'
                          }`}
                        >
                          {fb.score} / {fb.maxScore} pts
                        </span>
                      </div>

                      <p className="text-xs font-medium text-console-text leading-relaxed">
                        {q?.questionText}
                      </p>

                      {/* Transcribed Candidate Answer */}
                      <div className="p-3 rounded-lg bg-console-panel border border-console-border space-y-1 text-[11px]">
                        <span className="text-console-text-muted font-mono font-semibold">Your Transcribed Response:</span>
                        <p className="text-console-text leading-relaxed italic">
                          "{studentAns}"
                        </p>
                      </div>

                      {/* Quoted Feedback */}
                      <div className="p-3 rounded-lg bg-bridge-teal/10 border border-bridge-teal/25 space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-bridge-teal">
                          <Quote className="w-3.5 h-3.5" />
                          <span>Sash's Quoted Feedback & Critique:</span>
                        </div>
                        <p className="text-console-text leading-relaxed">
                          {fb.feedback}
                        </p>
                        {fb.improvements && (
                          <div className="text-[10px] text-console-text-muted pt-1 border-t border-bridge-teal/20">
                            <span className="font-semibold text-bridge-teal font-mono">Actionable Tip: </span>
                            {fb.improvements}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-console-border">
                <Link
                  to="/report-card"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-console-panel hover:bg-console-border border border-console-border text-xs font-semibold text-console-text transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View in Report Card History</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={initSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-console-panel-raised border border-console-border hover:border-bridge-teal text-xs font-semibold text-console-text transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-bridge-teal" />
                    <span>Retake Mock Interview</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-bold text-xs shadow-md shadow-bridge-teal/20 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : currentQ ? (
            /* ── Interactive Live Interview Room ── */
            <ExamIntegrityGuard
              sessionId={session?.id || 'mock-interview'}
              sessionType="MOCK_INTERVIEW"
            >
              <div className="space-y-4">
              {/* Question Progress & Navigation Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-console-text-muted">
                <div className="flex items-center gap-2">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span>•</span>
                  <span className={allQuestionsAnswered ? 'text-status-green font-bold flex items-center gap-1' : 'text-console-text-muted'}>
                    {allQuestionsAnswered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                        <span>All {questions.length} Answered (Ready to Submit)</span>
                      </>
                    ) : (
                      <span>{answeredCount} of {questions.length} answered</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {questions.map((q, qIdx) => {
                    const ansStatus = isQuestionAnswered(q.questionIndex);
                    const isCurrent = qIdx === currentIndex;
                    return (
                      <button
                        key={q.questionIndex}
                        type="button"
                        onClick={async () => {
                          stopVoiceRecognition();
                          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                          await saveCurrentAnswerToServer(currentIndex + 1);
                          setCurrentIndex(qIdx);
                          if (voiceAudioEnabled && questions[qIdx]) {
                            speakText(questions[qIdx].questionText);
                          }
                        }}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold font-mono transition-all flex items-center justify-center border ${
                          isCurrent
                            ? 'bg-bridge-teal text-white border-bridge-teal shadow-sm'
                            : ansStatus
                            ? 'bg-status-green/15 text-status-green border-status-green/30 hover:border-status-green'
                            : 'bg-console-bg text-console-text-muted border-console-border hover:text-console-text'
                        }`}
                        title={`Question ${q.questionIndex}: ${ansStatus ? 'Answered' : 'Pending'}`}
                      >
                        {ansStatus && !isCurrent ? '✓' : q.questionIndex}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full h-1.5 bg-console-bg rounded-full overflow-hidden border border-console-border">
                <div
                  className="h-full bg-bridge-teal transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>

              {/* Main 2-Column Responsive Layout: Left (Questions & Answers), Right (Live Camera Proctor) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: Questions & Response (8 cols on lg) */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Sash Question Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-console-panel-raised border border-console-border space-y-3 relative">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30">
                          Sash Asks:
                        </span>
                        {isSpeakingQuestion && (
                          <span className="flex items-center gap-1 text-[10px] text-bridge-teal font-mono animate-pulse">
                            <Volume2 className="w-3 h-3" />
                            <span>Speaking...</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isSpeakingQuestion) {
                            window.speechSynthesis.cancel();
                            setIsSpeakingQuestion(false);
                          } else {
                            speakText(currentQ.questionText);
                          }
                        }}
                        title="Toggle voice readout"
                        className="p-1.5 rounded-lg bg-console-bg border border-console-border text-console-text-muted hover:text-console-text"
                      >
                        {isSpeakingQuestion ? <VolumeX className="w-4 h-4 text-status-red" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <h3 className="font-serif text-sm sm:text-base font-bold text-console-text leading-relaxed">
                      {currentQ.questionText}
                    </h3>

                    {/* Behavioral STAR Guidance Tip */}
                    {currentQ.category === 'behavioral' && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-[11px] text-purple-200 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">STAR Method Strategy: </span>
                          Structure your response into <b>Situation</b> (the context), <b>Task</b> (your role), <b>Action</b> (steps you executed), and <b>Result</b> (quantified business or tech impact).
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Candidate Response Editor with Speech-to-Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] uppercase tracking-wider text-console-text font-bold flex items-center gap-2">
                        <span>Your Answer (Speak or Type):</span>
                      </label>

                      {/* Speech Recognition Toggle */}
                      <button
                        type="button"
                        onClick={toggleVoiceRecognition}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all border ${
                          isListeningVoice
                            ? 'bg-status-red text-white border-status-red animate-pulse shadow-md shadow-status-red/30'
                            : 'bg-console-bg text-bridge-teal border-bridge-teal/40 hover:bg-bridge-teal/15'
                        }`}
                      >
                        {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isListeningVoice ? 'Listening (Click to Stop)' : 'Voice Input (Web Speech)'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={answers[currentIndex + 1] || ''}
                      onChange={(e) => setAnswers({ ...answers, [currentIndex + 1]: e.target.value })}
                      placeholder={
                        isListeningVoice
                          ? 'Listening to your microphone... Your transcribed speech will appear here.'
                          : 'Type your answer, or click "Voice Input" to speak your answer aloud via your browser microphone...'
                      }
                      className="w-full bg-console-bg border border-console-border rounded-xl p-3.5 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal leading-relaxed font-sans"
                    />

                    <div className="flex items-center justify-between text-[10px] font-mono text-console-text-muted">
                      <span>
                        Word count: {(answers[currentIndex + 1] || '').split(/\s+/).filter(Boolean).length} words
                      </span>
                      <span>
                        Time on this question: {formatTimer(questionTimers[currentIndex + 1] || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Live Camera & AI Proctoring Module (4 cols on lg) */}
                <div className="lg:col-span-4 space-y-3">
                  <MockInterviewCamera
                    sessionId={session?.id}
                    isInterviewActive={isOpen && !evaluation && !isInitializing && !isSubmitting && !suspensionData?.isSuspended}
                    onSuspended={(suspension) => {
                      setSuspensionData({
                        isSuspended: true,
                        remainingSeconds: suspension.remainingSeconds || 259200,
                        reason: suspension.reason || 'Multiple integrity violations detected.',
                        suspendedUntil: suspension.suspendedUntil,
                      });
                      setErrorMsg(suspension?.reason || '3-day suspension triggered due to repeated proctoring violations.');
                    }}
                  />

                  {/* Proctoring HUD Guidelines Card */}
                  <div className="p-3 rounded-xl bg-console-bg border border-console-border space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-bridge-teal font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Proctor HUD</span>
                    </div>
                    <p className="text-[10px] text-console-text-muted leading-relaxed">
                      Maintains eye contact verification, attention scoring, and environment integrity during your answers.
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-console-text-muted border-t border-console-border/60">
                      <span>Total Time Left:</span>
                      <span className="text-bridge-teal font-bold">{formatTimer(totalSecondsLeft)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Controls & Submit Interview */}
              <div className="pt-3 border-t border-console-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-xl bg-console-panel border border-console-border text-console-text-muted hover:text-console-text disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-console-panel border border-console-border text-console-text-muted hover:text-console-text disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Submit Interview button ONLY appears once EVERY question has an answer */}
                  {allQuestionsAnswered ? (
                    <button
                      type="button"
                      onClick={async () => {
                        stopVoiceRecognition();
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        await saveCurrentAnswerToServer(currentIndex + 1);
                        setShowSubmitConfirm(true);
                      }}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-bridge-teal to-emerald-500 hover:from-bridge-teal/90 hover:to-emerald-450 text-white font-bold text-xs shadow-lg shadow-bridge-teal/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Submit Interview</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-console-panel-raised border border-console-border text-[11px] font-mono text-console-text-muted">
                      <AlertCircle className="w-3.5 h-3.5 text-industry-amber flex-shrink-0" />
                      <span>
                        Answer all questions to submit ({answeredCount}/{questions.length})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ExamIntegrityGuard>
        ) : null}
        </div>

        {/* Early Submission Confirmation Dialog Modal */}
        {showSubmitConfirm && (
          <div
            className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowSubmitConfirm(false)}
          >
            <div
              className="bg-console-panel border border-bridge-teal/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-console-text animate-in zoom-in-95 duration-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bridge-teal/15 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-console-text">
                    Submit Interview for Evaluation?
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    All {questions.length} questions answered
                  </p>
                </div>
              </div>

              <p className="text-xs text-console-text leading-relaxed">
                You've answered all {questions.length} questions. You finished early with{' '}
                <strong className="text-bridge-teal font-mono">{formatTimer(totalSecondsLeft)}</strong> remaining on the clock.
              </p>

              {/* Metrics Summary Box */}
              <div className="p-3.5 rounded-xl bg-console-bg border border-console-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-console-text-muted">
                  <span>Questions Answered:</span>
                  <span className="text-status-green font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {questions.length} of {questions.length} Complete
                  </span>
                </div>
                <div className="flex items-center justify-between text-console-text-muted">
                  <span>Actual Elapsed Time:</span>
                  <span className="text-console-text font-bold">
                    {formatTimer((30 * 60) - totalSecondsLeft)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-console-text-muted">
                  <span>Time Remaining Saved:</span>
                  <span className="text-bridge-teal font-bold">
                    {formatTimer(totalSecondsLeft)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-console-text-muted">
                Would you like to submit now for Sash's comprehensive rubric evaluation, or review your answers first?
              </p>

              {/* Confirmation Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-console-panel hover:bg-console-panel-raised border border-console-border text-xs font-semibold text-console-text transition-colors"
                >
                  Review My Answers
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleFinish(false);
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-bridge-teal to-emerald-500 hover:from-bridge-teal/90 hover:to-emerald-450 text-white text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Yes, Submit Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active 3-Day Suspension Overlay Modal */}
        {suspensionData?.isSuspended && (
          <ExamSuspensionOverlay
            isSuspended={true}
            remainingSeconds={suspensionData.remainingSeconds}
            reason={suspensionData.reason}
            onRefreshStatus={() => {
              setSuspensionData(null);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
