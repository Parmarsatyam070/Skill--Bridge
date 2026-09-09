import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AcademicRadarSkillDto } from '@shared/types';
import { Sparkles, ShieldCheck, Target } from 'lucide-react';

interface AcademicRadarWidgetProps {
  data: AcademicRadarSkillDto[];
  overallScore?: number;
}

export const AcademicRadarWidget: React.FC<AcademicRadarWidgetProps> = ({ data, overallScore }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm">Upload marksheets to generate your interactive Domain Academic Radar.</p>
      </div>
    );
  }

  // Format data for Recharts Radar
  const chartData = data.map(item => ({
    subject: item.skill,
    pillar: item.pillar,
    performance: item.performance,
    benchmark: item.benchmark || 75,
    category: item.category,
    relevance: item.relevance,
    count: item.subjectCount,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const isStrong = p.performance >= 75;
      const isNeedsImp = p.performance < 68;

      return (
        <div className="bg-[#0b1329]/95 border border-[#334155] backdrop-blur-md rounded-xl p-4 shadow-2xl min-w-[240px] text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2">
            <span className="font-semibold text-white text-sm">{p.subject}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isStrong
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isNeedsImp
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {p.category}
            </span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Domain Pillar:</span>
              <span className="text-slate-200 font-medium">{p.pillar}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Performance:</span>
              <span className="text-cyan-400 font-bold">{p.performance}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Benchmark Target:</span>
              <span className="text-slate-300">{p.benchmark}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Curriculum Relevance:</span>
              <span className="text-blue-400 font-medium">{p.relevance}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden shadow-xl">
      {/* Glow ambient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white tracking-wide">Domain Academic Radar</h3>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Dynamic Normalized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual breakdown of core competency pillars versus the 75% industry standard benchmark.
          </p>
        </div>

        {overallScore !== undefined && (
          <div className="bg-[#0f172a] border border-[#1e293b] px-3.5 py-1.5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Domain Avg:</span>
            <span className="text-sm font-bold text-white">{overallScore}%</span>
          </div>
        )}
      </div>

      <div className="w-full h-[320px] sm:h-[360px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              stroke="#1e293b"
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Benchmark Standard Polygon */}
            <Radar
              name="Benchmark (75%)"
              dataKey="benchmark"
              stroke="#475569"
              fill="#334155"
              fillOpacity={0.15}
              strokeDasharray="3 3"
            />
            {/* Actual Student Performance Polygon */}
            <Radar
              name="Student Academic Performance"
              dataKey="performance"
              stroke="#38bdf8"
              fill="#2563eb"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Categories */}
      <div className="mt-4 pt-4 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400 border border-cyan-300" />
            <span className="text-slate-300">Your Academic Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-slate-500 rounded" />
            <span className="text-slate-400">Target Standard (75%)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Strong (&ge;75%)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate (68-74%)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Needs Improvement (&lt;68%)
          </span>
        </div>
      </div>
    </div>
  );
};
