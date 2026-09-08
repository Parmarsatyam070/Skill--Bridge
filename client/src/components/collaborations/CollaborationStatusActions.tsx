import React, { useState } from 'react';
import type { CollaborationDetailDto, CollaborationStatus } from '@shared/types';
import { useUpdateCollaborationStatus } from '../../hooks/useCollaborations';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Play,
  Award,
  Ban,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface Props {
  collaboration: CollaborationDetailDto;
  currentUserRole?: string;
}

export const CollaborationStatusActions: React.FC<Props> = ({
  collaboration,
  currentUserRole,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const statusMutation = useUpdateCollaborationStatus(collaboration.id);

  const normStatus = (collaboration.status || '').toUpperCase();

  const handleStatusUpdate = async (
    newStatus: CollaborationStatus,
    dates?: { startDate?: string; endDate?: string }
  ) => {
    setErrorMsg(null);
    try {
      await statusMutation.mutateAsync({
        status: newStatus,
        startDate: dates?.startDate ? new Date(dates.startDate).toISOString() : undefined,
        endDate: dates?.endDate ? new Date(dates.endDate).toISOString() : undefined,
      });
      setShowDateModal(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update collaboration status.');
    }
  };

  // Terminal states - no further updates
  if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(normStatus)) {
    return (
      <div className="p-3 bg-[#111318] border border-[#2A2E38] rounded-xl text-xs text-[#8B90A0] flex items-center justify-between">
        <span>This collaboration is in a terminal state ({normStatus.toLowerCase()}).</span>
        <span className="text-[11px] font-mono uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
          Locked
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* REQUESTED state actions */}
        {normStatus === 'REQUESTED' && (
          <>
            <button
              onClick={() => handleStatusUpdate('DISCUSSION')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open Discussion
            </button>

            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>

            <button
              onClick={() => handleStatusUpdate('REJECTED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Decline
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}

        {/* DISCUSSION state actions */}
        {['DISCUSSION', 'UNDER_REVIEW'].includes(normStatus) && (
          <>
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Proposal
            </button>

            <button
              onClick={() => handleStatusUpdate('REJECTED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Decline
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}

        {/* APPROVED state actions */}
        {['APPROVED', 'ACCEPTED'].includes(normStatus) && (
          <>
            <button
              onClick={() => setShowDateModal(true)}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-[#2F8C82]/20 border border-[#2F8C82]/40 text-[#4CC38A] text-xs font-medium hover:bg-[#2F8C82]/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Mark as Active
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}

        {/* ACTIVE state actions */}
        {['ACTIVE', 'IN_PROGRESS'].includes(normStatus) && (
          <>
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={statusMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              Mark Completed
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}

        {statusMutation.isPending && (
          <div className="flex items-center gap-1.5 text-xs text-[#8B90A0] ml-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F8C82]" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Optional Date Modal when transitioning to ACTIVE */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F5F7]">
              <Calendar className="w-4 h-4 text-[#2F8C82]" />
              <span>Launch Collaboration (Active)</span>
            </div>
            <p className="text-xs text-[#8B90A0] leading-relaxed">
              Transitioning to <span className="text-[#4CC38A] font-semibold">Active</span> indicates the initiative is live. You may optionally specify expected start and end dates.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-lg px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-lg px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A2E38]">
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('ACTIVE', { startDate, endDate })}
                disabled={statusMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#2F8C82] hover:bg-[#3aa398] text-white flex items-center gap-1.5"
              >
                {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
