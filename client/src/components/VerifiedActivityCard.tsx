import React from 'react';

export interface VerifiedActivityItem {
  id: string | number;
  title: string;
  subtitle?: string;
  value: string | number;
  badge?: string;
  timestamp?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  sparklineData?: number[];
  onClick?: () => void;
}

export interface VerifiedActivityCardProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  items: VerifiedActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export const VerifiedActivityCard: React.FC<VerifiedActivityCardProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  items,
  emptyMessage = 'No verified activity recorded yet.',
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#1e293b] bg-[#0b1329] backdrop-blur-md overflow-hidden flex flex-col ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#0b1329]">
        <div>
          <h3 className="small-caps-label text-slate-400">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors py-1 px-2.5 rounded-full hover:bg-[#0f172a]"
          >
            {actionText} →
          </button>
        )}
      </div>

      {/* List Items */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-sans">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-[#1e293b] flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.onClick);

            return (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                  isClickable
                    ? 'cursor-pointer hover:bg-[#0f172a]'
                    : 'hover:bg-[#0f172a]/40'
                }`}
              >
                {/* Left: Icon + Title/Subtitle */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-slate-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#0f172a] text-slate-400 border border-[#1e293b] shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Monospace Value + Trend / Timestamp */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-white">
                      {item.value}
                    </span>
                    {item.trend && (
                      <span
                        className={`font-mono text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          item.trend.direction === 'up'
                            ? 'text-[#4CC38A] bg-[#4CC38A]/10'
                            : item.trend.direction === 'down'
                            ? 'text-[#E5637C] bg-[#E5637C]/10'
                            : 'text-slate-400 bg-[#0f172a]'
                        }`}
                      >
                        {item.trend.direction === 'up' ? '+' : ''}
                        {item.trend.value}
                      </span>
                    )}
                  </div>
                  {item.timestamp && (
                    <span className="text-[11px] text-slate-400/80 font-mono mt-0.5">
                      {item.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerifiedActivityCard;
