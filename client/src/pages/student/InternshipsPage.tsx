import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  FileText,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { MatchBadge } from '../../components/MatchBadge';
import { BridgeLine } from '../../components/BridgeLine';
import { ExternalApplyButton } from '../../components/ExternalApplyButton';
import { MockInterviewModal } from '../../components/interview/MockInterviewModal';
import { Link } from 'react-router-dom';

export const InternshipsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeApplyJob, setActiveApplyJob] = useState<any | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverNote, setCoverNote] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [mockInterviewJob, setMockInterviewJob] = useState<{ id: string; title: string; companyName: string } | null>(null);

  // 1. Fetch Student Profile for Active Target Internship
  const { data: profileData } = useQuery({
    queryKey: ['studentProfile', studentProfileId],
    queryFn: () => api.get<any>(`/students/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const activeTargetInternshipId = profileData?.targetInternshipId;
  const activeTargetInternship = profileData?.targetInternship;

  // Target Role Mutations
  const targetMutation = useMutation({
    mutationFn: (internshipId: string) => api.post(`/students/${studentProfileId}/target-internship`, { internshipId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', studentProfileId] });
      queryClient.invalidateQueries({ queryKey: ['roadmapData'] });
    },
  });

  const clearTargetMutation = useMutation({
    mutationFn: () => api.delete(`/students/${studentProfileId}/target-internship`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', studentProfileId] });
      queryClient.invalidateQueries({ queryKey: ['roadmapData'] });
    },
  });

  // 1. Fetch Authoritative Matches from Single Source of Truth
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['studentMatches', studentProfileId],
    queryFn: () => api.get<{ matches: any[] }>(`/students/${studentProfileId}/matches`),
    enabled: !!studentProfileId,
  });

  // 2. Fetch Student Resumes for selection in Apply Modal
  const { data: resumesData } = useQuery({
    queryKey: ['studentResumes', studentProfileId],
    queryFn: () => api.get<{ resumes: any[] }>('/resumes'),
    enabled: !!studentProfileId,
  });

  // 3. Fetch Existing Applications to show applied status
  const { data: appsData } = useQuery({
    queryKey: ['studentApplications', studentProfileId],
    queryFn: () => api.get<{ applications: any[] }>(`/applications/student/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const matches = matchesData?.matches || [];
  const resumes = resumesData?.resumes || [];
  const appliedJobIds = new Set((appsData?.applications || []).map((a: any) => a.internshipId));

  // Apply Mutation
  const applyMutation = useMutation({
    mutationFn: (data: { internshipId: string; resumeId?: string; coverNote?: string }) =>
      api.post('/applications/apply', data),
    onSuccess: () => {
      setApplySuccess(true);
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      setTimeout(() => {
        setApplySuccess(false);
        setActiveApplyJob(null);
        setCoverNote('');
      }, 1800);
    },
  });

  const filteredMatches = matches.filter(m => {
    const matchesTier = selectedTier === 'all' || m.tier === selectedTier;
    const matchesSearch =
      m.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const handleOpenApplyModal = (job: any) => {
    setActiveApplyJob(job);
    if (resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  };

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApplyJob) return;

    applyMutation.mutate({
      internshipId: activeApplyJob.internshipId,
      resumeId: selectedResumeId || undefined,
      coverNote,
    });
  };

  return (
    <div className="min-h-full space-y-5 sm:space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="small-caps-label text-[11px] text-bridge-teal font-bold">
              [● AUTHORITATIVE MATCH PIPELINE]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal" />
            <span className="text-xs font-mono text-text-muted">Verified Hiring Matches</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-sans">
            Matched Internships & Openings
          </h1>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by title or company..."
              className="bg-void border border-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-bridge-teal"
            />
          </div>

          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="bg-void border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-bridge-teal font-mono cursor-pointer"
          >
            <option value="all">All Match Tiers</option>
            <option value="high">High Match (≥80%)</option>
            <option value="medium">Good Fit (50–79%)</option>
            <option value="low">Skill Gap (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Active Target Role Focus Banner */}
      {activeTargetInternship && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-bridge-teal/15 via-panel to-panel-raised border border-bridge-teal/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bridge-teal/20 border border-bridge-teal/40 flex items-center justify-center text-bridge-teal flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="small-caps-label text-[10px] font-bold text-bridge-teal font-mono">
                  [● ACTIVE TARGET ROLE]
                </span>
                <span className="text-xs font-bold text-text-primary">
                  {activeTargetInternship.title} @ {activeTargetInternship.companyName}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Your 2-Year Roadmap, Daily Practice Sets, and Sash Mock Interview are prioritized around this posting.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMockInterviewJob({
                id: activeTargetInternship.id,
                title: activeTargetInternship.title,
                companyName: activeTargetInternship.companyName,
              })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bridge-teal text-slate-950 font-bold text-xs shadow-md shadow-bridge-teal/20 hover:bg-bridge-teal/90 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Mock Interview (Sash)</span>
            </button>
            <Link
              to="/skill-profile"
              className="px-3.5 py-1.5 rounded-full bg-panel border border-border hover:border-bridge-teal text-text-primary text-xs font-semibold transition-colors"
            >
              Role Roadmap →
            </Link>
            <button
              onClick={() => clearTargetMutation.mutate()}
              disabled={clearTargetMutation.isPending}
              className="px-2.5 py-1.5 rounded-full text-text-muted hover:text-text-primary text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Internships List */}
      {matchesLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-panel border border-border rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <h3 className="font-bold text-lg text-text-primary font-sans">No Internships Found</h3>
          <p className="text-xs text-text-muted font-sans">
            Try adjusting your search criteria or tier filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filteredMatches.map(job => {
            const isApplied = appliedJobIds.has(job.internshipId);

            return (
              <div
                key={job.internshipId}
                className="bg-panel border border-border rounded-2xl p-5 sm:p-6 shadow-xl hover:border-bridge-teal/40 transition-all duration-200 space-y-4 content-auto"
              >
                {/* Top Title & Match Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-text-primary font-sans">
                        {job.internshipTitle}
                      </h3>
                      {isApplied && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-signal-green/15 text-signal-green border border-signal-green/30">
                          ✓ Applied
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex flex-wrap items-center gap-3 font-mono">
                      <span className="text-text-primary font-semibold">{job.companyName}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.workMode}</span>
                      <span>•</span>
                      <span className="text-signal-green font-semibold">{job.stipend}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MatchBadge score={job.overallScore} tier={job.tier} size="lg" />
                    {isApplied ? (
                      <button
                        disabled
                        className="px-4 py-2 rounded-full bg-panel-raised border border-border text-text-muted text-xs font-mono font-medium cursor-not-allowed"
                      >
                        Application Submitted
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenApplyModal(job)}
                        className="bridge-btn-primary px-5 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all"
                      >
                        Apply with Resume →
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Targeting & AI Mock Interview Toolbar */}
                <div className="p-3 rounded-xl bg-panel-raised border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {job.internshipId === activeTargetInternshipId ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>★ Active Target Role</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => targetMutation.mutate(job.internshipId)}
                        disabled={targetMutation.isPending}
                        className="px-3 py-1 rounded-full bg-panel border border-border hover:border-bridge-teal text-text-primary text-[11px] font-semibold transition-all hover:bg-bridge-teal/10"
                      >
                        🎯 Target this Role
                      </button>
                    )}
                    <span className="text-text-muted hidden sm:inline">•</span>
                    <span className="text-text-muted text-[11px]">
                      {job.internshipId === activeTargetInternshipId
                        ? 'Roadmap & Daily Practice weighted to this role'
                        : 'Sets customized roadmap & daily practice weighting'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMockInterviewJob({
                        id: job.internshipId,
                        title: job.internshipTitle,
                        companyName: job.companyName,
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 hover:bg-bridge-teal hover:text-slate-950 font-bold text-[11px] transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Mock Interview with Sash</span>
                    </button>
                    {job.internshipId === activeTargetInternshipId && (
                      <Link
                        to="/skill-profile"
                        className="text-bridge-teal font-mono text-[11px] hover:underline px-2 py-1"
                      >
                        View Scoped Roadmap →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Signature Bridge Line for genuine matches */}
                <BridgeLine
                  sourceLabel="Your Assessed Skill Profile"
                  targetLabel={`${job.internshipTitle} @ ${job.companyName}`}
                  matchScore={job.overallScore}
                  tier={job.tier}
                  isApplied={isApplied}
                />

                {/* Required Skills Matrix */}
                <div className="space-y-2 pt-1">
                  <span className="small-caps-label text-[11px] font-mono text-text-muted font-bold block">
                    COMPETENCY BREAKDOWN
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {job.breakdown.matchedSkills.map((sk: any) => (
                      <div
                        key={sk.skillId}
                        className={`p-2.5 rounded-xl border text-xs font-mono ${
                          sk.isMet
                            ? 'bg-signal-green/10 border-signal-green/25 text-signal-green'
                            : 'bg-panel-raised border-border text-text-muted'
                        }`}
                      >
                        <div className="font-sans font-medium text-text-primary text-xs truncate">
                          {sk.skillName}
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center justify-between">
                          <span>{sk.studentScore}%</span>
                          <span className="opacity-70">Req: {sk.requiredScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outbound Cross-Posting Deep Links */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
                  <span className="text-text-muted">
                    Also search or cross-check this role on external partner portals:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <ExternalApplyButton platform="internshala" query={job.internshipTitle} />
                    <ExternalApplyButton platform="aicte" />
                    <ExternalApplyButton platform="linkedin" query={`${job.internshipTitle} ${job.companyName}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Apply Modal with Resume Selection */}
      {activeApplyJob && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setActiveApplyJob(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-console-panel border border-console-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveApplyJob(null)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-xs font-mono text-bridge-teal font-semibold">
                Submit Verified Application
              </span>
              <h3 className="font-serif text-xl font-bold text-console-text mt-0.5">
                {activeApplyJob.internshipTitle}
              </h3>
              <p className="text-xs text-console-text-muted">
                {activeApplyJob.companyName} • Match at Apply: <span className="font-mono font-bold text-bridge-teal">{activeApplyJob.overallScore}%</span>
              </p>
            </div>

            {applySuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-status-green mx-auto" />
                <h4 className="font-serif text-lg font-bold text-console-text">
                  Application Submitted!
                </h4>
                <p className="text-xs text-console-text-muted">
                  Your snapshot score of {activeApplyJob.overallScore}% has been recorded for the recruiter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmApply} className="space-y-4 text-xs">
                {/* Resume Selector */}
                <div>
                  <label className="block font-semibold text-console-text mb-1.5">
                    Select Resume to Attach (Required)
                  </label>
                  {resumes.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-status-amber/10 border border-status-amber/20 text-status-amber text-xs space-y-1">
                      <div className="font-semibold">No resumes found in your profile</div>
                      <p className="text-[11px] text-console-text-muted">
                        Generate an AI resume or upload a PDF first in the Resume Builder.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={e => setSelectedResumeId(e.target.value)}
                      required
                      className="w-full bg-console-bg border border-console-border rounded-xl px-3.5 py-2.5 text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                    >
                      {resumes.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.type === 'AI_GENERATED' ? 'AI-Generated' : 'Uploaded File'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Optional Cover Note */}
                <div>
                  <label className="block font-semibold text-console-text mb-1.5">
                    Cover Note to Recruiter (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    placeholder="Briefly state your verified strengths and project experience..."
                    className="w-full bg-console-bg border border-console-border rounded-xl p-3 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border text-[11px] text-console-text-muted space-y-1">
                  <div className="font-mono text-console-text font-semibold">Snapshot Integrity:</div>
                  <div>Your match score ({activeApplyJob.overallScore}%) will be immutably recorded at submission.</div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveApplyJob(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-console-text-muted hover:text-console-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyMutation.isPending || resumes.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{applyMutation.isPending ? 'Submitting...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 30-Minute AI Mock Interview Modal */}
      {mockInterviewJob && (
        <MockInterviewModal
          internshipId={mockInterviewJob.id}
          internshipTitle={mockInterviewJob.title}
          companyName={mockInterviewJob.companyName}
          isOpen={Boolean(mockInterviewJob)}
          onClose={() => setMockInterviewJob(null)}
          onFinishSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['roadmapData'] });
            queryClient.invalidateQueries({ queryKey: ['reportCard'] });
          }}
        />
      )}
    </div>
  );
};
