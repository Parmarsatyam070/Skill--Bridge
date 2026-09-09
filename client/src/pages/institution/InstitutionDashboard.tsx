import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const institutionProfileId = user?.institutionProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['institutionAnalytics', institutionProfileId],
    queryFn: () => api.get<{ analytics: any }>(`/institutions/${institutionProfileId || 'default'}/analytics`),
  });

  const analytics = data?.analytics;

  if (isLoading || !analytics) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header — Institutional Intelligence */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="small-caps-label flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f172a] text-[#4CC38A] border border-[#4CC38A]/30 text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CC38A] animate-pulse" />
              Institutional Intelligence
            </span>
            <span className="text-xs font-mono text-slate-400">
              {user?.institutionProfile?.institutionName || 'Accredited Academic Institution'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Batch Placement Readiness & Skill Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Data-driven institutional analytics comparing batch competency vectors directly against real-time industry benchmark standards.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0f172a] p-4 rounded-2xl border border-[#1e293b] font-mono shrink-0">
          <div className="text-center px-3">
            <div className="text-3xl font-bold text-[#4CC38A]">
              {analytics.overallReadinessIndex}%
            </div>
            <div className="text-[10.5px] text-slate-400 font-sans mt-0.5">Readiness Index</div>
          </div>
          <div className="w-px h-10 bg-[#1e293b]" />
          <div className="text-center px-3">
            <div className="text-3xl font-bold text-blue-400">
              {analytics.totalStudentsEnrolled}
            </div>
            <div className="text-[10.5px] text-slate-400 font-sans mt-0.5">Active Cohort</div>
          </div>
        </div>
      </div>

      {/* Placement Readiness Tier Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono">
        <div className="p-5 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span>High-Tier Match (≥80%)</span>
            <CheckCircle2 className="w-4 h-4 text-[#4CC38A]" />
          </div>
          <div className="text-2xl font-bold text-[#4CC38A]">
            {analytics.readinessDistribution.highTier.percentage}%
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {analytics.readinessDistribution.highTier.count} students ready for fast-track recruitment
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span>Medium-Tier (50–79%)</span>
            <TrendingUp className="w-4 h-4 text-[#E8A23C]" />
          </div>
          <div className="text-2xl font-bold text-[#E8A23C]">
            {analytics.readinessDistribution.mediumTier.percentage}%
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {analytics.readinessDistribution.mediumTier.count} students in active remediation
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span>Critical Skill Gaps (&lt;50%)</span>
            <AlertTriangle className="w-4 h-4 text-[#E5637C]" />
          </div>
          <div className="text-2xl font-bold text-[#E5637C]">
            {analytics.readinessDistribution.lowTier.percentage}%
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {analytics.readinessDistribution.lowTier.count} students requiring foundational focus
          </div>
        </div>
      </div>

      {/* Curriculum Gap Signals Heatmap */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block">
              Curriculum Health Index
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Curriculum Gap Signals vs Industry Benchmark
            </h3>
          </div>
          <span className="text-xs font-mono text-[#E8A23C] bg-[#0f172a] px-2.5 py-1 rounded-md border border-[#E8A23C]/30">
            {analytics.curriculumGapSignals.filter((g: any) => g.severity === 'CRITICAL').length} Critical Gaps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Competency Area</th>
                <th className="pb-3 font-medium">Batch Average</th>
                <th className="pb-3 font-medium">Industry Benchmark</th>
                <th className="pb-3 font-medium">Gap Delta</th>
                <th className="pb-3 font-medium">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {analytics.curriculumGapSignals.map((sig: any, i: number) => {
                const isCritical = sig.severity === 'CRITICAL';
                return (
                  <tr key={i} className="hover:bg-[#0f172a]/50 transition-colors">
                    <td className="py-3.5 font-semibold text-white">
                      {sig.skillName}
                    </td>
                    <td className="py-3.5 font-mono text-blue-400 font-semibold">
                      {sig.studentAvg}%
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {sig.industryBenchmark}%
                    </td>
                    <td className="py-3.5 font-mono font-bold text-[#E5637C]">
                      -{sig.gap}%
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold border ${
                          isCritical
                            ? 'bg-[#0f172a] text-[#E5637C] border-[#E5637C]/30'
                            : 'bg-[#0f172a] text-[#E8A23C] border-[#E8A23C]/30'
                        }`}
                      >
                        {sig.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Syllabus Upgrade Recommendations & Hiring Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Syllabus Upgrade Recommendations */}
        <div className="lg:col-span-7 bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block">
              Actionable Insights
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Board of Studies Syllabus Recommendations
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.syllabusRecommendations.map((rec: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{rec.courseSubject}</span>
                  <span className="text-[10px] font-mono font-semibold text-[#E5637C] bg-[#E5637C]/10 border border-[#E5637C]/20 px-2 py-0.5 rounded">
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {rec.suggestedAction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Hiring Corporate Partners */}
        <div className="lg:col-span-5 bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block">
              Enterprise Ecosystem
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Top Corporate Hiring Partners
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.topHiringPartners.map((partner: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{partner.name}</div>
                  <div className="text-[10.5px] font-mono text-slate-400">
                    {partner.activeOpenings} Active Openings
                  </div>
                </div>
                <span className="font-mono text-[#4CC38A] font-bold">
                  {partner.hiresCount} Hires
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
