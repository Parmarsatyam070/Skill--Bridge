/**
 * InstitutionSkillDemandPage.tsx
 * Phase 4 — Skill Demand vs Curriculum Alignment Dashboard
 *
 * All data is strictly derived from the Phase 4 backend API:
 * GET /api/institutions/skill-demand
 * GET /api/institutions/skill-demand/export
 *
 * Scope is enforced server-side via authenticated session (req.user.institutionProfileId).
 * Zero client-side scope manipulation.
 * Zero hardcoded/mock data.
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Radar,
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  BookOpen,
  ArrowUpDown,
  Layers,
  HelpCircle,
  Clock,
  Filter,
  Info,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { api } from '../../lib/api';
import {
  SkillDemandAlignmentResponseDto,
  SkillDemandItemDto,
  CurriculumClassification,
  CurriculumMappingSource,
  GapStatus,
} from '@shared/types';

/* ─── Color Tokens (Dark Blue & Console Theme) ─────────────────────────── */
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

const PIE_COLORS: Record<CurriculumClassification, string> = {
  'Covered': THEME.emerald,
  'Partially Covered': THEME.cyan,
  'Not Mapped': THEME.rose,
};

type TimeRangeFilter = '30d' | '90d' | '6m' | '12m' | 'all';
type OpportunityTypeFilter = 'ALL' | 'JOB' | 'INTERNSHIP';
type SortField = 'demandPct' | 'supplyPct' | 'gapPp' | 'opportunityCount' | 'studentCount';

export const InstitutionSkillDemandPage: React.FC = () => {
  // Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [opportunityType, setOpportunityType] = useState<OpportunityTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('demandPct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Query Phase 4 Skill Demand Backend API
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{
    success: boolean;
    data: SkillDemandAlignmentResponseDto;
  }>({
    queryKey: ['skill-demand-alignment', timeRange, opportunityType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange !== 'all') params.append('timeRange', timeRange);
      if (opportunityType !== 'ALL') params.append('opportunityType', opportunityType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await api.get(`/institutions/skill-demand${queryStr}`);
    },
    staleTime: 60 * 1000,
  });

  const alignment = data?.data;

  // Handle RFC-4180 CSV Export
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (timeRange !== 'all') params.append('timeRange', timeRange);
      if (opportunityType !== 'ALL') params.append('opportunityType', opportunityType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      let token = localStorage.getItem('skillbridge_token');
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch {
        // fallback to localStorage
      }

      const res = await fetch(`/api/institutions/skill-demand/export${queryStr}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to export CSV');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-demand-curriculum-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export skill demand CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Sort Table Skills
  const sortedSkills = useMemo(() => {
    if (!alignment?.skills) return [];
    return [...alignment.skills].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [alignment?.skills, sortField, sortAsc]);

  // Top 10 Demanded Skills for Comparison Chart
  const topComparisonData = useMemo(() => {
    if (!alignment?.skills) return [];
    return [...alignment.skills]
      .filter(s => s.opportunityCount > 0)
      .slice(0, 8)
      .map(s => ({
        name: s.skillName.length > 14 ? `${s.skillName.slice(0, 12)}…` : s.skillName,
        fullName: s.skillName,
        'Demand %': s.demandPct,
        'Supply %': s.supplyPct,
        'Verified Supply %': s.verifiedSupplyPct,
        gapPp: s.gapPp,
      }));
  }, [alignment?.skills]);

  // Pie chart data for curriculum breakdown
  const curriculumPieData = useMemo(() => {
    if (!alignment?.curriculumBreakdown) return [];
    const cb = alignment.curriculumBreakdown;
    return [
      { name: 'Covered', value: cb.coveredCount, color: THEME.emerald },
      { name: 'Partially Covered', value: cb.partiallyCoveredCount, color: THEME.cyan },
      { name: 'Not Mapped', value: cb.notMappedCount, color: THEME.rose },
    ].filter(item => item.value > 0);
  }, [alignment?.curriculumBreakdown]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 md:p-8 space-y-8 font-sans">
      {/* ─── PAGE HEADER & CONTROLS ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Skill Demand vs Curriculum Alignment
              </h1>
              <p className="text-sm text-slate-400 flex items-center gap-2 flex-wrap">
                {alignment?.metadata?.institutionName && (
                  <span className="text-blue-300 font-semibold">{alignment.metadata.institutionName} •</span>
                )}
                <span>Deterministic comparison of live industry skill demands against institutional student supply and mapped curriculum.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#0b1329] border border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-600 transition-all disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting || isLoading || !alignment}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting CSV...' : 'Export Aggregate CSV'}
          </button>
        </div>
      </div>

      {/* ─── CONTROLS TOOLBAR ─────────────────────────────────────────── */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Time Range Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Window:
          </span>
          {(
            [
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '6m', label: '6 Months' },
              { id: '12m', label: '12 Months' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-[#1e293b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Middle: Opportunity Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'JOB', label: 'Jobs' },
              { id: 'INTERNSHIP', label: 'Internships' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setOpportunityType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                opportunityType === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-[#0f172a] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-[#1e293b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Skill Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search skill name or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0f172a] border border-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ─── LOADING & ERROR STATES ───────────────────────────────────── */}
      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center gap-4 bg-[#0b1329] border border-[#1e293b] rounded-2xl">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Computing Skill Demand vs Curriculum Alignment...</p>
        </div>
      )}

      {isError && (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-start gap-4 text-red-200">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-base text-red-300">Failed to Load Alignment Analytics</h3>
            <p className="text-sm text-red-400 mt-1">
              {(error as any)?.message || 'An unexpected error occurred while communicating with the server.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-semibold text-red-300 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {alignment && (
        <>
          {/* ─── SECTION A: KPI OVERVIEW CARDS ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Relevant Opportunities */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Relevant Opportunities</span>
                <Briefcase className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {alignment.overview.relevantOpportunities.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {alignment.overview.activeOpportunities} Active
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  {alignment.overview.closedOpportunities} Closed
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {alignment.overview.pausedOpportunities} Paused
                </span>
              </div>
            </div>

            {/* KPI 2: Demanded Skills */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Demanded Skills</span>
                <Radar className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {alignment.overview.demandedSkillsCount.toLocaleString()}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Unique skills required across active, closed & paused postings
              </p>
            </div>

            {/* KPI 3: Companies Demanding Skills */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Demanding Companies</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {alignment.overview.companiesWithDemandCount.toLocaleString()}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Unique industry partners hiring for these skills
              </p>
            </div>

            {/* KPI 4: Students with Verified Skills */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Verified Students</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
                {alignment.overview.studentsWithVerifiedSkills.toLocaleString()}
                <span className="text-sm font-semibold text-emerald-400">
                  ({alignment.overview.verifiedStudentsPct}%)
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Of {alignment.overview.totalStudents.toLocaleString()} total students enrolled
              </p>
            </div>

            {/* KPI 5: Curriculum Coverage % */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Curriculum Coverage</span>
                <GraduationCap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
                {alignment.overview.curriculumCoveragePct}%
              </div>
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                <div
                  className="bg-emerald-400 h-full"
                  style={{
                    width: `${alignment.curriculumBreakdown.coveredCount ? (alignment.curriculumBreakdown.coveredCount / (alignment.overview.demandedSkillsCount || 1)) * 100 : 0}%`,
                  }}
                  title={`Covered: ${alignment.curriculumBreakdown.coveredCount}`}
                />
                <div
                  className="bg-cyan-400 h-full"
                  style={{
                    width: `${alignment.curriculumBreakdown.partiallyCoveredCount ? (alignment.curriculumBreakdown.partiallyCoveredCount / (alignment.overview.demandedSkillsCount || 1)) * 100 : 0}%`,
                  }}
                  title={`Partially Covered: ${alignment.curriculumBreakdown.partiallyCoveredCount}`}
                />
                <div
                  className="bg-rose-400 h-full"
                  style={{
                    width: `${alignment.curriculumBreakdown.notMappedCount ? (alignment.curriculumBreakdown.notMappedCount / (alignment.overview.demandedSkillsCount || 1)) * 100 : 0}%`,
                  }}
                  title={`Not Mapped: ${alignment.curriculumBreakdown.notMappedCount}`}
                />
              </div>
            </div>
          </div>

          {/* ─── SECTION B & D: CHARTS GRID ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section B: Industry Demand % vs Student Supply % Bar Chart */}
            <div className="lg:col-span-2 bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Demand vs Supply Alignment (Top Demanded Skills)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comparing opportunity demand % against institutional student supply %
                  </p>
                </div>
              </div>

              {topComparisonData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No demanded skills found matching the current filter.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        unit="%"
                        domain={[0, 100]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 shadow-2xl text-xs space-y-1">
                                <p className="font-bold text-white text-sm">{d.fullName}</p>
                                <div className="flex items-center justify-between gap-4 text-cyan-300">
                                  <span>Industry Demand:</span>
                                  <span className="font-semibold">{d['Demand %']}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-emerald-300">
                                  <span>Total Student Supply:</span>
                                  <span className="font-semibold">{d['Supply %']}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-purple-300">
                                  <span>Verified Supply:</span>
                                  <span className="font-semibold">{d['Verified Supply %']}%</span>
                                </div>
                                <div className="pt-1 border-t border-[#1e293b] flex items-center justify-between gap-4 text-slate-300">
                                  <span>Gap (Demand - Supply):</span>
                                  <span className={`font-bold ${d.gapPp > 15 ? 'text-amber-400' : d.gapPp < -15 ? 'text-blue-400' : 'text-emerald-400'}`}>
                                    {d.gapPp > 0 ? `+${d.gapPp}` : d.gapPp} pp
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Demand %" fill={THEME.cyan} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Supply %" fill={THEME.emerald} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Section D: Curriculum Breakdown */}
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Curriculum Coverage Breakdown
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Deterministic 4-priority classification of demanded skills
                </p>

                {curriculumPieData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                    No demanded skills in current criteria
                  </div>
                ) : (
                  <div className="h-44 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={curriculumPieData}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {curriculumPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const p = payload[0];
                              return (
                                <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 text-xs text-white">
                                  <span className="font-semibold">{p.name}: </span>
                                  <span>{p.value} skills</span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Counts List */}
                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Covered (Priority 1)
                    </span>
                    <span className="font-bold text-white">{alignment.curriculumBreakdown.coveredCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      Partially Covered (P2 & P3)
                    </span>
                    <span className="font-bold text-white">{alignment.curriculumBreakdown.partiallyCoveredCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      Not Mapped (Priority 4)
                    </span>
                    <span className="font-bold text-white">{alignment.curriculumBreakdown.notMappedCount}</span>
                  </div>
                </div>
              </div>

              {/* Source attribution notice */}
              <div className="mt-4 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Platform course coverage represents SkillBridge platform learning content; it does not replace guaranteed university syllabus credit.
                </span>
              </div>
            </div>
          </div>

          {/* ─── SECTION E: MONTHLY DEMAND TREND ─────────────────────────── */}
          {alignment.monthlyTrends && alignment.monthlyTrends.length > 0 && (
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Monthly Opportunity Demand Trend
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chronological volume of opportunities demanding talent across status stages
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={alignment.monthlyTrends} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 shadow-2xl text-xs space-y-1.5">
                              <p className="font-bold text-white text-sm">{label}</p>
                              <div className="flex justify-between gap-4 text-cyan-300">
                                <span>Total Postings:</span>
                                <span className="font-semibold">{item.totalOpportunities}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-300">
                                <span>Active (OPEN):</span>
                                <span className="font-semibold">{item.activeOpportunities}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-400">
                                <span>Closed:</span>
                                <span className="font-semibold">{item.closedOpportunities}</span>
                              </div>
                              {item.topSkills && item.topSkills.length > 0 && (
                                <div className="pt-2 border-t border-[#1e293b]">
                                  <span className="text-[11px] text-slate-400 font-semibold block mb-1">Top Demanded:</span>
                                  {item.topSkills.slice(0, 3).map((sk: any) => (
                                    <div key={sk.skillId} className="flex justify-between text-[11px] text-slate-300">
                                      <span>{sk.skillName}</span>
                                      <span className="font-medium text-cyan-400">{sk.demandCount} opps</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="totalOpportunities" name="Total Opportunities" stroke={THEME.cyan} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="activeOpportunities" name="Active" stroke={THEME.emerald} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="closedOpportunities" name="Closed" stroke={THEME.rose} strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── SECTION C: SKILL ALIGNMENT TABLE ───────────────────────── */}
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Skill Demand vs Supply Alignment Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Comprehensive breakdown of industry opportunity demand, institution student supply, and curriculum status.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Showing <span className="font-semibold text-white">{sortedSkills.length}</span> skills
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] bg-[#0f172a] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Skill & Category</th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('opportunityCount')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Opps <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">Cos</th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('demandPct')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Demand % <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('studentCount')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Students <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="py-3 px-3 text-right">Verified</th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('supplyPct')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Supply % <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => toggleSort('gapPp')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Gap (pp) <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="py-3 px-3">Gap Status</th>
                    <th className="py-3 px-3">Curriculum Status</th>
                    <th className="py-3 px-4">Mapping Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {sortedSkills.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        No skills match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedSkills.map(skill => {
                      const gapStatusColor =
                        skill.gapStatus === 'Higher demand than supply'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : skill.gapStatus === 'Higher supply than demand'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                      const currStatusColor =
                        skill.curriculumStatus === 'Covered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : skill.curriculumStatus === 'Partially Covered'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

                      return (
                        <tr key={skill.skillId} className="hover:bg-slate-900/40 transition-colors">
                          {/* Skill & Category */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{skill.skillName}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                              {skill.category}
                            </span>
                          </td>

                          {/* Opportunities Demanding */}
                          <td className="py-3 px-3 text-right font-medium text-slate-200">
                            {skill.opportunityCount}
                          </td>

                          {/* Companies Demanding */}
                          <td className="py-3 px-3 text-right font-medium text-slate-400">
                            {skill.companyCount}
                          </td>

                          {/* Demand % */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-cyan-400">{skill.demandPct}%</div>
                            <div className="w-16 bg-slate-800 rounded-full h-1 ml-auto overflow-hidden">
                              <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(100, skill.demandPct)}%` }} />
                            </div>
                          </td>

                          {/* Student Supply Count */}
                          <td className="py-3 px-3 text-right font-medium text-slate-200">
                            {skill.studentCount}
                          </td>

                          {/* Verified Student Count */}
                          <td className="py-3 px-3 text-right font-medium text-emerald-400">
                            {skill.verifiedStudentCount}
                          </td>

                          {/* Supply % */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-emerald-400">{skill.supplyPct}%</div>
                            <div className="w-16 bg-slate-800 rounded-full h-1 ml-auto overflow-hidden">
                              <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, skill.supplyPct)}%` }} />
                            </div>
                          </td>

                          {/* Gap (pp) */}
                          <td className="py-3 px-3 text-right font-bold">
                            <span className={skill.gapPp > 0 ? 'text-amber-400' : skill.gapPp < 0 ? 'text-blue-400' : 'text-slate-300'}>
                              {skill.gapPp > 0 ? `+${skill.gapPp}` : skill.gapPp} pp
                            </span>
                          </td>

                          {/* Gap Status */}
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${gapStatusColor}`}>
                              {skill.gapStatus}
                            </span>
                          </td>

                          {/* Curriculum Status */}
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${currStatusColor}`}>
                              {skill.curriculumStatus}
                            </span>
                          </td>

                          {/* Mapping Source */}
                          <td className="py-3 px-4">
                            <div className="text-slate-300 font-medium">{skill.mappingSource}</div>
                            {skill.mappedCurriculumDetails && skill.mappedCurriculumDetails.length > 0 && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={skill.mappedCurriculumDetails.join(', ')}>
                                {skill.mappedCurriculumDetails.join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── SECTION F: NEUTRAL DATA OBSERVATIONS ─────────────────────── */}
          {alignment.observations && alignment.observations.length > 0 && (
            <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Descriptive Data Observations</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Deterministic analytics
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {alignment.observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
