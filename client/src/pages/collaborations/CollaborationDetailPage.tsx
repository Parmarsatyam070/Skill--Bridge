import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollaboration } from '../../hooks/useCollaborations';
import { CollaborationOverview } from '../../components/collaborations/CollaborationOverview';
import { CollaborationMessageThread } from '../../components/collaborations/CollaborationMessageThread';
import { CollaborationMessageInput } from '../../components/collaborations/CollaborationMessageInput';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

export const CollaborationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: collaboration, isLoading, error, refetch } = useCollaboration(id);

  const isIndustry = user?.role === 'INDUSTRY';
  const isInstitution = user?.role === 'INSTITUTION_ADMIN';
  const isAuthorized = isIndustry || isInstitution;

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#F4F5F7] mb-2">Access Denied</h2>
        <p className="text-sm text-[#8B90A0] max-w-md leading-relaxed mb-6">
          You do not have permission to view this collaboration. Only participants from the involved industry partner and academic institution have access.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-blue-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm text-slate-400">Loading collaboration...</span>
      </div>
    );
  }

  if (error || !collaboration) {
    const is404 = (error as any)?.code === 'NOT_FOUND' || (error as any)?.status === 404;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          {is404 ? 'Collaboration Not Found' : 'Error Loading Collaboration'}
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {is404
            ? 'The requested collaboration does not exist or may have been deleted.'
            : (error as any)?.message || 'An unexpected error occurred while fetching the collaboration.'}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/collaborations')}
            className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-xs font-semibold text-white transition-colors"
          >
            Back to Collaborations
          </button>
          {!is404 && (
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-xs font-semibold text-white transition-colors shadow-md shadow-blue-500/20"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const isClosed = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(
    (collaboration.status || '').toUpperCase()
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/collaborations')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-[#0f172a]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collaborations</span>
        </button>
      </div>

      {/* Main Overview */}
      <CollaborationOverview
        collaboration={collaboration}
        currentUserRole={user?.role}
      />

      {/* Negotiation & Messaging Thread Card */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Negotiation & Coordination Thread
              </h3>
              <p className="text-xs text-slate-400">
                Official discussion channel between involved company and academic faculty
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {collaboration.messages?.length || 0} messages
          </span>
        </div>

        {/* Message Thread */}
        <CollaborationMessageThread
          messages={collaboration.messages || []}
          currentUserId={user?.id}
        />

        {/* Message Input Box */}
        <div className="pt-3 border-t border-[#1e293b]">
          <CollaborationMessageInput
            collaborationId={collaboration.id}
            disabled={isClosed}
          />
        </div>
      </div>
    </div>
  );
};
