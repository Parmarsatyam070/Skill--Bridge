import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  Code2,
  FolderGit2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { OpportunityMatchItem } from '@shared/types';

interface OpportunityMatchBreakdownViewProps {
  match: OpportunityMatchItem;
  compact?: boolean;
}

export const OpportunityMatchBreakdownView: React.FC<OpportunityMatchBreakdownViewProps> = ({
  match,
  compact = false,
}) => {
  const { score, tier, eligibility, ineligibilityReason, breakdown } = match;

  const tierMeta = {
    high: {
      label: 'High Match (Direct Fit)',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      ringColor: '#10b981',
      desc: 'You satisfy all primary role requirements and exceed threshold benchmarks.',
    },
    medium: {
      label: 'Moderate Match (Targeted Fit)',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      ringColor: '#f59e0b',
      desc: 'Good alignment on core areas; focus on recommended gap skills to optimize fit.',
    },
    low: {
      label: 'Developing Match',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      ringColor: '#f43f5e',
      desc: 'Multiple key skill prerequisites missing or unverified.',
    },
  }[tier] || {
    label: 'Evaluated Match',
    badgeClass: 'bg-blue-600/15 text-blue-400 border-blue-500/30',
    ringColor: '#2563eb',
    desc: 'Match evaluated by authoritative engine.',
  };

  const factors = breakdown?.factors || {
    requiredSkillsCoverage:  { score: 0, weight: 0.40, weighted: 0 },
    skillProficiencyDepth:   { score: 0, weight: 0.20, weighted: 0 },
    experienceTechOverlap:   { score: 0, weight: 0.10, weighted: 0 },
    projectPortfolioQuality: { score: 0, weight: 0.10, weighted: 0 },
    assessmentAndDSA:        { score: 0, weight: 0.10, weighted: 0 },
    educationMatch:          { score: 0, weight: 0.05, weighted: 0 },
    certificationRelevance:  { score: 0, weight: 0.05, weighted: 0 },
  };

  const factorList = [
    {
      key: 'requiredSkillsCoverage',
      title: 'Required Skills Coverage',
      weightPct: '40%',
      icon: ShieldCheck,
      color: '#3b82f6',
      data: factors.requiredSkillsCoverage,
      desc: 'Fulfillment of mandatory and preferred role requirements',
    },
    {
      key: 'skillProficiencyDepth',
      title: 'Skill Proficiency',
      weightPct: '20%',
      icon: TrendingUp,
      color: '#0ea5e9',
      data: factors.skillProficiencyDepth,
      desc: 'Demonstrated mastery level vs benchmark target scores',
    },
    {
      key: 'experienceTechOverlap',
      title: 'Experience',
      weightPct: '10%',
      icon: Code2,
      color: '#10b981',
      data: factors.experienceTechOverlap,
      desc: 'Real project tech stack alignment with required skills',
    },
    {
      key: 'projectPortfolioQuality',
      title: 'Projects',
      weightPct: '10%',
      icon: FolderGit2,
      color: '#6366f1',
      data: factors.projectPortfolioQuality,
      desc: 'Public code repos, production demo URLs & project depth',
    },
    {
      key: 'assessmentAndDSA',
      title: 'Assessment',
      weightPct: '10%',
      icon: Award,
      color: '#a855f7',
      data: factors.assessmentAndDSA,
      desc: 'Proctored evaluations, solved DSA problems & practice consistency',
    },
    {
      key: 'educationMatch',
      title: 'Education',
      weightPct: '5%',
      icon: GraduationCap,
      color: '#f59e0b',
      data: factors.educationMatch,
      desc: 'Academic degree level, CGPA band & graduation recency',
    },
    {
      key: 'certificationRelevance',
      title: 'Certification',
      weightPct: '5%',
      icon: BookOpen,
      color: '#f97316',
      data: factors.certificationRelevance,
      desc: 'Accredited domain credentials and verified licenses',
    },
  ];

  if (compact) {
    return (
      <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xl font-bold font-mono"
              style={{ color: tierMeta.ringColor }}
            >
              {score}%
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierMeta.badgeClass}`}>
              {tierMeta.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {eligibility ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Eligible</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Ineligible</span>
              </span>
            )}
          </div>
        </div>

        {/* 7-Factor Bar Progress List */}
        <div className="space-y-1.5 pt-1">
          {factorList.map((f) => (
            <div key={f.key} className="space-y-0.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <f.icon className="w-3 h-3" style={{ color: f.color }} />
                  <span>{f.title}</span>
                  <span className="text-[9px] text-slate-500">({f.weightPct})</span>
                </span>
                <span className="text-white font-mono font-medium">{f.data.score}%</span>
              </div>
              <div className="w-full h-1 bg-[#0b1329] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, f.data.score)}%`, backgroundColor: f.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-[#1e293b] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Circular Progress Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#0b1329"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={tierMeta.ringColor}
                  strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-white">{score}%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">7-Factor</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">{tierMeta.label}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierMeta.badgeClass}`}>
                  {tier.toUpperCase()} TIER
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">{tierMeta.desc}</p>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 font-mono">
                <span>ALGORITHM:</span>
                <span className="text-blue-400 font-semibold">{breakdown?.algorithmVersion || 'v2.0-7factor'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">DETERMINISTIC VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Eligibility Indicator Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-center min-w-[220px] ${
              eligibility
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {eligibility ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold text-sm">Mandatory Skills Met</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold text-sm">Mandatory Skills Missing</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {eligibility
                ? 'All mandatory requirements satisfied. Candidate ranked by 7-factor composite score.'
                : ineligibilityReason || 'One or more required mandatory skills have not been verified.'}
            </p>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Authoritative 7-Factor Mathematical Composition
          </h4>
          <span className="text-[11px] text-slate-400">Weights sum to 100%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {factorList.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.key}
                className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-blue-500/40 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${f.color}15`, color: f.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{f.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#0b1329] text-slate-400">
                          {f.weightPct}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-white">{f.data.score}%</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{(f.data.weighted || (f.data.score * f.data.weight)).toFixed(1)} pts
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#0b1329] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(2, Math.min(100, f.data.score))}%`,
                      backgroundColor: f.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Recommendations */}
      {(match.strengths && match.strengths.length > 0) || (match.recommendations && match.recommendations.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {match.strengths && match.strengths.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Strengths</span>
              </div>
              <ul className="space-y-2">
                {match.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {match.recommendations && match.recommendations.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Actionable Recommendations</span>
              </div>
              <ul className="space-y-2">
                {match.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
