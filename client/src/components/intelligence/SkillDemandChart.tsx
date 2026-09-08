import React from 'react';
import type { SkillDemandItem } from '@shared/types';

interface SkillDemandChartProps {
  skills: SkillDemandItem[];
}

export const SkillDemandChart: React.FC<SkillDemandChartProps> = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
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
                <span className="font-medium" style={{ color: '#F4F5F7' }}>
                  {s.skillName}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#8B90A0',
                  }}
                >
                  {s.category}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span style={{ color: '#8B90A0' }}>
                  {s.mandatoryCount} mandatory / {s.preferredCount} preferred
                </span>
                <span className="font-bold" style={{ color: '#2F8C82' }}>
                  {s.demandCount} opps ({s.demandPct}%)
                </span>
              </div>
            </div>

            <div
              className="h-3 rounded-full overflow-hidden relative"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: 'linear-gradient(90deg, #2F8C82, #4CC38A)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
