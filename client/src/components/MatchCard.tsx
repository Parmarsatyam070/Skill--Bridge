import React from 'react';

export interface MatchCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subtitle?: string;
  status?: 'verified' | 'unverified' | string;
  progress?: number; // 0 - 100
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  sparklineData?: number[];
  variant?: 'default' | 'raised' | 'highlight';
  className?: string;
  onClick?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  label,
  value,
  subValue,
  subtitle,
  status,
  progress,
  trend,
  icon: Icon,
  sparklineData,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const displaySubtitle = subtitle || subValue;
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 overflow-hidden ${
        variant === 'raised'
          ? 'bg-[#1A1D24] border-[#2A2E38] shadow-lg'
          : variant === 'highlight'
          ? 'bg-[#111318] border-[#2F8C82]/50 shadow-[0_0_24px_rgba(47,140,130,0.15)]'
          : 'bg-[#111318]/90 backdrop-blur-md border-[#2A2E38]'
      } ${
        isInteractive
          ? 'cursor-pointer hover:border-[#3d4352] hover:bg-[#1A1D24] hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {/* Top row: Small-caps label + optional status / icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="small-caps-label truncate">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {status && (
            <span
              className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                status === 'verified'
                  ? 'bg-[#4CC38A]/15 text-[#4CC38A] border-[#4CC38A]/30'
                  : 'bg-[#E8A23C]/15 text-[#E8A23C] border-[#E8A23C]/30'
              }`}
            >
              {status}
            </span>
          )}
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#8B90A0]">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Center: Big, bold verified metric in IBM Plex Mono */}
      <div className="flex items-baseline gap-2 my-1">
        <span className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-[#F4F5F7]">
          {value}
        </span>
        {trend && (
          <span
            className={`font-mono text-xs font-medium px-1.5 py-0.5 rounded ${
              trend.direction === 'up'
                ? 'text-[#4CC38A] bg-[#4CC38A]/10'
                : trend.direction === 'down'
                ? 'text-[#E5637C] bg-[#E5637C]/10'
                : 'text-[#8B90A0] bg-[#1A1D24]'
            }`}
          >
            {trend.direction === 'up' ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>

      {/* Subvalue text if present */}
      {displaySubtitle && (
        <p className="text-xs text-[#8B90A0] mt-0.5 mb-2 truncate">
          {displaySubtitle}
        </p>
      )}

      {/* Thin Progress Bar or Sparkline at bottom */}
      {typeof progress === 'number' && (
        <div className="mt-2.5 w-full">
          <div className="w-full h-1 rounded-full bg-[#1A1D24] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: 'linear-gradient(90deg, #2F8C82 0%, #5B7FE0 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Optional Sparkline SVG */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 w-full h-5 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
            {(() => {
              const min = Math.min(...sparklineData);
              const max = Math.max(...sparklineData);
              const range = max - min || 1;
              const points = sparklineData
                .map((d, i) => {
                  const x = (i / (sparklineData.length - 1)) * 100;
                  const y = 22 - ((d - min) / range) * 20;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <polyline
                  fill="none"
                  stroke="#2F8C82"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
