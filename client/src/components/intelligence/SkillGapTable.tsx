import React, { useState } from 'react';
import type { InstitutionSkillComparisonItem } from '@shared/types';
import { GapSeverityBadge } from './GapSeverityBadge';
import { Users, ArrowUpDown } from 'lucide-react';

interface SkillGapTableProps {
  skills: InstitutionSkillComparisonItem[];
  onSelectSkill?: (skillId: string, skillName: string) => void;
  selectedSkillId?: string | null;
}

export const SkillGapTable: React.FC<SkillGapTableProps> = ({
  skills,
  onSelectSkill,
  selectedSkillId,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'demand' | 'coverage' | 'score'>('demand');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (!skills || skills.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: '#8B90A0' }}>
        No market skill comparisons generated yet.
      </div>
    );
  }

  // Filter
  const filtered = skills.filter(s => {
    if (filterSeverity === 'ALL') return true;
    return s.gapSeverity === filterSeverity;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'demand') diff = a.industryDemandCount - b.industryDemandCount;
    if (sortBy === 'coverage') diff = a.coveragePct - b.coveragePct;
    if (sortBy === 'score') diff = a.avgStudentScore - b.avgStudentScore;
    return sortOrder === 'asc' ? diff : -diff;
  });

  const toggleSort = (column: 'demand' | 'coverage' | 'score') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border" style={{ background: '#111318', borderColor: '#2A2E38' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterSeverity(lvl)}
              className="px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{
                background: filterSeverity === lvl ? '#2F8C82' : 'transparent',
                color: filterSeverity === lvl ? '#FFFFFF' : '#8B90A0',
              }}
            >
              {lvl === 'ALL' ? 'All Skills' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Gap`}
            </button>
          ))}
        </div>

        <div className="text-xs" style={{ color: '#8B90A0' }}>
          Showing {sorted.length} of {skills.length} skills
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#2A2E38', background: '#111318' }}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b font-mono uppercase tracking-wider" style={{ borderColor: '#2A2E38', color: '#8B90A0' }}>
              <th className="p-3.5 pl-4">Skill & Category</th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('demand')}>
                <div className="flex items-center gap-1">
                  <span>Industry Demand</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('coverage')}>
                <div className="flex items-center gap-1">
                  <span>Student Coverage</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer select-none" onClick={() => toggleSort('score')}>
                <div className="flex items-center gap-1">
                  <span>Avg Score</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="p-3.5">Verified %</th>
              <th className="p-3.5">Severity</th>
              <th className="p-3.5 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#2A2E38' }}>
            {sorted.map(s => {
              const isSelected = selectedSkillId === s.skillId;
              return (
                <tr
                  key={s.skillId}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: isSelected ? 'rgba(47, 140, 130, 0.08)' : 'transparent',
                  }}
                >
                  <td className="p-3.5 pl-4 font-medium" style={{ color: '#F4F5F7' }}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{s.skillName}</span>
                      <span className="text-[11px] uppercase tracking-wide opacity-60">{s.category}</span>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono">
                    <span className="font-bold text-sm" style={{ color: '#2F8C82' }}>
                      {s.industryDemandCount}
                    </span>
                    <span className="text-[11px] block opacity-70">roles open</span>
                  </td>

                  <td className="p-3.5 font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>{s.coveragePct}%</span>
                        <span className="opacity-60">({s.studentCoverageCount} students)</span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full overflow-hidden bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, s.coveragePct)}%`,
                            background: s.coveragePct >= 60 ? '#4CC38A' : s.coveragePct >= 30 ? '#E8A23C' : '#E5637C',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono">
                    <span className="font-bold">{s.avgStudentScore}</span>
                    <span className="text-[11px] block opacity-60">/ 100 benchmark</span>
                  </td>

                  <td className="p-3.5 font-mono text-xs" style={{ color: '#8B90A0' }}>
                    {s.verificationStrengthPct}%
                  </td>

                  <td className="p-3.5">
                    <GapSeverityBadge severity={s.gapSeverity} />
                  </td>

                  <td className="p-3.5 pr-4 text-right">
                    {onSelectSkill && (
                      <button
                        onClick={() => onSelectSkill(s.skillId, s.skillName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isSelected ? '#2F8C82' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#FFFFFF' : '#F4F5F7',
                          border: `1px solid ${isSelected ? '#2F8C82' : '#2A2E38'}`,
                        }}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Viewing' : `View (${s.affectedStudentCount})`}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
