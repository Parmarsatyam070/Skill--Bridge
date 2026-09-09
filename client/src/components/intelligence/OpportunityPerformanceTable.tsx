import React from 'react';
import type { IndustryOpportunityPerformanceItem } from '@shared/types';
import { Briefcase, ArrowRight } from 'lucide-react';

interface OpportunityPerformanceTableProps {
  opportunities: IndustryOpportunityPerformanceItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export const OpportunityPerformanceTable: React.FC<OpportunityPerformanceTableProps> = ({
  opportunities,
  pagination,
  onPageChange,
}) => {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        No published opportunities found for this organization.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const isSuccess = status === 'OPEN';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase font-mono border ${
          isSuccess
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0b1329]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] font-mono uppercase tracking-wider text-slate-400">
              <th className="p-3.5 pl-4">Opportunity</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Applications</th>
              <th className="p-3.5">Eligible</th>
              <th className="p-3.5">Matches</th>
              <th className="p-3.5">Assessments</th>
              <th className="p-3.5">Interviews</th>
              <th className="p-3.5">Hires</th>
              <th className="p-3.5 pr-4 text-right">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {opportunities.map(opp => (
              <tr key={opp.id} className="transition-colors hover:bg-[#0f172a]/60">
                <td className="p-3.5 pl-4 font-medium text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#0f172a] border border-[#1e293b] shrink-0">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm block">{opp.title}</span>
                      <span className="text-[11px] uppercase tracking-wide opacity-60 font-mono text-slate-400">
                        {opp.type}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  {getStatusBadge(opp.status)}
                </td>

                <td className="p-3.5 font-mono font-bold text-white">
                  {opp.applicationCount}
                </td>

                <td className="p-3.5 font-mono text-slate-400">
                  {opp.eligibleCandidateCount}
                </td>

                <td className="p-3.5 font-mono text-slate-400">
                  {opp.matchCount}
                </td>

                <td className="p-3.5 font-mono text-slate-400">
                  {opp.assessmentParticipationCount}
                </td>

                <td className="p-3.5 font-mono text-slate-400">
                  {opp.interviewCount}
                </td>

                <td className="p-3.5 font-mono font-bold text-emerald-400">
                  {opp.hiredCount}
                </td>

                <td className="p-3.5 pr-4 text-right font-mono font-bold text-blue-400">
                  {opp.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-400">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="px-3 py-1 rounded-lg border border-[#1e293b] bg-[#0f172a] text-slate-300 hover:border-blue-500/40 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="px-3 py-1 rounded-lg border border-[#1e293b] bg-[#0f172a] text-slate-300 hover:border-blue-500/40 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
