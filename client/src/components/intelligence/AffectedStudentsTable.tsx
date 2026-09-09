import React, { useState } from 'react';
import type { AffectedStudentsResponse } from '@shared/types';
import { GapSeverityBadge } from './GapSeverityBadge';
import { Search, X, User, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface AffectedStudentsTableProps {
  data: AffectedStudentsResponse;
  onClose?: () => void;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
}

export const AffectedStudentsTable: React.FC<AffectedStudentsTableProps> = ({
  data,
  onClose,
  onPageChange,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] space-y-4 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-white">
              Affected Students: {data.skillName}
            </h3>
            <GapSeverityBadge severity={data.gapSeverity} />
          </div>
          <p className="text-xs mt-1 text-slate-400">
            {data.totalAffected} student{data.totalAffected === 1 ? '' : 's'} in cohort currently below the 60% coverage threshold or unattempted.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#1e293b] text-xs text-slate-400 hover:text-white hover:bg-[#0f172a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Filter */}
      {onSearch && (
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 opacity-60" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter affected students by name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#030712] text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            Search
          </button>
        </form>
      )}

      {/* Table */}
      {data.students.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          No students found matching current criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#030712]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] font-mono uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Target Domain</th>
                <th className="p-3.5">CGPA Bracket</th>
                <th className="p-3.5">Skill Score</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 pr-4 text-right">Last Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {data.students.map(s => {
                const initials = s.fullName
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isUnattempted = s.verificationLevel === 'UNATTEMPTED';

                return (
                  <tr key={s.id} className="transition-colors hover:bg-[#0f172a]/60">
                    <td className="p-3.5 pl-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 bg-blue-600/15 text-blue-400 border border-blue-500/30"
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-sm">{s.fullName}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-400">
                      {s.targetDomain}
                    </td>

                    <td className="p-3.5 font-mono text-slate-400">
                      {s.cgpaBracket || 'Undisclosed'}
                    </td>

                    <td className="p-3.5 font-mono">
                      {isUnattempted ? (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Unattempted
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-200">{s.currentSkillScore}%</span>
                          <div className="w-20 h-1.5 rounded-full overflow-hidden bg-[#0f172a] border border-[#1e293b]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, s.currentSkillScore)}%`,
                                background: s.currentSkillScore >= 40 ? '#f59e0b' : '#f43f5e',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase"
                        style={{
                          background: s.verificationLevel === 'UNATTEMPTED'
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(16, 185, 129, 0.1)',
                          color: s.verificationLevel === 'UNATTEMPTED' ? '#f59e0b' : '#10b981',
                          border: `1px solid ${s.verificationLevel === 'UNATTEMPTED' ? '#f59e0b30' : '#10b98130'}`,
                        }}
                      >
                        {s.verificationLevel.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 pr-4 text-right font-mono text-xs text-slate-400">
                      {s.lastAttemptDate ? new Date(s.lastAttemptDate).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={data.pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(data.pagination.page - 1)}
              className="px-3 py-1 rounded-lg border border-[#1e293b] bg-[#030712] text-slate-300 hover:border-blue-500/40 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => onPageChange && onPageChange(data.pagination.page + 1)}
              className="px-3 py-1 rounded-lg border border-[#1e293b] bg-[#030712] text-slate-300 hover:border-blue-500/40 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
