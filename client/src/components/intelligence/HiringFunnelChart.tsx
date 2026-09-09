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
      <div className="p-8 text-center text-sm text-slate-400">
        No application data available to construct recruitment funnel.
      </div>
    );
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  const stageColors: Record<string, string> = {
    applied: '#3b82f6',     // Blue
    under_review: '#60a5fa',// Light Blue
    shortlisted: '#f59e0b', // Amber
    interview: '#8b5cf6',   // Purple
    hired: '#10b981',       // Emerald
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, idx) => {
        const widthPct = Math.max(8, Math.round((stage.count / maxCount) * 100));
        const color = stageColors[stage.stage] || '#3b82f6';

        return (
          <div key={stage.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="font-medium text-white">
                  {stage.label}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-bold text-white">
                  {stage.count}
                </span>
                <span className="text-slate-400">
                  {stage.percentageOfTotal}% of total
                </span>
                {idx > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded border ${
                      stage.conversionFromPrevious >= 50
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {stage.conversionFromPrevious}% conv.
                  </span>
                )}
              </div>
            </div>

            <div
              className="h-7 rounded-lg overflow-hidden relative flex items-center px-3 transition-all duration-500 bg-[#0f172a] border border-[#1e293b]"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${color}30, ${color}60)`,
                  borderRight: `2px solid ${color}`,
                }}
              />
              <span className="relative z-10 text-xs font-mono font-medium text-white">
                {stage.count} candidate{stage.count === 1 ? '' : 's'}
              </span>
            </div>

            {idx < stages.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
