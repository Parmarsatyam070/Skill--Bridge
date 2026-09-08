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
    <div className="p-5 rounded-xl border space-y-4" style={{ background: '#111318', borderColor: '#2A2E38' }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold" style={{ color: '#F4F5F7' }}>
              Affected Students: {data.skillName}
            </h3>
            <GapSeverityBadge severity={data.gapSeverity} />
          </div>
          <p className="text-xs mt-1" style={{ color: '#8B90A0' }}>
            {data.totalAffected} student{data.totalAffected === 1 ? '' : 's'} in cohort currently below the 60% coverage threshold or unattempted.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border text-xs hover:bg-white/5 transition-colors"
            style={{ borderColor: '#2A2E38', color: '#8B90A0' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Filter */}
      {onSearch && (
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-50" style={{ color: '#8B90A0' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter affected students by name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs bg-transparent focus:outline-none"
              style={{ borderColor: '#2A2E38', color: '#F4F5F7' }}
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#2F8C82', color: '#FFFFFF' }}
          >
            Search
          </button>
        </form>
      )}

      {/* Table */}
      {data.students.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
          No students found matching current criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#2A2E38', background: '#08090C' }}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b font-mono uppercase tracking-wider" style={{ borderColor: '#2A2E38', color: '#8B90A0' }}>
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Target Domain</th>
                <th className="p-3.5">CGPA Bracket</th>
                <th className="p-3.5">Skill Score</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5 pr-4 text-right">Last Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#2A2E38' }}>
              {data.students.map(s => {
                const initials = s.fullName
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isUnattempted = s.verificationLevel === 'UNATTEMPTED';

                return (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="p-3.5 pl-4 font-medium" style={{ color: '#F4F5F7' }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ background: '#2F8C8220', color: '#2F8C82', border: '1px solid #2F8C8240' }}
                        >
                          {initials}
                        </div>
                        <span className="font-semibold text-sm">{s.fullName}</span>
                      </div>
                    </td>

                    <td className="p-3.5" style={{ color: '#8B90A0' }}>
                      {s.targetDomain}
                    </td>

                    <td className="p-3.5 font-mono" style={{ color: '#8B90A0' }}>
                      {s.cgpaBracket || 'Undisclosed'}
                    </td>

                    <td className="p-3.5 font-mono">
                      {isUnattempted ? (
                        <span className="text-[11px] text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Unattempted
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold">{s.currentSkillScore}%</span>
                          <div className="w-20 h-1.5 rounded-full overflow-hidden bg-white/10">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, s.currentSkillScore)}%`,
                                background: s.currentSkillScore >= 40 ? '#E8A23C' : '#E5637C',
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
                            ? 'rgba(232, 162, 60, 0.1)'
                            : 'rgba(76, 195, 138, 0.1)',
                          color: s.verificationLevel === 'UNATTEMPTED' ? '#E8A23C' : '#4CC38A',
                          border: `1px solid ${s.verificationLevel === 'UNATTEMPTED' ? '#E8A23C30' : '#4CC38A30'}`,
                        }}
                      >
                        {s.verificationLevel.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 pr-4 text-right font-mono text-xs" style={{ color: '#8B90A0' }}>
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
        <div className="flex items-center justify-between px-2 pt-1 text-xs" style={{ color: '#8B90A0' }}>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={data.pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(data.pagination.page - 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
              style={{ background: '#08090C', borderColor: '#2A2E38' }}
            >
              Previous
            </button>
            <button
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => onPageChange && onPageChange(data.pagination.page + 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
              style={{ background: '#08090C', borderColor: '#2A2E38' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
