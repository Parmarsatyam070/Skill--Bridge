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

  return (
    <div className={`relative flex items-center justify-between p-4 bg-[#111318]/90 border border-[#2A2E38] rounded-2xl backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Background SVG Bridge Thread with Bridge Gradient */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 400 60"
      >
        <defs>
          <linearGradient id={`bridge-grad-${matchScore}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2F8C82" />
            <stop offset="50%" stopColor="#5B7FE0" />
            <stop offset="100%" stopColor={isSolid ? '#4CC38A' : '#E8A23C'} />
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
        <div className="w-2.5 h-2.5 rounded-full bg-[#2F8C82] shadow-[0_0_10px_#2F8C82] animate-pulse" />
        <div>
          <span className="small-caps-label text-[10px] block">
            Verified Competency
          </span>
          <span className="text-xs font-medium text-[#F4F5F7]">
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Center Match Node Badge */}
      <div className="relative z-10 flex flex-col items-center justify-center px-3.5 py-1 rounded-full bg-[#1A1D24] border border-[#2A2E38] shadow-md">
        <div className="flex items-center gap-1.5">
          {isApplied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4CC38A]" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#2F8C82] animate-spin" style={{ animationDuration: '6s' }} />
          )}
          <span className="font-mono text-xs font-semibold text-[#F4F5F7]">
            {matchScore}% Match
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#5BC4B8]">
          {isApplied ? 'Application Linked' : 'Bridge Path Active'}
        </span>
      </div>

      {/* Right Node: Matched Opportunity */}
      <div className="relative z-10 flex items-center gap-2.5 text-right">
        <div>
          <span className="small-caps-label text-[10px] block">
            Matched Target
          </span>
          <span className="text-xs font-medium text-[#F4F5F7]">
            {targetLabel}
          </span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${isSolid ? 'bg-[#4CC38A] shadow-[0_0_10px_#4CC38A]' : 'bg-[#E8A23C] shadow-[0_0_10px_#E8A23C]'}`} />
      </div>
    </div>
  );
};

export default BridgeLine;
