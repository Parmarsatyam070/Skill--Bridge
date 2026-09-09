import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { AI_INTERVIEW_ADVISORY_DISCLAIMER } from '@shared/types';

interface InterviewAdvisoryNoticeProps {
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
}

export const InterviewAdvisoryNotice: React.FC<InterviewAdvisoryNoticeProps> = ({
  variant = 'banner',
  className = '',
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-amber-400/90 font-medium ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>AI Advisory Signal — Human Decision Governed</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xs flex items-start gap-3 ${className}`}
      >
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            AI Advisory Governance Notice
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {AI_INTERVIEW_ADVISORY_DISCLAIMER}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border border-amber-500/25 bg-amber-500/10 flex items-center justify-between gap-3 text-xs text-amber-200 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>AI Advisory Signal:</strong> Evaluations are generated for guidance and candidate feedback only. Hiring decisions remain exclusively with human recruiters.
        </span>
      </div>
      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono shrink-0">
        Non-Authoritative
      </span>
    </div>
  );
};
