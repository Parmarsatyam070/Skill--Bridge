/**
 * InstitutionComplianceReportsPage.tsx
 * Phase 5 — Policy-Ready Compliance Reports
 *
 * Deterministic compliance reporting interface for INSTITUTION_ADMIN.
 * Pulls authoritative data from Phase 5 backend API:
 * GET /api/institutions/reports
 * GET /api/institutions/reports/export-csv
 * GET /api/institutions/reports/export-pdf
 *
 * Scope is enforced strictly server-side via authenticated session.
 * Zero client-side scope manipulation.
 * Zero student PII.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  Layers,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Info,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import {
  ComplianceReportType,
  ComplianceTimePeriod,
  ComplianceReportPayload,
  RecruitmentActivityReportDto,
  CandidateSkillsReportDto,
  CurriculumAlignmentReportDto,
  InstitutionalComplianceSummaryDto,
} from '@shared/types';

/* ─── Color Tokens ─────────────────────────────────────────────────────────── */
const THEME = {
  canvas: '#030712',
  panel: '#0b1329',
  panelRaised: '#0f172a',
  border: '#1e293b',
  borderStrong: '#334155',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  cyan: '#38bdf8',
  emerald: '#4CC38A',
  amber: '#E8A23C',
  rose: '#E5637C',
  purple: '#a855f7',
  textMuted: '#94a3b8',
};

const REPORT_TABS: Array<{ id: ComplianceReportType; label: string; icon: any }> = [
  { id: 'institutional_compliance_summary', label: 'Executive Summary', icon: ShieldCheck },
  { id: 'recruitment_activity', label: 'Recruitment Activity', icon: Briefcase },
  { id: 'candidate_skills', label: 'Candidate & Skills', icon: Users },
  { id: 'curriculum_alignment', label: 'Curriculum Alignment', icon: Layers },
];

const TIME_PERIODS: Array<{ id: ComplianceTimePeriod; label: string }> = [
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '6m', label: 'Last 6 Months' },
  { id: '12m', label: 'Last 12 Months' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

export const InstitutionComplianceReportsPage: React.FC = () => {
  // State
  const [reportType, setReportType] = useState<ComplianceReportType>('institutional_compliance_summary');
  const [timePeriod, setTimePeriod] = useState<ComplianceTimePeriod>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [appliedCustomDates, setAppliedCustomDates] = useState<{ start: string; end: string } | null>(null);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('reportType', reportType);
  queryParams.append('timePeriod', timePeriod);
  if (timePeriod === 'custom' && appliedCustomDates) {
    queryParams.append('startDate', appliedCustomDates.start);
    queryParams.append('endDate', appliedCustomDates.end);
  }

  // Fetch Report Data
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<{ success: boolean } & ComplianceReportPayload>({
    queryKey: ['institution-compliance-report', reportType, timePeriod, appliedCustomDates],
    queryFn: async () => {
      let token = localStorage.getItem('skillbridge_token');
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch {
        // fallback
      }

      const res = await fetch(`/api/institutions/reports?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error?.message || `Failed to fetch report (${res.status})`);
      }

      return res.json();
    },
    enabled: timePeriod !== 'custom' || appliedCustomDates !== null,
  });

  const reportPayload = response?.data;

  // Handle Export CSV
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    setExportError(null);
    try {
      let token = localStorage.getItem('skillbridge_token');
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetch(`/api/institutions/reports/export-csv?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to export CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-${reportType}-${timePeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Error exporting CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Handle Export PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      let token = localStorage.getItem('skillbridge_token');
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetch(`/api/institutions/reports/export-pdf?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to export PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-${reportType}-${timePeriod}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Error exporting PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) {
      alert('Please provide both Start Date and End Date.');
      return;
    }
    if (customStartDate > customEndDate) {
      alert('Start Date cannot be later than End Date.');
      return;
    }
    setAppliedCustomDates({ start: customStartDate, end: customEndDate });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Policy & Compliance Audit Reports
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Deterministic & Aggregate
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Official institutional compliance reports compiled directly from recorded student outcomes, verified skills, and curriculum mappings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            {isExportingCsv ? 'Exporting CSV...' : 'Download CSV'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20 transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            {isExportingPdf ? 'Rendering PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Export Error Alert */}
      {exportError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* ── Toolbar: Tabs & Time Filters ───────────────────────────────── */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Report Type Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Report Type:
          </span>
          {REPORT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Time Period Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Window:
            </span>
            {TIME_PERIODS.map(period => {
              const isActive = timePeriod === period.id;
              return (
                <button
                  key={period.id}
                  onClick={() => {
                    setTimePeriod(period.id);
                    if (period.id !== 'custom') {
                      setAppliedCustomDates(null);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Form (if custom selected) */}
          {timePeriod === 'custom' && (
            <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Main Document Preview ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Compiling authoritative institutional compliance metrics...</p>
        </div>
      ) : isError ? (
        <div className="bg-[#0b1329] border border-rose-900/50 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">Error Loading Report</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {(error as any)?.message || 'Failed to retrieve compliance report data.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition"
          >
            Retry
          </button>
        </div>
      ) : reportPayload ? (
        <div className="space-y-6">
          {/* Document Presentation Container (Formal Whitepaper Aesthetic) */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Formal Institutional Header Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono tracking-wider text-blue-400 uppercase font-semibold">
                  {reportPayload.metadata.institutionName}
                </div>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {reportPayload.metadata.reportTitle}
                </h2>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {reportPayload.metadata.reportingPeriod}
                </span>
              </div>
            </div>

            {/* Formal Document Metadata Details */}
            <div className="bg-slate-900/40 border-b border-slate-800 px-6 py-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-300">Data Scope: </span>
                {reportPayload.metadata.dataScope}
              </div>
              <div>
                <span className="font-semibold text-slate-300">Generated: </span>
                {new Date(reportPayload.metadata.generatedAt).toUTCString()}
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6">
              {isFetching && reportPayload?.metadata?.reportType !== reportType ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading {REPORT_TABS.find(t => t.id === reportType)?.label} metrics...</p>
                </div>
              ) : (
                <>
                  {/* RENDER: Executive Summary */}
                  {reportType === 'institutional_compliance_summary' && reportPayload?.metadata?.reportType === 'institutional_compliance_summary' && (
                    <ExecutiveSummarySection data={reportPayload as InstitutionalComplianceSummaryDto} />
                  )}

                  {/* RENDER: Recruitment Activity */}
                  {reportType === 'recruitment_activity' && reportPayload?.metadata?.reportType === 'recruitment_activity' && (
                    <RecruitmentActivitySection data={reportPayload as RecruitmentActivityReportDto} />
                  )}

                  {/* RENDER: Candidate Skills */}
                  {reportType === 'candidate_skills' && reportPayload?.metadata?.reportType === 'candidate_skills' && (
                    <CandidateSkillsSection data={reportPayload as CandidateSkillsReportDto} />
                  )}

                  {/* RENDER: Curriculum Alignment */}
                  {reportType === 'curriculum_alignment' && reportPayload?.metadata?.reportType === 'curriculum_alignment' && (
                    <CurriculumAlignmentSection data={reportPayload as CurriculumAlignmentReportDto} />
                  )}
                </>
              )}

              {/* Factual Disclaimer Banner */}
              <div className="mt-8 p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">Methodology & Regulatory Notice: </span>
                  {reportPayload.metadata.methodologyNote} This document reflects recorded institutional data and calculations according to established institutional methodology; it does not constitute a legal, formal accreditation, or regulatory certification.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ─── Sub-Components for Report Types ──────────────────────────────────────── */

const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; icon?: any; color?: string }> = ({
  label,
  value,
  sub,
  icon: Icon,
  color = 'text-blue-400',
}) => (
  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg flex items-start justify-between">
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
    {Icon && (
      <div className={`p-2 rounded bg-slate-800/80 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    )}
  </div>
);

// 1. Executive Summary Component
const ExecutiveSummarySection: React.FC<{ data: InstitutionalComplianceSummaryDto }> = ({ data }) => {
  const scorecard = data?.scorecard || {
    totalStudents: 0,
    overallPlacementRate: 0,
    totalApplications: 0,
    activeApplications: 0,
    avgMatchScoreAtApply: 0,
    studentsWithVerifiedSkills: 0,
    verifiedStudentsPct: 0,
    averageRecordedSkillScore: 0,
    totalDemandedSkills: 0,
    curriculumCoveragePct: 0,
    employersWithActivityCount: 0,
  };
  const funnelSummary = data?.funnelSummary || [];
  const skillGapSummary = data?.skillGapSummary || {
    higherDemandCount: 0,
    balancedCount: 0,
    higherSupplyCount: 0,
    unmappedCount: 0,
  };
  const topDemandedSkills = data?.topDemandedSkills || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Executive Institutional Scorecard
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Enrolled Students"
            value={scorecard.totalStudents}
            sub="Affiliated cohort baseline"
            icon={Users}
            color="text-blue-400"
          />
          <KpiCard
            label="Overall Placement Rate"
            value={`${(scorecard.overallPlacementRate ?? 0).toFixed(1)}%`}
            sub="Unique placed / total cohort"
            icon={CheckCircle2}
            color="text-emerald-400"
          />
          <KpiCard
            label="Verified Skills Ratio"
            value={`${(scorecard.verifiedStudentsPct ?? 0).toFixed(1)}%`}
            sub={`${scorecard.studentsWithVerifiedSkills ?? 0} students with verified skills`}
            icon={ShieldCheck}
            color="text-cyan-400"
          />
          <KpiCard
            label="Curriculum Coverage"
            value={`${(scorecard.curriculumCoveragePct ?? 0).toFixed(1)}%`}
            sub={`${scorecard.totalDemandedSkills ?? 0} industry demanded skills`}
            icon={Layers}
            color="text-purple-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Overview */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Recruitment Pipeline Conversion
          </h4>
          <div className="space-y-2">
            {funnelSummary.map(f => (
              <div key={f.stage} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                <span className="text-slate-300">{f.label}</span>
                <span className="font-semibold text-slate-100">
                  {f.count} <span className="text-slate-500 font-normal">({(f.pct ?? 0).toFixed(1)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Alignment Balance */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Skill Demand & Supply Alignment
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Higher Demand than Supply (&gt;+15 pp):</span>
              <span className="font-bold text-amber-400">{skillGapSummary.higherDemandCount} skills</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Balanced Alignment (±15 pp):</span>
              <span className="font-bold text-emerald-400">{skillGapSummary.balancedCount} skills</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Higher Supply than Demand (&lt;-15 pp):</span>
              <span className="font-bold text-blue-400">{skillGapSummary.higherSupplyCount} skills</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-300">Unmapped Demanded Skills:</span>
              <span className="font-bold text-rose-400">{skillGapSummary.unmappedCount} skills</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Average Recorded Skill Score:</span>
              <span className="font-semibold text-slate-200">
                {(scorecard.averageRecordedSkillScore ?? 0).toFixed(1)} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Demanded Skills Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Top Demanded Skills in Active Opportunities
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Skill Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Demanding Opps</th>
                <th className="py-2.5 px-3 text-right">Demand %</th>
                <th className="py-2.5 px-3 text-right">Student Supply</th>
                <th className="py-2.5 px-3 text-right">Supply %</th>
                <th className="py-2.5 px-3 text-right">Gap (pp)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topDemandedSkills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                    No demanded skills recorded for this reporting period.
                  </td>
                </tr>
              ) : (
                topDemandedSkills.map(s => (
                  <tr key={s.skillId} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-medium text-white">{s.skillName}</td>
                    <td className="py-2 px-3 text-slate-400">{s.category}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{s.opportunityCount}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{(s.demandPct ?? 0).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-slate-200">{s.studentCount}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{(s.supplyPct ?? 0).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span className={s.gapPp > 15 ? 'text-amber-400' : s.gapPp < -15 ? 'text-blue-400' : 'text-emerald-400'}>
                        {s.gapPp > 0 ? `+${s.gapPp.toFixed(1)}` : (s.gapPp ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {s.gapStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. Recruitment Activity Component
const RecruitmentActivitySection: React.FC<{ data: RecruitmentActivityReportDto }> = ({ data }) => {
  const overview = data?.overview || {
    totalStudents: 0,
    totalApplications: 0,
    uniqueStudentsPlaced: 0,
    overallPlacementRate: 0,
    activeApplications: 0,
    avgMatchScoreAtApply: 0,
  };
  const funnel = data?.funnel || [];
  const employersByVolume = data?.employersByVolume || [];
  const domainPerformance = data?.domainPerformance || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Enrolled Students" value={overview.totalStudents} sub="Cohort baseline" icon={Users} />
        <KpiCard label="Total Applications Submitted" value={overview.totalApplications} icon={Briefcase} />
        <KpiCard
          label="Overall Placement Rate"
          value={`${(overview.overallPlacementRate ?? 0).toFixed(1)}%`}
          sub={`${overview.uniqueStudentsPlaced} unique students placed`}
          icon={CheckCircle2}
          color="text-emerald-400"
        />
        <KpiCard label="Active Applications" value={overview.activeApplications} sub="In review / assessment / interview" />
        <KpiCard label="Avg Match Score at Apply" value={`${(overview.avgMatchScoreAtApply ?? 0).toFixed(1)} / 100`} sub="Snapshotted 7-factor match" />
        <KpiCard label="Active Employers" value={employersByVolume.length} sub="With student application activity" />
      </div>

      {/* Recruitment Funnel Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Complete Application Pipeline Funnel
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3 text-right">Application Count</th>
                <th className="py-2.5 px-3 text-right">Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {funnel.map(f => (
                <tr key={f.stage} className="hover:bg-slate-900/40">
                  <td className="py-2 px-3 font-medium text-white">{f.label}</td>
                  <td className="py-2 px-3 text-right text-slate-200">{f.count}</td>
                  <td className="py-2 px-3 text-right text-slate-200 font-semibold">{(f.pct ?? 0).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employers Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Employers by Student Application Volume (Top 10)
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Employer Name</th>
                <th className="py-2.5 px-3">Industry Sector</th>
                <th className="py-2.5 px-3 text-right">Total Applications</th>
                <th className="py-2.5 px-3 text-right">Hired Outcomes</th>
                <th className="py-2.5 px-3 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employersByVolume.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                    No employer applications recorded for this reporting period.
                  </td>
                </tr>
              ) : (
                employersByVolume.map(c => (
                  <tr key={c.companyId} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-medium text-white">{c.companyName}</td>
                    <td className="py-2 px-3 text-slate-400">{c.industrySector || 'General'}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{c.totalApplications}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">{c.hired}</td>
                    <td className="py-2 px-3 text-right text-slate-200 font-semibold">{(c.conversionRate ?? 0).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Performance Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Academic Domain & Career Track Placement Performance
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Career Domain Preference</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">Applications</th>
                <th className="py-2.5 px-3 text-right">Hired</th>
                <th className="py-2.5 px-3 text-right">Placement Rate</th>
                <th className="py-2.5 px-3 text-right">Avg Match Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {domainPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                    No domain placement records found for this reporting period.
                  </td>
                </tr>
              ) : (
                domainPerformance.map(d => (
                  <tr key={d.domain} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-medium text-white">{d.domain}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{d.studentCount}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{d.applicationCount}</td>
                    <td className="py-2 px-3 text-right text-emerald-400">{d.hiredCount}</td>
                    <td className="py-2 px-3 text-right text-slate-200 font-semibold">{(d.placementRate ?? 0).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-slate-300">{(d.avgMatchScoreAtApply ?? 0).toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 3. Candidate & Skills Component
const CandidateSkillsSection: React.FC<{ data: CandidateSkillsReportDto }> = ({ data }) => {
  const summary = data?.summary || {
    totalStudents: 0,
    studentsWithVerifiedSkills: 0,
    verifiedStudentsPct: 0,
    averageRecordedSkillScore: 0,
    demandedSkillsCount: 0,
  };
  const domainDistribution = data?.domainDistribution || [];
  const skills = data?.skills || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Enrolled Students" value={summary.totalStudents} sub="Cohort baseline" icon={Users} />
        <KpiCard label="Students with Verified Skills" value={summary.studentsWithVerifiedSkills} icon={CheckCircle2} color="text-emerald-400" />
        <KpiCard label="Verified Student Ratio" value={`${(summary.verifiedStudentsPct ?? 0).toFixed(1)}%`} icon={ShieldCheck} color="text-cyan-400" />
        <KpiCard
          label="Average Recorded Skill Score"
          value={(summary.averageRecordedSkillScore ?? 0).toFixed(1)}
          sub="Weighted average across demanded skills"
          icon={BarChart3}
          color="text-purple-400"
        />
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Complete Skill Demand vs Student Supply Alignment Matrix
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Skill Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Demanded Opps</th>
                <th className="py-2.5 px-3 text-right">Demand %</th>
                <th className="py-2.5 px-3 text-right">Student Supply</th>
                <th className="py-2.5 px-3 text-right">Verified Supply</th>
                <th className="py-2.5 px-3 text-right">Avg Score</th>
                <th className="py-2.5 px-3 text-right">Gap (pp)</th>
                <th className="py-2.5 px-3">Gap Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {skills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-slate-500 italic">
                    No skill records found for this reporting period.
                  </td>
                </tr>
              ) : (
                skills.map(s => (
                  <tr key={s.skillId} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-medium text-white">{s.skillName}</td>
                    <td className="py-2 px-3 text-slate-400">{s.category}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{s.opportunityCount}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{(s.demandPct ?? 0).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-slate-200">{s.studentCount} ({(s.supplyPct ?? 0).toFixed(1)}%)</td>
                    <td className="py-2 px-3 text-right text-slate-200">{s.verifiedStudentCount} ({(s.verifiedSupplyPct ?? 0).toFixed(1)}%)</td>
                    <td className="py-2 px-3 text-right text-slate-300">{(s.avgScore ?? 0).toFixed(1)}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span className={s.gapPp > 15 ? 'text-amber-400' : s.gapPp < -15 ? 'text-blue-400' : 'text-emerald-400'}>
                        {s.gapPp > 0 ? `+${s.gapPp.toFixed(1)}` : (s.gapPp ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {s.gapStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4. Curriculum Alignment Component
const CurriculumAlignmentSection: React.FC<{ data: CurriculumAlignmentReportDto }> = ({ data }) => {
  const summary = data?.summary || {
    totalDemandedSkills: 0,
    curriculumCoveragePct: 0,
    coveredCount: 0,
    partiallyCoveredCount: 0,
    notMappedCount: 0,
    sourceBreakdown: { coreAcademic: 0, supportingAcademic: 0, platformCourse: 0, notMapped: 0 },
  };
  const demandedSkills = data?.demandedSkills || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Industry Demanded Skills" value={summary.totalDemandedSkills} icon={Briefcase} />
        <KpiCard
          label="Curriculum Coverage"
          value={`${(summary.curriculumCoveragePct ?? 0).toFixed(1)}%`}
          sub="(Covered + Partially Covered) / Demanded"
          icon={CheckCircle2}
          color="text-emerald-400"
        />
        <KpiCard
          label="Offerings with Coverage"
          value={(summary.coveredCount ?? 0) + (summary.partiallyCoveredCount ?? 0)}
          sub="Explicitly mapped offerings"
          icon={Layers}
          color="text-cyan-400"
        />
        <KpiCard
          label="Unmapped Demanded Skills"
          value={summary.notMappedCount}
          sub="Requires academic / course alignment"
          icon={AlertCircle}
          color="text-rose-400"
        />
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Demanded Skills Curriculum Mapping Matrix
        </h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Skill Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Opportunities</th>
                <th className="py-2.5 px-3 text-right">Demand %</th>
                <th className="py-2.5 px-3">Curriculum Status</th>
                <th className="py-2.5 px-3">Mapping Source</th>
                <th className="py-2.5 px-3">Mapped Offerings / Courses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {demandedSkills.map(s => (
                <tr key={s.skillId} className="hover:bg-slate-900/40">
                  <td className="py-2 px-3 font-medium text-white">{s.skillName}</td>
                  <td className="py-2 px-3 text-slate-400">{s.category}</td>
                  <td className="py-2 px-3 text-right text-slate-200">{s.opportunityCount}</td>
                  <td className="py-2 px-3 text-right text-slate-200">{s.demandPct.toFixed(1)}%</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.curriculumStatus === 'Covered'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.curriculumStatus === 'Partially Covered'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {s.curriculumStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">{s.mappingSource}</td>
                  <td className="py-2 px-3 text-slate-400">
                    {(s.mappedCurriculumDetails || []).length > 0
                      ? s.mappedCurriculumDetails?.join('; ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstitutionComplianceReportsPage;
