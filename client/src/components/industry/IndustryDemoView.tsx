import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Bot,
  Scale,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';

export const IndustryDemoView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'candidates' | 'roles' | 'analytics'>('candidates');

  // Candidate filters
  const [selectedUniversity, setSelectedUniversity] = useState('ALL');
  const [selectedSkill, setSelectedSkill] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);

  // Selected for comparison & modal details
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedCandidateDetailId, setSelectedCandidateDetailId] = useState<string | null>(null);
  const [activeRoleForApplicants, setActiveRoleForApplicants] = useState<string | null>(null);

  // 1. Fetch Dynamic Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['industryDemoStats'],
    queryFn: () => api.get<{ success: boolean; data: any }>('/industry/demo/stats'),
  });

  const stats = statsData?.data;

  // 2. Fetch Candidates
  const { data: candidatesData, isLoading: isLoadingCandidates } = useQuery({
    queryKey: [
      'industryDemoCandidates',
      selectedUniversity,
      selectedSkill,
      selectedBranch,
      searchQuery,
      scoreRange,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedUniversity !== 'ALL') params.append('university', selectedUniversity);
      if (selectedSkill !== 'ALL') params.append('skill', selectedSkill);
      if (selectedBranch !== 'ALL') params.append('branch', selectedBranch);
      if (searchQuery) params.append('search', searchQuery);
      if (scoreRange[0] > 0) params.append('minScore', scoreRange[0].toString());
      if (scoreRange[1] < 100) params.append('maxScore', scoreRange[1].toString());
      params.append('limit', '50');
      return api.get<{ success: boolean; data: { candidates: any[]; totalCount: number } }>(
        `/industry/demo/candidates?${params.toString()}`
      );
    },
  });

  const candidatesList = candidatesData?.data?.candidates || [];
  const totalCandidates = candidatesData?.data?.totalCount || 0;

  // 3. Fetch Opportunities
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ['industryDemoOpportunities'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/industry/demo/opportunities'),
  });

  const opportunities = opportunitiesData?.data || [];

  // 4. Fetch Role Applicants
  const { data: roleApplicantsData, isLoading: isLoadingRoleApplicants } = useQuery({
    queryKey: ['industryDemoRoleApplicants', activeRoleForApplicants],
    queryFn: () =>
      api.get<{ success: boolean; data: { opportunity: any; applicants: any[] } }>(
        `/industry/demo/opportunities/${activeRoleForApplicants}/applicants`
      ),
    enabled: !!activeRoleForApplicants,
  });

  // 5. Fetch Single Candidate Details
  const { data: candidateDetailData } = useQuery({
    queryKey: ['industryDemoCandidateDetail', selectedCandidateDetailId],
    queryFn: () =>
      api.get<{ success: boolean; data: any }>(
        `/industry/demo/candidates/${selectedCandidateDetailId}`
      ),
    enabled: !!selectedCandidateDetailId,
  });

  const candidateDetail = candidateDetailData?.data;

  // 6. Multi-Candidate Comparison Mutation (2 to 5)
  const compareMutation = useMutation({
    mutationFn: ({ candidateIds, opportunityId }: { candidateIds: string[]; opportunityId: string }) =>
      api.post<{ success: boolean; data: any }>('/industry/demo/compare', {
        candidateIds,
        opportunityId,
      }),
  });

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= 5) {
        alert('You can select up to 5 candidates for side-by-side comparison.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleOpenCopilotForRole = (roleId: string, candIds?: string[]) => {
    window.dispatchEvent(
      new CustomEvent('skillbridge:open-copilot', {
        detail: {
          opportunityId: roleId,
          candidateIds: candIds || selectedCandidateIds,
        },
      })
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-[#0b1329] to-indigo-950/80 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl shadow-blue-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="small-caps-label flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                DEMO DATASET MODE
              </span>
              <span className="text-xs font-mono text-slate-400">
                5 Source Datasets • 410 Total Records
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Recruiter Candidate Explorer & Benchmark Dataset
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Demonstrating candidate evaluation, explainable multi-skill matching, deterministic
              scoring, and Recruiter Copilot comparison across 410 candidate records from 4
              universities + SkillBridge Benchmark.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCopilotForRole(opportunities[0]?.id || '')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Recruiter Copilot</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Statistics Bar (Calculated Dynamically from Database) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Total Records</div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {stats?.totalRecords ?? 410}
          </div>
          <div className="text-[10px] text-emerald-400">410 Unique IDs</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Universities / Sources</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-400">
            {stats ? `${stats.universitiesCount} Unis + 1 Bench` : '4 + 1'}
          </div>
          <div className="text-[10px] text-slate-400">5 Data Sources</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Branches</div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {stats?.branchesCount ?? 8}
          </div>
          <div className="text-[10px] text-slate-400">Academic Fields</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Skills</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400">
            {stats?.skillsCount ?? 6}
          </div>
          <div className="text-[10px] text-slate-400">6 Categories</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Avg Skill Score</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">
            {stats?.averageScore ? `${stats.averageScore}%` : '71.52%'}
          </div>
          <div className="text-[10px] text-slate-400">Benchmark Avg</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Demo Requisitions</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-400">
            {stats?.opportunitiesCount ?? 6}
          </div>
          <div className="text-[10px] text-slate-400">{stats?.applicationsCount ?? 1374} Matches</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-[#0b1329] p-1.5 border border-[#1e293b] max-w-lg">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'candidates'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Candidate Explorer</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'roles'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Demo Roles & Matches</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dataset Analytics</span>
        </button>
      </div>

      {/* ── TAB 1: CANDIDATE EXPLORER ── */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate name or ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* University / Source filter */}
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Sources (5 Datasets)</option>
                <option value="SkillBridge Benchmark">SkillBridge Benchmark (150)</option>
                <option value="Sharda University">Sharda University (80)</option>
                <option value="Galgotias University">Galgotias University (50)</option>
                <option value="Bennett University">Bennett University (60)</option>
                <option value="Gautam Buddha University">Gautam Buddha University (70)</option>
              </select>

              {/* Skill filter */}
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Skills (6)</option>
                <option value="TypeScript">TypeScript</option>
                <option value="React.js">React.js</option>
                <option value="Express.js">Express.js</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="System Design & Architecture">System Design & Architecture</option>
                <option value="Technical Communication">Technical Communication</option>
              </select>
            </div>

            {/* Selection Counter & Comparison Trigger */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                Selected for Copilot: <strong>{selectedCandidateIds.length}/5</strong>
              </span>
              <button
                onClick={() => handleOpenCopilotForRole(opportunities[0]?.id || '')}
                disabled={selectedCandidateIds.length < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare Selected ({selectedCandidateIds.length})</span>
              </button>
            </div>
          </div>

          {/* Candidate Cards Grid */}
          {isLoadingCandidates ? (
            <div className="h-60 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : candidatesList.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No candidates match your filters</p>
              <p className="text-xs text-slate-400">Try adjusting your skill, university, or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {candidatesList.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.id);
                const skill = cand.skills?.[0] || { skill: 'Technical', skillScore: cand.averageScore };

                return (
                  <div
                    key={cand.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-500/10'
                        : 'bg-[#0b1329] border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {cand.studentName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#0f172a] border border-[#1e293b]">
                            {cand.externalStudentId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{cand.university}</p>
                        <p className="text-[11px] text-slate-500">{cand.branch}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-mono font-bold text-emerald-400">
                          {cand.averageScore}%
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                          Benchmark Skill Score
                        </span>
                      </div>
                    </div>

                    {/* Skill Representation (1 skill per candidate from dataset) */}
                    <div className="pt-2 border-t border-[#1e293b]/70 space-y-1.5">
                      <div className="text-[10.5px] text-slate-400 flex items-center justify-between">
                        <span>Dataset Skill:</span>
                        <span className="font-semibold text-blue-400 font-mono">
                          {skill.skill}: {skill.skillScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${skill.skillScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <button
                        onClick={() => setSelectedCandidateDetailId(cand.id)}
                        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile & Demo Context</span>
                      </button>

                      <button
                        onClick={() => handleToggleCandidate(cand.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#0f172a] text-slate-300 hover:bg-[#1e293b] border border-[#1e293b]'
                        }`}
                      >
                        {isSelected ? 'Selected' : '+ Select for Copilot'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: DEMO ROLES & APPLICANT MATCHING ── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {opp.department}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {opp.applicantCount} applicants
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{opp.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{opp.description}</p>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Required Skills ({opp.requiredSkills?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {opp.requiredSkills?.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#0f172a] text-slate-300 border border-[#1e293b]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1e293b]">
                  <button
                    onClick={() => setActiveRoleForApplicants(opp.id)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Matching Applicants</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenCopilotForRole(opp.id)}
                    className="p-2 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] text-blue-400 transition-colors"
                    title="Open Recruiter Copilot for this role"
                  >
                    <Bot className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Role Applicants Breakdown Modal / Drawer View */}
          {activeRoleForApplicants && roleApplicantsData?.data && (
            <div className="p-6 rounded-xl bg-[#0b1329] border border-blue-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                    [• ROLE APPLICANT PIPELINE & MULTI-SKILL MATCHING]
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {roleApplicantsData.data.opportunity.title} (
                    {roleApplicantsData.data.applicants.length} Applicants)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveRoleForApplicants(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#0f172a] border border-[#1e293b]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {roleApplicantsData.data.applicants.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{app.studentName}</h4>
                        <p className="text-slate-400 text-[11px]">{app.university}</p>
                        <p className="text-slate-500 text-[10px]">{app.branch}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-mono font-bold text-emerald-400">
                          {app.matchScore}%
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                          Deterministic Fit
                        </span>
                      </div>
                    </div>

                    {/* Skill Coverage Breakdown */}
                    <div className="p-2.5 rounded-lg bg-[#0b1329] border border-[#1e293b] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Skill Coverage:</span>
                        <span className="font-mono font-bold text-blue-400">
                          {app.skillCoverageRatio}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">
                          Known Dataset Skill:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {app.knownSkills.map((ks: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                            >
                              {ks.skill}: {ks.skillScore}%
                            </span>
                          ))}
                        </div>
                      </div>

                      {app.missingSkills.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 block mb-0.5">
                            Missing Role Skills:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {app.missingSkills.map((ms: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              >
                                {ms}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        Stage: <strong className="text-white">{app.stage}</strong>
                      </span>
                      <button
                        onClick={() =>
                          handleOpenCopilotForRole(activeRoleForApplicants, [app.candidateId])
                        }
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Compare in Copilot</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: DATASET ANALYTICS ── */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* University Breakdown Matrix */}
          <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              University & Source Performance Matrix (4 Universities + Benchmark)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {stats.universityBreakdown?.map((ub: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-2"
                >
                  <div className="text-xs font-bold text-white truncate">{ub.university}</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {ub.averageScore}%
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{ub.candidateCount} Students</span>
                    {ub.isBenchmark && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300">
                        Benchmark
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Supply Breakdown */}
          <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Skill Supply & Benchmark Score Distribution (6 Skills)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.skillBreakdown?.map((sb: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{sb.skill}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {sb.averageScore}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0b1329] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${sb.averageScore}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Category: {sb.category}</span>
                    <span>{sb.candidateCount} Candidates</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile & Simulated Assessment/Interview Modal */}
      {selectedCandidateDetailId && candidateDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-blue-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1e293b]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  DEMO CANDIDATE PROFILE
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {candidateDetail.candidate.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  {candidateDetail.candidate.university} • {candidateDetail.candidate.branch} (ID:{' '}
                  {candidateDetail.candidate.externalStudentId})
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidateDetailId(null)}
                className="p-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dataset Skill Card */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Benchmark Skill Score
              </span>
              {candidateDetail.candidate.skills?.map((sk: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{sk.skill}</div>
                    <div className="text-[11px] text-slate-400">{sk.skillCategory}</div>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {sk.skillScore}%
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Demo Assessment Context */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {candidateDetail.demoAssessment.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {candidateDetail.demoAssessment.percentileBand}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {candidateDetail.demoAssessment.disclaimer}
              </p>
              <div className="flex items-center justify-between pt-1 font-mono text-slate-300">
                <span>Skill Evaluated: {candidateDetail.demoAssessment.skillEvaluated}</span>
                <span className="font-bold text-emerald-400">
                  Score: {candidateDetail.demoAssessment.score}%
                </span>
              </div>
            </div>

            {/* Simulated Demo AI Interview Context */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {candidateDetail.demoInterview.badge}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {candidateDetail.demoInterview.readinessRating}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {candidateDetail.demoInterview.disclaimer}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded bg-[#0b1329] border border-[#1e293b]">
                  <div className="text-slate-400 text-[9px]">Technical</div>
                  <div className="font-bold text-white">
                    {candidateDetail.demoInterview.technicalScore}%
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0b1329] border border-[#1e293b]">
                  <div className="text-slate-400 text-[9px]">Communication</div>
                  <div className="font-bold text-white">
                    {candidateDetail.demoInterview.communicationScore}%
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0b1329] border border-[#1e293b]">
                  <div className="text-slate-400 text-[9px]">Problem Solving</div>
                  <div className="font-bold text-white">
                    {candidateDetail.demoInterview.problemSolvingScore}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidateDetailId(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
