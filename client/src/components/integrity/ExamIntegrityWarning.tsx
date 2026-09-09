import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ExamIntegrityEventType } from '../../../../shared/types';

interface ExamIntegrityWarningProps {
  visible: boolean;
  eventType: ExamIntegrityEventType | null;
  message?: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const ExamIntegrityWarning: React.FC<ExamIntegrityWarningProps> = ({
  visible,
  eventType,
  message,
  onDismiss,
  autoDismissMs = 8000,
}) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDismiss]);

  if (!visible) return null;

  const formattedEvent = eventType ? eventType.replace(/_/g, ' ') : 'PROHIBITED_ACTION';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-6 right-6 z-50 max-w-md w-full bg-[#111318] border-2 border-[#E8A23C] rounded-xl shadow-2xl p-5 transition-all transform animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-[#E8A23C]/20 border border-[#E8A23C]/40 rounded-lg text-[#E8A23C] flex-shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#F4F5F7] tracking-tight">
              Integrity Warning
            </h4>
            <button
              onClick={onDismiss}
              className="text-[#8B90A0] hover:text-[#F4F5F7] p-1 rounded-md transition-colors"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-sm text-[#8B90A0] space-y-1.5 leading-relaxed">
            <p className="font-medium text-[#F4F5F7]">
              A prohibited action was detected:{' '}
              <span className="text-[#E8A23C] font-semibold">{formattedEvent}</span>.
            </p>
            <p>
              This is your first warning. A further prohibited action may temporarily suspend your assessment access.
            </p>
            <p className="text-xs text-[#8B90A0]/80">
              Please continue without using prohibited assistance.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onDismiss}
              className="px-3.5 py-1.5 bg-[#E8A23C] hover:bg-[#d49132] text-[#08090C] font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              I Understand & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
