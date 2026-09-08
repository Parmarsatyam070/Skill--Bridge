import React from 'react';
import type { IndustryInterviewAnalyticsDto } from '@shared/types';
import { Bot, CheckCircle, BarChart2 } from 'lucide-react';

interface InterviewAnalyticsCardProps {
  data: IndustryInterviewAnalyticsDto;
}

export const InterviewAnalyticsCard: React.FC<InterviewAnalyticsCardProps> = ({ data }) => {
  if (!data || data.interviewsScheduled === 0) {
    return (
      <div className="p-8 text-center text-sm border rounded-xl" style={{ borderColor: '#2A2E38', background: '#111318', color: '#8B90A0' }}>
        No interview sessions scheduled or completed yet. AI Interview preparation will appear here once candidates participate.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border space-y-5" style={{ background: '#111318', borderColor: '#2A2E38' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#F4F5F7' }}>
            Interview Intelligence
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#8B90A0' }}>
            Session completion rates and evaluator recommendations
          </p>
        </div>
        <Bot className="w-5 h-5" style={{ color: '#5B9BD9' }} />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Scheduled
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#F4F5F7' }}>
            {data.interviewsScheduled}
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Completed
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#F4F5F7' }}>
            {data.interviewsCompleted}
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Completion Rate
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#4CC38A' }}>
            {data.completionRate}%
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Average Score
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#5B9BD9' }}>
            {data.averageScore !== null ? `${data.averageScore}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: '#2A2E38' }}>
        {/* Type Distribution */}
        <div className="space-y-2">
          <span className="text-xs font-semibold block" style={{ color: '#8B90A0' }}>
            Interview Types
          </span>
          <div className="space-y-1.5">
            {Object.entries(data.typeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.02]">
                <span className="capitalize" style={{ color: '#F4F5F7' }}>{type.toLowerCase()}</span>
                <span className="font-mono font-bold" style={{ color: '#2F8C82' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation Distribution */}
        <div className="space-y-2">
          <span className="text-xs font-semibold block" style={{ color: '#8B90A0' }}>
            Recommendations
          </span>
          <div className="space-y-1.5">
            {Object.entries(data.recommendationDistribution).map(([rec, count]) => (
              <div key={rec} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.02]">
                <span className="capitalize" style={{ color: '#F4F5F7' }}>{rec.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-mono font-bold" style={{ color: '#4CC38A' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
