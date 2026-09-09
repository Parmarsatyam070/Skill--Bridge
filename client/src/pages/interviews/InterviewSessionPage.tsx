import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { InterviewSessionDetailDto, InterviewQuestionItem } from '@shared/types';
import { InterviewQuestionCard } from '../../components/interviews/InterviewQuestionCard';
import { InterviewResponseInput } from '../../components/interviews/InterviewResponseInput';
import { InterviewProgress } from '../../components/interviews/InterviewProgress';
import { InterviewTimer } from '../../components/interviews/InterviewTimer';
import { InterviewCompletionDialog } from '../../components/interviews/InterviewCompletionDialog';
import { InterviewAdvisoryNotice } from '../../components/interviews/InterviewAdvisoryNotice';

export const InterviewSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch session detail
  const { data: session, isLoading, error } = useQuery<InterviewSessionDetailDto>({
    queryKey: ['interview-session', id],
    queryFn: async () => {
      const res = await fetch(`/api/interviews/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to load interview session');
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  // Submit Answer Mutation
  const answerMutation = useMutation({
    mutationFn: async ({
      questionId,
      questionNumber,
      answer,
    }: {
      questionId: string;
      questionNumber: number;
      answer: string;
    }) => {
      const res = await fetch(`/api/interviews/${id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionNumber,
          answer,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to submit response');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', id] });
      if (data.data?.isCompleted) {
        setIsCompletionModalOpen(true);
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to record answer');
    },
  });

  // Complete Interview Mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/interviews/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to complete evaluation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', id] });
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      navigate(`/interviews/${id}/result`);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Evaluation generation failed');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="text-sm text-slate-400">Loading interview room...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Interview Room Unavailable</h2>
        <p className="text-xs text-slate-400">
          {(error as any)?.message || 'The requested interview session could not be found or is not accessible.'}
        </p>
        <Link
          to="/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs font-semibold hover:border-blue-500/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Interviews</span>
        </Link>
      </div>
    );
  }

  // If already completed, redirect or show message
  if (session.status === 'COMPLETED') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#0b1329] border border-[#1e293b] rounded-3xl text-center space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Interview Already Completed</h2>
          <p className="text-xs text-slate-400">
            This interview session has been completed and final AI advisory evaluations have been generated.
          </p>
        </div>
        <Link
          to={`/interviews/${id}/result`}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
        >
          <span>View Scorecard & Transcript</span>
        </Link>
      </div>
    );
  }

  const answeredCount = session.transcript.length;
  const totalQuestions = 5;
  const currentQNum = answeredCount + 1;
  const currentQuestion: InterviewQuestionItem | undefined =
    session.currentQuestion ||
    session.questions.find(q => q.questionNumber === currentQNum) ||
    session.questions[session.questions.length - 1];

  const isLastQuestion = currentQNum >= totalQuestions;

  const handleAnswerSubmit = async (answerText: string) => {
    setErrorMessage(null);
    if (!currentQuestion) return;

    await answerMutation.mutateAsync({
      questionId: currentQuestion.id,
      questionNumber: currentQuestion.questionNumber,
      answer: answerText,
    });
  };

  const handleConfirmComplete = async () => {
    await completeMutation.mutateAsync();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* ── TOP NAV BAR ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <Link
            to="/interviews"
            className="p-2 rounded-xl bg-[#0b1329] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
            title="Exit Interview Room"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white line-clamp-1">
              {session.opportunityTitle || 'AI Domain Mock Interview'}
            </h1>
            <p className="text-xs text-slate-400">
              {session.type} Interview Session • {session.companyName || 'General Practice'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InterviewTimer />
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={() => setIsCompletionModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors"
            >
              Finish Now
            </button>
          )}
        </div>
      </div>

      {/* Advisory Notice Header */}
      <InterviewAdvisoryNotice />

      {/* Progress Stepper */}
      <InterviewProgress
        currentQuestionNumber={currentQNum}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Question Card */}
      {currentQuestion ? (
        <div className="space-y-6">
          <InterviewQuestionCard
            question={currentQuestion}
            totalQuestions={totalQuestions}
          />

          <InterviewResponseInput
            onSubmit={handleAnswerSubmit}
            isSubmitting={answerMutation.isPending}
            isLastQuestion={isLastQuestion}
          />
        </div>
      ) : (
        <div className="p-8 text-center bg-[#0b1329] border border-[#1e293b] rounded-2xl space-y-4">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">
            All Questions Answered
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have answered all scheduled questions. Complete your interview to generate your structured scorecard.
          </p>
          <button
            type="button"
            onClick={() => setIsCompletionModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            Generate AI Scorecard
          </button>
        </div>
      )}

      {/* Completion Confirmation Dialog */}
      <InterviewCompletionDialog
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmComplete}
        isSubmitting={completeMutation.isPending}
        totalAnswered={answeredCount}
        totalQuestions={totalQuestions}
      />
    </div>
  );
};
