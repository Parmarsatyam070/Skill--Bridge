import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface IntelligenceEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const IntelligenceEmptyState: React.FC<IntelligenceEmptyStateProps> = ({
  title,
  description,
  icon: Icon = Info,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      className="p-8 md:p-12 rounded-xl border text-center space-y-3"
      style={{
        background: '#111318',
        borderColor: '#2A2E38',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
        style={{
          background: 'rgba(47, 140, 130, 0.1)',
          color: '#2F8C82',
          border: '1px solid rgba(47, 140, 130, 0.2)',
        }}
      >
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold" style={{ color: '#F4F5F7' }}>
        {title}
      </h4>

      <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: '#8B90A0' }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{
              background: '#2F8C82',
              color: '#FFFFFF',
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
