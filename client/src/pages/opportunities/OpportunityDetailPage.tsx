import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Clock,
  Send,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Calendar,
  DollarSign,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { OpportunitySummary, OpportunityMatchItem } from '@shared/types';
import { OpportunityMatchBreakdownView } from '../../components/opportunities/OpportunityMatchBreakdownView';
import { OpportunityApplyModal } from '../../components/opportunities/OpportunityApplyModal';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;
  const isStudent = user?.role === 'STUDENT';

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Fetch Opportunity Detail
  const { data: oppData, isLoading, error } = useQuery({
    queryKey: ['opportunityDetail', id],
    queryFn: () => api.get<{ opportunity: any }>(`/opportunities/${id}`),
    enabled: !!id,
  });

  const rawOpp = oppData?.opportunity;
  const opportunity: OpportunitySummary | null = rawOpp
    ? {
        id: rawOpp.id,
        title: rawOpp.title,
        description: rawOpp.description,
        type: rawOpp.type,
        industry: rawOpp.company?.industrySector || rawOpp.industry,
        location: rawOpp.location,
        remote: rawOpp.remote,
        workMode: rawOpp.workMode,
        experienceLevel: rawOpp.experienceLevel,
        educationRequirements: rawOpp.educationRequirements,
        stipend: rawOpp.stipend,
        duration: rawOpp.duration,
        applicationDeadline: rawOpp.applicationDeadline,
        status: rawOpp.status,
        createdAt: rawOpp.createdAt,
        company: {
          id: rawOpp.company?.id || '',
          name: rawOpp.company?.companyName || 'Company',
          website: rawOpp.company?.website,
          industry: rawOpp.company?.industrySector,
        },
        requiredSkills: (rawOpp.skills || rawOpp.requiredSkills || []).map((rs: any) => ({
          id: rs.id,
          skillId: rs.skillId,
          skillName: rs.skill?.name || rs.skillName || 'Skill',
          proficiencyLevel: rs.proficiencyLevel,
          weight: rs.weight,
          minScore: rs.minScore,
          isMandatory: rs.isMandatory,
        })),
        applicantCount: rawOpp._count?.applications || 0,
      }
    : null;

  // 2. Fetch Student Match Scores (if student)
  const { data: matchesData } = useQuery({
    queryKey: ['opportunityMatches'],
    queryFn: () => api.get<{ matches: OpportunityMatchItem[] }>('/opportunities/my/matches'),
    enabled: isStudent && !!studentProfileId,
  });

  const matchItem = matchesData?.matches?.find((m) => m.opportunityId === id);

  // 3. Fetch Saved Opportunities (if student)
  const { data: savedData } = useQuery({
    queryKey: ['savedOpportunities'],
    queryFn: () => api.get<{ savedOpportunities: any[] }>('/opportunities/saved/list'),
    enabled: isStudent && !!studentProfileId,
  });

  const isSaved = (savedData?.savedOpportunities || []).some(
    (s: any) => s.opportunity?.id === id || s.opportunityId === id
  );

  // 4. Fetch Student Applications (if student)
  const { data: appsData } = useQuery({
    queryKey: ['studentApplications', studentProfileId],
    queryFn: () => api.get<{ applications: any[] }>(`/applications/student/${studentProfileId}`),
    enabled: isStudent && !!studentProfileId,
  });

  const isApplied = (appsData?.applications || []).some((a: any) => a.opportunityId === id);

  // Save/Unsave mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      if (isSaved) {
        return api.delete(`/opportunities/${id}/save`);
      } else {
        return api.post(`/opportunities/${id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedOpportunities'] });
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white p-8 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-blue-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs text-slate-400 font-mono tracking-wider">LOADING OPPORTUNITY...</span>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-[#030712] text-white p-8 flex flex-col items-center justify-center font-sans space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <h2 className="text-xl font-bold">Opportunity Not Found</h2>
        <p className="text-xs text-slate-400">The requested listing may have expired, been paused, or removed.</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="px-4 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs font-semibold hover:border-slate-600 transition-colors"
        >
          Return to Opportunity Hub
        </button>
      </div>
    );
  }

  const deadlineFormatted = opportunity.applicationDeadline
    ? new Date(opportunity.applicationDeadline).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 lg:p-10 font-sans animate-fade-in space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/opportunities')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunity Hub</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-[#0b1329] border border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copySuccess ? 'Copied Link!' : 'Share'}</span>
          </button>

          {isStudent && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSaved
                  ? 'bg-blue-600/15 text-blue-400 border-blue-500/40'
                  : 'bg-[#0b1329] text-slate-400 border-[#1e293b] hover:text-white hover:border-slate-600'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-8 rounded-3xl bg-[#0b1329] border border-[#1e293b] shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-xl font-black text-blue-400 shrink-0">
              {opportunity.company.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{opportunity.company.name}</span>
                </span>
                {opportunity.company.website && (
                  <a
                    href={opportunity.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600/15 text-blue-400 border border-blue-500/30">
                  {opportunity.type}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {opportunity.title}
              </h1>

              {/* Badges and metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>{opportunity.location}</span>
                  <span className="text-white font-medium">({opportunity.workMode})</span>
                </span>

                {opportunity.stipend && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5 text-white">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>{opportunity.stipend}</span>
                    </span>
                  </>
                )}

                {opportunity.duration && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{opportunity.duration}</span>
                    </span>
                  </>
                )}

                {deadlineFormatted && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Calendar className="w-4 h-4" />
                      <span>Apply by {deadlineFormatted}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:self-center">
            {isApplied ? (
              <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted</span>
              </div>
            ) : isStudent ? (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Send className="w-4 h-4" />
                <span>Apply for Role</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-[#0f172a] text-xs text-slate-400 border border-[#1e293b]">
                Logged in as Recruiter / Guest
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Description & Skills Matrix */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Match Breakdown Card (if student) */}
          {isStudent && matchItem && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Authoritative 7-Factor Role Fit Evaluation</span>
              </h2>
              <OpportunityMatchBreakdownView match={matchItem} />
            </div>
          )}

          {/* Description */}
          <div className="p-7 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>Role Overview & Responsibilities</span>
            </h3>
            <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </div>
          </div>

          {/* Required Skills Matrix */}
          <div className="p-7 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Skills & Competency Verification Matrix</span>
              </h3>
              <span className="text-xs text-slate-400">
                {opportunity.requiredSkills.filter((s) => s.isMandatory).length} Mandatory •{' '}
                {opportunity.requiredSkills.filter((s) => !s.isMandatory).length} Preferred
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Skill</th>
                    <th className="py-3 px-3">Requirement</th>
                    <th className="py-3 px-3">Target Benchmark</th>
                    <th className="py-3 px-3">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {opportunity.requiredSkills.map((rs, idx) => (
                    <tr key={idx} className="hover:bg-[#0f172a]/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white">{rs.skillName}</span>
                      </td>
                      <td className="py-3 px-3">
                        {rs.isMandatory ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                            <span>MANDATORY</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0f172a] text-slate-400 border border-[#1e293b] w-fit">
                            PREFERRED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-white">≥ {rs.minScore || 70}%</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-400">{rs.weight || 3} / 5</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details & Company Summary */}
        <div className="space-y-6">
          {/* Quick Specifications */}
          <div className="p-6 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opportunity Specifications</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400">Role Type</span>
                <span className="font-semibold text-white">{opportunity.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400">Work Arrangement</span>
                <span className="font-semibold text-white">{opportunity.workMode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e293b]">
                <span className="text-slate-400">Experience Level</span>
                <span className="font-semibold text-white">{opportunity.experienceLevel}</span>
              </div>
              {opportunity.educationRequirements && (
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-slate-400">Education</span>
                  <span className="font-semibold text-white text-right">{opportunity.educationRequirements}</span>
                </div>
              )}
              {opportunity.stipend && (
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-slate-400">Compensation</span>
                  <span className="font-semibold text-emerald-400">{opportunity.stipend}</span>
                </div>
              )}
              {opportunity.duration && (
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-semibold text-white">{opportunity.duration}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Date Posted</span>
                <span className="font-semibold text-white">
                  {new Date(opportunity.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Company Card */}
          <div className="p-6 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center font-bold text-blue-400">
                {opportunity.company.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{opportunity.company.name}</h4>
                <p className="text-[11px] text-slate-400">{opportunity.company.industry || 'Industry Partner'}</p>
              </div>
            </div>

            {opportunity.company.website && (
              <a
                href={opportunity.company.website}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-slate-600 text-xs text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Visit Company Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <OpportunityApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        opportunity={opportunity}
        matchItem={matchItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['opportunityDetail', id] });
          queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
        }}
      />
    </div>
  );
};

export default OpportunityDetailPage;
