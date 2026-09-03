import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Sparkles, ArrowRight, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { DailyPracticeStatus } from '@shared/types';

interface DailyPracticeBannerProps {
  className?: string;
  onStartSet?: (practiceSetId: string) => void;
}

export const DailyPracticeBanner: React.FC<DailyPracticeBannerProps> = ({ className = '', onStartSet }) => {
  const { data: status, isLoading } = useQuery<DailyPracticeStatus>({
    queryKey: ['dailyPracticeStatus'],
    queryFn: () => api.get<DailyPracticeStatus>('/assessments/daily-status'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !status) {
    return null;
  }

  const { completedToday, currentStreak, recommendedSet } = status;

  if (completedToday) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/50 border border-emerald-500/30 p-4 sm:p-5 shadow-lg shadow-emerald-950/20 backdrop-blur-md ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Streak Active Today
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <strong className="text-amber-300 font-semibold">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</strong>
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1">
                You’ve completed your mandatory daily practice set. Skill Radar vectors are fully calibrated!
              </p>
            </div>
          </div>

          <Link
            to="/assessment"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200"
          >
            <span>Practice More</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/50 via-orange-950/40 to-slate-900/60 border border-amber-500/40 p-4 sm:p-5 shadow-xl shadow-amber-950/30 backdrop-blur-md ${className}`}
    >
      {/* Decorative Glow Ring */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Status Nudge & Copy */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0 animate-pulse">
            <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Mandatory Daily Practice Pending
              </span>
              {currentStreak > 0 ? (
                <span className="text-xs text-amber-200/90 font-medium flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {currentStreak}-day streak at risk today
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  Start your learning streak today
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white mt-1.5">
              Today's practice pending — complete 1 set to keep your streak and radar active
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              To reflect real-world engineering readiness, daily activity requires submitting at least 1 set. Unpracticed skills experience mild decay after 30 days.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action & Recommended Set */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto flex-shrink-0">
          {recommendedSet && (
            <div className="hidden xl:flex flex-col text-right pr-2">
              <span className="text-[11px] font-medium text-slate-400">Target Domain Set</span>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                {recommendedSet.title}
              </span>
            </div>
          )}

          {recommendedSet && onStartSet ? (
            <button
              onClick={() => onStartSet(recommendedSet.id)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-450 hover:to-orange-450 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Daily Set</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <Link
              to={recommendedSet ? `/assessment?set=${recommendedSet.id}` : '/assessment'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-450 hover:to-orange-450 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Daily Set</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
