import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Target, Award, AlertCircle, Activity } from 'lucide-react';
import { MatchCard } from './MatchCard';

interface SkillScoreItem {
  skillId: string;
  skillName: string;
  score: number;
}

interface BenchmarkItem {
  skillId: string;
  skillName: string;
  benchmarkScore: number;
}

interface SkillRadarCardProps {
  studentSkills: SkillScoreItem[];
  benchmarks: BenchmarkItem[];
  targetDomain: string;
  className?: string;
}

export const SkillRadarCard: React.FC<SkillRadarCardProps> = React.memo(({
  studentSkills,
  benchmarks,
  targetDomain,
  className = '',
}) => {
  const { chartData, isAllZero, totalGaps, strengths } = useMemo(() => {
    const scoreMap = new Map(studentSkills.map(s => [s.skillId, s.score]));

    const effectiveBenchmarks = benchmarks.length >= 3
      ? benchmarks
      : [
          { skillId: 'def-1', skillName: 'Problem Solving & DSA', benchmarkScore: 80 },
          { skillId: 'def-2', skillName: 'Core Architecture', benchmarkScore: 75 },
          { skillId: 'def-3', skillName: 'API & Data Contracts', benchmarkScore: 75 },
          { skillId: 'def-4', skillName: 'Code Quality & Testing', benchmarkScore: 70 },
          { skillId: 'def-5', skillName: 'System Fundamentals', benchmarkScore: 80 },
          { skillId: 'def-6', skillName: 'DevOps & Tooling', benchmarkScore: 70 },
        ];

    const data = effectiveBenchmarks.map(b => {
      const studentScore = scoreMap.get(b.skillId) || 0;
      return {
        skill: b.skillName,
        skillId: b.skillId,
        studentScore,
        benchmarkScore: b.benchmarkScore,
        gap: Math.max(0, b.benchmarkScore - studentScore),
      };
    });

    const allZero = data.every(d => d.studentScore === 0);
    const gaps = data.filter(d => d.studentScore < d.benchmarkScore).length;
    const str = data.filter(d => d.studentScore >= d.benchmarkScore).length;

    return {
      chartData: data,
      isAllZero: allZero,
      totalGaps: gaps,
      strengths: str,
    };
  }, [studentSkills, benchmarks]);

  return (
    <div className={`bg-[#111318] border border-[#2A2E38] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2A2E38] gap-3">
        <div>
          <span className="small-caps-label flex items-center gap-1.5 text-[#2F8C82] mb-1">
            <Activity className="w-3 h-3 text-[#2F8C82]" />
            Vector Calibration
          </span>
          <h3 className="text-base sm:text-lg font-semibold text-[#F4F5F7] tracking-tight">
            {targetDomain} Skill Radar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1D24] border border-[#2A2E38]">
            <Award className="w-3.5 h-3.5 text-[#4CC38A]" />
            <span className="text-xs font-mono text-[#4CC38A] font-medium">
              {strengths} Strengths
            </span>
          </div>
          {totalGaps > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1D24] border border-[#2A2E38]">
              <AlertCircle className="w-3.5 h-3.5 text-[#E5637C]" />
              <span className="text-xs font-mono text-[#E5637C] font-medium">
                {totalGaps} Gaps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid gridType="polygon" stroke="#2A2E38" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: '#8B90A0', fontSize: 11, fontFamily: 'Inter' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              type="number"
              allowDataOverflow={false}
              tick={{ fill: '#8B90A0', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1A1D24] border border-[#2A2E38] p-3 rounded-xl shadow-xl font-sans text-xs space-y-1.5">
                      <div className="font-semibold text-[#F4F5F7] pb-1 border-b border-[#2A2E38]">{data.skill}</div>
                      <div className="flex items-center justify-between gap-4 text-[#2F8C82] font-mono">
                        <span>Your Score:</span>
                        <span className="font-bold">{data.studentScore}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#8B90A0] font-mono">
                        <span>Industry Target:</span>
                        <span className="font-bold">{data.benchmarkScore}%</span>
                      </div>
                      {data.gap > 0 ? (
                        <div className="mt-1 pt-1 border-t border-[#2A2E38] text-[#E5637C] font-mono font-medium">
                          Gap: -{data.gap}%
                        </div>
                      ) : (
                        <div className="mt-1 pt-1 border-t border-[#2A2E38] text-[#4CC38A] font-mono font-medium">
                          Benchmark Met
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Industry Benchmark line */}
            <Radar
              name="Industry Benchmark"
              dataKey="benchmarkScore"
              stroke="#8B90A0"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="#8B90A0"
              fillOpacity={0.06}
            />
            {/* Student Verified Score in Bridge Teal */}
            <Radar
              name="Verified Student Score"
              dataKey="studentScore"
              stroke="#2F8C82"
              strokeWidth={2.5}
              fill="#2F8C82"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#2A2E38] text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2F8C82]" />
          <span className="text-[#F4F5F7] font-medium">Verified Vector</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-[#8B90A0]" />
          <span className="text-[#8B90A0]">Industry Benchmark</span>
        </div>
      </div>

      {/* Category breakdown via MatchCard components */}
      <div className="pt-2">
        <div className="small-caps-label text-[#8B90A0] mb-3">
          Category Vectors & Benchmarks
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {chartData.map((d) => (
            <MatchCard
              key={d.skillId}
              label={d.skill}
              value={`${d.studentScore}%`}
              subValue={`Target: ${d.benchmarkScore}%`}
              progress={(d.studentScore / (d.benchmarkScore || 100)) * 100}
              trend={
                d.gap > 0
                  ? { direction: 'down', value: `-${d.gap}%` }
                  : { direction: 'up', value: 'Passed' }
              }
              variant="raised"
            />
          ))}
        </div>
      </div>

      {isAllZero && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#1A1D24] border border-[#2A2E38] text-center">
          <span className="text-xs text-[#2F8C82] font-mono">
            Calibration Pending: Complete domain assessments or course certifications to expand your verified polygon.
          </span>
        </div>
      )}
    </div>
  );
});

export default SkillRadarCard;
