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
  color = '#2F8C82',
  trend,
}) => {
  return (
    <div
      className="p-5 rounded-xl border transition-all duration-200 hover:translate-y-[-2px] relative overflow-hidden group"
      style={{
        background: '#111318',
        borderColor: '#2A2E38',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: '#8B90A0' }}>
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
        <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight" style={{ color: '#F4F5F7' }}>
          {value}
        </span>
        {trend && (
          <span
            className="text-xs font-medium"
            style={{ color: trend.isPositive ? '#4CC38A' : '#E5637C' }}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: '#8B90A0' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
