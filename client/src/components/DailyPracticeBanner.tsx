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
    placeholderData: (previousData) => previousData,
  });

  if (isLoading || !status) {
    return null;
  }

  const { completedToday, currentStreak, recommendedSet } = status;

  if (completedToday) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-[#111318] border border-[#4CC38A]/30 p-4 sm:p-5 shadow-lg backdrop-blur-md ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1A1D24] border border-[#4CC38A]/40 flex items-center justify-center text-[#4CC38A] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#4CC38A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="small-caps-label text-[#4CC38A] bg-[#4CC38A]/10 px-2 py-0.5 rounded">
                  Daily Protocol Completed
                </span>
                <span className="text-xs text-[#8B90A0] flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 text-[#E8A23C] fill-[#E8A23C]" />
                  <strong className="text-[#F4F5F7] font-medium">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</strong>
                </span>
              </div>
              <p className="text-xs text-[#8B90A0] mt-1 font-sans">
                You’ve completed today’s mandatory practice set. Skill radar vectors remain fully calibrated.
              </p>
            </div>
          </div>

          <Link
            to="/assessment"
            className="bridge-btn-secondary text-xs py-2 px-4 shrink-0"
          >
            <span>Practice More</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#8B90A0]" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#111318] border border-[#E8A23C]/40 p-4 sm:p-5 shadow-lg backdrop-blur-md ${className}`}
    >
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Status Nudge & Copy */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#1A1D24] border border-[#E8A23C]/40 flex items-center justify-center text-[#E8A23C] shrink-0">
            <Flame className="w-5 h-5 text-[#E8A23C] fill-[#E8A23C]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="small-caps-label text-[#E8A23C] bg-[#E8A23C]/10 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8A23C] animate-pulse" />
                Mandatory Daily Protocol Pending
              </span>
              {currentStreak > 0 ? (
                <span className="text-[11px] text-[#8B90A0] font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#E8A23C]" />
                  {currentStreak}-day streak at risk today
                </span>
              ) : (
                <span className="text-[11px] text-[#8B90A0] font-mono">
                  Start your learning streak today
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-[#F4F5F7]">
              Today's practice pending — complete 1 set to keep your streak and radar active
            </h3>
            <p className="text-xs text-[#8B90A0] max-w-2xl leading-relaxed font-sans">
              To reflect real-world engineering readiness, daily activity requires submitting at least 1 set. Unpracticed skills experience mild decay after 30 days.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action & Recommended Set */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          {recommendedSet && (
            <div className="hidden xl:flex flex-col text-right pr-2">
              <span className="small-caps-label text-[10px]">Target Set</span>
              <span className="text-xs font-medium text-[#F4F5F7] truncate max-w-[180px]">
                {recommendedSet.title}
              </span>
            </div>
          )}

          {recommendedSet && onStartSet ? (
            <button
              onClick={() => onStartSet(recommendedSet.id)}
              className="bridge-btn-primary text-xs py-2 px-5 font-medium"
            >
              <span>Start Daily Set</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          ) : (
            <Link
              to={recommendedSet ? `/assessment?set=${recommendedSet.id}` : '/assessment'}
              className="bridge-btn-primary text-xs py-2 px-5 font-medium"
            >
              <span>Start Daily Set</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyPracticeBanner;
