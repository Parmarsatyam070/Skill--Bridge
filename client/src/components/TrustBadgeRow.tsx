import React from 'react';

export interface TrustBadge {
  label: string;
  isLive?: boolean;
}

const DEFAULT_BADGES: TrustBadge[] = [
  { label: 'VERIFIED SCORING ENGINE', isLive: true },
  { label: 'AICTE-ALIGNED CURRICULUM DATA', isLive: false },
  { label: 'ZERO SELF-REPORTED SCORES', isLive: false },
];

export const TrustBadgeRow: React.FC<{
  badges?: TrustBadge[];
  className?: string;
}> = ({ badges = DEFAULT_BADGES, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b1329] border border-[#1e293b] text-[10.5px] sm:text-[11px] font-sans font-medium tracking-[0.08em] text-slate-400 uppercase hover:border-blue-500/40 transition-colors"
        >
          {badge.isLive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          )}
          <span>{badge.label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadgeRow;
