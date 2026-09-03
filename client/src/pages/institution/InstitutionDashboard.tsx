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
        <div className="w-8 h-8 border-2 border-status-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-console-panel-raised via-console-panel to-console-bg border border-console-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/30 text-xs font-mono font-medium">
              Institutional Intelligence
            </span>
            <span className="text-xs font-mono text-console-text-muted">
              {user?.institutionProfile?.institutionName || 'Delhi Technological University'}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Batch Placement Readiness & Skill Heatmap
          </h1>
          <p className="text-xs text-console-text-muted max-w-xl leading-relaxed">
            Data-driven institutional analytics comparing batch competency vectors directly against real-time industry benchmark standards.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-console-panel p-4 rounded-2xl border border-console-border font-mono">
          <div className="text-center px-3">
            <div className="text-3xl font-bold text-status-green">
              {analytics.overallReadinessIndex}%
            </div>
            <div className="text-[10.5px] text-console-text-muted font-sans mt-0.5">Readiness Index</div>
          </div>
          <div className="w-px h-10 bg-console-border" />
          <div className="text-center px-3">
            <div className="text-3xl font-bold text-bridge-teal">
              {analytics.totalStudentsEnrolled}
            </div>
            <div className="text-[10.5px] text-console-text-muted font-sans mt-0.5">Active Cohort</div>
          </div>
        </div>
      </div>

      {/* Placement Readiness Tier Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-2">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>High-Tier Match (≥80%)</span>
            <CheckCircle2 className="w-4 h-4 text-status-green" />
          </div>
          <div className="text-2xl font-bold text-status-green">
            {analytics.readinessDistribution.highTier.percentage}%
          </div>
          <div className="text-[11px] text-console-text-muted font-sans">
            {analytics.readinessDistribution.highTier.count} students ready for fast-track recruitment
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-2">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>Medium-Tier (50–79%)</span>
            <TrendingUp className="w-4 h-4 text-status-amber" />
          </div>
          <div className="text-2xl font-bold text-status-amber">
            {analytics.readinessDistribution.mediumTier.percentage}%
          </div>
          <div className="text-[11px] text-console-text-muted font-sans">
            {analytics.readinessDistribution.mediumTier.count} students in active remediation
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-console-panel border border-console-border space-y-2">
          <div className="flex items-center justify-between text-xs text-console-text-muted font-sans">
            <span>Critical Skill Gaps (&lt;50%)</span>
            <AlertTriangle className="w-4 h-4 text-status-red" />
          </div>
          <div className="text-2xl font-bold text-status-red">
            {analytics.readinessDistribution.lowTier.percentage}%
          </div>
          <div className="text-[11px] text-console-text-muted font-sans">
            {analytics.readinessDistribution.lowTier.count} students requiring foundational focus
          </div>
        </div>
      </div>

      {/* Curriculum Gap Signals Heatmap */}
      <div className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Curriculum Health Index
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              Curriculum Gap Signals vs Industry Benchmark
            </h3>
          </div>
          <span className="text-xs font-mono text-status-amber bg-status-amber/10 px-2.5 py-1 rounded-md border border-status-amber/20">
            {analytics.curriculumGapSignals.filter((g: any) => g.severity === 'CRITICAL').length} Critical Gaps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-console-border text-console-text-muted font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Competency Area</th>
                <th className="pb-3 font-medium">Batch Average</th>
                <th className="pb-3 font-medium">Industry Benchmark</th>
                <th className="pb-3 font-medium">Gap Delta</th>
                <th className="pb-3 font-medium">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border/60">
              {analytics.curriculumGapSignals.map((sig: any, i: number) => {
                const isCritical = sig.severity === 'CRITICAL';
                return (
                  <tr key={i} className="hover:bg-console-panel-raised/50 transition-colors">
                    <td className="py-3.5 font-semibold text-console-text">
                      {sig.skillName}
                    </td>
                    <td className="py-3.5 font-mono text-bridge-teal font-semibold">
                      {sig.studentAvg}%
                    </td>
                    <td className="py-3.5 font-mono text-console-text-muted">
                      {sig.industryBenchmark}%
                    </td>
                    <td className="py-3.5 font-mono font-bold text-status-red">
                      -{sig.gap}%
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold border ${
                          isCritical
                            ? 'bg-status-red/15 text-status-red border-status-red/30'
                            : 'bg-status-amber/15 text-status-amber border-status-amber/30'
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
        <div className="lg:col-span-7 bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Actionable Insights
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              Board of Studies Syllabus Recommendations
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.syllabusRecommendations.map((rec: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-console-panel-raised border border-console-border space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-console-text">{rec.courseSubject}</span>
                  <span className="text-[10px] font-mono font-bold text-status-red bg-status-red/10 px-2 py-0.5 rounded">
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <p className="text-console-text-muted leading-relaxed">
                  {rec.suggestedAction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Hiring Corporate Partners */}
        <div className="lg:col-span-5 bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Enterprise Ecosystem
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              Top Corporate Hiring Partners
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.topHiringPartners.map((partner: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-console-text">{partner.name}</div>
                  <div className="text-[10.5px] font-mono text-console-text-muted">
                    {partner.activeOpenings} Active Openings
                  </div>
                </div>
                <span className="font-mono text-status-green font-bold">
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
