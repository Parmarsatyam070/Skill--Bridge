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
      className="p-8 md:p-12 rounded-xl border border-[#1e293b] bg-[#0b1329] text-center space-y-3 shadow-md"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto bg-blue-600/15 text-blue-400 border border-blue-500/30"
      >
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-white">
        {title}
      </h4>

      <p className="text-xs max-w-md mx-auto leading-relaxed text-slate-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
