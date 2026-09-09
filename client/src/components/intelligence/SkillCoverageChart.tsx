import React from 'react';
import type { CandidateSkillSupplyItem } from '@shared/types';

interface SkillCoverageChartProps {
  items: CandidateSkillSupplyItem[];
}

export const SkillCoverageChart: React.FC<SkillCoverageChartProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        No candidate supply metrics available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 8).map(item => {
        const gapColor = {
          HEALTHY: '#10b981',
          SUPPLY_DEFICIT: '#f59e0b',
          HIGH_DEMAND_LOW_SUPPLY: '#f43f5e',
        }[item.gapType];

        const gapLabel = {
          HEALTHY: 'Adequate Talent Supply',
          SUPPLY_DEFICIT: 'Mild Supply Deficit',
          HIGH_DEMAND_LOW_SUPPLY: 'Severe Shortage',
        }[item.gapType];

        return (
          <div
            key={item.skillId}
            className="p-3.5 rounded-lg border border-[#1e293b] bg-[#0b1329] space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-sm text-white">
                  {item.skillName}
                </span>
                <span className="ml-2 text-xs text-slate-400">
                  Demand: {item.demandCount} roles
                </span>
              </div>

              <span
                className="px-2 py-0.5 rounded text-[11px] font-medium"
                style={{
                  background: `${gapColor}15`,
                  color: gapColor,
                  border: `1px solid ${gapColor}30`,
                }}
              >
                {gapLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Available Verified Candidates: {item.candidateSupplyCount}
              </span>
              <span className="font-bold" style={{ color: gapColor }}>
                {item.coveragePct}% ratio
              </span>
            </div>

            <div
              className="h-2 rounded-full overflow-hidden bg-[#0f172a] border border-[#1e293b]"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, item.coveragePct)}%`,
                  background: gapColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
