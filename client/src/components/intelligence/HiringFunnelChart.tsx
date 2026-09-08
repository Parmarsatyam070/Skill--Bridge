import React from 'react';
import type { RecruitmentFunnelStage } from '@shared/types';
import { ArrowDown } from 'lucide-react';

interface HiringFunnelChartProps {
  stages: RecruitmentFunnelStage[];
  totalApplications: number;
}

export const HiringFunnelChart: React.FC<HiringFunnelChartProps> = ({ stages, totalApplications }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
        No application data available to construct recruitment funnel.
      </div>
    );
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  const stageColors: Record<string, string> = {
    applied: '#2F8C82',     // Bridge teal
    under_review: '#5B9BD9',// Blue
    shortlisted: '#E8A23C', // Amber
    interview: '#9B59B6',   // Purple
    hired: '#4CC38A',       // Green
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, idx) => {
        const widthPct = Math.max(8, Math.round((stage.count / maxCount) * 100));
        const color = stageColors[stage.stage] || '#2F8C82';

        return (
          <div key={stage.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="font-medium" style={{ color: '#F4F5F7' }}>
                  {stage.label}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-bold" style={{ color: '#F4F5F7' }}>
                  {stage.count}
                </span>
                <span style={{ color: '#8B90A0' }}>
                  {stage.percentageOfTotal}% of total
                </span>
                {idx > 0 && (
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: stage.conversionFromPrevious >= 50 ? '#4CC38A' : '#E8A23C',
                    }}
                  >
                    {stage.conversionFromPrevious}% conv.
                  </span>
                )}
              </div>
            </div>

            <div
              className="h-7 rounded-lg overflow-hidden relative flex items-center px-3 transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${color}30, ${color}60)`,
                  borderRight: `2px solid ${color}`,
                }}
              />
              <span className="relative z-10 text-xs font-mono font-medium" style={{ color: '#F4F5F7' }}>
                {stage.count} candidate{stage.count === 1 ? '' : 's'}
              </span>
            </div>

            {idx < stages.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown className="w-3.5 h-3.5 opacity-30" style={{ color: '#8B90A0' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
