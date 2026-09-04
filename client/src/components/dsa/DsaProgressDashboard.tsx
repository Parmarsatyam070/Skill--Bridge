import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  TrendingUp,
  AlertTriangle,
  Brain,
  Radar,
  Code2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DSAProgressSummary, DSAPlatform } from '@shared/types';

export const DsaProgressDashboard: React.FC = () => {
  const { data, isLoading } = useQuery<{ progress: DSAProgressSummary }>({
    queryKey: ['dsaProgress'],
    queryFn: () => api.get<{ progress: DSAProgressSummary }>('/dsa/progress'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-900 rounded-2xl border border-slate-800" />
        ))}
      </div>
    );
  }

  const p = data?.progress;
  if (!p) return null;

  const easyPct = p.easyTotal > 0 ? Math.round((p.easySolved / p.easyTotal) * 100) : 0;
  const medPct = p.mediumTotal > 0 ? Math.round((p.mediumSolved / p.mediumTotal) * 100) : 0;
  const hardPct = p.hardTotal > 0 ? Math.round((p.hardSolved / p.hardTotal) * 100) : 0;

  const getPlatformColor = (platform: DSAPlatform) => {
    switch (platform) {
      case 'LeetCode':
        return 'from-amber-500/20 to-orange-500/10 border-orange-500/30 text-orange-400';
      case 'GeeksforGeeks':
        return 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400';
      case 'CSES':
        return 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400';
      case 'Codeforces':
        return 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400';
      default:
        return 'from-slate-800 to-slate-850 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total Solved
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{p.totalSolved}</span>
            <span className="text-xs text-slate-400 font-mono">
              / {p.easyTotal + p.mediumTotal + p.hardTotal} Seeded
            </span>
          </div>
        </div>

        {/* Total Attempted */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Attempted
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{p.totalAttempted}</span>
            <span className="text-xs text-slate-400 font-mono">Questions</span>
          </div>
        </div>

        {/* Current Daily Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Daily Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{p.currentStreak}</span>
            <span className="text-xs text-slate-400 font-mono">Days</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Longest Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{p.longestStreak}</span>
            <span className="text-xs text-slate-400 font-mono">Days Record</span>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown & Platform Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Difficulty Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              Difficulty Mastery
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Solved / Total</span>
          </div>

          {/* Easy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">Easy</span>
              <span className="text-slate-300">
                {p.easySolved} / {p.easyTotal} ({easyPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${easyPct}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">Medium</span>
              <span className="text-slate-300">
                {p.mediumSolved} / {p.mediumTotal} ({medPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${medPct}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400 font-bold">Hard</span>
              <span className="text-slate-300">
                {p.hardSolved} / {p.hardTotal} ({hardPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${hardPct}%` }}
              />
            </div>
          </div>

          {/* Radar impact note */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-2.5 mt-2">
            <Radar className="w-4 h-4 text-bridge-teal flex-shrink-0" />
            <span className="text-[11px] text-slate-300">
              DSA problem performance continuously tunes your <strong className="text-bridge-teal">Problem Solving</strong> Skill Radar vector.
            </span>
          </div>
        </div>

        {/* Platform Breakdown Cards (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
              Platform-Wise Breakdown
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Authentic External Repositories</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {p.platformBreakdown.map((pb) => {
              const pct = pb.total > 0 ? Math.round((pb.solved / pb.total) * 100) : 0;
              return (
                <div
                  key={pb.platform}
                  className={`p-3.5 rounded-xl border bg-gradient-to-br ${getPlatformColor(pb.platform)} flex flex-col justify-between space-y-2`}
                >
                  <div className="text-xs font-bold font-mono">{pb.platform}</div>
                  <div>
                    <div className="text-lg font-bold font-mono text-white">
                      {pb.solved} <span className="text-[10px] text-slate-400 font-normal">/ {pb.total}</span>
                    </div>
                    <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-current rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weak Topics vs Strong Topics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Weak topics */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Weak Practice Areas</span>
              </div>
              {p.weakTopics && p.weakTopics.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {p.weakTopics.map((wt) => (
                    <span
                      key={wt}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      {wt}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No persistent weaknesses detected.</p>
              )}
            </div>

            {/* Strong topics */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>High Proficiency Areas</span>
              </div>
              {p.strongTopics && p.strongTopics.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {p.strongTopics.map((st) => (
                    <span
                      key={st}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Solve more sets to reveal strengths.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
