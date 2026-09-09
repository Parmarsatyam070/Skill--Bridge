import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IntelligenceKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const IntelligenceKpiCard: React.FC<IntelligenceKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#3b82f6',
  trend,
}) => {
  return (
    <div
      className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] transition-all duration-200 hover:translate-y-[-2px] hover:border-blue-500/40 relative overflow-hidden group shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase text-slate-400">
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
          style={{
            background: `${color}15`,
            color: color,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span
            className="text-xs font-medium"
            style={{ color: trend.isPositive ? '#10b981' : '#f43f5e' }}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
