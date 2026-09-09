import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  TalentAssessmentStartResult,
  TalentAssessmentSubmitResult,
  TalentAssessmentQuestionDto,
} from '@shared/types';
import { AssessmentTimer } from '../../components/assessments/AssessmentTimer';
import { AssessmentProgress } from '../../components/assessments/AssessmentProgress';
import { AssessmentQuestion } from '../../components/assessments/AssessmentQuestion';
import { AssessmentSubmitDialog } from '../../components/assessments/AssessmentSubmitDialog';

export const AssessmentTakingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<TalentAssessmentStartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Initialize or resume attempt session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        setLoading(true);
        const res = await api.post<TalentAssessmentStartResult>(`/talent-assessments/${id}/start`);
        if (isMounted) {
          setSession(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          if (err.code === 'ALREADY_SUBMITTED') {
            navigate(`/assessments/${id}/result`, { replace: true });
            return;
          }
          setStartError(err.message || 'Failed to initialize assessment session.');
          setLoading(false);
        }
      }
    }

    if (id) {
      initSession();
    }

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (answersPayload: Record<string, any>) =>
      api.post<TalentAssessmentSubmitResult>(`/talent-assessments/${id}/submit`, {
        answers: answersPayload,
      }),
    onSuccess: (submitResult) => {
      navigate(`/assessments/${id}/result`, {
        state: { submitResult, assessmentTitle: session?.title },
        replace: true,
      });
    },
    onError: (err: any) => {
      alert(`Submission error: ${err.message || 'Failed to submit'}`);
      setIsSubmitDialogOpen(false);
    },
  });

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleAutoExpire = () => {
    // Automatically submit when timer hits 0
    if (!submitMutation.isPending) {
      submitMutation.mutate(answers);
    }
  };

  const handleManualSubmitConfirm = () => {
    submitMutation.mutate(answers);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
        <span className="text-sm font-medium">Calibrating assessment environment...</span>
      </div>
    );
  }

  if (startError || !session) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">Cannot Start Assessment</h3>
          <p className="text-xs mb-5">{startError || 'Assessment session is unavailable.'}</p>
          <Link
            to={`/assessments/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f172a] text-white border border-[#1e293b]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Assessment Details</span>
          </Link>
        </div>
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion: TalentAssessmentQuestionDto | undefined = questions[currentIndex];
  const questionIds = questions.map(q => q.id);

  const answeredCount = questionIds.filter(qid => {
    const val = answers[qid];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Sticky Test Header Bar */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between gap-4 sticky top-2 z-30 shadow-md">
        <div className="flex items-center gap-3 truncate">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <h1 className="text-sm sm:text-base font-semibold text-white truncate">{session.title}</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <AssessmentTimer
            initialSeconds={session.timeRemainingSeconds}
            onExpire={handleAutoExpire}
          />

          <button
            type="button"
            onClick={() => setIsSubmitDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-md shadow-blue-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish & Submit</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Question Area */}
        <div className="lg:col-span-2 space-y-4">
          {currentQuestion && (
            <AssessmentQuestion
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              currentAnswer={answers[currentQuestion.id]}
              onAnswerChange={handleAnswerChange}
            />
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#0f172a] text-white border border-[#1e293b] hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-md shadow-blue-500/20"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubmitDialogOpen(true)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-400" />
                <span>Review & Submit</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Column: Progress & Palette Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <AssessmentProgress
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            questionIds={questionIds}
            answers={answers}
            onSelectQuestion={idx => setCurrentIndex(idx)}
          />
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AssessmentSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={handleManualSubmitConfirm}
        isSubmitting={submitMutation.isPending}
        unansweredCount={unansweredCount}
        totalQuestions={questions.length}
      />
    </div>
  );
};
