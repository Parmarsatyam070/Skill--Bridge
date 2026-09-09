import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollaborations, useCollaboration } from '../../hooks/useCollaborations';
import type { CollaborationSummaryDto, CollaborationDetailDto } from '@shared/types';
import { CollaborationCard } from '../../components/collaborations/CollaborationCard';
import {
  CollaborationFilters,
  StatusFilterOption,
} from '../../components/collaborations/CollaborationFilters';
import { CollaborationOverview } from '../../components/collaborations/CollaborationOverview';
import { CollaborationMessageThread } from '../../components/collaborations/CollaborationMessageThread';
import { CollaborationMessageInput } from '../../components/collaborations/CollaborationMessageInput';
import { CreateCollaborationModal } from '../../components/collaborations/CreateCollaborationModal';
import {
  Handshake,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';

export const CollaborationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterOption>('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Queries
  const { data: collaborations, isLoading, error, refetch } = useCollaborations(
    selectedStatus === 'ALL' ? undefined : selectedStatus
  );

  const {
    data: activeCollabDetail,
    isLoading: isLoadingDetail,
  } = useCollaboration(selectedId || undefined);

  const isIndustry = user?.role === 'INDUSTRY';
  const isInstitution = user?.role === 'INSTITUTION_ADMIN';
  const isAuthorized = isIndustry || isInstitution;

  // Filter collaborations by search text and type
  const filteredCollaborations = useMemo(() => {
    if (!collaborations) return [];
    return collaborations.filter((c) => {
      // Type filter
      if (selectedType !== 'ALL' && c.type !== selectedType) return false;

      // Search filter
      if (search.trim().length > 0) {
        const query = search.toLowerCase();
        const titleMatch = c.title.toLowerCase().includes(query);
        const descMatch = c.description.toLowerCase().includes(query);
        const compMatch = c.company?.companyName?.toLowerCase().includes(query);
        const instMatch = c.institution?.institutionName?.toLowerCase().includes(query);
        return titleMatch || descMatch || compMatch || instMatch;
      }

      return true;
    });
  }, [collaborations, selectedType, search]);

  // Compute status counts for filter tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (collaborations) {
      collaborations.forEach((c) => {
        const norm = (c.status || '').toUpperCase();
        counts[norm] = (counts[norm] || 0) + 1;
      });
    }
    return counts;
  }, [collaborations]);

  // Handle card selection
  const handleSelectCollab = (collab: CollaborationSummaryDto) => {
    setSelectedId(collab.id);
    setSearchParams({ id: collab.id });

    // On mobile screens (< 1024px), navigate directly to detail page
    if (window.innerWidth < 1024) {
      navigate(`/collaborations/${collab.id}`);
    }
  };

  // Auto-select first item on desktop if none selected
  React.useEffect(() => {
    if (!selectedId && filteredCollaborations.length > 0 && window.innerWidth >= 1024) {
      setSelectedId(filteredCollaborations[0].id);
      setSearchParams({ id: filteredCollaborations[0].id });
    }
  }, [filteredCollaborations, selectedId, setSearchParams]);

  // Unauthorized access guard
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#F4F5F7] mb-2">
          Collaboration Management Restricted
        </h2>
        <p className="text-sm text-[#8B90A0] max-w-md leading-relaxed mb-6">
          The Collaboration Hub is exclusively available to verified Industry Partners and Institutional Administrators to coordinate workshops, campus hackathons, research partnerships, and curriculum alignment.
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F7] tracking-tight">
              Collaboration Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-600/15 text-blue-400 border border-blue-500/30">
              {isIndustry ? 'Industry Hub' : 'Institution Hub'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Propose, negotiate, and execute impactful academia-industry initiatives
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal</span>
        </button>
      </div>

      {/* Filter and search controls */}
      <CollaborationFilters
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        statusCounts={statusCounts}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Failed to load collaborations: {(error as any)?.message}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-blue-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm text-slate-400">Loading collaborations...</span>
        </div>
      ) : filteredCollaborations.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 text-center bg-[#0b1329] border border-dashed border-[#1e293b] rounded-2xl max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center text-blue-400 mx-auto mb-4 border border-[#1e293b]">
            <Handshake className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            No collaborations found
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            {search || selectedStatus !== 'ALL' || selectedType !== 'ALL'
              ? 'No collaborations match your selected filters. Try clearing your search parameters.'
              : 'You have no active or historical collaboration requests yet. Launch your first academia-industry proposal today.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Proposal</span>
          </button>
        </div>
      ) : (
        /* Two-Column Responsive Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Collaborations List */}
          <div className="lg:col-span-5 space-y-3.5 max-h-[800px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredCollaborations.map((collab) => (
              <CollaborationCard
                key={collab.id}
                collaboration={collab}
                isSelected={selectedId === collab.id}
                onSelect={handleSelectCollab}
              />
            ))}
          </div>

          {/* Right Column: Selected Collaboration Details (Desktop) */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">
            {isLoadingDetail ? (
              <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <span className="text-xs text-slate-400">Loading details...</span>
              </div>
            ) : activeCollabDetail ? (
              <div className="space-y-6">
                {/* Full page view link */}
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/collaborations/${activeCollabDetail.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline font-medium"
                  >
                    <span>Open Standalone Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Overview metadata & status actions */}
                <CollaborationOverview
                  collaboration={activeCollabDetail}
                  currentUserRole={user?.role}
                />

                {/* Negotiation Message Thread & Composer */}
                <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Negotiation & Coordination Thread</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeCollabDetail.messages?.length || 0} messages
                    </span>
                  </div>

                  <CollaborationMessageThread
                    messages={activeCollabDetail.messages || []}
                    currentUserId={user?.id}
                  />

                  <div className="pt-3 border-t border-[#1e293b]">
                    <CollaborationMessageInput
                      collaborationId={activeCollabDetail.id}
                      disabled={['COMPLETED', 'REJECTED', 'CANCELLED'].includes(
                        (activeCollabDetail.status || '').toUpperCase()
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400 text-sm">
                Select a collaboration to inspect its details and messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proposal Creation Modal */}
      <CreateCollaborationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserRole={user?.role}
        onCreated={(newCollab) => {
          setSelectedId(newCollab.id);
          setSearchParams({ id: newCollab.id });
        }}
      />
    </div>
  );
};
