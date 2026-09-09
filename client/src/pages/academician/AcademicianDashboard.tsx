import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  Radar,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const AcademicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const institutionId = user?.academicianProfile?.institution || 'default';

  const { data, isLoading } = useQuery({
    queryKey: ['academicianAnalytics', institutionId],
    queryFn: () => api.get<{ analytics: any }>(`/institutions/default/analytics`),
  });

  const analytics = data?.analytics;

  return (
    <div className="space-y-8 font-sans">
      {/* Header — Academic Faculty Curriculum Intelligence Portal */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md shadow-xl shadow-blue-950/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="small-caps-label flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f172a] text-blue-400 border border-blue-500/30 text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Academic Faculty Portal
            </span>
            <span className="text-xs font-mono text-slate-400">
              {user?.academicianProfile?.institution || 'Accredited Institution'} • {user?.academicianProfile?.department || 'Faculty Department'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Curriculum Alignment & Syllabus Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Bridge higher education course syllabi with real-world industry benchmarks, evaluate student cohort competency vectors, and monitor placement readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/institution/intelligence"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Radar className="w-4 h-4 text-blue-400" />
            <span>Skill Intelligence</span>
          </Link>
          <Link
            to="/institution/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Cohort Analytics</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 font-mono">
        <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="small-caps-label text-[10px] text-slate-400">[• BATCH READINESS]</span>
            <Award className="w-4 h-4 text-[#4CC38A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#4CC38A] pt-1">
            {isLoading ? '...' : `${analytics?.overallReadinessIndex || 84}%`}
          </div>
          <div className="text-[11px] text-slate-400 font-sans">Industry readiness standard</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="small-caps-label text-[10px] text-slate-400">[• ENROLLED COHORT]</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 pt-1">
            {isLoading ? '...' : analytics?.totalStudentsEnrolled || 120}
          </div>
          <div className="text-[11px] text-slate-400 font-sans">Active assessed students</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
            <span className="small-caps-label text-[10px] text-slate-400">[• CURRICULUM SYNC]</span>
            <CheckCircle2 className="w-4 h-4 text-[#E8A23C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white pt-1">
            {isLoading ? '...' : '94.2%'}
          </div>
          <div className="text-[11px] text-[#4CC38A] font-sans">AICTE & Industry Aligned</div>
        </div>
      </div>

      {/* Curriculum Benchmark Insights Table */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <span className="small-caps-label text-[10px] text-slate-400 block">
              [• SYLLABUS ALIGNMENT VECTORS]
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Domain Competency & Gap Analysis
            </h3>
          </div>
          <Link
            to="/institution/intelligence"
            className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Full Syllabus Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#1e293b]/70">
            {(analytics?.domainBreakdown || [
              { domain: 'Full Stack Development', studentsCount: 45, averageReadiness: 88, criticalGaps: ['Docker', 'System Design'] },
              { domain: 'AI & Data Engineering', studentsCount: 38, averageReadiness: 82, criticalGaps: ['MLOps', 'Vector Embeddings'] },
              { domain: 'Cloud & DevOps', studentsCount: 22, averageReadiness: 79, criticalGaps: ['Kubernetes', 'Terraform'] },
              { domain: 'Cybersecurity', studentsCount: 15, averageReadiness: 85, criticalGaps: ['Zero Trust Architecture'] },
            ]).map((item: any, idx: number) => (
              <div
                key={item.domain || idx}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-1 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-white">
                      {item.domain}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-400 border border-blue-500/20">
                      {item.studentsCount} Students
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans flex flex-wrap items-center gap-2">
                    <span>Identified Gaps:</span>
                    {item.criticalGaps?.map((gap: string) => (
                      <span key={gap} className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {gap}
                      </span>
                    )) || <span className="text-emerald-400 text-xs">No Critical Gaps</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <div className="text-right">
                    <div className="text-base font-bold text-[#4CC38A]">{item.averageReadiness}%</div>
                    <div className="text-[10.5px] text-slate-400 font-sans">Cohort Readiness</div>
                  </div>
                  <div className="w-24 bg-[#0f172a] h-2 rounded-full overflow-hidden border border-[#1e293b]">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-[#4CC38A] h-full rounded-full transition-all"
                      style={{ width: `${item.averageReadiness}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicianDashboard;
