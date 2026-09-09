import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

interface AssessmentSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  unansweredCount: number;
  totalQuestions: number;
}

export const AssessmentSubmitDialog: React.FC<AssessmentSubmitDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  unansweredCount,
  totalQuestions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#0f172a] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dialog Icon & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              unansweredCount > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {unansweredCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 id="submit-dialog-title" className="text-base font-semibold text-white">
              {unansweredCount > 0 ? 'Unanswered Questions' : 'Ready to Submit?'}
            </h3>
            <span className="text-xs text-slate-400">Final Assessment Submission</span>
          </div>
        </div>

        {/* Dialog Content Message */}
        <div className="mb-6">
          {unansweredCount > 0 ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 leading-relaxed">
              <strong>Notice:</strong> You still have <strong>{unansweredCount}</strong> unanswered{' '}
              {unansweredCount === 1 ? 'question' : 'questions'} out of {totalQuestions}. Are you sure you want to submit? Unanswered questions will receive 0 points.
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              You have answered all <strong>{totalQuestions}</strong> questions. Once submitted, your answers cannot be modified and will be evaluated deterministically.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0f172a] text-white border border-[#1e293b] hover:border-slate-600 transition-colors"
          >
            Go Back & Review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm & Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
