import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  useCollaborations,
  useCollaboration,
  useCollaborationMetrics,
  useCollaborationPartners,
} from '../../hooks/useCollaborations';
import type { CollaborationSummaryDto } from '@shared/types';
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
  Building2,
  Calendar,
  CheckCircle2,
  Search,
  Globe,
  Tag,
} from 'lucide-react';

export const CollaborationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'collaborations' | 'partners'>('collaborations');
  const [search, setSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterOption>('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [preselectedPartnerId, setPreselectedPartnerId] = useState<string | undefined>(undefined);

  const isIndustry = user?.role === 'INDUSTRY';
  const isInstitution = user?.role === 'INSTITUTION_ADMIN';
  const isAuthorized = isIndustry || isInstitution;

  // Backend queries
  const {
    data: collaborations,
    isLoading: isLoadingCollabs,
    error: collabsError,
    refetch: refetchCollabs,
  } = useCollaborations(selectedStatus === 'ALL' ? undefined : selectedStatus);

  const {
    data: activeCollabDetail,
    isLoading: isLoadingDetail,
  } = useCollaboration(selectedId || undefined);

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
  } = useCollaborationMetrics();

  const {
    data: partnersData,
    isLoading: isLoadingPartners,
  } = useCollaborationPartners();

  // Filter collaborations by search text and type
  const filteredCollaborations = useMemo(() => {
    if (!collaborations) return [];
    return collaborations.filter((c) => {
      if (selectedType !== 'ALL' && c.type !== selectedType) return false;

      if (search.trim().length > 0) {
        const query = search.toLowerCase();
        const titleMatch = c.title.toLowerCase().includes(query);
        const descMatch = c.description.toLowerCase().includes(query);
        const compMatch = c.company?.companyName?.toLowerCase().includes(query);
        const instMatch = c.institution?.institutionName?.toLowerCase().includes(query);
        const deptMatch = c.targetDepartment?.toLowerCase().includes(query);
        return titleMatch || descMatch || compMatch || instMatch || deptMatch;
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

  // Filter industry partners for discovery view
  const filteredPartners = useMemo(() => {
    const companies = partnersData?.companies || [];
    if (!partnerSearch.trim()) return companies;
    const query = partnerSearch.toLowerCase().trim();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(query) ||
        (c.industrySector && c.industrySector.toLowerCase().includes(query))
    );
  }, [partnersData, partnerSearch]);

  // Handle card selection
  const handleSelectCollab = (collab: CollaborationSummaryDto) => {
    setSelectedId(collab.id);
    setSearchParams({ id: collab.id });

    if (window.innerWidth < 1024) {
      navigate(`/collaborations/${collab.id}`);
    }
  };

  // Open creation modal with an optional partner pre-selected
  const handleOpenCreateModal = (partnerId?: string) => {
    setPreselectedPartnerId(partnerId);
    setIsCreateModalOpen(true);
  };

  // Auto-select first item on desktop if none selected
  React.useEffect(() => {
    if (!selectedId && filteredCollaborations.length > 0 && window.innerWidth >= 1024 && activeTab === 'collaborations') {
      setSelectedId(filteredCollaborations[0].id);
      setSearchParams({ id: filteredCollaborations[0].id });
    }
  }, [filteredCollaborations, selectedId, setSearchParams, activeTab]);

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
      {/* 6A. Top Header: Recruiter Collaboration Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F5F7] tracking-tight">
              Collaborations
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage, track, and execute impactful industry-academia collaborations and joint talent initiatives.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal</span>
        </button>
      </div>

      {/* 6B. Summary Scorecards (Backend authoritative metrics) */}
      {isInstitution && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Collaborations</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            {isLoadingMetrics ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold text-white tracking-tight">
                {metrics?.totalCollaborations ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">Platform partnerships</p>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            {isLoadingMetrics ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {metrics?.activeCollaborations ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">In progress & live</p>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Upcoming</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            {isLoadingMetrics ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold text-amber-400 tracking-tight">
                {metrics?.upcomingCollaborations ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">Scheduled with confirmed dates</p>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            {isLoadingMetrics ? (
              <div className="h-8 w-16 bg-slate-800 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold text-purple-400 tracking-tight">
                {metrics?.completedCollaborations ?? 0}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">Successfully concluded</p>
          </div>
        </div>
      )}

      {/* Tabs: Active Collaborations vs Partner Discovery */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
        <button
          onClick={() => setActiveTab('collaborations')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'collaborations'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>Collaborations</span>
          {collaborations && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#1e293b] text-slate-300">
              {collaborations.length}
            </span>
          )}
        </button>

        {isInstitution && (
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'partners'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Discover Industry Partners</span>
            {partnersData?.companies && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#1e293b] text-slate-300">
                {partnersData.companies.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* View 1: Collaborations List & Workspace */}
      {activeTab === 'collaborations' && (
        <div className="space-y-6">
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
          {collabsError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Failed to load collaborations: {(collabsError as any)?.message}</span>
              </div>
              <button
                onClick={() => refetchCollabs()}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoadingCollabs ? (
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
                onClick={() => handleOpenCreateModal()}
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
        </div>
      )}

      {/* View 2: Step 7 Partner Discovery View */}
      {activeTab === 'partners' && isInstitution && (
        <div className="space-y-6">
          {/* Partner Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search industry partners by name or sector..."
              value={partnerSearch}
              onChange={(e) => setPartnerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b1329] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Partners Loading */}
          {isLoadingPartners ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-blue-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm text-slate-400">Loading registered partners...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            /* Partner Empty State */
            <div className="py-20 px-4 text-center bg-[#0b1329] border border-dashed border-[#1e293b] rounded-2xl max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center text-blue-400 mx-auto mb-4 border border-[#1e293b]">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No industry partners found
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                {partnerSearch
                  ? `No registered organizations match "${partnerSearch}". Try clearing your search.`
                  : 'There are currently no verified industry partners registered on the platform.'}
              </p>
            </div>
          ) : (
            /* Partners Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-[#0b1329] border border-[#1e293b] hover:border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {partner.website && (
                        <a
                          href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-[#0f172a] transition-colors"
                          title="Visit Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight truncate">
                        {partner.companyName}
                      </h3>
                      {partner.industrySector && (
                        <p className="text-xs text-blue-400 font-medium mt-0.5">
                          {partner.industrySector}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      Verified corporate partner active on SkillBridge talent recruitment and technical evaluation.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#1e293b]">
                    <button
                      onClick={() => handleOpenCreateModal(partner.id)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600 hover:to-blue-500 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Propose Collaboration</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proposal Creation Modal */}
      <CreateCollaborationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserRole={user?.role}
        initialPartnerId={preselectedPartnerId}
        onCreated={(newCollab) => {
          setSelectedId(newCollab.id);
          setActiveTab('collaborations');
          setSearchParams({ id: newCollab.id });
        }}
      />
    </div>
  );
};
