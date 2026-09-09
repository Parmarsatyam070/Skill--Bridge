import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  ChevronLeft,
  Filter,
  ShieldCheck,
  Calendar,
  Video,
  Kanban,
  List,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  AlertCircle,
  X,
  Bot,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MatchBadge } from '../../components/MatchBadge';
import { ScheduleInterviewModal } from '../../components/interview/ScheduleInterviewModal';
import { VerifiedMatchBreakdownModal } from '../../components/matching/VerifiedMatchBreakdownModal';
import { ApplicationStatus, MatchBreakdown, InterviewDetails, HiredDetails } from '@shared/types';

interface ApplicantRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  institution: string;
  targetDomain: string;
  cgpa?: number | null;
  githubUsername?: string;
  linkedinUrl?: string;
  status: ApplicationStatus;
  matchScoreAtApply: number;
  currentMatchScore: number;
  matchTier: 'high' | 'medium' | 'low';
  coverNote?: string;
  resume?: any;
  interviewDetails?: InterviewDetails | null;
  hiredDetails?: HiredDetails | null;
  appliedAt: string;
  breakdown: MatchBreakdown | null;
}

export const ApplicantsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [interviewModalApp, setInterviewModalApp] = useState<ApplicantRecord | null>(null);
  const [breakdownModalApp, setBreakdownModalApp] = useState<ApplicantRecord | null>(null);
  const [hireModalApp, setHireModalApp] = useState<ApplicantRecord | null>(null);

  // Hire Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const defaultJoining = nextMonth.toISOString().split('T')[0];

  const [offerDate, setOfferDate] = useState(todayStr);
  const [joiningDate, setJoiningDate] = useState(defaultJoining);
  const [offerStipend, setOfferStipend] = useState('₹45,000/month');
  const [hireNotes, setHireNotes] = useState('');

  // Fetch ranked applicants (supporting live requisitions and demo dataset opportunities)
  const { data, isLoading } = useQuery({
    queryKey: ['jobApplicants', jobId],
    queryFn: async () => {
      try {
        return await api.get<{ applicants: ApplicantRecord[] }>(`/internships/${jobId}/applicants`);
      } catch (err) {
        // Fallback: Check if it's a demo opportunity from Industry Demo dataset
        const demoRes = await api.get<{ success: boolean; data: { opportunity: any; applicants: any[] } }>(
          `/industry/demo/opportunities/${jobId}/applicants`
        );
        const mapped: ApplicantRecord[] = (demoRes.data?.applicants || []).map((app: any) => ({
          id: app.id,
          studentId: app.candidateId,
          studentName: app.studentName,
          studentEmail: `${app.externalStudentId.toLowerCase()}@demo.skillbridge.internal`,
          institution: app.university,
          targetDomain: 'Technical',
          cgpa: Math.round((app.averageScore / 10) * 10) / 10,
          status: (app.stage?.toLowerCase() === 'interview_scheduled'
            ? 'interview_scheduled'
            : app.stage?.toLowerCase() === 'hired'
            ? 'accepted'
            : app.stage?.toLowerCase() === 'shortlisted'
            ? 'shortlisted'
            : 'applied') as ApplicationStatus,
          matchScoreAtApply: app.matchScore,
          currentMatchScore: app.matchScore,
          matchTier: (app.matchScore >= 80 ? 'high' : app.matchScore >= 65 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          appliedAt: app.appliedAt || new Date().toISOString(),
          breakdown: {
            totalScore: app.matchScore,
            verifiedSkills: (app.knownSkills || []).map((k: any) => ({
              skillName: k.skill,
              score: k.skillScore,
            })),
          } as any,
        }));
        return { applicants: mapped };
      }
    },
    enabled: !!jobId,
  });

  // Direct status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ appId, payload }: { appId: string; payload: any }) =>
      api.put(`/applications/${appId}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
      setHireModalApp(null);
    },
  });

  const applicants = data?.applicants || [];

  const filteredApplicants = applicants.filter(a => {
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pipelineStages: { status: ApplicationStatus; label: string; bg: string; dot: string }[] = [
    { status: 'applied', label: 'Applied', bg: 'bg-status-blue/10 border-status-blue/25 text-status-blue', dot: 'bg-status-blue' },
    { status: 'under_review', label: 'Under Review', bg: 'bg-status-amber/10 border-status-amber/25 text-status-amber', dot: 'bg-status-amber' },
    { status: 'shortlisted', label: 'Shortlisted', bg: 'bg-bridge-teal/10 border-bridge-teal/25 text-bridge-teal', dot: 'bg-bridge-teal' },
    { status: 'interview', label: 'Interview Scheduled', bg: 'bg-industry-amber/15 border-industry-amber/30 text-industry-amber', dot: 'bg-industry-amber' },
    { status: 'hired', label: 'Hired / Offered', bg: 'bg-status-green/15 border-status-green/30 text-status-green', dot: 'bg-status-green' },
    { status: 'rejected', label: 'Rejected', bg: 'bg-status-red/10 border-status-red/25 text-status-red', dot: 'bg-status-red' },
  ];

  const handleOpenHireModal = (app: ApplicantRecord) => {
    setHireModalApp(app);
    setOfferDate(todayStr);
    setJoiningDate(defaultJoining);
    setOfferStipend('₹45,000/month');
    setHireNotes('Candidate demonstrated excellence across all three verified competency pillars.');
  };

  const handleConfirmHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireModalApp) return;

    statusMutation.mutate({
      appId: hireModalApp.id,
      payload: {
        status: 'hired',
        hiredDetails: {
          offerDate,
          joiningDate,
          stipend: offerStipend,
          notes: hireNotes,
        },
      },
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link & Header */}
      <div className="space-y-3 pb-4 border-b border-console-border">
        <Link
          to="/industry/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-console-text-muted hover:text-console-text font-mono"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Recruitment Hub</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 text-[10px] font-mono font-bold">
                RECRUITER PIPELINE
              </span>
              <span className="text-xs font-mono text-console-text-muted">
                Applied → Under Review → Shortlisted → Interview → Hire
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text mt-1">
              Candidate Pipeline & Ranked Pool
            </h1>
          </div>

          {/* Controls: Search, View Mode Toggle, Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidates..."
              className="bg-console-panel-raised border border-console-border rounded-xl px-3 py-1.5 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal font-sans w-48"
            />

            {/* View Mode Toggle */}
            <div className="flex items-center bg-console-panel-raised border border-console-border rounded-xl p-0.5 text-xs font-mono">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-bridge-teal text-white font-bold shadow-sm'
                    : 'text-console-text-muted hover:text-console-text'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-bridge-teal text-white font-bold shadow-sm'
                    : 'text-console-text-muted hover:text-console-text'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Ranked List</span>
              </button>
            </div>

            {/* Recruiter Copilot Launcher */}
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('skillbridge:open-copilot', {
                    detail: { opportunityId: jobId },
                  })
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-console-panel-raised border border-console-border hover:border-bridge-teal text-console-text text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-bridge-teal"
              aria-label="Open Recruiter Copilot for this opportunity"
            >
              <Bot className="w-3.5 h-3.5 text-bridge-teal" />
              <span>Copilot AI</span>
              <Sparkles className="w-3 h-3 text-industry-amber" />
            </button>

            {/* Filter Status */}
            {viewMode === 'list' && (
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-console-panel-raised border border-console-border rounded-xl px-3 py-1.5 text-xs font-semibold text-console-text focus:outline-none focus:border-bridge-teal font-mono"
              >
                <option value="all">All States</option>
                <option value="applied">Applied</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview Scheduled</option>
                <option value="hired">Hired / Offered</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-industry-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-console-panel border border-console-border rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-console-text-muted mx-auto opacity-40" />
          <h3 className="font-serif text-lg font-bold text-console-text">No Applicants Yet</h3>
          <p className="text-xs text-console-text-muted max-w-md mx-auto">
            Candidates who apply with verified portfolios will be automatically ranked by the server matching engine.
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {pipelineStages.filter(s => s.status !== 'rejected').map(stage => {
            const stageApplicants = filteredApplicants.filter(a => a.status === stage.status);

            return (
              <div
                key={stage.status}
                className="bg-console-panel/80 border border-console-border rounded-2xl p-3 flex flex-col min-h-[500px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-console-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    <span className="font-serif text-xs font-bold text-console-text">
                      {stage.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-console-panel-raised border border-console-border text-[10px] font-mono font-bold text-console-text">
                    {stageApplicants.length}
                  </span>
                </div>

                {/* Candidate Cards in Stage */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {stageApplicants.length === 0 ? (
                    <div className="h-32 border border-dashed border-console-border rounded-xl flex items-center justify-center text-center p-3">
                      <span className="text-[11px] font-mono text-console-text-muted">
                        No candidates in this stage
                      </span>
                    </div>
                  ) : (
                    stageApplicants.map((app, idx) => (
                      <div
                        key={app.id}
                        className="bg-console-panel-raised border border-console-border hover:border-bridge-teal/50 rounded-xl p-3.5 space-y-3 shadow-sm transition-all"
                      >
                        {/* Candidate Info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={app.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${app.studentName}`}
                              alt={app.studentName}
                              className="w-8 h-8 rounded-lg object-cover border border-console-border"
                            />
                            <div>
                              <div className="font-serif text-xs font-bold text-console-text leading-tight">
                                {app.studentName}
                              </div>
                              <div className="text-[10px] text-console-text-muted truncate max-w-[120px]">
                                {app.institution}
                              </div>
                            </div>
                          </div>
                          <MatchBadge score={app.currentMatchScore} tier={app.matchTier} size="sm" />
                        </div>

                        {/* 3-Pillar Micro Badges */}
                        {app.breakdown?.pillars && (
                          <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
                            <div className="p-1 rounded bg-bridge-teal/10 border border-bridge-teal/20 text-bridge-teal">
                              <div className="font-bold">{app.breakdown.pillars.skillMatch.score}%</div>
                              <div className="opacity-70 text-[8px]">Skills</div>
                            </div>
                            <div className="p-1 rounded bg-industry-amber/10 border border-industry-amber/20 text-industry-amber">
                              <div className="font-bold">{app.breakdown.pillars.experienceMatch.score}%</div>
                              <div className="opacity-70 text-[8px]">Projects</div>
                            </div>
                            <div className="p-1 rounded bg-status-green/10 border border-status-green/20 text-status-green">
                              <div className="font-bold">{app.breakdown.pillars.assessmentScore.score}%</div>
                              <div className="opacity-70 text-[8px]">Tests</div>
                            </div>
                          </div>
                        )}

                        {/* Interview Details Banner (If Scheduled) */}
                        {app.status === 'interview' && app.interviewDetails && (
                          <div className="p-2.5 rounded-lg bg-industry-amber/10 border border-industry-amber/30 text-[11px] font-mono space-y-1.5">
                            <div className="flex items-center gap-1 text-industry-amber font-bold">
                              <Calendar className="w-3 h-3" />
                              <span>{app.interviewDetails.interviewDate} @ {app.interviewDetails.interviewTime}</span>
                            </div>
                            {app.interviewDetails.meetingLink && (
                              <a
                                href={app.interviewDetails.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1 w-full py-1 rounded bg-industry-amber text-white font-bold hover:bg-industry-amber/90 transition-all text-[10px]"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Google Meet</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Hired Details Banner */}
                        {app.status === 'hired' && app.hiredDetails && (
                          <div className="p-2.5 rounded-lg bg-status-green/10 border border-status-green/30 text-[11px] font-mono space-y-1">
                            <div className="text-status-green font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Offer Accepted</span>
                            </div>
                            <div className="text-console-text-muted text-[10px]">
                              Join Date: {app.hiredDetails.joiningDate || 'TBD'} • {app.hiredDetails.stipend || 'Stipend'}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons for Kanban */}
                        <div className="space-y-1.5 pt-1 border-t border-console-border/60">
                          {/* Inspect AI Match */}
                          <button
                            onClick={() => setBreakdownModalApp(app)}
                            className="w-full py-1 px-2 rounded-lg bg-console-panel hover:bg-console-border border border-console-border text-bridge-teal text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Inspect 3-Pillar Breakdown</span>
                          </button>

                          {/* Stage Transition Action */}
                          <div className="flex items-center gap-1">
                            {app.status === 'applied' && (
                              <button
                                onClick={() => statusMutation.mutate({ appId: app.id, payload: { status: 'under_review' } })}
                                className="flex-1 py-1 rounded-lg bg-status-amber/20 hover:bg-status-amber/30 text-status-amber text-[10px] font-mono font-semibold"
                              >
                                Review
                              </button>
                            )}

                            {(app.status === 'applied' || app.status === 'under_review') && (
                              <button
                                onClick={() => statusMutation.mutate({ appId: app.id, payload: { status: 'shortlisted' } })}
                                className="flex-1 py-1 rounded-lg bg-bridge-teal/20 hover:bg-bridge-teal/30 text-bridge-teal text-[10px] font-mono font-bold"
                              >
                                Shortlist
                              </button>
                            )}

                            {(app.status === 'shortlisted' || app.status === 'interview') && (
                              <button
                                onClick={() => setInterviewModalApp(app)}
                                className="flex-1 py-1 rounded-lg bg-industry-amber/20 hover:bg-industry-amber/30 text-industry-amber text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{app.status === 'interview' ? 'Reschedule' : 'Interview'}</span>
                              </button>
                            )}

                            {app.status === 'interview' && (
                              <button
                                onClick={() => handleOpenHireModal(app)}
                                className="flex-1 py-1 rounded-lg bg-status-green/20 hover:bg-status-green/30 text-status-green text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Hire</span>
                              </button>
                            )}

                            {app.status !== 'hired' && app.status !== 'rejected' && (
                              <button
                                onClick={() => statusMutation.mutate({ appId: app.id, payload: { status: 'rejected' } })}
                                className="py-1 px-2 rounded-lg bg-status-red/10 hover:bg-status-red/20 text-status-red text-[10px] font-mono"
                                title="Reject Application"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RANKED LIST / TABLE VIEW */
        <div className="space-y-4">
          {filteredApplicants.map((app, index) => {
            const currentStage = pipelineStages.find(s => s.status === app.status) || pipelineStages[0];

            return (
              <div
                key={app.id}
                className="bg-console-panel border border-console-border rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-console-border">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={app.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${app.studentName}`}
                      alt={app.studentName}
                      className="w-12 h-12 rounded-xl object-cover border border-console-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg font-bold text-console-text">
                          #{index + 1} {app.studentName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${currentStage.bg}`}>
                          {currentStage.label}
                        </span>
                      </div>
                      <div className="text-xs text-console-text-muted font-mono">
                        {app.institution} {app.cgpa && `• CGPA ${app.cgpa}/10`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-console-text-muted uppercase">
                        Verified Match Score
                      </div>
                      <MatchBadge score={app.currentMatchScore} tier={app.matchTier} size="lg" />
                    </div>

                    {/* Quick Stage Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBreakdownModalApp(app)}
                        className="px-3 py-1.5 rounded-xl bg-bridge-teal/15 hover:bg-bridge-teal/25 border border-bridge-teal/30 text-bridge-teal text-xs font-semibold font-mono flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Breakdown</span>
                      </button>

                      {app.status !== 'interview' && app.status !== 'hired' && (
                        <button
                          onClick={() => setInterviewModalApp(app)}
                          className="px-3 py-1.5 rounded-xl bg-industry-amber/15 hover:bg-industry-amber/25 border border-industry-amber/30 text-industry-amber text-xs font-semibold font-mono flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule</span>
                        </button>
                      )}

                      {app.status === 'interview' && (
                        <button
                          onClick={() => handleOpenHireModal(app)}
                          className="px-3 py-1.5 rounded-xl bg-status-green/15 hover:bg-status-green/25 border border-status-green/30 text-status-green text-xs font-semibold font-mono flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Make Offer</span>
                        </button>
                      )}

                      {app.status !== 'rejected' && app.status !== 'hired' && (
                        <button
                          onClick={() => statusMutation.mutate({ appId: app.id, payload: { status: 'rejected' } })}
                          className="px-2.5 py-1.5 rounded-xl bg-status-red/10 hover:bg-status-red/20 border border-status-red/25 text-status-red text-xs font-mono"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3-Pillar Progress Summary */}
                {app.breakdown?.pillars && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between">
                      <span className="text-console-text-muted">1. Skills (40%)</span>
                      <span className="font-bold text-bridge-teal">{app.breakdown.pillars.skillMatch.score}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between">
                      <span className="text-console-text-muted">2. Experience (30%)</span>
                      <span className="font-bold text-industry-amber">{app.breakdown.pillars.experienceMatch.score}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between">
                      <span className="text-console-text-muted">3. Assessment (30%)</span>
                      <span className="font-bold text-status-green">{app.breakdown.pillars.assessmentScore.score}%</span>
                    </div>
                  </div>
                )}

                {/* Scheduled Interview Inline Strip */}
                {app.status === 'interview' && app.interviewDetails && (
                  <div className="p-3 rounded-xl bg-industry-amber/10 border border-industry-amber/30 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-industry-amber font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{app.interviewDetails.roundTitle || 'Technical Interview'}</span>
                      </div>
                      <div className="text-console-text-muted">
                        Scheduled for: <strong className="text-console-text">{app.interviewDetails.interviewDate}</strong> at <strong className="text-console-text">{app.interviewDetails.interviewTime}</strong>
                      </div>
                    </div>
                    {app.interviewDetails.meetingLink && (
                      <a
                        href={app.interviewDetails.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-industry-amber text-white font-bold hover:bg-industry-amber/90 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Video Call</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Hired Details Strip */}
                {app.status === 'hired' && app.hiredDetails && (
                  <div className="p-3 rounded-xl bg-status-green/10 border border-status-green/30 text-xs font-mono flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-status-green font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Offer Formally Extended / Hired</span>
                      </div>
                      <div className="text-console-text-muted text-[11px]">
                        Offer Date: {app.hiredDetails.offerDate} • Joining: {app.hiredDetails.joiningDate} • Stipend: {app.hiredDetails.stipend}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-status-green/20 text-status-green font-bold text-[10px]">
                      HIRED CANDIDATE
                    </span>
                  </div>
                )}

                {/* Cover Note & Links Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  {app.coverNote ? (
                    <div className="text-console-text-muted italic text-[11px] max-w-xl truncate">
                      "{app.coverNote}"
                    </div>
                  ) : <div />}

                  <div className="flex items-center gap-4 font-mono">
                    {app.resume && (
                      <span className="text-bridge-teal flex items-center gap-1 text-[11px]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{app.resume.title}</span>
                      </span>
                    )}
                    <Link
                      to={`/portfolio/${app.studentId}`}
                      target="_blank"
                      className="text-bridge-teal font-semibold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Public Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      <ScheduleInterviewModal
        isOpen={!!interviewModalApp}
        onClose={() => setInterviewModalApp(null)}
        application={interviewModalApp}
        jobId={jobId}
      />

      {/* 3-PILLAR MATCH BREAKDOWN MODAL */}
      <VerifiedMatchBreakdownModal
        isOpen={!!breakdownModalApp}
        onClose={() => setBreakdownModalApp(null)}
        candidateName={breakdownModalApp?.studentName || 'Candidate'}
        candidateAvatar={breakdownModalApp?.avatarUrl}
        candidateInstitution={breakdownModalApp?.institution}
        candidateCgpa={breakdownModalApp?.cgpa}
        breakdown={breakdownModalApp?.breakdown || null}
      />

      {/* HIRE CANDIDATE OFFER MODAL */}
      {hireModalApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans"
          onClick={() => setHireModalApp(null)}
        >
          <div
            className="bg-console-panel border border-console-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-console-panel-raised border-b border-console-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-status-green/20 border border-status-green/30 flex items-center justify-center text-status-green">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-console-text">
                    Extend Formal Offer
                  </h3>
                  <p className="text-[11px] font-mono text-console-text-muted">
                    Candidate: {hireModalApp.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHireModalApp(null)}
                className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHire} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-console-text">Offer Date</label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={e => setOfferDate(e.target.value)}
                  className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text font-mono focus:outline-none focus:border-status-green"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-console-text">Expected Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text font-mono focus:outline-none focus:border-status-green"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-console-text">Stipend / Compensation</label>
                <input
                  type="text"
                  value={offerStipend}
                  onChange={e => setOfferStipend(e.target.value)}
                  className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text font-mono focus:outline-none focus:border-status-green"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-console-text">Offer Notes & Congratulatory Message</label>
                <textarea
                  rows={2}
                  value={hireNotes}
                  onChange={e => setHireNotes(e.target.value)}
                  placeholder="Notes regarding team allocation or congratulatory message..."
                  className="w-full bg-console-panel-raised border border-console-border rounded-xl px-3 py-2 text-xs text-console-text focus:outline-none focus:border-status-green resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-console-border">
                <button
                  type="button"
                  onClick={() => setHireModalApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-console-text-muted hover:text-console-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-status-green hover:bg-status-green/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {statusMutation.isPending ? 'Processing...' : 'Confirm Hire & Extend Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
