import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  Brain,
  MessageSquare,
  Compass,
} from 'lucide-react';
import { InterviewEvaluation } from '@shared/types';
import { InterviewAdvisoryNotice } from './InterviewAdvisoryNotice';

interface InterviewFeedbackCardProps {
  evaluation: InterviewEvaluation;
}

export const InterviewFeedbackCard: React.FC<InterviewFeedbackCardProps> = ({ evaluation }) => {
  const getReadinessBadge = (tier: string) => {
    switch (tier) {
      case 'READY':
        return { label: 'Interview Ready', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'ALMOST_READY':
        return { label: 'Almost Ready', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'DEVELOPING':
        return { label: 'Developing', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'NEEDS_WORK':
      default:
        return { label: 'Needs Preparation', color: 'bg-red-500/15 text-red-300 border-red-500/30' };
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'STRONGLY_RECOMMEND':
        return { label: 'Strong Positive Signal', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'RECOMMEND':
        return { label: 'Positive Signal', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'MAYBE':
        return { label: 'Mixed Signal', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'DO_NOT_RECOMMEND':
      default:
        return { label: 'Needs Additional Practice', color: 'bg-[#0f172a] text-slate-400 border-[#1e293b]' };
    }
  };

  const readinessMeta = getReadinessBadge(evaluation.readinessTier);
  const recMeta = getRecommendationBadge(evaluation.recommendation);

  return (
    <div className="space-y-6">
      {/* ── KPI HEADER CARD ────────────────────────────────────────── */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1e293b]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                AI Advisory Signal
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${readinessMeta.color}`}>
                {readinessMeta.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Interview Evaluation Scorecard
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Generated via multi-factor generative assessment analyzing technical precision, problem decomposition, and structured articulation.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Overall Advisory Score */}
            <div className="text-center p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] min-w-[110px]">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-mono">
                {evaluation.overallScore}
                <span className="text-xs text-slate-500 font-sans font-normal">/100</span>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-1 block">
                Advisory Score
              </span>
            </div>

            {/* Technical Score */}
            {evaluation.technicalScore !== undefined && (
              <div className="text-center p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] min-w-[100px] hidden sm:block">
                <div className="text-2xl sm:text-3xl font-bold text-slate-200 font-mono">
                  {evaluation.technicalScore}%
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-1 block">
                  Technical
                </span>
              </div>
            )}

            {/* Communication Score */}
            {evaluation.communicationScore !== undefined && (
              <div className="text-center p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] min-w-[100px] hidden sm:block">
                <div className="text-2xl sm:text-3xl font-bold text-slate-200 font-mono">
                  {evaluation.communicationScore}%
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-1 block">
                  Communication
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Signal Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Advisory Recommendation:</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${recMeta.color}`}>
              {recMeta.label}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            *This recommendation does not automate or override human hiring discretion.
          </span>
        </div>
      </div>

      {/* ── STRENGTHS & IMPROVEMENT AREAS ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <h3>Demonstrated Strengths</h3>
          </div>
          <ul className="space-y-3">
            {evaluation.strengths.map((st, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{st}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <h3>Growth & Improvement Areas</h3>
          </div>
          <ul className="space-y-3">
            {evaluation.improvementAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── EVIDENCE OBSERVED ─────────────────────────────────────── */}
      {evaluation.evidenceObserved && evaluation.evidenceObserved.length > 0 && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Brain className="w-4 h-4" />
            <h3>Candidate Evidence Observed</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {evaluation.evidenceObserved.map((ev, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs text-slate-300 flex items-start gap-2"
              >
                <span className="text-blue-400 font-mono text-xs font-bold mt-0.5">#{i + 1}</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SKILL OBSERVATIONS ────────────────────────────────────── */}
      {evaluation.skillObservations && evaluation.skillObservations.length > 0 && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <TrendingUp className="w-4 h-4" />
            <h3>Skill Observations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evaluation.skillObservations.map((obs, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{obs.skill}</span>
                  <span className="font-mono text-blue-400 font-bold">{obs.rating}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {obs.observation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ───────────────────────────────────────── */}
      {evaluation.recommendations && evaluation.recommendations.length > 0 && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Compass className="w-4 h-4" />
            <h3>Actionable Preparation Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {evaluation.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── MANDATORY ADVISORY NOTICE CARD ────────────────────────── */}
      <InterviewAdvisoryNotice variant="card" />
    </div>
  );
};
