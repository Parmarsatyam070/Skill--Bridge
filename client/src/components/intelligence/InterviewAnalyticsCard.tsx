import React from 'react';
import type { IndustryInterviewAnalyticsDto } from '@shared/types';
import { Bot, CheckCircle, BarChart2 } from 'lucide-react';

interface InterviewAnalyticsCardProps {
  data: IndustryInterviewAnalyticsDto;
}

export const InterviewAnalyticsCard: React.FC<InterviewAnalyticsCardProps> = ({ data }) => {
  if (!data || data.interviewsScheduled === 0) {
    return (
      <div className="p-8 text-center text-sm border border-[#1e293b] rounded-xl bg-[#0b1329] text-slate-400">
        No interview sessions scheduled or completed yet. AI Interview preparation will appear here once candidates participate.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] space-y-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Interview Intelligence
          </h3>
          <p className="text-xs mt-0.5 text-slate-400">
            Session completion rates and evaluator recommendations
          </p>
        </div>
        <Bot className="w-5 h-5 text-blue-400" />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Scheduled
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {data.interviewsScheduled}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Completed
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {data.interviewsCompleted}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Completion Rate
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {data.completionRate}%
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Average Score
          </span>
          <span className="text-xl font-bold font-mono text-blue-400">
            {data.averageScore !== null ? `${data.averageScore}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1e293b]">
        {/* Type Distribution */}
        <div className="space-y-2">
          <span className="text-xs font-semibold block text-slate-400">
            Interview Types
          </span>
          <div className="space-y-1.5">
            {Object.entries(data.typeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs p-2 rounded bg-[#0f172a] border border-[#1e293b]">
                <span className="capitalize text-slate-200">{type.toLowerCase()}</span>
                <span className="font-mono font-bold text-blue-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation Distribution */}
        <div className="space-y-2">
          <span className="text-xs font-semibold block text-slate-400">
            Recommendations
          </span>
          <div className="space-y-1.5">
            {Object.entries(data.recommendationDistribution).map(([rec, count]) => (
              <div key={rec} className="flex items-center justify-between text-xs p-2 rounded bg-[#0f172a] border border-[#1e293b]">
                <span className="capitalize text-slate-200">{rec.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-mono font-bold text-emerald-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
