import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Users,
  Star,
  Tag,
  FileText,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Github,
  Linkedin,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Zap,
  Award,
  BookOpen,
  X,
  Send,
  TrendingUp,
  Eye,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CandidateCard {
  studentProfileId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  institution: string;
  targetDomain: string;
  cgpa?: number | null;
  gradYear?: number | null;
  headline?: string | null;
  githubUsername?: string | null;
  linkedinUrl?: string | null;
  skillSummary: { skillId: string; skillName: string; score: number; verificationLevel: string }[];
  topSkillScore: number;
  applicationStatus?: string | null;
  matchScore?: number | null;
  tags: string[];
  hasNotes: boolean;
}

interface FilterState {
  search: string;
  minCgpa: string;
  targetDomain: string;
  gradYear: string;
  minSkillScore: string;
  opportunityId: string;
  minMatchScore: string;
  tags: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  minCgpa: '',
  targetDomain: '',
  gradYear: '',
  minSkillScore: '',
  opportunityId: '',
  minMatchScore: '',
  tags: '',
};

// ---------------------------------------------------------------------------
// Score badge helper
// ---------------------------------------------------------------------------
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    : score >= 60 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    : 'text-slate-400 border-slate-600/40 bg-slate-700/20';
  return (
    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

function VerifBadge({ level }: { level: string }) {
  const shortMap: Record<string, { label: string; color: string }> = {
    'ASSESSMENT-VERIFIED': { label: 'A', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
    'CERTIFICATION-VERIFIED': { label: 'C', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
    'PROJECT-VERIFIED': { label: 'P', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    'COURSE-VERIFIED': { label: 'V', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    'SELF-REPORTED': { label: 'S', color: 'text-slate-500 border-slate-600/30 bg-slate-700/10' },
  };
  const { label, color } = shortMap[level] || shortMap['SELF-REPORTED'];
  return (
    <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${color}`} title={level}>
      {label}
    </span>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    assessment: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    interview: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    hired: 'bg-green-500/10 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  const cls = map[status] || 'bg-slate-700/20 text-slate-400 border-slate-600/30';
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Candidate Row
// ---------------------------------------------------------------------------
function CandidateRow({
  candidate,
  selected,
  onToggle,
  onViewDetail,
}: {
  candidate: CandidateCard;
  selected: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div
      className={`group relative border rounded-xl p-4 transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-cyan-500/50 bg-cyan-500/5'
          : 'border-[#1e293b] bg-[#0b1329] hover:border-[#334155] hover:bg-[#0d1b3e]/60'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="mt-1 shrink-0 text-slate-500 hover:text-cyan-400 transition-colors"
          aria-label={selected ? 'Deselect candidate' : 'Select candidate'}
        >
          {selected ? <CheckSquare size={16} className="text-cyan-400" /> : <Square size={16} />}
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0"
          onClick={onViewDetail}
        >
          {candidate.avatarUrl
            ? <img src={candidate.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            : candidate.name.charAt(0).toUpperCase()
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0" onClick={onViewDetail}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{candidate.name}</span>
            {candidate.topSkillScore > 0 && <ScoreBadge score={candidate.topSkillScore} />}
            {candidate.applicationStatus && <AppStatusBadge status={candidate.applicationStatus} />}
            {candidate.matchScore != null && (
              <span className="text-[11px] font-mono text-slate-400">
                Match: <ScoreBadge score={Math.round(candidate.matchScore)} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
            <span className="truncate max-w-[200px]">{candidate.email}</span>
            <span className="text-slate-600">·</span>
            <span>{candidate.targetDomain}</span>
            {candidate.cgpa && (
              <>
                <span className="text-slate-600">·</span>
                <span>CGPA {candidate.cgpa.toFixed(2)}</span>
              </>
            )}
            {candidate.gradYear && (
              <>
                <span className="text-slate-600">·</span>
                <span>Batch {candidate.gradYear}</span>
              </>
            )}
          </div>

          {/* Skills */}
          {candidate.skillSummary.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {candidate.skillSummary.slice(0, 6).map((sk) => (
                <span
                  key={sk.skillId}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0f172a] border border-[#1e293b] text-slate-300"
                >
                  <VerifBadge level={sk.verificationLevel} />
                  {sk.skillName} {sk.score}
                </span>
              ))}
              {candidate.skillSummary.length > 6 && (
                <span className="text-[10px] text-slate-500 self-center">
                  +{candidate.skillSummary.length - 6} more
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {candidate.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {candidate.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {candidate.githubUsername && (
            <a
              href={`https://github.com/${candidate.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <Github size={14} />
            </a>
          )}
          {candidate.linkedinUrl && (
            <a
              href={candidate.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <Linkedin size={14} />
            </a>
          )}
          {candidate.hasNotes && (
            <span title="Has notes" className="text-amber-400">
              <FileText size={13} />
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
            className="text-slate-500 hover:text-cyan-400 transition-colors"
            aria-label="View candidate detail"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommend Modal
// ---------------------------------------------------------------------------
function RecommendModal({
  selectedIds,
  onClose,
}: {
  selectedIds: string[];
  onClose: () => void;
}) {
  const [opportunityId, setOpportunityId] = useState('');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const recommendMutation = useMutation({
    mutationFn: () =>
      api.post('/institutions/recommendations', {
        opportunityId: opportunityId.trim(),
        candidateIds: selectedIds,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutionRecommendations'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Recommend Candidates</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Recommending {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} to a recruiter's Opportunity.
          This is a <strong className="text-amber-400">non-operative endorsement</strong> — it will NOT auto-apply on their behalf.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Opportunity ID *</label>
            <input
              id="recommend-opportunity-id"
              value={opportunityId}
              onChange={e => setOpportunityId(e.target.value)}
              placeholder="Paste the Opportunity UUID here..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Endorsement Note (optional)</label>
            <textarea
              id="recommend-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="These students have been assessed and meet the profile requirements..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>
        </div>
        {recommendMutation.isError && (
          <p className="text-red-400 text-xs mt-2">
            {(recommendMutation.error as any)?.message || 'Failed to recommend. Check the Opportunity ID.'}
          </p>
        )}
        {recommendMutation.isSuccess && (
          <p className="text-emerald-400 text-xs mt-2">Recommendation submitted successfully!</p>
        )}
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            id="recommend-submit-btn"
            disabled={!opportunityId.trim() || recommendMutation.isPending}
            onClick={() => recommendMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
          >
            <Send size={14} />
            {recommendMutation.isPending ? 'Submitting...' : 'Submit Recommendation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const InstitutionCandidateExplorerPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const buildQueryParams = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.minCgpa) params.set('minCgpa', f.minCgpa);
    if (f.targetDomain) params.set('targetDomain', f.targetDomain);
    if (f.gradYear) params.set('gradYear', f.gradYear);
    if (f.minSkillScore) params.set('minSkillScore', f.minSkillScore);
    if (f.opportunityId) params.set('opportunityId', f.opportunityId);
    if (f.minMatchScore) params.set('minMatchScore', f.minMatchScore);
    if (f.tags) params.set('tags', f.tags);
    params.set('page', String(p));
    params.set('limit', '20');
    return params.toString();
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['candidateExplorer', activeFilters, page],
    queryFn: () =>
      api.get<{ candidates: CandidateCard[]; total: number; page: number; pages: number }>(
        `/institutions/candidates?${buildQueryParams(activeFilters, page)}`
      ),
  });

  const handleSearch = () => {
    setActiveFilters({ ...filters });
    setPage(1);
    setSelected(new Set());
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setPage(1);
    setSelected(new Set());
  };

  const handleExportCsv = async () => {
    try {
      const query = buildQueryParams(activeFilters, 1);
      const token = localStorage.getItem('skillbridge_token');
      const res = await fetch(`/api/institutions/candidates/export?${query}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_export_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.candidates) return;
    if (selected.size === data.candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.candidates.map(c => c.studentProfileId)));
    }
  };

  const candidates = data?.candidates || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;
  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Header */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400">
              {user?.institutionProfile?.institutionName || 'Your Institution'}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Candidate Explorer</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            Discover, filter, and shortlist students from your institution for placement opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="export-candidates-csv-btn"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[#1e293b] text-slate-400 hover:text-white hover:border-[#334155] transition-all"
            title="Export filtered candidates as CSV"
          >
            <Download size={14} />
            Export CSV
          </button>
          {selected.size > 0 && (
            <button
              id="recommend-candidates-btn"
              onClick={() => setShowRecommendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm font-medium transition-all"
            >
              <Send size={14} />
              Recommend ({selected.size})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
              showFilters
                ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
                : 'border-[#1e293b] text-slate-400 hover:text-white hover:border-[#334155]'
            }`}
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="candidate-search-input"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or email..."
            className="w-full bg-[#0b1329] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          id="candidate-search-btn"
          onClick={handleSearch}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-medium transition-all"
        >
          Search
        </button>
        {Object.values(activeFilters).some(Boolean) && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2.5 border border-[#1e293b] rounded-xl text-slate-400 hover:text-white text-sm transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Min CGPA</label>
            <input
              id="filter-min-cgpa"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={filters.minCgpa}
              onChange={e => setFilters(f => ({ ...f, minCgpa: e.target.value }))}
              placeholder="e.g. 7.5"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Domain</label>
            <input
              id="filter-target-domain"
              value={filters.targetDomain}
              onChange={e => setFilters(f => ({ ...f, targetDomain: e.target.value }))}
              placeholder="e.g. AI/Data Science"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Grad Year</label>
            <input
              id="filter-grad-year"
              type="number"
              value={filters.gradYear}
              onChange={e => setFilters(f => ({ ...f, gradYear: e.target.value }))}
              placeholder="e.g. 2026"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Min Skill Score</label>
            <input
              id="filter-min-skill-score"
              type="number"
              min="0"
              max="100"
              value={filters.minSkillScore}
              onChange={e => setFilters(f => ({ ...f, minSkillScore: e.target.value }))}
              placeholder="e.g. 65"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Opportunity ID</label>
            <input
              id="filter-opportunity-id"
              value={filters.opportunityId}
              onChange={e => setFilters(f => ({ ...f, opportunityId: e.target.value }))}
              placeholder="For match score filter..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Min Match Score</label>
            <input
              id="filter-min-match-score"
              type="number"
              min="0"
              max="100"
              value={filters.minMatchScore}
              onChange={e => setFilters(f => ({ ...f, minMatchScore: e.target.value }))}
              placeholder="e.g. 70"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Tags (comma-separated)</label>
            <input
              id="filter-tags"
              value={filters.tags}
              onChange={e => setFilters(f => ({ ...f, tags: e.target.value }))}
              placeholder="Placement Ready, Top Performer"
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div className="flex items-end">
            <button
              id="apply-filters-btn"
              onClick={handleSearch}
              className="w-full px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {candidates.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs"
          >
            {allSelected ? <CheckSquare size={13} className="text-cyan-400" /> : <Square size={13} />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-slate-600">·</span>
          <span>{total.toLocaleString()} candidates found</span>
          {selected.size > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-medium">{selected.size} selected</span>
            </>
          )}
        </div>
      )}

      {/* Candidate List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-400 text-sm">
          Failed to load candidates. You may need an active Institution profile.
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Users size={40} className="mx-auto text-slate-600" />
          <p className="text-slate-400 text-sm">No candidates found matching your filters.</p>
          <p className="text-slate-600 text-xs">
            Candidates appear here when they register with your institution's name.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => (
            <CandidateRow
              key={c.studentProfileId}
              candidate={c}
              selected={selected.has(c.studentProfileId)}
              onToggle={() => toggleSelect(c.studentProfileId)}
              onViewDetail={() => {
                // Open a detail view — for now link to skill profile via query
                window.open(`/profile?preview=${c.userId}`, '_blank');
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); setSelected(new Set()); }}
            className="p-2 border border-[#1e293b] rounded-lg text-slate-400 hover:text-white hover:border-[#334155] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-400 font-mono">
            Page {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => { setPage(p => p + 1); setSelected(new Set()); }}
            className="p-2 border border-[#1e293b] rounded-lg text-slate-400 hover:text-white hover:border-[#334155] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Recommend Modal */}
      {showRecommendModal && (
        <RecommendModal
          selectedIds={Array.from(selected)}
          onClose={() => setShowRecommendModal(false)}
        />
      )}
    </div>
  );
};
