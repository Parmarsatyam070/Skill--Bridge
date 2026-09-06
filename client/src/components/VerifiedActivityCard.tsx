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
      className={`rounded-2xl border border-[#2A2E38] bg-[#111318]/90 backdrop-blur-md overflow-hidden flex flex-col ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2E38] bg-[#111318]">
        <div>
          <h3 className="small-caps-label text-[#8B90A0]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[#8B90A0] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="text-xs font-medium text-[#2F8C82] hover:text-[#3aa398] transition-colors py-1 px-2.5 rounded-full hover:bg-[#1A1D24]"
          >
            {actionText} →
          </button>
        )}
      </div>

      {/* List Items */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#8B90A0] font-sans">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-[#2A2E38]/60 flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.onClick);

            return (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                  isClickable
                    ? 'cursor-pointer hover:bg-[#1A1D24]'
                    : 'hover:bg-[#1A1D24]/40'
                }`}
              >
                {/* Left: Icon + Title/Subtitle */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#8B90A0] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#F4F5F7] truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1A1D24] text-[#8B90A0] border border-[#2A2E38] shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-[#8B90A0] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Monospace Value + Trend / Timestamp */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[#F4F5F7]">
                      {item.value}
                    </span>
                    {item.trend && (
                      <span
                        className={`font-mono text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          item.trend.direction === 'up'
                            ? 'text-[#4CC38A] bg-[#4CC38A]/10'
                            : item.trend.direction === 'down'
                            ? 'text-[#E5637C] bg-[#E5637C]/10'
                            : 'text-[#8B90A0] bg-[#1A1D24]'
                        }`}
                      >
                        {item.trend.direction === 'up' ? '+' : ''}
                        {item.trend.value}
                      </span>
                    )}
                  </div>
                  {item.timestamp && (
                    <span className="text-[11px] text-[#8B90A0]/80 font-mono mt-0.5">
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
