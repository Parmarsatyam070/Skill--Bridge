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
      <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-[#8B90A0] hover:text-[#F4F5F7] p-1.5 rounded-lg hover:bg-[#1A1D24] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dialog Icon & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              unansweredCount > 0
                ? 'bg-[#E8A23C]/15 border-[#E8A23C]/40 text-[#E8A23C]'
                : 'bg-[#4CC38A]/15 border-[#4CC38A]/40 text-[#4CC38A]'
            }`}
          >
            {unansweredCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 id="submit-dialog-title" className="text-base font-semibold text-[#F4F5F7]">
              {unansweredCount > 0 ? 'Unanswered Questions' : 'Ready to Submit?'}
            </h3>
            <span className="text-xs text-[#8B90A0]">Final Assessment Submission</span>
          </div>
        </div>

        {/* Dialog Content Message */}
        <div className="mb-6">
          {unansweredCount > 0 ? (
            <div className="p-3.5 bg-[#E8A23C]/10 border border-[#E8A23C]/30 rounded-xl text-xs text-[#E8A23C] leading-relaxed">
              <strong>Notice:</strong> You still have <strong>{unansweredCount}</strong> unanswered{' '}
              {unansweredCount === 1 ? 'question' : 'questions'} out of {totalQuestions}. Are you sure you want to submit? Unanswered questions will receive 0 points.
            </div>
          ) : (
            <p className="text-xs text-[#8B90A0] leading-relaxed">
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
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38] hover:border-[#8B90A0]/40 transition-colors"
          >
            Go Back & Review
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm & Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
