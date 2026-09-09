import React from 'react';
import { Sparkles, AlertCircle, X, Loader2 } from 'lucide-react';
import { InterviewAdvisoryNotice } from './InterviewAdvisoryNotice';

interface InterviewCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
  totalAnswered: number;
  totalQuestions: number;
}

export const InterviewCompletionDialog: React.FC<InterviewCompletionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalAnswered,
  totalQuestions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#0b1329] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-dialog-title"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f172a] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 id="completion-dialog-title" className="text-base font-semibold text-white">
              Complete & Evaluate Interview
            </h3>
            <p className="text-xs text-slate-400">
              Finalize transcript and generate AI advisory evaluation
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs text-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Questions Answered:</span>
            <span className="font-mono font-bold text-emerald-400">
              {totalAnswered} / {totalQuestions}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Evaluation Engine:</span>
            <span className="font-mono text-slate-300">Google Gemini (GenAI SDK)</span>
          </div>
        </div>

        <InterviewAdvisoryNotice variant="card" />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#0f172a] transition-colors border border-transparent"
          >
            Review Answers
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all duration-150"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Evaluation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm & Generate Scorecard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
