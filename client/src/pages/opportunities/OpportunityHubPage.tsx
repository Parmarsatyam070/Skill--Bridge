import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Briefcase,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  RotateCcw,
  Loader2,
  Layers,
  Flame,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { OpportunitySummary, OpportunityMatchItem, OpportunityType } from '@shared/types';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { OpportunityApplyModal } from '../../components/opportunities/OpportunityApplyModal';

const OPPORTUNITY_TYPES = [
  { value: 'ALL', label: 'All Openings' },
  { value: 'DEMO', label: 'Demo Dataset Requisitions (6)' },
  { value: 'JOB', label: 'Full-Time Jobs' },
  { value: 'INTERNSHIP', label: 'Internships' },
  { value: 'PROJECT', label: 'Live Projects' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeships' },
  { value: 'HACKATHON', label: 'Hackathons' },
  { value: 'TRAINING', label: 'Industry Training' },
  { value: 'RESEARCH', label: 'Research & Labs' },
  { value: 'MENTORSHIP', label: 'Mentorships' },
];

const WORK_MODES = [
  { value: 'ALL', label: 'All Modes' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ON_SITE', label: 'On-Site' },
];

const EXPERIENCE_LEVELS = [
  { value: 'ALL', label: 'All Levels' },
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead / Principal' },
];

export const OpportunityHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStudent = user?.role === 'STUDENT';
  const studentProfileId = user?.studentProfile?.id;

  // URL state & local filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>(searchParams.get('workMode') || 'ALL');
  const [selectedExpLevel, setSelectedExpLevel] = useState<string>(searchParams.get('exp') || 'ALL');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'HIGH' | 'ELIGIBLE' | 'SAVED'>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Active Apply Modal
  const [activeApplyOpp, setActiveApplyOpp] = useState<OpportunitySummary | null>(null);

  // 1. Fetch Opportunities from backend API
  const { data: oppsData, isLoading: oppsLoading, error: oppsError, refetch } = useQuery({
    queryKey: [
      'opportunities',
      searchQuery,
      selectedType,
      selectedWorkMode,
      selectedExpLevel,
      sortBy,
      sortOrder,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedWorkMode !== 'ALL') params.append('workMode', selectedWorkMode);
      if (selectedExpLevel !== 'ALL') params.append('experienceLevel', selectedExpLevel);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      return api.get<{
        opportunities: OpportunitySummary[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/opportunities?${params.toString()}`);
    },
    staleTime: 30000,
  });

  // 2. Fetch Authoritative 7-Factor Matches (for student)
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['opportunityMatches'],
    queryFn: () => api.get<{ matches: OpportunityMatchItem[]; total: number }>('/opportunities/my/matches'),
    enabled: isStudent && !!studentProfileId,
    staleTime: 60000,
  });

  const matchesMap = useMemo(() => {
    const map = new Map<string, OpportunityMatchItem>();
    (matchesData?.matches || []).forEach((m) => {
      map.set(m.opportunityId, m);
    });
    return map;
  }, [matchesData]);

  // 3. Fetch Student Saved Bookmarks
  const { data: savedData } = useQuery({
    queryKey: ['savedOpportunities'],
    queryFn: () => api.get<{ savedOpportunities: any[] }>('/opportunities/saved/list'),
    enabled: isStudent && !!studentProfileId,
  });

  const savedSet = useMemo(() => {
    return new Set(
      (savedData?.savedOpportunities || []).map((s: any) => s.opportunity?.id || s.opportunityId)
    );
  }, [savedData]);

  // 4. Fetch Student Existing Applications
  const { data: appsData } = useQuery({
    queryKey: ['studentApplications', studentProfileId],
    queryFn: () => api.get<{ applications: any[] }>(`/applications/student/${studentProfileId}`),
    enabled: isStudent && !!studentProfileId,
  });

  const appliedSet = useMemo(() => {
    return new Set((appsData?.applications || []).map((a: any) => a.opportunityId));
  }, [appsData]);

  // Save/Unsave mutation
  const saveMutation = useMutation({
    mutationFn: async (oppId: string) => {
      const isCurrentlySaved = savedSet.has(oppId);
      if (isCurrentlySaved) {
        return api.delete(`/opportunities/${oppId}/save`);
      } else {
        return api.post(`/opportunities/${oppId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedOpportunities'] });
    },
  });

  const handleSaveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isStudent) {
      navigate('/login');
      return;
    }
    saveMutation.mutate(id);
  };

  const handleApplyClick = (opp: OpportunitySummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isStudent) {
      navigate('/login');
      return;
    }
    setActiveApplyOpp(opp);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/opportunities/${id}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedWorkMode('ALL');
    setSelectedExpLevel('ALL');
    setMatchFilter('ALL');
    setCurrentPage(1);
  };

  // 1b. Fetch Demo Opportunities from Industry Demo dataset
  const { data: demoOppsData } = useQuery({
    queryKey: ['industryDemoOpportunitiesForHub'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/industry/demo/opportunities'),
    staleTime: 60000,
  });

  const mappedDemoOpps: OpportunitySummary[] = useMemo(() => {
    return (demoOppsData?.data || []).map((opp: any) => ({
      id: opp.id,
      title: `[DEMO] ${opp.title}`,
      description: opp.description,
      type: 'DEMO' as any,
      industry: opp.department || 'Technology',
      location: opp.location,
      remote: opp.location.toLowerCase().includes('remote'),
      workMode: 'REMOTE',
      experienceLevel: 'ENTRY',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      company: {
        id: 'demo-enterprise',
        name: 'SkillBridge Demo Enterprise',
        industry: opp.department,
      },
      requiredSkills: (opp.requiredSkills || []).map((s: string) => ({
        skillId: s,
        skillName: s,
        isMandatory: true,
        minScore: opp.minScoreThreshold || 70,
      })),
      applicantCount: opp.applicantCount,
    }));
  }, [demoOppsData]);

  // Filter items in memory if student uses client-side match pills (HIGH, ELIGIBLE, SAVED)
  const rawOpportunities = useMemo(() => {
    const live = oppsData?.opportunities || [];
    if (selectedType === 'DEMO') {
      return mappedDemoOpps;
    }
    if (selectedType === 'ALL') {
      return [...live, ...mappedDemoOpps];
    }
    return live;
  }, [oppsData, mappedDemoOpps, selectedType]);

  const filteredOpportunities = useMemo(() => {
    if (matchFilter === 'ALL') return rawOpportunities;

    return rawOpportunities.filter((opp) => {
      const match = matchesMap.get(opp.id);
      if (matchFilter === 'HIGH') {
        return match && match.score >= 80;
      }
      if (matchFilter === 'ELIGIBLE') {
        return match && match.eligibility === true;
      }
      if (matchFilter === 'SAVED') {
        return savedSet.has(opp.id);
      }
      return true;
    });
  }, [rawOpportunities, matchFilter, matchesMap, savedSet]);

  const pagination = oppsData?.pagination || {
    page: 1,
    limit: pageSize,
    total: filteredOpportunities.length,
    totalPages: 1,
  };

  // Live Metric stats
  const totalOpenings = pagination.total || 0;
  const highMatchCount = useMemo(() => {
    return Array.from(matchesMap.values()).filter((m) => m.score >= 80).length;
  }, [matchesMap]);
  const eligibleCount = useMemo(() => {
    return Array.from(matchesMap.values()).filter((m) => m.eligibility).length;
  }, [matchesMap]);

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 lg:p-10 font-sans space-y-8 animate-fade-in">
      {/* Hero Header & Statistics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Unified Talent & Opportunity Hub</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Industry Opportunities & Gigs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover verified corporate jobs, internships, apprenticeships, and live projects matched against your authentic portfolio using our deterministic 7-factor engine.
          </p>
        </div>

        {/* Live Metrics Counter */}
        {isStudent && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[#0b1329] border border-[#1e293b] text-center min-w-[100px]">
              <span className="text-lg font-mono font-black text-white">{totalOpenings}</span>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Active Roles</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b1329] border border-[#1e293b] text-center min-w-[100px]">
              <span className="text-lg font-mono font-black text-[#4CC38A]">{highMatchCount}</span>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">High Matches</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b1329] border border-[#1e293b] text-center min-w-[100px]">
              <span className="text-lg font-mono font-black text-blue-400">{eligibleCount}</span>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Eligible</p>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Control Bar */}
      <div className="space-y-4">
        {/* Main Search Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by job title, company, required skill (e.g. React, Docker), or location..."
              className="w-full pl-11 pr-10 py-3 bg-[#0b1329] border border-[#1e293b] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Sort Select */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 bg-[#0b1329] border border-[#1e293b] rounded-2xl text-xs text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="createdAt:desc">Newest Openings</option>
                <option value="applicationDeadline:asc">Closing Soonest</option>
                <option value="title:asc">Title (A - Z)</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(searchQuery || selectedType !== 'ALL' || selectedWorkMode !== 'ALL' || selectedExpLevel !== 'ALL' || matchFilter !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="p-3 bg-[#0b1329] border border-[#1e293b] hover:border-slate-700 text-slate-400 hover:text-white rounded-2xl transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Opportunity Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {OPPORTUNITY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setSelectedType(t.value);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedType === t.value
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-[#0b1329] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Secondary Dropdowns & Student Match Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Work Mode */}
            <select
              value={selectedWorkMode}
              onChange={(e) => {
                setSelectedWorkMode(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-[#0b1329] border border-[#1e293b] rounded-xl text-xs text-slate-300 hover:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {WORK_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Experience Level */}
            <select
              value={selectedExpLevel}
              onChange={(e) => {
                setSelectedExpLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-[#0b1329] border border-[#1e293b] rounded-xl text-xs text-slate-300 hover:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {EXPERIENCE_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>

            {/* Student Match Filter Tabs */}
            {isStudent && (
              <div className="flex items-center p-0.5 rounded-xl bg-[#0b1329] border border-[#1e293b]">
                <button
                  onClick={() => setMatchFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    matchFilter === 'ALL'
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMatchFilter('HIGH')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    matchFilter === 'HIGH'
                      ? 'bg-[#4CC38A]/15 text-[#4CC38A] shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>≥80% Match</span>
                </button>
                <button
                  onClick={() => setMatchFilter('ELIGIBLE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    matchFilter === 'ELIGIBLE'
                      ? 'bg-blue-600/15 text-blue-400 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Eligible</span>
                </button>
                <button
                  onClick={() => setMatchFilter('SAVED')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    matchFilter === 'SAVED'
                      ? 'bg-[#E8A23C]/15 text-[#E8A23C] shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Saved</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {oppsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0f172a]" />
                <div className="space-y-2 flex-1">
                  <div className="w-24 h-3 bg-[#0f172a] rounded" />
                  <div className="w-40 h-4 bg-[#0f172a] rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-[#0f172a] rounded-lg" />
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-[#0f172a] rounded-md" />
                <div className="w-16 h-5 bg-[#0f172a] rounded-md" />
              </div>
              <div className="pt-3 border-t border-[#1e293b] flex justify-between items-center">
                <div className="w-20 h-6 bg-[#0f172a] rounded" />
                <div className="w-20 h-7 bg-[#0f172a] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : oppsError ? (
        <div className="p-12 rounded-3xl bg-[#0b1329] border border-[#1e293b] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#E5637C]/15 text-[#E5637C] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Failed to Load Opportunities</h3>
          <p className="text-xs text-slate-400">
            An unexpected error occurred while contacting the opportunity service. Please verify your connection.
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#0b1329] border border-[#1e293b] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#0f172a] text-slate-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Opportunities Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No active listings matched your specific filter criteria. Try expanding your search query or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 text-xs font-semibold text-white transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                matchItem={matchesMap.get(opp.id)}
                isSaved={savedSet.has(opp.id)}
                isApplied={appliedSet.has(opp.id)}
                onSaveToggle={handleSaveToggle}
                onApply={handleApplyClick}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} opportunities
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3.5 py-2 rounded-xl bg-[#0b1329] border border-[#1e293b] hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs font-mono font-bold text-white">
                  {pagination.page} / {pagination.totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3.5 py-2 rounded-xl bg-[#0b1329] border border-[#1e293b] hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
      <OpportunityApplyModal
        isOpen={!!activeApplyOpp}
        onClose={() => setActiveApplyOpp(null)}
        opportunity={activeApplyOpp}
        matchItem={activeApplyOpp ? matchesMap.get(activeApplyOpp.id) : undefined}
      />
    </div>
  );
};

export default OpportunityHubPage;
