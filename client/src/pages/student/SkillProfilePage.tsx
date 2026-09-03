import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { DomainRecommendation } from '@shared/types';

export const SkillProfilePage: React.FC = () => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;

  const [selectedDomain, setSelectedDomain] = useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedAddDomain, setPreselectedAddDomain] = useState<string | null>(null);

  // 1. Fetch Student's Tracked Domains (only domains user has actually added)
  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: ['studentDomains', studentProfileId],
    queryFn: () => api.get<{ domains: any[] }>(`/students/${studentProfileId}/domains`),
    enabled: !!studentProfileId,
  });

  const trackedDomains = domainsData?.domains || [];

  // If student has no tracked domains after load, trigger modal
  useEffect(() => {
    if (!domainsLoading && trackedDomains.length === 0) {
      setIsAddModalOpen(true);
    } else if (trackedDomains.length > 0) {
      // If current selectedDomain is not in trackedDomains, set to first one
      const exists = trackedDomains.some(d => d.domainName === selectedDomain);
      if (!exists && trackedDomains[0]) {
        setSelectedDomain(trackedDomains[0].domainName);
      }
    }
  }, [domainsLoading, trackedDomains]);

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

  const handleDomainAdded = (newDomainName: string) => {
    setSelectedDomain(newDomainName);
  };

  if (domainsLoading || radarLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-console-text-muted">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-console-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 text-xs font-mono font-medium">
              Verified Competency Matrix
            </span>
            <span className="text-xs font-mono text-console-text-muted">
              Dynamic Recency-Weighted Vector Engine
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text mt-1">
            Skill Profile & Verification
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-console-panel border border-console-border rounded-xl p-1 gap-1">
            {trackedDomains.map(d => (
              <button
                key={d.domainId}
                type="button"
                onClick={() => setSelectedDomain(d.domainName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedDomain === d.domainName
                    ? 'bg-bridge-teal text-white shadow-sm'
                    : 'text-console-text-muted hover:text-console-text'
                }`}
              >
                {d.domainName}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddDomain()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text text-xs font-semibold font-mono transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-bridge-teal" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SkillRadarCard
            studentSkills={studentSkills}
            benchmarks={benchmarks}
            targetDomain={selectedDomain}
          />
        </div>

        <div className="lg:col-span-5 bg-console-panel border border-console-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Skill Vector Breakdown • {selectedDomain}
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text mb-4">
              Competency Vector Stats
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4 font-mono">
              <div className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border">
                <div className="text-xl font-bold text-status-green">
                  {strengthsCount}
                </div>
                <div className="text-[11px] text-console-text-muted font-sans mt-0.5">Met Standards (Strengths)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border">
                <div className="text-xl font-bold text-status-amber">
                  {gapsCount}
                </div>
                <div className="text-[11px] text-console-text-muted font-sans mt-0.5">Identified Gaps</div>
              </div>
            </div>

            <p className="text-xs text-console-text-muted leading-relaxed">
              Every vector on this radar responds <strong className="text-console-text">dynamically in both directions</strong> (up on good attempts, down on poor retakes). Inactivity decay gently reduces unpracticed skills after 30 days.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-bridge-teal/10 border border-bridge-teal/20 text-xs text-bridge-teal font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 flex-shrink-0" />
              <span>Rolling Recency & Decay Active</span>
            </div>
            <Link to="/learn" className="text-xs font-bold text-bridge-teal underline hover:text-white">
              Explore /learn →
            </Link>
          </div>
        </div>
      </div>

      <CareerRoadmap targetDomain={selectedDomain} />

      <div className="bg-console-panel border border-console-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Granular Skill Scores & History
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              {selectedDomain} Competency Inventory
            </h3>
          </div>
          <span className="text-xs font-mono text-console-text-muted">
            {benchmarks.length} Required Skills
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-console-border text-console-text-muted font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Skill Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Current Score & Delta</th>
                <th className="pb-3 font-medium">Industry Target</th>
                <th className="pb-3 font-medium">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border/60">
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
                    <tr className="hover:bg-console-panel-raised/50 transition-colors">
                      <td className="py-3 font-semibold text-console-text">
                        <div className="flex items-center gap-2">
                          <span>{b.skillName}</span>
                          {isDecayed && (
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40" title={`Score reduced by ${s.inactivityDecayPct}% due to ${s.decayDaysCount} days of inactivity`}>
                              ↓ Inactive {s.decayDaysCount}d (-{s.inactivityDecayPct}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono capitalize bg-console-panel-raised border border-console-border text-console-text-muted">
                          {b.category || 'technical'}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-bridge-teal">
                        <div className="flex items-center gap-1.5">
                          <span>{currentScore}%</span>
                          {delta > 0 && (
                            <span className="text-emerald-400 text-[11px] font-bold bg-emerald-950/40 px-1 rounded border border-emerald-800/40">
                              ▲ +{delta}%
                            </span>
                          )}
                          {delta < 0 && (
                            <span className="text-rose-400 text-[11px] font-bold bg-rose-950/40 px-1 rounded border border-rose-800/40">
                              ▼ {delta}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-console-text-muted">{b.benchmarkScore}%</td>
                      <td className="py-3">
                        {isMet ? (
                          <span className="inline-flex items-center gap-1 text-status-green font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Standard Met</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-status-amber font-mono text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Gap (-{b.benchmarkScore - currentScore}%)</span>
                          </span>
                        )}
                      </td>
                    </tr>

                    {!isMet && matchedGap && matchedGap.resources && matchedGap.resources.length > 0 && (
                      <tr className="bg-slate-900/40">
                        <td colSpan={5} className="py-2.5 px-3 border-l-2 border-amber-500/60 pl-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Recommended Gap Accelerators:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {matchedGap.resources.slice(0, 2).map((res: any, rIdx: number) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-[11px] transition-colors"
                                >
                                  <span>{res.title}</span>
                                  <span className="text-slate-400 text-[10px]">({res.provider})</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              ))}
                              <Link
                                to="/learn"
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1"
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

      {recommendations.length > 0 && (
        <div className="bg-console-panel border border-console-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-console-border">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-status-amber" />
                <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted">
                  Career Trajectory Intelligence
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-console-text mt-0.5">
                Recommended Domains for You
              </h3>
            </div>
            <span className="text-[11px] font-mono text-console-text-muted bg-console-panel-raised px-2.5 py-1 rounded-md border border-console-border">
              Ranked by 60% Skill Overlap + 40% Earning Potential
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(rec => (
              <div
                key={rec.domainId}
                className="p-5 rounded-xl bg-console-panel-raised border border-console-border flex flex-col justify-between space-y-4 hover:border-bridge-teal/50 transition-all group shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10.5px] font-mono font-semibold rounded bg-status-green/15 text-status-green border border-status-green/20">
                      {rec.avgSalaryDisplay} Indicative Avg
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      rec.readinessTier === 'High Readiness'
                        ? 'bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30'
                        : 'bg-status-amber/15 text-status-amber border border-status-amber/30'
                    }`}>
                      {rec.readinessTier}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-console-text group-hover:text-bridge-teal transition-colors">
                    {rec.domainName}
                  </h4>

                  <p className="text-xs text-console-text-muted leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-console-text-muted">Skill Overlap:</span>
                      <span className="font-bold text-bridge-teal">{rec.skillOverlapPercentage}% match</span>
                    </div>
                    <div className="w-full h-1.5 bg-console-bg rounded-full overflow-hidden border border-console-border">
                      <div
                        className="h-full bg-bridge-teal rounded-full"
                        style={{ width: `${rec.skillOverlapPercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-console-text-muted block">
                      {rec.overlappingSkillsCount} of {rec.totalRequiredSkills} competencies already familiar
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-console-border/60">
                  <button
                    type="button"
                    onClick={() => handleOpenAddDomain(rec.domainId)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-bridge-teal/15 hover:bg-bridge-teal text-bridge-teal hover:text-white border border-bridge-teal/30 text-xs font-semibold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Track this Domain →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-console-text-muted font-mono pt-1">
            * Market salary benchmarks are sourced from India Skills Report & National Industry Standards (indicative average compensation, not guaranteed).
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {studentProfileId && (
        <AddDomainModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          studentId={studentProfileId}
          onDomainAdded={handleDomainAdded}
          preselectedDomainId={preselectedAddDomain}
        />
      )}
    </div>
  );
};
