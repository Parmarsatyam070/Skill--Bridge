import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  Plus,
  ArrowRight,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

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
    <div className="space-y-6 font-sans">
      {/* Header — Enterprise Recruitment Command Center */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md shadow-xl shadow-blue-950/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="small-caps-label flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f172a] text-[#E8A23C] border border-[#E8A23C]/30 text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8A23C] animate-pulse" />
              Verified Enterprise Recruiter
            </span>
            <span className="text-xs font-mono text-slate-400">
              {user?.industryProfile?.companyName || user?.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recruitment Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Direct access to verified student talent evaluated through standardized academic benchmarks and accredited partner courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('skillbridge:open-copilot'))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/50 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            aria-label="Open Recruiter Copilot Assistant"
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Recruiter Copilot (AI)</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          </button>

          <Link
            to="/industry/post-job"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Internship</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 font-mono">
        <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="small-caps-label text-[10px] text-slate-400">[• ACTIVE POSTINGS]</span>
            <Briefcase className="w-4 h-4 text-[#E8A23C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white pt-1">{internships.length}</div>
          <div className="text-[11px] text-[#4CC38A] font-sans">Open for applications</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="small-caps-label text-[10px] text-slate-400">[• VERIFIED APPLICANTS]</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 pt-1">{totalApplicants}</div>
          <div className="text-[11px] text-slate-400 font-sans">100% Pre-assessed candidates</div>
        </div>
      </div>

      {/* Active Internships & Candidate Pipeline Table */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <span className="small-caps-label text-[10px] text-slate-400 block">
              [• ACTIVE REQUISITIONS]
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Internship Requisitions
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#0f172a] px-2.5 py-1 rounded-md border border-[#1e293b]">
            {internships.length} Active Positions
          </span>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : internships.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Briefcase className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
            <div className="text-xs font-semibold text-white">No Active Job Postings</div>
            <p className="text-xs text-slate-400">
              Create your first internship posting with customized skill vector weights.
            </p>
            <Link
              to="/industry/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Position</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1e293b]/70">
            {internships.map(job => (
              <div
                key={job.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-1 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-white">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4CC38A]/10 text-[#4CC38A] border border-[#4CC38A]/20">
                      {job.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-3">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.workMode}</span>
                    <span>•</span>
                    <span>{job.stipend}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-xs hidden sm:block">
                    <div className="font-bold text-white">{job.applicantCount || 0} Applicants</div>
                    <div className="text-[10.5px] text-blue-400">Ranked by Vector Match</div>
                  </div>

                  <Link
                    to={`/industry/applicants/${job.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-slate-200 hover:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
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
