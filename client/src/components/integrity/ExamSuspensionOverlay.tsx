import React from 'react';
import { ShieldAlert, Clock, Lock } from 'lucide-react';

interface ExamSuspensionOverlayProps {
  isSuspended: boolean;
  remainingSeconds: number;
  reason?: string;
  onRefreshStatus?: () => void;
}

export const ExamSuspensionOverlay: React.FC<ExamSuspensionOverlayProps> = ({
  isSuspended,
  remainingSeconds,
  reason,
  onRefreshStatus,
}) => {
  if (!isSuspended) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspension-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090C]/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="max-w-lg w-full bg-[#111318] border-2 border-[#E5637C]/60 rounded-2xl shadow-2xl p-8 text-center space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#E5637C]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#E5637C]/20 border-2 border-[#E5637C]/40 flex items-center justify-center text-[#E5637C] shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5637C]/15 border border-[#E5637C]/30 text-[#E5637C] text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Access Locked
          </div>
          <h2 id="suspension-title" className="text-2xl font-bold text-[#F4F5F7]">
            Assessment Temporarily Suspended
          </h2>
          <p className="text-sm text-[#E5637C] font-medium">
            {reason || 'A second integrity violation was detected.'}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="py-6 px-4 bg-[#08090C] border border-[#E5637C]/20 rounded-xl space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#8B90A0] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#E5637C]" />
            Time Remaining in Suspension
          </div>
          <div className="text-5xl font-mono font-extrabold text-[#F4F5F7] tracking-wider tabular-nums">
            {formattedTime}
          </div>
          <p className="text-xs text-[#8B90A0]">
            Duration: exactly 5 minutes (300 seconds)
          </p>
        </div>

        {/* Explanatory policy note */}
        <div className="text-xs text-[#8B90A0] leading-relaxed space-y-1">
          <p>
            Your protected assessment access has been temporarily suspended for 5 minutes.
          </p>
          <p>
            You can continue after the suspension expires. Any attempt to refresh, switch tabs, or create new sessions will remain locked until the server timer concludes.
          </p>
        </div>

        {remainingSeconds <= 0 && onRefreshStatus && (
          <button
            onClick={onRefreshStatus}
            className="w-full py-2.5 px-4 bg-[#2F8C82] hover:bg-[#25736b] text-[#F4F5F7] font-semibold text-sm rounded-xl transition-all shadow-md"
          >
            Check Expiration & Resume
          </button>
        )}
      </div>
    </div>
  );
};
