/**
 * InstitutionRecruitmentMetricsPage.tsx
 * Phase 3 — Recruitment Metrics Dashboard
 *
 * All data is derived from real database records via GET /api/institutions/recruitment-metrics.
 * Institution scope is enforced server-side — the authenticated session determines which
 * institution's data is returned. No client-side scope selection.
 *
 * Charts: Recharts ^2.12.7
 * Design: matches existing dark console theme (#030712 canvas, #0b1329 panels)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Activity,
  Target,
  Building2,
  GraduationCap,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

// ---------------------------------------------------------------------------
// Type mirrors from server (no shared import needed — simple TS interfaces)
// ---------------------------------------------------------------------------

interface OverviewMetrics {
  totalStudents: number;
  totalApplications: number;
  /** Unique students (not application rows) with a hired outcome */
  uniqueStudentsPlaced: number;
  /** (uniqueStudentsPlaced / totalStudents) × 100 — both sides are student-level */
  overallPlacementRate: number;
  activeApplications: number;
  /** Average of Application.matchScoreAtApply (7-factor snapshot); null records excluded */
  avgMatchScoreAtApply: number;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  pct: number;
}

/** Top 10 by application volume (sorted desc by totalApplications) */
interface CompanyActivity {
  companyId: string;
  companyName: string;
  industrySector: string;
  totalApplications: number;
  hired: number;
  advancedApplications: number;
  conversionRate: number;
}

/** Grouped by StudentProfile.targetDomain (career/domain preference, NOT academic department) */
interface DomainPerformance {
  domain: string;
  studentCount: number;
  applicationCount: number;
  hiredCount: number;
  /** (hiredCount / studentCount) × 100 — student-level denominator */
  placementRate: number;
  /** Average Application.matchScoreAtApply for this domain group; null records excluded */
  avgMatchScoreAtApply: number;
}

interface BatchCohort {
  gradYear: number;
  studentCount: number;
  applicationCount: number;
  hiredCount: number;
  placementRate: number;
}

interface MonthlyTrend {
  month: string;
  applications: number;
  hired: number;
}

interface StatusDistribution {
  status: string;
  label: string;
  count: number;
  pct: number;
}

interface RecruitmentMetrics {
  overview: OverviewMetrics;
  funnel: FunnelStage[];
  /** Top 10 companies by application volume */
  topCompaniesByVolume: CompanyActivity[];
  /** Domain performance grouped by StudentProfile.targetDomain */
  domainPerformance: DomainPerformance[];
  batchCohorts: BatchCohort[];
  monthlyTrends: MonthlyTrend[];
  statusDistribution: StatusDistribution[];
  topOpportunityTypes: { type: string; count: number; hired: number }[];
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Design tokens (matches existing console theme)
// ---------------------------------------------------------------------------

const C = {
  canvas:   '#030712',
  s1:       '#0b1329',
  s2:       '#0f172a',
  hairline: '#1e293b',
  primary:  '#2563eb',
  cyan:     '#38bdf8',
  emerald:  '#4CC38A',
  amber:    '#E8A23C',
  red:      '#E5637C',
  violet:   '#8b5cf6',
  pink:     '#ec4899',
  ink:      '#ffffff',
  muted:    '#94a3b8',
  subtle:   '#64748b',
};

// Pie / status colour map
const STATUS_COLORS: Record<string, string> = {
  applied:      C.cyan,
  under_review: C.amber,
  shortlisted:  C.violet,
  assessment:   C.primary,
  interview:    '#f97316',
  hired:        C.emerald,
  rejected:     C.red,
};

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = C.emerald,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ background: C.s1, borderColor: C.hairline }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: C.muted }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div className="text-3xl font-bold font-mono" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px]" style={{ color: C.muted }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ label, title, badge }: { label: string; title: string; badge?: string }) {
  return (
    <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: C.hairline }}>
      <div>
        <span className="text-[10.5px] font-mono uppercase tracking-wider block" style={{ color: C.muted }}>{label}</span>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight mt-0.5" style={{ color: C.ink }}>{title}</h3>
      </div>
      {badge && (
        <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-md border" style={{ color: C.amber, background: C.s2, borderColor: `${C.amber}40` }}>{badge}</span>
      )}
    </div>
  );
}

function ChartTooltipBase({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border p-3 text-xs font-mono shadow-xl" style={{ background: C.s2, borderColor: C.hairline }}>
      <div className="font-semibold mb-1.5" style={{ color: C.ink }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2" style={{ color: p.color || C.muted }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-1">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Overview KPI Cards
// ---------------------------------------------------------------------------

function OverviewSection({ data }: { data: OverviewMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard label="Enrolled Students"    value={data.totalStudents}           sub="Affiliated cohort"                      icon={Users}        accent={C.cyan}    />
      <StatCard label="Total Applications"   value={data.totalApplications}       sub="All time"                               icon={Briefcase}    accent={C.primary} />
      <StatCard label="Students Placed"      value={data.uniqueStudentsPlaced}    sub="Unique students hired"                  icon={CheckCircle2} accent={C.emerald} />
      <StatCard label="Placement Rate"       value={`${data.overallPlacementRate}%`} sub="Students placed / enrolled"          icon={TrendingUp}   accent={C.emerald} />
      <StatCard label="Active Applications"  value={data.activeApplications}      sub="In-progress pipeline"                  icon={Activity}     accent={C.amber}   />
      <StatCard label="Avg Match @ Apply"    value={data.avgMatchScoreAtApply > 0 ? `${data.avgMatchScoreAtApply}%` : '—'} sub="7-factor score snapshot" icon={Target} accent={C.violet} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Application Funnel
// ---------------------------------------------------------------------------

function FunnelSection({ data }: { data: FunnelStage[] }) {
  // Use FunnelChart from Recharts (displayed as horizontal bar for clarity)
  const chartData = data.map(f => ({ name: f.label, value: f.count, pct: f.pct }));

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
      <SectionHeader label="Pipeline Health" title="Application Funnel" badge={`${data.find(f => f.stage === 'hired')?.count ?? 0} Hired`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: C.ink, fontSize: 12, fontFamily: 'monospace' }} width={100} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltipBase />} cursor={{ fill: `${C.primary}15` }} />
            <Bar dataKey="value" name="Applications" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => {
                const stages = data.map(f => f.stage);
                const stageKey = stages[i] || 'applied';
                return <Cell key={i} fill={STATUS_COLORS[stageKey] || C.primary} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.hairline }}>
                {['Stage', 'Count', 'Share'].map(h => (
                  <th key={h} className="pb-2 text-left font-mono uppercase tracking-wider text-[10.5px]" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.hairline }}>
              {data.map(f => (
                <tr key={f.stage} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-semibold" style={{ color: STATUS_COLORS[f.stage] || C.ink }}>{f.label}</td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.ink }}>{f.count}</td>
                  <td className="py-2.5 font-mono" style={{ color: C.muted }}>{f.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Monthly Trends
// ---------------------------------------------------------------------------

function TrendsSection({ data }: { data: MonthlyTrend[] }) {
  // Format month labels to 3-letter abbreviation
  const chartData = data.map(d => ({
    ...d,
    label: (() => {
      const [yr, mo] = d.month.split('-');
      const date = new Date(parseInt(yr), parseInt(mo) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    })(),
  }));

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
      <SectionHeader label="Time Series" title="Application Trends (Last 12 Months)" />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
          <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltipBase />} />
          <Legend formatter={(value) => <span style={{ color: C.muted, fontSize: 11 }}>{value}</span>} />
          <Line type="monotone" dataKey="applications" name="Applications" stroke={C.primary} strokeWidth={2} dot={{ r: 3, fill: C.primary }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="hired" name="Hired" stroke={C.emerald} strokeWidth={2} dot={{ r: 3, fill: C.emerald }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Company Activity
// ---------------------------------------------------------------------------

function CompaniesSection({ data }: { data: CompanyActivity[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
        <SectionHeader label="Industry Partners" title="Company Activity by Application Volume" />
        <div className="text-center py-10 text-sm" style={{ color: C.muted }}>No company applications recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
      <SectionHeader label="Industry Partners" title="Company Activity by Application Volume" badge={`Top ${data.length} by volume`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ResponsiveContainer width="100%" height={Math.min(data.length * 48, 400)}>
          <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 60, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="companyName" tick={{ fill: C.ink, fontSize: 11 }} width={110} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltipBase />} cursor={{ fill: `${C.primary}15` }} />
            <Legend formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
            <Bar dataKey="totalApplications" name="Applications" fill={C.primary} radius={[0, 4, 4, 0]} />
            <Bar dataKey="hired" name="Hired" fill={C.emerald} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.hairline }}>
                {['Company', 'Apps', 'Hired', 'Conv %'].map(h => (
                  <th key={h} className="pb-2 text-left font-mono uppercase tracking-wider text-[10.5px]" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: `${C.hairline}60` }}>
              {data.map(c => (
                <tr key={c.companyId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-semibold" style={{ color: C.ink }}>
                    <div>{c.companyName}</div>
                    <div className="text-[10px] font-normal" style={{ color: C.muted }}>{c.industrySector}</div>
                  </td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.primary }}>{c.totalApplications}</td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.emerald }}>{c.hired}</td>
                  <td className="py-2.5 font-mono" style={{ color: c.conversionRate >= 20 ? C.emerald : c.conversionRate >= 10 ? C.amber : C.muted }}>
                    {c.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Domain Performance (grouped by StudentProfile.targetDomain)
// NOTE: targetDomain is a career/domain preference field — NOT an academic department.
// ---------------------------------------------------------------------------

function DomainSection({ data }: { data: DomainPerformance[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border p-6" style={{ background: C.s1, borderColor: C.hairline }}>
        <SectionHeader label="Domain Analysis" title="Domain Performance" />
        <div className="text-center py-10 text-sm" style={{ color: C.muted }}>No domain data yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
      <SectionHeader label="By targetDomain" title="Domain Performance" />
      <p className="text-[10.5px] font-mono" style={{ color: C.subtle }}>
        Grouped by StudentProfile.targetDomain (career/domain preference). Avg Match @ Apply = average of Application.matchScoreAtApply (7-factor snapshot); null records excluded.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ResponsiveContainer width="100%" height={Math.min(data.length * 52, 360)}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="domain" tick={{ fill: C.ink, fontSize: 11 }} width={120} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltipBase />} cursor={{ fill: `${C.primary}15` }} />
            <Legend formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
            <Bar dataKey="studentCount" name="Students" fill={C.cyan} radius={[0, 4, 4, 0]} />
            <Bar dataKey="hiredCount" name="Hired" fill={C.emerald} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.hairline }}>
                {['Domain', 'Students', 'Apps', 'Hired', 'Placement %', 'Avg Match @ Apply'].map(h => (
                  <th key={h} className="pb-2 text-left font-mono uppercase tracking-wider text-[10.5px]" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: `${C.hairline}60` }}>
              {data.map(d => (
                <tr key={d.domain} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-semibold" style={{ color: C.ink }}>{d.domain}</td>
                  <td className="py-2.5 font-mono" style={{ color: C.cyan }}>{d.studentCount}</td>
                  <td className="py-2.5 font-mono" style={{ color: C.primary }}>{d.applicationCount}</td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.emerald }}>{d.hiredCount}</td>
                  <td className="py-2.5 font-mono" style={{ color: d.placementRate >= 20 ? C.emerald : d.placementRate >= 10 ? C.amber : C.muted }}>
                    {d.placementRate}%
                  </td>
                  <td className="py-2.5 font-mono" style={{ color: C.muted }}>
                    {d.avgMatchScoreAtApply > 0 ? `${d.avgMatchScoreAtApply}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Batch Cohort Analysis
// ---------------------------------------------------------------------------

function CohortSection({ data }: { data: BatchCohort[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border p-6" style={{ background: C.s1, borderColor: C.hairline }}>
        <SectionHeader label="Cohort Analysis" title="Batch Year Performance" />
        <div className="text-center py-8 text-sm" style={{ color: C.muted }}>No batch cohort data available (gradYear not set on students).</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
      <SectionHeader label="Cohort Analysis" title="Batch Year Performance" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: 0, right: 32, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
            <XAxis dataKey="gradYear" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltipBase />} cursor={{ fill: `${C.primary}15` }} />
            <Legend formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
            <Bar dataKey="studentCount" name="Students" fill={C.cyan} radius={[4, 4, 0, 0]} />
            <Bar dataKey="applicationCount" name="Applications" fill={C.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="hiredCount" name="Hired" fill={C.emerald} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.hairline }}>
                {['Batch Year', 'Students', 'Apps', 'Hired', 'Placement %'].map(h => (
                  <th key={h} className="pb-2 text-left font-mono uppercase tracking-wider text-[10.5px]" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: `${C.hairline}60` }}>
              {data.map(c => (
                <tr key={c.gradYear} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.amber }}>{c.gradYear}</td>
                  <td className="py-2.5 font-mono" style={{ color: C.cyan }}>{c.studentCount}</td>
                  <td className="py-2.5 font-mono" style={{ color: C.primary }}>{c.applicationCount}</td>
                  <td className="py-2.5 font-mono font-bold" style={{ color: C.emerald }}>{c.hiredCount}</td>
                  <td className="py-2.5 font-mono" style={{ color: c.placementRate >= 20 ? C.emerald : c.placementRate >= 10 ? C.amber : C.muted }}>
                    {c.placementRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Status Distribution + Opportunity Types  (side-by-side)
// ---------------------------------------------------------------------------

function StatusAndTypesSection({
  statusData,
  typeData,
}: {
  statusData: StatusDistribution[];
  typeData: { type: string; count: number; hired: number }[];
}) {
  const PIE_COLORS = statusData.map(s => STATUS_COLORS[s.status] || C.muted);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution Donut */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
        <SectionHeader label="Pipeline Distribution" title="Application Status Breakdown" />
        {statusData.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: C.muted }}>No application data.</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as StatusDistribution;
                    return (
                      <div className="rounded-xl border p-3 text-xs font-mono shadow-xl" style={{ background: C.s2, borderColor: C.hairline }}>
                        <div className="font-semibold mb-1" style={{ color: C.ink }}>{d.label}</div>
                        <div style={{ color: STATUS_COLORS[d.status] || C.muted }}>Count: <strong>{d.count}</strong></div>
                        <div style={{ color: C.muted }}>Share: {d.pct}%</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
              {statusData.map((s, i) => (
                <div key={s.status} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span style={{ color: C.muted }}>{s.label}</span>
                  <span className="font-mono font-bold" style={{ color: PIE_COLORS[i] }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Types */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
        <SectionHeader label="Opportunity Mix" title="Top Opportunity Types" />
        {typeData.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: C.muted }}>No opportunity data.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
              <XAxis dataKey="type" tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltipBase />} cursor={{ fill: `${C.primary}15` }} />
              <Legend formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="count" name="Applications" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="hired" name="Hired" fill={C.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export const InstitutionRecruitmentMetricsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'funnel' | 'trends' | 'companies' | 'domains' | 'cohorts'>('overview');

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['institutionRecruitmentMetrics'],
    queryFn: () => api.get<{ metrics: RecruitmentMetrics }>('/institutions/recruitment-metrics'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const metrics = data?.metrics;

  // Loading
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3" style={{ color: C.muted }}>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Computing recruitment metrics…</span>
        </div>
      </div>
    );
  }

  // Error
  if (isError || !metrics) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle className="w-10 h-10" style={{ color: C.red }} />
          <div>
            <div className="font-semibold mb-1" style={{ color: C.ink }}>Failed to load metrics</div>
            <div className="text-sm mb-4" style={{ color: C.muted }}>
              {(error as any)?.message || 'An error occurred while computing recruitment analytics.'}
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: C.primary, color: C.ink }}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const computedAt = metrics.computedAt ? new Date(metrics.computedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  const TABS = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'funnel',    label: 'Funnel'    },
    { key: 'trends',    label: 'Trends'    },
    { key: 'companies', label: 'Companies' },
    { key: 'domains',   label: 'Domains'   },
    { key: 'cohorts',   label: 'Cohorts'   },
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div
        className="rounded-2xl border p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        style={{ background: C.s1, borderColor: C.hairline }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border" style={{ background: C.s2, color: C.emerald, borderColor: `${C.emerald}30` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.emerald }} />
              Recruitment Analytics
            </span>
            <span className="text-xs font-mono" style={{ color: C.muted }}>
              {user?.institutionProfile?.institutionName || 'Institution'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: C.ink }}>
            Recruitment Metrics Dashboard
          </h1>
          <p className="text-xs sm:text-sm max-w-xl leading-relaxed" style={{ color: C.muted }}>
            Institution-scoped pipeline analytics derived from live application and placement records. All metrics reflect your affiliated student cohort only.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: C.s2, borderColor: C.hairline }}>
            <div className="text-center px-3">
              <div className="text-3xl font-bold font-mono" style={{ color: C.emerald }}>{metrics.overview.overallPlacementRate}%</div>
              <div className="text-[10.5px] mt-0.5 font-sans" style={{ color: C.muted }}>Placed / Enrolled</div>
            </div>
            <div className="w-px h-10" style={{ background: C.hairline }} />
            <div className="text-center px-3">
              <div className="text-3xl font-bold font-mono" style={{ color: C.cyan }}>{metrics.overview.totalStudents}</div>
              <div className="text-[10.5px] mt-0.5 font-sans" style={{ color: C.muted }}>Enrolled</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: C.subtle }}>Updated {computedAt}</span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: C.s2, color: C.muted }}
              title="Refresh metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all"
            style={{
              background: tab === t.key ? C.primary : C.s1,
              color:      tab === t.key ? C.ink    : C.muted,
              border:     `1px solid ${tab === t.key ? C.primary : C.hairline}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <OverviewSection data={metrics.overview} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendsSection data={metrics.monthlyTrends} />
            <div className="rounded-2xl border p-6 space-y-4" style={{ background: C.s1, borderColor: C.hairline }}>
              <SectionHeader label="Status Mix" title="Application Status Distribution" />
              {metrics.statusDistribution.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: C.muted }}>No application data.</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {metrics.statusDistribution.map(s => (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: STATUS_COLORS[s.status] || C.muted }}>{s.label}</span>
                        <span className="font-mono" style={{ color: C.muted }}>{s.count} · {s.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.s2 }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${s.pct}%`, background: STATUS_COLORS[s.status] || C.primary }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'funnel' && <FunnelSection data={metrics.funnel} />}

      {tab === 'trends' && (
        <div className="space-y-6">
          <TrendsSection data={metrics.monthlyTrends} />
          <StatusAndTypesSection statusData={metrics.statusDistribution} typeData={metrics.topOpportunityTypes} />
        </div>
      )}

      {tab === 'companies' && <CompaniesSection data={metrics.topCompaniesByVolume} />}

      {tab === 'domains' && <DomainSection data={metrics.domainPerformance} />}

      {tab === 'cohorts' && (
        <div className="space-y-6">
          <CohortSection data={metrics.batchCohorts} />
          <DomainSection data={metrics.domainPerformance} />
        </div>
      )}

      {/* Footer: scope disclosure */}
      <div className="text-[10.5px] font-mono text-center pb-2" style={{ color: C.subtle }}>
        Metrics scoped to your institution's affiliated students only · Computed at {computedAt}
      </div>
    </div>
  );
};
