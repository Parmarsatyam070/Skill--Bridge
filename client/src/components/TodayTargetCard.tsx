import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
  BookOpen,
  Code2,
  Layout,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { DailyTargetData } from '@shared/types';

const TYPE_META: Record<
  string,
  { icon: React.FC<{ className?: string }>; color: string; label: string }
> = {
  dsa: {
    icon: Code2,
    color: 'text-[#5B7FE0]',
    label: 'DSA Challenge',
  },
  practice_set: {
    icon: Layout,
    color: 'text-[#2F8C82]',
    label: 'Assessment',
  },
  resource: {
    icon: BookOpen,
    color: 'text-[#E8A23C]',
    label: 'Learning Resource',
  },
};

interface Props {
  /** compact = single-row variant for Dashboard; full = expanded card for SkillProfile */
  variant?: 'compact' | 'full';
  className?: string;
}

export const TodayTargetCard: React.FC<Props> = ({
  variant = 'full',
  className = '',
}) => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;
  const queryClient = useQueryClient();

  const {
    data: target,
    isLoading,
    isError,
  } = useQuery<DailyTargetData>({
    queryKey: ['dailyTarget', studentProfileId],
    queryFn: () =>
      api
        .get<{ target: DailyTargetData }>(`/students/${studentProfileId}/daily-target`)
        .then(r => r.target),
    enabled: !!studentProfileId,
    staleTime: 5 * 60 * 1000, // 5 min — target is stable for the day
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      api.post<{ target: DailyTargetData }>(
        `/students/${studentProfileId}/daily-target/complete`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyTarget', studentProfileId] });
    },
  });

  if (!studentProfileId) return null;

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div
        className={`bg-[#111318] border border-[#2A2E38] rounded-2xl p-5 flex items-center gap-3 ${className}`}
      >
        <Loader2 className="w-4 h-4 text-[#8B90A0] animate-spin" />
        <span className="text-xs text-[#8B90A0]">Generating your daily target…</span>
      </div>
    );
  }

  /* ── Error / empty ───────────────────────────────────────── */
  if (isError || !target) {
    return (
      <div
        className={`bg-[#111318] border border-[#2A2E38] rounded-2xl p-5 flex items-center gap-3 ${className}`}
      >
        <Target className="w-4 h-4 text-[#8B90A0]" />
        <span className="text-xs text-[#8B90A0]">Could not load today's target. Check back shortly.</span>
      </div>
    );
  }

  const meta = TYPE_META[target.targetType] || TYPE_META.practice_set;
  const TypeIcon = meta.icon;
  const isCompleted = target.completed;

  /* ── Compact row (Dashboard hero band) ──────────────────── */
  if (variant === 'compact') {
    return (
      <div
        className={`bg-[#111318] border border-[#2A2E38] rounded-2xl p-4 flex items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCompleted
                ? 'bg-[#4CC38A]/15 border border-[#4CC38A]/30'
                : 'bg-[#1A1D24] border border-[#2A2E38]'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-[#4CC38A]" />
            ) : (
              <TypeIcon className={`w-4 h-4 ${meta.color}`} />
            )}
          </span>
          <div className="min-w-0">
            <span className="small-caps-label text-[#8B90A0] flex items-center gap-1 mb-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              Today's Target
              {isCompleted && (
                <span className="text-[#4CC38A] ml-1">· Done ✓</span>
              )}
            </span>
            <p className="text-xs font-medium text-[#F4F5F7] truncate max-w-xs sm:max-w-md">
              {target.targetGoal}
            </p>
          </div>
        </div>

        {!isCompleted && (
          <Link
            to={target.targetUrl}
            className="bridge-btn-primary text-xs py-2 px-4 flex-shrink-0"
          >
            <span>{target.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        )}
      </div>
    );
  }

  /* ── Full card (SkillProfile page) ──────────────────────── */
  return (
    <div
      className={`bg-[#111318] border ${
        isCompleted ? 'border-[#4CC38A]/40' : 'border-[#2A2E38]'
      } rounded-2xl p-5 sm:p-6 space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="small-caps-label flex items-center gap-1.5 text-[#8B90A0]">
          <Sparkles className="w-3 h-3 text-[#5B7FE0]" />
          Sash · Today's Target
        </span>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-medium border ${
            isCompleted
              ? 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30'
              : `bg-[#1A1D24] ${meta.color} border-[#2A2E38]`
          }`}
        >
          {isCompleted ? '✓ Completed' : meta.label}
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h3
          className={`text-base sm:text-lg font-semibold tracking-tight ${
            isCompleted ? 'text-[#4CC38A]' : 'text-[#F4F5F7]'
          }`}
        >
          {target.title}
        </h3>
        <p className="text-sm text-[#8B90A0] leading-relaxed">{target.targetGoal}</p>
      </div>

      {/* Rationale chip */}
      <div className="bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3.5 py-2.5 text-xs text-[#8B90A0] leading-relaxed">
        <span className="text-[#5B7FE0] font-medium">Why today? </span>
        {target.rationale}
      </div>

      {/* Phase tag */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10.5px] font-mono text-[#8B90A0] bg-[#1A1D24] border border-[#2A2E38] px-2.5 py-1 rounded-md">
          {target.roadmapPhase}
        </span>
        <span className="text-[10.5px] font-mono text-[#2F8C82] bg-[#2F8C82]/10 border border-[#2F8C82]/20 px-2.5 py-1 rounded-md">
          Focus: {target.focusTopic}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        {!isCompleted && (
          <>
            <Link
              to={target.targetUrl}
              className="bridge-btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
            >
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{target.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>

            <button
              type="button"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
              className="bridge-btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5 disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4CC38A]" />
              )}
              <span>Mark Done</span>
            </button>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-[#4CC38A] font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Target achieved for today — great work!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayTargetCard;
