import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Radar,
  Award,
  AlertCircle,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Filter,
  Plus,
  Sparkles,
  ArrowRight,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SkillRadarCard } from '../../components/SkillRadarCard';
import { CareerRoadmap } from '../../components/CareerRoadmap';
import { AddDomainModal } from '../../components/profile/AddDomainModal';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';
import { MatchCard } from '../../components/MatchCard';
import { TodayTargetCard } from '../../components/TodayTargetCard';
import { DomainRecommendation } from '@shared/types';

const DEFAULT_DOMAINS = [
  { domainId: 'domain-web', domainName: 'Full-Stack Web' },
  { domainId: 'domain-ai', domainName: 'AI/Data Science' },
];

export const SkillProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const storageKey = `skillbridge_tracked_domains_${studentProfileId || 'default'}`;
  const [localDomains, setLocalDomains] = useState<Array<{ domainId: string; domainName: string }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDomain, setSelectedDomain] = useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedAddDomain, setPreselectedAddDomain] = useState<string | null>(null);

  // 1. Fetch Student's Tracked Domains from server
  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: ['studentDomains', studentProfileId],
    queryFn: () => api.get<{ domains: any[] }>(`/students/${studentProfileId}/domains`),
    enabled: !!studentProfileId,
  });

  // Merge default baseline domains with server domains and local domains
  const trackedDomains = React.useMemo(() => {
    const map = new Map<string, { domainId: string; domainName: string }>();
    DEFAULT_DOMAINS.forEach(d => map.set(d.domainName, d));
    (domainsData?.domains || []).forEach((d: any) => {
      const name = d.domainName || d.name;
      if (name) map.set(name, { domainId: d.domainId || d.id || name, domainName: name });
    });
    localDomains.forEach(d => {
      if (d.domainName) map.set(d.domainName, d);
    });
    return Array.from(map.values());
  }, [domainsData?.domains, localDomains]);

  // Ensure current selectedDomain is valid among trackedDomains
  useEffect(() => {
    if (trackedDomains.length > 0) {
      const exists = trackedDomains.some(d => d.domainName === selectedDomain);
      if (!exists && trackedDomains[0]) {
        setSelectedDomain(trackedDomains[0].domainName);
      }
    }
  }, [trackedDomains, selectedDomain]);

  // 2. Fetch Domain-Specific Radar Data when selectedDomain changes
  const { data: radarData, isLoading: radarLoading } = useQuery({
    queryKey: ['radarData', studentProfileId, selectedDomain],
    queryFn: () => api.get<{ domain: string; benchmarks: any[]; studentSkills: any[] }>(
      `/students/${studentProfileId}/radar?domain=${encodeURIComponent(selectedDomain)}`
    ),
    enabled: !!studentProfileId && !!selectedDomain,
  });

  // 3. Fetch "Recommended for You" Higher-Earning Domains
  const { data: recData } = useQuery({
    queryKey: ['domainRecommendations', studentProfileId],
    queryFn: () => api.get<{ recommendations: DomainRecommendation[] }>(`/students/${studentProfileId}/recommendations`),
    enabled: !!studentProfileId,
  });

  const { data: gapResourcesData } = useQuery<{
    gaps: { skillName: string; currentScore: number; benchmarkScore: number; gap: number; resources: any[] }[];
  }>({
    queryKey: ['studentGapResources', studentProfileId],
    queryFn: () => api.get(`/resources/gaps/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const benchmarks = radarData?.benchmarks || [];
  const studentSkills = radarData?.studentSkills || [];
  const recommendations = recData?.recommendations || [];
  const gapResources = gapResourcesData?.gaps || [];

  const handleOpenAddDomain = (domainIdToPreselect?: string) => {
    setPreselectedAddDomain(domainIdToPreselect || null);
    setIsAddModalOpen(true);
  };

  const handleDomainAdded = (newDomainName: string, newDomainId?: string) => {
    const entry = { domainId: newDomainId || newDomainName, domainName: newDomainName };
    setLocalDomains(prev => {
      if (prev.some(d => d.domainName === newDomainName)) return prev;
      const updated = [...prev, entry];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    queryClient.invalidateQueries({ queryKey: ['studentDomains', studentProfileId] });
    setSelectedDomain(newDomainName);
    setIsAddModalOpen(false);
    setPreselectedAddDomain(null);
  };

  if (domainsLoading || radarLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Calibrating domain skill radar vectors...</p>
        </div>
      </div>
    );
  }

  const strengthsCount = studentSkills.filter((s: any) => {
    const b = benchmarks.find((item: any) => item.skillId === s.skillId);
    return b && s.score >= b.benchmarkScore;
  }).length;

  const gapsCount = studentSkills.filter((s: any) => {
    const b = benchmarks.find((item: any) => item.skillId === s.skillId);
    return b && s.score < b.benchmarkScore;
  }).length;

  return (
    <div className="space-y-8 font-sans pb-12">
      <DailyPracticeBanner />

      {/* Sash Daily Target — full-detail card */}
      <TodayTargetCard variant="full" />

      {/* Header & Tracked Domains Pill Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2">
            <span className="small-caps-label px-2.5 py-0.5 rounded-full bg-[#0b1329] text-blue-400 border border-blue-500/30 font-semibold">
              Verified Competency Matrix
            </span>
            <span className="text-xs font-mono text-slate-400">
              Dynamic Recency-Weighted Vector Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-1">
            Skill Profile & Verification
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#0b1329] border border-[#1e293b] rounded-xl p-1 gap-1 overflow-x-auto max-w-full touch-pan-x">
            {trackedDomains.map(d => (
              <button
                key={d.domainId || d.domainName}
                type="button"
                onClick={() => setSelectedDomain(d.domainName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
                  selectedDomain === d.domainName
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-[#0f172a]'
                }`}
              >
                {d.domainName}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddDomain()}
            className="bridge-btn-secondary text-xs py-1.5 px-3.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-blue-400" />
            <span>+ Add Domain</span>
          </button>
        </div>
      </div>

      {/* Selected Domain Practice Set Launcher Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1329] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="small-caps-label text-[10px] text-blue-400 block font-semibold">
              {selectedDomain} Assessment & Verification • 25 Mins
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-white mt-0.5">
              Take Timed Practice Sets in {selectedDomain}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verify competencies against industry benchmarks and elevate your skill radar.
            </p>
          </div>
        </div>

        <Link
          to={`/assessment?domain=${encodeURIComponent(selectedDomain)}`}
          className="bridge-btn-primary text-xs py-2 px-4 shrink-0"
        >
          <span>Practice {selectedDomain} Sets</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </div>

      {/* Skill Radar & Vector Breakdown Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SkillRadarCard
            studentSkills={studentSkills}
            benchmarks={benchmarks}
            targetDomain={selectedDomain}
          />
        </div>

        <div className="lg:col-span-5 bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <span className="small-caps-label block mb-1">
              Skill Vector Breakdown • {selectedDomain}
            </span>
            <h3 className="text-lg font-semibold text-white mb-4">
              Competency Vector Stats
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <MatchCard
                label="MET BENCHMARKS"
                value={strengthsCount}
                subValue="Strengths Verified"
                icon={CheckCircle2}
                variant="raised"
              />
              <MatchCard
                label="IDENTIFIED GAPS"
                value={gapsCount}
                subValue="Prioritized for Elevation"
                icon={AlertCircle}
                variant="raised"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Every vector on this radar responds <strong className="text-white">dynamically in both directions</strong> (up on good attempts, down on poor retakes). Inactivity decay gently reduces unpracticed skills after 30 days.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Rolling Recency & Decay Active</span>
            </div>
            <Link to="/learn" className="text-xs font-medium text-blue-400 hover:text-blue-300 underline">
              Explore /learn →
            </Link>
          </div>
        </div>
      </div>

      <CareerRoadmap targetDomain={selectedDomain} />

      {/* Competency Inventory Table */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <span className="small-caps-label block">
              Granular Skill Scores & History
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {selectedDomain} Competency Inventory
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {benchmarks.length} Required Skills
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Skill Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Current Score & Delta</th>
                <th className="pb-3 font-medium">Industry Target</th>
                <th className="pb-3 font-medium">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {benchmarks.map((b: any) => {
                const s = studentSkills.find((item: any) => item.skillId === b.skillId);
                const currentScore = s ? s.score : 0;
                const isMet = currentScore >= b.benchmarkScore;
                const delta = s?.delta || 0;
                const isDecayed = s?.isDecayed || (s?.inactivityDecayPct && s.inactivityDecayPct > 0);

                const matchedGap = gapResources.find(g =>
                  g.skillName.toLowerCase() === b.skillName.toLowerCase() ||
                  b.skillName.toLowerCase().includes(g.skillName.toLowerCase())
                );

                return (
                  <React.Fragment key={b.skillId}>
                    <tr className="hover:bg-[#0f172a] transition-colors">
                      <td className="py-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{b.skillName}</span>
                          {isDecayed && (
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30" title={`Score reduced by ${s.inactivityDecayPct}% due to ${s.decayDaysCount} days of inactivity`}>
                              ↓ Inactive {s.decayDaysCount}d (-{s.inactivityDecayPct}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono capitalize bg-[#0f172a] border border-[#1e293b] text-slate-400">
                          {b.category || 'technical'}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>{currentScore}%</span>
                          {delta > 0 && (
                            <span className="text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-1 rounded border border-emerald-500/30">
                              ▲ +{delta}%
                            </span>
                          )}
                          {delta < 0 && (
                            <span className="text-rose-400 text-[11px] font-medium bg-rose-500/10 px-1 rounded border border-rose-500/30">
                              ▼ {delta}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {b.benchmarkScore}%
                      </td>
                      <td className="py-3">
                        {isMet ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Benchmark Met
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" />
                            -{b.benchmarkScore - currentScore}% Gap
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Quick Course / Resource Recommendation Row if there is a gap */}
                    {!isMet && matchedGap && matchedGap.resources && matchedGap.resources.length > 0 && (
                      <tr className="bg-[#0f172a]/50">
                        <td colSpan={5} className="py-2.5 px-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="text-[11px]">Recommended Remediation:</span>
                              <strong className="text-white font-medium text-[11px]">
                                {matchedGap.resources[0].title}
                              </strong>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({matchedGap.resources[0].provider} • {matchedGap.resources[0].durationHours || 4}h)
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <a
                                href={matchedGap.resources[0].externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                              >
                                <span>Enroll</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <Link
                                to="/learn"
                                className="text-[11px] text-slate-400 hover:text-white font-medium underline ml-1"
                              >
                                View all →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Domains for You */}
      {recommendations.length > 0 && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1e293b]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="small-caps-label text-slate-400">
                  Career Trajectory Intelligence
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mt-0.5">
                Recommended Domains for You
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-[#0f172a] px-2.5 py-1 rounded-md border border-[#1e293b]">
              Ranked by 60% Skill Overlap + 40% Earning Potential
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div
                key={rec.domainId}
                className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all group shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10.5px] font-mono font-medium rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {rec.avgSalaryDisplay} Indicative Avg
                    </span>
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                      rec.readinessTier === 'High Readiness'
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {rec.readinessTier}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {rec.domainName}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Skill Overlap:</span>
                      <span className="font-bold text-blue-400">{rec.skillOverlapPercentage}% match</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0b1329] rounded-full overflow-hidden border border-[#1e293b]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                        style={{ width: `${rec.skillOverlapPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {rec.overlappingSkillsCount} of {rec.totalRequiredSkills} competencies already familiar
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => handleOpenAddDomain(rec.domainId)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b1329] hover:bg-[#1e293b] text-white border border-[#1e293b] text-xs font-semibold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Track this Domain →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-1">
            * Market salary benchmarks are sourced from India Skills Report & National Industry Standards (indicative average compensation, not guaranteed).
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {studentProfileId && (
        <AddDomainModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setPreselectedAddDomain(null);
          }}
          studentId={studentProfileId}
          onDomainAdded={handleDomainAdded}
          preselectedDomainId={preselectedAddDomain}
        />
      )}
    </div>
  );
};

export default SkillProfilePage;
