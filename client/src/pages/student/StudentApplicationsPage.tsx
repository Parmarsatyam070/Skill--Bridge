import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  FileText,
  AlertCircle,
  X,
  Send,
  CheckCircle2,
  XCircle,
  Video,
  ChevronRight,
  Filter,
  Search,
  ShieldCheck,
  History,
  AlertTriangle,
  ArrowRight,
  MapPin,
  DollarSign,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ApplicationStatus, ApplicationTimelineEventDto } from '@shared/types';

interface StudentApplicationItem {
  id: string;
  internshipId?: string | null;
  opportunityId?: string | null;
  internshipTitle: string;
  opportunityTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  stipend: string;
  status: ApplicationStatus;
  canonicalStatus: string;
  matchScoreAtApply: number;
  currentMatchScore: number;
  matchTier: 'high' | 'medium' | 'low';
  resumeTitle?: string;
  coverNote?: string;
  interviewDetails?: {
    scheduledDate?: string;
    interviewType?: string;
    meetingUrl?: string;
    interviewerName?: string;
    notes?: string;
  } | null;
  hiredDetails?: {
    offerDate?: string;
    joiningDate?: string;
    stipend?: string;
    notes?: string;
  } | null;
  appliedAt: string;
  updatedAt: string;
  daysInCurrentStage: number;
  isStageDelayed: boolean;
  delayThresholdDays: number;
  historyCount: number;
}

export const StudentApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusGroup, setSelectedStatusGroup] = useState<'all' | 'active' | 'interview' | 'offered' | 'terminal'>('all');
  
  // Timeline Modal State
  const [selectedAppForTimeline, setSelectedAppForTimeline] = useState<StudentApplicationItem | null>(null);

  // Withdraw Modal State
  const [withdrawModalApp, setWithdrawModalApp] = useState<StudentApplicationItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // 1. Fetch Student Applications
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['studentApplications', studentProfileId],
    queryFn: async () => {
      if (!studentProfileId) return { applications: [] };
      return await api.get<{ applications: StudentApplicationItem[] }>(`/applications/student/${studentProfileId}`);
    },
    enabled: !!studentProfileId,
  });

  // 2. Fetch Timeline for Selected Application
  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['applicationTimeline', selectedAppForTimeline?.id],
    queryFn: async () => {
      if (!selectedAppForTimeline) return { timeline: [] };
      return await api.get<{ timeline: ApplicationTimelineEventDto[] }>(`/applications/${selectedAppForTimeline.id}/timeline`);
    },
    enabled: !!selectedAppForTimeline,
  });

  // 3. Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      return await api.put(`/applications/${appId}/status`, {
        status: 'WITHDRAWN',
        notes: reason || 'Candidate voluntarily withdrew their application.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentApplications', studentProfileId] });
      setWithdrawModalApp(null);
      setWithdrawReason('');
    },
  });

  const applications = data?.applications || [];

  // Categorize helper
  const filterByStatusGroup = (app: StudentApplicationItem) => {
    const s = (app.canonicalStatus || app.status).toUpperCase();
    if (selectedStatusGroup === 'all') return true;
    if (selectedStatusGroup === 'active') {
      return ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'ON_HOLD'].includes(s);
    }
    if (selectedStatusGroup === 'interview') {
      return ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(s);
    }
    if (selectedStatusGroup === 'offered') {
      return ['OFFERED', 'ACCEPTED'].includes(s);
    }
    if (selectedStatusGroup === 'terminal') {
      return ['REJECTED', 'WITHDRAWN'].includes(s);
    }
    return true;
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && filterByStatusGroup(app);
  });

  // KPI Metrics
  const totalApps = applications.length;
  const activeApps = applications.filter((a) =>
    ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'ON_HOLD'].includes(
      (a.canonicalStatus || a.status).toUpperCase()
    )
  ).length;
  const interviewsCount = applications.filter((a) =>
    ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes((a.canonicalStatus || a.status).toUpperCase())
  ).length;
  const offersCount = applications.filter((a) =>
    ['OFFERED', 'ACCEPTED'].includes((a.canonicalStatus || a.status).toUpperCase())
  ).length;

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    const norm = status.toUpperCase();
    switch (norm) {
      case 'OFFERED':
      case 'ACCEPTED':
      case 'HIRED':
        return {
          label: norm === 'OFFERED' ? 'Offer Extended' : 'Offer Accepted',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW':
        return {
          label: 'Interview Scheduled',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'INTERVIEW_COMPLETED':
        return {
          label: 'Interview Completed',
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'SHORTLISTED':
        return {
          label: 'Shortlisted',
          className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-400',
        };
      case 'ASSESSMENT':
        return {
          label: 'Assessment Round',
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'APPLIED':
        return {
          label: 'Applied',
          className: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
        };
      case 'REJECTED':
        return {
          label: 'Not Selected',
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'WITHDRAWN':
        return {
          label: 'Withdrawn',
          className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
          dot: 'bg-zinc-400',
        };
      case 'ON_HOLD':
        return {
          label: 'On Hold',
          className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-300',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  const isWithdrawable = (status: string) => {
    const norm = status.toUpperCase();
    return ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'ON_HOLD'].includes(norm);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-console-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold tracking-wider">
                LIFECYCLE TRACKER
              </span>
              <span className="text-xs font-mono text-console-text-muted">
                Single Source of Truth
              </span>
            </div>
            <h1 className="text-2xl font-bold text-console-text tracking-tight flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-500" />
              My Applications
            </h1>
            <p className="text-xs text-console-text-muted mt-1">
              Centralized current application status across all your opportunity requisitions, interview calls, and offers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/opportunities"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Explore Opportunities
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-console-card border border-console-border">
          <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider">
            Total Submissions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-console-text font-mono">{totalApps}</span>
            <span className="text-[10px] text-console-text-muted">applications</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-console-card border border-console-border">
          <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider">
            Active in Review
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400 font-mono">{activeApps}</span>
            <span className="text-[10px] text-blue-500/70 font-mono">in pipeline</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-console-card border border-console-border">
          <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider">
            Interview Rounds
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{interviewsCount}</span>
            <span className="text-[10px] text-amber-500/70 font-mono">scheduled</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-console-card border border-console-border">
          <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider">
            Offers Extended
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{offersCount}</span>
            <span className="text-[10px] text-emerald-500/70 font-mono">congratulations!</span>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-console-card border border-console-border overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active Pipeline' },
            { id: 'interview', label: 'Interviews' },
            { id: 'offered', label: 'Offers' },
            { id: 'terminal', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusGroup(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-all ${
                selectedStatusGroup === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-console-text-muted hover:text-console-text hover:bg-console-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-console-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-console-card border border-console-border text-xs text-console-text placeholder-console-text-muted focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-12 rounded-xl bg-console-card border border-console-border flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-console-text-muted">Loading your applications portfolio...</span>
        </div>
      ) : isError ? (
        <div className="p-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to load applications. Please try again.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-medium text-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-12 rounded-xl bg-console-card border border-console-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-console-text">No Applications Found</h3>
            <p className="text-xs text-console-text-muted max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No applications match your search query. Try clearing your search.'
                : 'You have not submitted applications matching this filter yet. Explore active requisitions on the Opportunity Market.'}
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const badge = getStatusBadge(app.canonicalStatus || app.status);
            const appliedDate = new Date(app.appliedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const updatedDate = new Date(app.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={app.id}
                className="p-4 sm:p-5 rounded-xl bg-console-card border border-console-border hover:border-blue-500/40 transition-all space-y-4"
              >
                {/* Row 1: Header + Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-console-text hover:text-blue-400 transition-colors">
                        {app.opportunityTitle}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>

                      {app.isStageDelayed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          Stage Delay ({app.daysInCurrentStage}d)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-console-text-muted">
                      <span className="flex items-center gap-1.5 text-console-text font-medium">
                        <Building2 className="w-3.5 h-3.5 text-console-text-muted" />
                        {app.companyName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {app.location} • {app.workMode}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {app.stipend}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedAppForTimeline(app)}
                      className="px-3 py-1.5 rounded-lg bg-console-hover hover:bg-console-border text-console-text text-xs font-medium inline-flex items-center gap-1.5 border border-console-border transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-blue-400" />
                      View Timeline
                    </button>

                    {isWithdrawable(app.canonicalStatus || app.status) && (
                      <button
                        onClick={() => setWithdrawModalApp(app)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Stage & Match Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-lg bg-console-bg/50 border border-console-border/60 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-console-text-muted uppercase block">Applied On</span>
                    <span className="text-console-text font-medium mt-0.5 block">{appliedDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-console-text-muted uppercase block">Days in Current Stage</span>
                    <span className="text-console-text font-medium mt-0.5 block">
                      {app.daysInCurrentStage} {app.daysInCurrentStage === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-console-text-muted uppercase block">Match Score</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-console-text font-mono">{app.currentMatchScore}%</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-bold ${
                          app.matchTier === 'high'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : app.matchTier === 'medium'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {app.matchTier}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-console-text-muted uppercase block">Last Updated</span>
                    <span className="text-console-text font-medium mt-0.5 block">{updatedDate}</span>
                  </div>
                </div>

                {/* Row 3: Interview Callout (if scheduled) */}
                {app.interviewDetails && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Video className="w-4 h-4" />
                        <span>Interview Scheduled: {app.interviewDetails.interviewType || 'Video Round'}</span>
                      </div>
                      {app.interviewDetails.meetingUrl && (
                        <a
                          href={app.interviewDetails.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                        >
                          Join Meeting <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-amber-300/80 text-[11px]">
                      {app.interviewDetails.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(app.interviewDetails.scheduledDate).toLocaleString()}
                        </span>
                      )}
                      {app.interviewDetails.interviewerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Interviewer: {app.interviewDetails.interviewerName}
                        </span>
                      )}
                    </div>
                    {app.interviewDetails.notes && (
                      <p className="text-[11px] text-amber-300/90 italic pt-1 border-t border-amber-500/20">
                        "{app.interviewDetails.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Row 4: Offer Callout (if offered or accepted) */}
                {app.hiredDetails && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Formal Placement / Internship Offer</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-emerald-300/80 text-[11px]">
                      {app.hiredDetails.stipend && <span>Compensation: {app.hiredDetails.stipend}</span>}
                      {app.hiredDetails.joiningDate && (
                        <span>Joining Date: {new Date(app.hiredDetails.joiningDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {app.hiredDetails.notes && (
                      <p className="text-[11px] text-emerald-300/90 italic pt-1 border-t border-emerald-500/20">
                        "{app.hiredDetails.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── APPLICATION TIMELINE MODAL ────────────────────────────────────── */}
      {selectedAppForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-console-card border border-console-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-console-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider block">
                  Application Lifecycle Audit
                </span>
                <h3 className="text-base font-bold text-console-text mt-0.5">
                  {selectedAppForTimeline.opportunityTitle}
                </h3>
                <span className="text-xs text-console-text-muted">
                  {selectedAppForTimeline.companyName}
                </span>
              </div>
              <button
                onClick={() => setSelectedAppForTimeline(null)}
                className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Timeline Events */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {isLoadingTimeline ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-console-text-muted">Loading audit history...</span>
                </div>
              ) : !timelineData?.timeline || timelineData.timeline.length === 0 ? (
                <div className="py-8 text-center text-xs text-console-text-muted">
                  No historical status changes recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-console-border">
                  {timelineData.timeline.map((event, idx) => {
                    const badge = getStatusBadge(event.status);
                    const eventDate = new Date(event.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={event.id || idx} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full border-2 border-console-card ${badge.dot}`}
                        />

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${badge.className}`}>
                              {badge.label}
                            </span>
                            <span className="text-[11px] font-mono text-console-text-muted">
                              {eventDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-console-text-muted pt-0.5">
                            <span>Actor: <strong className="text-console-text">{event.changedByRole}</strong></span>
                            {event.stageDurationDays !== undefined && (
                              <span>• Stage duration: <strong className="text-console-text">{event.stageDurationDays}d</strong></span>
                            )}
                          </div>

                          {event.notes && (
                            <p className="text-xs text-console-text bg-console-bg p-2.5 rounded-lg border border-console-border/70 mt-1">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-console-border bg-console-bg/50 flex justify-end">
              <button
                onClick={() => setSelectedAppForTimeline(null)}
                className="px-4 py-1.5 rounded-lg bg-console-hover text-console-text text-xs font-medium border border-console-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW CONFIRMATION MODAL ───────────────────────────────────── */}
      {withdrawModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-console-card border border-console-border rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-console-text">Withdraw Application?</h3>
            </div>

            <p className="text-xs text-console-text-muted">
              Are you sure you want to withdraw your application for{' '}
              <strong className="text-console-text">{withdrawModalApp.opportunityTitle}</strong> at{' '}
              <strong className="text-console-text">{withdrawModalApp.companyName}</strong>? This action is permanent and recorded in the application history.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-console-text block">
                Reason for Withdrawal (Optional)
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="e.g. Accepted another offer, relocation, scheduling conflict..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-console-bg border border-console-border text-xs text-console-text placeholder-console-text-muted focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-console-border">
              <button
                type="button"
                onClick={() => setWithdrawModalApp(null)}
                disabled={withdrawMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-console-hover text-console-text text-xs font-medium border border-console-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  withdrawMutation.mutate({
                    appId: withdrawModalApp.id,
                    reason: withdrawReason,
                  })
                }
                disabled={withdrawMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
