import React from 'react';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface BridgeLineProps {
  sourceLabel: string;
  targetLabel: string;
  matchScore: number;
  tier?: 'high' | 'medium' | 'low';
  isApplied?: boolean;
  className?: string;
}

/**
 * Signature Bridge Line Component
 * 
 * An animated SVG connector linking a skill/candidate node to a matched opportunity node.
 * ONLY rendered on genuine matches (skill profile -> recommended internship/course, job posting -> matched candidate).
 */
export const BridgeLine: React.FC<BridgeLineProps> = ({
  sourceLabel,
  targetLabel,
  matchScore,
  tier = 'high',
  isApplied = false,
  className = '',
}) => {
  const isSolid = isApplied;
  const strokeColor = tier === 'high' ? '#4CC38A' : tier === 'medium' ? '#F0A94E' : '#2F8C82';

  return (
    <div className={`relative flex items-center justify-between p-3.5 bg-console-panel/80 border border-console-border rounded-xl backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Background SVG Bridge Thread */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 400 60"
      >
        <defs>
          <linearGradient id={`bridge-grad-${matchScore}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2B4C7E" />
            <stop offset="50%" stopColor="#2F8C82" />
            <stop offset="100%" stopColor={isSolid ? '#4CC38A' : '#E8963C'} />
          </linearGradient>
        </defs>
        <path
          d="M 20 30 Q 200 10 380 30"
          fill="none"
          stroke={`url(#bridge-grad-${matchScore})`}
          strokeWidth="2.5"
          className={isSolid ? 'bridge-line-solid' : 'bridge-line-path'}
        />
      </svg>

      {/* Left Node: Student Skill Competency */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-campus-blue shadow-[0_0_8px_#2B4C7E] animate-pulse" />
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-console-text-muted block">
            Verified Competency
          </span>
          <span className="text-xs font-medium text-console-text">
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Center Match Node Badge */}
      <div className="relative z-10 flex flex-col items-center justify-center px-3 py-1 rounded-full bg-console-panel-raised border border-console-border shadow-sm">
        <div className="flex items-center gap-1.5">
          {isApplied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-bridge-teal animate-spin" style={{ animationDuration: '6s' }} />
          )}
          <span className="font-mono text-xs font-semibold text-console-text">
            {matchScore}% Match
          </span>
        </div>
        <span className="text-[9px] font-mono text-console-text-muted">
          {isApplied ? 'Application Linked' : 'Bridge Path Active'}
        </span>
      </div>

      {/* Right Node: Matched Opportunity */}
      <div className="relative z-10 flex items-center gap-2.5 text-right">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-console-text-muted block">
            Matched Target
          </span>
          <span className="text-xs font-medium text-console-text">
            {targetLabel}
          </span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${isSolid ? 'bg-status-green shadow-[0_0_8px_#4CC38A]' : 'bg-industry-amber shadow-[0_0_8px_#E8963C]'}`} />
      </div>
    </div>
  );
};
