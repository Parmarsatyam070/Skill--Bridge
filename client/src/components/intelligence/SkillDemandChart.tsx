import React from 'react';
import type { SkillDemandItem } from '@shared/types';

interface SkillDemandChartProps {
  skills: SkillDemandItem[];
}

export const SkillDemandChart: React.FC<SkillDemandChartProps> = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        No skill requirements recorded in active opportunities.
      </div>
    );
  }

  const maxDemand = Math.max(...skills.map(s => s.demandCount), 1);

  return (
    <div className="space-y-3.5">
      {skills.slice(0, 8).map(s => {
        const widthPct = Math.max(8, Math.round((s.demandCount / maxDemand) * 100));

        return (
          <div key={s.skillId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {s.skillName}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-[#0f172a] border border-[#1e293b] text-slate-400"
                >
                  {s.category}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">
                  {s.mandatoryCount} mandatory / {s.preferredCount} preferred
                </span>
                <span className="font-bold text-blue-400">
                  {s.demandCount} opps ({s.demandPct}%)
                </span>
              </div>
            </div>

            <div
              className="h-3 rounded-full overflow-hidden relative bg-[#0f172a] border border-[#1e293b]"
            >
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-blue-400"
                style={{
                  width: `${widthPct}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
