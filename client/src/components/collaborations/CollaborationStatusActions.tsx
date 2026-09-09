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
      <div className="p-3 bg-[#0b1329] border border-[#1e293b] rounded-xl text-xs text-slate-400 flex items-center justify-between">
        <span>This collaboration is in a terminal state ({normStatus.toLowerCase()}).</span>
        <span className="text-[11px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">
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
              className="px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
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
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
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
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Mark as Active
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
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
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              Mark as Completed
            </button>

            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}

        {/* Loading Spinner during mutation */}
        {statusMutation.isPending && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>Updating status...</span>
          </div>
        )}
      </div>

      {/* Date picker modal for transitioning to ACTIVE */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Schedule Collaboration Period</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define the scheduled start and expected completion dates for this initiative before setting it to Active.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleStatusUpdate('ACTIVE', {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                  })
                }
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Confirm Active</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
