import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DailyPracticeData } from '@shared/types';

interface DsaDailyBannerProps {
  onStartDailyPractice: (dailyData: DailyPracticeData) => void;
}

export const DsaDailyBanner: React.FC<DsaDailyBannerProps> = ({ onStartDailyPractice }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ dailyPractice: DailyPracticeData }>({
    queryKey: ['dsaDailyPractice'],
    queryFn: () => api.get<{ dailyPractice: DailyPracticeData }>('/dsa/daily'),
  });

  const startDailyMutation = useMutation({
    mutationFn: () => api.post<{ dailyPractice: DailyPracticeData }>('/dsa/daily/start'),
    onSuccess: (res) => {
      queryClient.setQueryData(['dsaDailyPractice'], res);
      onStartDailyPractice(res.dailyPractice);
    },
    onError: (err: any) => {
      alert(`Could not start daily practice: ${err.message || 'Unknown error'}`);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-console-panel border border-console-border animate-pulse flex items-center justify-between">
        <div className="h-10 bg-console-panel-raised rounded-xl w-64" />
        <div className="h-10 bg-console-panel-raised rounded-xl w-32" />
      </div>
    );
  }

  const daily = data?.dailyPractice;
  if (!daily) return null;

  const totalQuestions = daily.questionCount || daily.questions?.length || 5;
  const completedCount = daily.completedQuestionIds?.length || 0;
  const isCompleted = daily.status === 'COMPLETED';
  const progressPct = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const formattedDate = new Date(daily.date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-bridge-teal/30 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
      {/* Background ambient glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-bridge-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left info column */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridge-teal/15 border border-bridge-teal/40 text-bridge-teal text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Daily Mandatory DSA Challenge
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>

            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-green/20 border border-status-green/40 text-status-green text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            ) : completedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-industry-amber/20 border border-industry-amber/40 text-industry-amber text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                In Progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                Not Started Today
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
              {isCompleted ? "Today's DSA Practice Completed! 🎉" : "Today's Mandatory DSA Practice"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {isCompleted
                ? `You've solved all ${totalQuestions} questions for today. Your daily streak has advanced and radar calibration is updated!`
                : `A fresh, balanced set of ${totalQuestions} authentic questions generated for your calendar day. Complete all to extend your streak.`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">
                Progress: <span className="text-bridge-teal font-bold">{completedCount}</span> / {totalQuestions} Solved
              </span>
              <span className="text-slate-400 font-bold">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-750">
              <div
                className="h-full bg-gradient-to-r from-bridge-teal to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right action & streak card */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-4">
          {/* Streaks pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-white">
                  {daily.currentStreak || 0}
                </span>
                <span className="text-xs font-medium text-slate-400">Day Streak</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Longest: <span className="text-amber-400 font-bold">{daily.longestStreak || 0} days</span>
              </div>
            </div>
          </div>

          {/* Start / Continue Button */}
          <button
            onClick={() => {
              if (daily.status === 'PENDING') {
                startDailyMutation.mutate();
              } else {
                onStartDailyPractice(daily);
              }
            }}
            disabled={startDailyMutation.isPending}
            className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
              isCompleted
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                : 'bg-bridge-teal hover:bg-bridge-teal/90 text-white shadow-bridge-teal/20 hover:scale-[1.02]'
            }`}
          >
            {startDailyMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating Set...</span>
              </>
            ) : isCompleted ? (
              <>
                <Layers className="w-4 h-4 text-bridge-teal" />
                <span>Review Today's Set ({totalQuestions} Qs)</span>
              </>
            ) : completedCount > 0 ? (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Continue Today's Set ({completedCount}/{totalQuestions})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Daily Practice ({totalQuestions} Qs)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
