import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export type StatusFilterOption =
  | 'ALL'
  | 'REQUESTED'
  | 'DISCUSSION'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: StatusFilterOption;
  onStatusChange: (status: StatusFilterOption) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  statusCounts?: Record<string, number>;
}

const STATUS_TABS: Array<{ id: StatusFilterOption; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'DISCUSSION', label: 'Discussion' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REJECTED', label: 'Declined' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const COLLAB_TYPES = [
  { id: 'ALL', label: 'All Types' },
  { id: 'WORKSHOP', label: 'Workshop' },
  { id: 'HACKATHON', label: 'Hackathon' },
  { id: 'MENTORSHIP', label: 'Mentorship' },
  { id: 'CURRICULUM', label: 'Curriculum' },
  { id: 'RESEARCH', label: 'Research' },
  { id: 'PLACEMENT_DRIVE', label: 'Placement Drive' },
];

export const CollaborationFilters: React.FC<Props> = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  statusCounts = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Search & Type filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, company, institution, or keywords..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#0b1329] border border-[#1e293b] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative min-w-[170px]">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full appearance-none bg-[#0b1329] border border-[#1e293b] text-white text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {COLLAB_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0b1329] text-white">
                {t.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Horizontal status pills scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.id;
          const count = tab.id === 'ALL' ? undefined : statusCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'bg-[#0b1329] text-slate-400 hover:text-white hover:bg-[#0f172a] border border-[#1e293b]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
