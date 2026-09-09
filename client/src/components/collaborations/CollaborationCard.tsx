import React from 'react';
import type { CollaborationSummaryDto } from '@shared/types';
import { CollaborationStatusBadge } from './CollaborationStatusBadge';
import {
  Building2,
  GraduationCap,
  Calendar,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  collaboration: CollaborationSummaryDto;
  isSelected?: boolean;
  onSelect?: (collab: CollaborationSummaryDto) => void;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  WORKSHOP: { label: 'Workshop', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  HACKATHON: { label: 'Hackathon', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  MENTORSHIP: { label: 'Mentorship', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  CURRICULUM: { label: 'Curriculum Advisory', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  RESEARCH: { label: 'Research Initiative', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  PLACEMENT_DRIVE: { label: 'Placement Drive', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const CollaborationCard: React.FC<Props> = ({
  collaboration,
  isSelected = false,
  onSelect,
}) => {
  const typeBadge = TYPE_CONFIG[collaboration.type] || {
    label: collaboration.type,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const messageCount = collaboration._count?.messages ?? 0;

  const formattedDate = new Date(collaboration.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect?.(collaboration)}
      className={`group relative rounded-xl p-5 cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-[#0f172a] border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
          : 'bg-[#0b1329] border-[#1e293b] hover:border-blue-500/40 hover:bg-[#0f172a]'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(collaboration);
        }
      }}
      aria-label={`Collaboration: ${collaboration.title}`}
    >
      {/* Top row: Type badge & Status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${typeBadge.color}`}
        >
          {typeBadge.label}
        </span>
        <CollaborationStatusBadge status={collaboration.status} size="sm" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white group-hover:text-blue-300 line-clamp-1 mb-2">
        {collaboration.title}
      </h3>

      {/* Description preview */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {collaboration.description}
      </p>

      {/* Participants */}
      <div className="space-y-1.5 mb-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate font-medium">
            {collaboration.company?.companyName || 'Company'}
          </span>
          {collaboration.company?.industrySector && (
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              • {collaboration.company.industrySector}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate font-medium">
            {collaboration.institution?.institutionName || 'Institution'}
          </span>
        </div>
      </div>

      {/* Footer: Date, messages count, indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          {messageCount > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <MessageSquare className="w-3.5 h-3.5" />
              {messageCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform font-medium">
          <span>View</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
