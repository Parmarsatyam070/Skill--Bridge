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
      <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
        No published opportunities found for this organization.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const isSuccess = status === 'OPEN';
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase font-mono"
        style={{
          background: isSuccess ? 'rgba(76, 195, 138, 0.15)' : 'rgba(139, 144, 160, 0.15)',
          color: isSuccess ? '#4CC38A' : '#8B90A0',
          border: `1px solid ${isSuccess ? 'rgba(76, 195, 138, 0.3)' : 'rgba(139, 144, 160, 0.3)'}`,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#2A2E38', background: '#111318' }}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b font-mono uppercase tracking-wider" style={{ borderColor: '#2A2E38', color: '#8B90A0' }}>
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
          <tbody className="divide-y" style={{ borderColor: '#2A2E38' }}>
            {opportunities.map(opp => (
              <tr key={opp.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="p-3.5 pl-4 font-medium" style={{ color: '#F4F5F7' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
                      <Briefcase className="w-3.5 h-3.5" style={{ color: '#2F8C82' }} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm block">{opp.title}</span>
                      <span className="text-[11px] uppercase tracking-wide opacity-60 font-mono">
                        {opp.type}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  {getStatusBadge(opp.status)}
                </td>

                <td className="p-3.5 font-mono font-bold" style={{ color: '#F4F5F7' }}>
                  {opp.applicationCount}
                </td>

                <td className="p-3.5 font-mono" style={{ color: '#8B90A0' }}>
                  {opp.eligibleCandidateCount}
                </td>

                <td className="p-3.5 font-mono" style={{ color: '#8B90A0' }}>
                  {opp.matchCount}
                </td>

                <td className="p-3.5 font-mono" style={{ color: '#8B90A0' }}>
                  {opp.assessmentParticipationCount}
                </td>

                <td className="p-3.5 font-mono" style={{ color: '#8B90A0' }}>
                  {opp.interviewCount}
                </td>

                <td className="p-3.5 font-mono font-bold" style={{ color: '#4CC38A' }}>
                  {opp.hiredCount}
                </td>

                <td className="p-3.5 pr-4 text-right font-mono font-bold" style={{ color: '#2F8C82' }}>
                  {opp.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs" style={{ color: '#8B90A0' }}>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
              style={{ background: '#111318', borderColor: '#2A2E38' }}
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
              style={{ background: '#111318', borderColor: '#2A2E38' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
