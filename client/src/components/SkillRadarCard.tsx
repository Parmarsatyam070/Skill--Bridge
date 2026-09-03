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
import { Target, Award, AlertCircle } from 'lucide-react';

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

export const SkillRadarCard: React.FC<SkillRadarCardProps> = ({
  studentSkills,
  benchmarks,
  targetDomain,
  className = '',
}) => {
  const scoreMap = new Map(studentSkills.map(s => [s.skillId, s.score]));

  const chartData = benchmarks.map(b => {
    const studentScore = scoreMap.get(b.skillId) || 0;
    return {
      skill: b.skillName,
      studentScore,
      benchmarkScore: b.benchmarkScore,
      gap: Math.max(0, b.benchmarkScore - studentScore),
    };
  });

  const totalGaps = chartData.filter(d => d.studentScore < d.benchmarkScore).length;
  const strengths = chartData.filter(d => d.studentScore >= d.benchmarkScore).length;

  return (
    <div className={`bg-console-panel border border-console-border rounded-xl p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-console-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
            Competency Vector vs Industry Benchmark
          </span>
          <h3 className="font-serif text-lg font-semibold text-console-text">
            {targetDomain} Skill Radar
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-green/10 border border-status-green/20">
            <Award className="w-3.5 h-3.5 text-status-green" />
            <span className="text-xs font-mono text-status-green font-medium">
              {strengths} Strengths
            </span>
          </div>
          {totalGaps > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-red/10 border border-status-red/20">
              <AlertCircle className="w-3.5 h-3.5 text-status-red" />
              <span className="text-xs font-mono text-status-red font-medium">
                {totalGaps} Gaps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#2E3241" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: '#EDEFF3', fontSize: 11, fontFamily: 'Inter' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#8A90A3', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-console-panel-raised border border-console-border p-3 rounded-lg shadow-lg font-sans text-xs">
                      <div className="font-semibold text-console-text mb-1.5">{data.skill}</div>
                      <div className="flex items-center justify-between gap-4 text-bridge-teal font-mono">
                        <span>Your Score:</span>
                        <span className="font-bold">{data.studentScore}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-console-text-muted font-mono">
                        <span>Industry Benchmark:</span>
                        <span className="font-bold">{data.benchmarkScore}%</span>
                      </div>
                      {data.gap > 0 ? (
                        <div className="mt-1.5 pt-1.5 border-t border-console-border text-status-red font-mono font-medium">
                          Gap: -{data.gap}%
                        </div>
                      ) : (
                        <div className="mt-1.5 pt-1.5 border-t border-console-border text-status-green font-mono font-medium">
                          Benchmark Met (Strength)
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Industry Benchmark line in console-text-muted */}
            <Radar
              name="Industry Benchmark"
              dataKey="benchmarkScore"
              stroke="#8A90A3"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="#8A90A3"
              fillOpacity={0.08}
            />
            {/* Student Verified Score in bridge-teal */}
            <Radar
              name="Verified Student Score"
              dataKey="studentScore"
              stroke="#2F8C82"
              strokeWidth={2.5}
              fill="#2F8C82"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-console-border/60 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-bridge-teal opacity-90 border border-bridge-teal" />
          <span className="text-console-text font-medium">Your Verified Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed border-console-text-muted" />
          <span className="text-console-text-muted">Industry Target Benchmark</span>
        </div>
      </div>
    </div>
  );
};
