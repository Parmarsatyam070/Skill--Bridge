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
} from 'lucide-react';
import { api } from '../../lib/api';
import { MatchBadge } from '../../components/MatchBadge';
import { BridgeLine } from '../../components/BridgeLine';

export const ApplicantsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeResumeModal, setActiveResumeModal] = useState<any | null>(null);

  // Fetch ranked applicants
  const { data, isLoading } = useQuery({
    queryKey: ['jobApplicants', jobId],
    queryFn: () => api.get<{ applicants: any[] }>(`/internships/${jobId}/applicants`),
    enabled: !!jobId,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.put(`/applications/${appId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
    },
  });

  const applicants = data?.applicants || [];

  const filteredApplicants = applicants.filter(a => {
    return selectedStatus === 'all' || a.status === selectedStatus;
  });

  const statusChips = {
    applied: { label: 'Applied', bg: 'bg-status-blue/15 text-status-blue border-status-blue/30' },
    under_review: { label: 'Under Review', bg: 'bg-status-amber/15 text-status-amber border-status-amber/30' },
    shortlisted: { label: 'Shortlisted', bg: 'bg-status-green/15 text-status-green border-status-green/30' },
    rejected: { label: 'Rejected', bg: 'bg-status-red/15 text-status-red border-status-red/30' },
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Back Link & Header */}
      <div className="space-y-3 pb-4 border-b border-console-border">
        <Link
          to="/industry/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-console-text-muted hover:text-console-text font-mono"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Recruitment Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Candidate Pipeline
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
              Ranked Candidate Pool
            </h1>
          </div>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-console-panel-raised border border-console-border rounded-xl px-3 py-1.5 text-xs font-semibold text-console-text focus:outline-none focus:border-bridge-teal font-mono"
          >
            <option value="all">All Application States</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applicants List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-industry-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-console-panel border border-console-border rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-console-text-muted mx-auto opacity-40" />
          <h3 className="font-serif text-lg font-bold text-console-text">No Applicants in this View</h3>
          <p className="text-xs text-console-text-muted">
            Candidates who apply with verified portfolios will be automatically ranked by the server matching engine.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplicants.map((app, index) => {
            const currentChip = statusChips[app.status as keyof typeof statusChips] || statusChips.applied;

            return (
              <div
                key={app.id}
                className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-5"
              >
                {/* Applicant Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-console-border">
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${currentChip.bg}`}>
                          {currentChip.label}
                        </span>
                      </div>
                      <div className="text-xs text-console-text-muted font-mono">
                        {app.institution} • CGPA {app.cgpa || '8.5'}/10
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-console-text-muted uppercase">Authoritative Match</div>
                      <MatchBadge score={app.currentMatchScore} tier={app.matchTier} size="lg" />
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => statusMutation.mutate({ appId: app.id, status: 'shortlisted' })}
                        className="px-3 py-1.5 rounded-xl bg-status-green/15 hover:bg-status-green/25 border border-status-green/30 text-status-green text-xs font-semibold font-mono transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ appId: app.id, status: 'rejected' })}
                        className="px-3 py-1.5 rounded-xl bg-status-red/10 hover:bg-status-red/20 border border-status-red/25 text-status-red text-xs font-semibold font-mono transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bridge Line Connector linking candidate verified competencies */}
                <BridgeLine
                  sourceLabel={`${app.studentName}'s Assessed Skills`}
                  targetLabel="Job Competency Threshold"
                  matchScore={app.currentMatchScore}
                  tier={app.matchTier}
                  isApplied={true}
                />

                {/* Cover Note if provided */}
                {app.coverNote && (
                  <div className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border text-xs space-y-1">
                    <div className="font-mono text-bridge-teal font-semibold">Candidate Cover Note:</div>
                    <p className="text-console-text leading-relaxed italic">
                      "{app.coverNote}"
                    </p>
                  </div>
                )}

                {/* Candidate Links */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <div className="flex items-center gap-4 font-mono text-console-text-muted">
                    {app.resume && (
                      <span className="flex items-center gap-1 text-bridge-teal">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Attached Resume: {app.resume.title}</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/portfolio/${app.studentId}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs font-semibold text-bridge-teal hover:underline font-mono"
                  >
                    <span>View Public Verified Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
