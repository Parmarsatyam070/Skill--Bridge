import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  Award,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { MatchBadge } from '../../components/MatchBadge';

export const IndustryDashboard: React.FC = () => {
  const { user } = useAuth();
  const industryProfileId = user?.industryProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['industryJobs', industryProfileId],
    queryFn: () => api.get<{ internships: any[] }>(`/internships?industryId=${industryProfileId}`),
    enabled: !!industryProfileId,
  });

  const internships = data?.internships || [];
  const totalApplicants = internships.reduce((sum, j) => sum + (j.applicantCount || 0), 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-console-panel-raised via-console-panel to-console-bg border border-console-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-industry-amber/15 text-industry-amber border border-industry-amber/30 text-xs font-mono font-medium">
              Verified Enterprise Recruiter
            </span>
            <span className="text-xs font-mono text-console-text-muted">
              {user?.industryProfile?.companyName}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Recruitment Command Center
          </h1>
          <p className="text-xs text-console-text-muted max-w-xl leading-relaxed">
            Direct access to verified student talent evaluated through standardized academic benchmarks and accredited partner courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('skillbridge:open-copilot'))}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-console-panel border border-console-border hover:border-bridge-teal text-console-text font-semibold text-xs transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-bridge-teal"
            aria-label="Open Recruiter Copilot Assistant"
          >
            <Bot className="w-4 h-4 text-bridge-teal" />
            <span>Recruiter Copilot (AI)</span>
            <Sparkles className="w-3.5 h-3.5 text-industry-amber" />
          </button>

          <Link
            to="/industry/post-job"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-industry-amber hover:bg-industry-amber/90 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Internship</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>Active Postings</span>
            <Briefcase className="w-4 h-4 text-industry-amber" />
          </div>
          <div className="text-2xl font-bold text-console-text">{internships.length}</div>
          <div className="text-[11px] text-status-green font-sans">Open for applications</div>
        </div>

        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>Verified Applicants</span>
            <Users className="w-4 h-4 text-bridge-teal" />
          </div>
          <div className="text-2xl font-bold text-bridge-teal">{totalApplicants}</div>
          <div className="text-[11px] text-console-text-muted font-sans">100% Pre-assessed candidates</div>
        </div>

        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>Integrity Guarantee</span>
            <ShieldCheck className="w-4 h-4 text-status-green" />
          </div>
          <div className="text-2xl font-bold text-status-green">0% Fraud</div>
          <div className="text-[11px] text-console-text-muted font-sans">Server-calculated match scores</div>
        </div>
      </div>

      {/* Active Internships & Candidate Pipeline Table */}
      <div className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Active Job Postings
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              Internship Requisitions
            </h3>
          </div>
          <span className="text-xs font-mono text-console-text-muted">
            {internships.length} Active Positions
          </span>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-industry-amber border-t-transparent rounded-full animate-spin" />
          </div>
        ) : internships.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Briefcase className="w-10 h-10 text-console-text-muted mx-auto opacity-40" />
            <div className="text-xs font-semibold text-console-text">No Active Job Postings</div>
            <p className="text-xs text-console-text-muted">
              Create your first internship posting with customized skill vector weights.
            </p>
            <Link
              to="/industry/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-industry-amber text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Position</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-console-border">
            {internships.map(job => (
              <div
                key={job.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-bold text-console-text">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-status-green/10 text-status-green border border-status-green/20">
                      {job.status}
                    </span>
                  </div>
                  <div className="text-xs text-console-text-muted font-mono flex flex-wrap items-center gap-3">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.workMode}</span>
                    <span>•</span>
                    <span>{job.stipend}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-xs hidden sm:block">
                    <div className="font-bold text-console-text">{job.applicantCount || 0} Applicants</div>
                    <div className="text-[10px] text-bridge-teal">Ranked by Vector Match</div>
                  </div>

                  <Link
                    to={`/industry/applicants/${job.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text hover:text-industry-amber text-xs font-semibold transition-colors"
                  >
                    <span>View Ranked Candidates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
