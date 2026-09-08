import React from 'react';
import type { CandidateSkillSupplyItem } from '@shared/types';

interface SkillCoverageChartProps {
  items: CandidateSkillSupplyItem[];
}

export const SkillCoverageChart: React.FC<SkillCoverageChartProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
        No candidate supply metrics available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 8).map(item => {
        const gapColor = {
          HEALTHY: '#4CC38A',
          SUPPLY_DEFICIT: '#E8A23C',
          HIGH_DEMAND_LOW_SUPPLY: '#E5637C',
        }[item.gapType];

        const gapLabel = {
          HEALTHY: 'Adequate Talent Supply',
          SUPPLY_DEFICIT: 'Mild Supply Deficit',
          HIGH_DEMAND_LOW_SUPPLY: 'Severe Shortage',
        }[item.gapType];

        return (
          <div
            key={item.skillId}
            className="p-3.5 rounded-lg border space-y-2"
            style={{
              background: '#111318',
              borderColor: '#2A2E38',
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-sm" style={{ color: '#F4F5F7' }}>
                  {item.skillName}
                </span>
                <span className="ml-2 text-xs" style={{ color: '#8B90A0' }}>
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
              <span style={{ color: '#8B90A0' }}>
                Available Verified Candidates: {item.candidateSupplyCount}
              </span>
              <span className="font-bold" style={{ color: gapColor }}>
                {item.coveragePct}% ratio
              </span>
            </div>

            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
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
