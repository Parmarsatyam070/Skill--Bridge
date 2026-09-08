import React from 'react';
import type { CollaborationStatus } from '@shared/types';
import {
  Clock,
  MessageSquare,
  CheckCircle2,
  Play,
  Award,
  XCircle,
  Ban,
  HelpCircle,
} from 'lucide-react';

interface Props {
  status: CollaborationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CollaborationStatusBadge: React.FC<Props> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const normStatus = (status || '').toUpperCase();

  // Color mapping matching SkillBridge design tokens
  switch (normStatus) {
    case 'REQUESTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-amber-500/10 border-amber-500/30 text-amber-300 ${className}`}
        >
          <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Requested
        </span>
      );

    case 'DISCUSSION':
    case 'UNDER_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-sky-500/10 border-sky-500/30 text-sky-300 ${className}`}
        >
          <MessageSquare className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Discussion
        </span>
      );

    case 'APPROVED':
    case 'ACCEPTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-emerald-500/10 border-emerald-500/30 text-emerald-300 ${className}`}
        >
          <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Approved
        </span>
      );

    case 'ACTIVE':
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-[#2F8C82]/20 border-[#2F8C82]/40 text-[#4CC38A] ${className}`}
        >
          <Play className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Active
        </span>
      );

    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-indigo-500/10 border-indigo-500/30 text-indigo-300 ${className}`}
        >
          <Award className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Completed
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-rose-500/10 border-rose-500/30 text-rose-400 ${className}`}
        >
          <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Declined
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-zinc-700/20 border-zinc-700/40 text-zinc-400 ${className}`}
        >
          <Ban className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cancelled
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
            size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : size === 'lg'
              ? 'px-3 py-1.5 text-sm'
              : 'px-2.5 py-1 text-xs'
          } bg-zinc-800 border-zinc-700 text-zinc-300 ${className}`}
        >
          <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          {status}
        </span>
      );
  }
};
