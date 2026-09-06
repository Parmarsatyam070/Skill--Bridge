import React from 'react';
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface MatchBadgeProps {
  score?: number;
  tier?: 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({
  score = 0,
  tier,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const resolvedTier = tier || (score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low');

  const tierStyles = {
    high: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'High Match',
      Icon: CheckCircle,
    },
    medium: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: 'Good Fit',
      Icon: AlertTriangle,
    },
    low: {
      bg: 'bg-slate-900',
      text: 'text-slate-400',
      border: 'border-slate-800',
      label: 'Skill Gap',
      Icon: HelpCircle,
    },
  }[resolvedTier];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  const IconComponent = tierStyles.Icon;

  return (
    <div
      className={`inline-flex items-center rounded-full border font-mono ${tierStyles.bg} ${tierStyles.text} ${tierStyles.border} ${sizeStyles} ${className}`}
      title={`${score}% Skill Alignment — ${tierStyles.label}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span className="tabular-nums font-semibold tracking-tight">{Math.round(score)}%</span>
      <span className="opacity-80 font-sans font-normal text-[10px] hidden sm:inline">
        • {tierStyles.label}
      </span>
    </div>
  );
};

export default MatchBadge;
