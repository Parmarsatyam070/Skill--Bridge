import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  HelpCircle,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TalentAssessmentSubmitResult } from '@shared/types';

interface AssessmentResultSummaryProps {
  result: TalentAssessmentSubmitResult;
  assessmentTitle: string;
  opportunityId?: string | null;
  onBackToAssessments: () => void;
}

export const AssessmentResultSummary: React.FC<AssessmentResultSummaryProps> = ({
  result,
  assessmentTitle,
  opportunityId,
  onBackToAssessments,
}) => {
  const isPassed = result.passed;
  const timeMinutes = Math.floor(result.timeSpentSeconds / 60);
  const timeSeconds = result.timeSpentSeconds % 60;
  const accuracyPct =
    result.totalQuestions > 0
      ? Math.round((result.correctQuestions / result.totalQuestions) * 100)
      : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main Result Card */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isPassed ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border font-mono">
          {isPassed ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>ASSESSMENT PASSED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>REQUIREMENT NOT MET</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{assessmentTitle}</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          Your assessment has been evaluated deterministically by the SkillBridge test engine.
        </p>

        {/* Score Ring / Number */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div
            className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-[#0f172a] shadow-lg ${
              isPassed ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'
            }`}
          >
            <span className="text-3xl font-extrabold font-mono tracking-tight">{result.score}%</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl mb-6 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Time Spent</span>
            </div>
            <span className="text-sm font-semibold text-white">
              {timeMinutes}m {timeSeconds}s
            </span>
          </div>

          <div className="border-x border-[#1e293b]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Correct</span>
            </div>
            <span className="text-sm font-semibold text-white">
              {result.correctQuestions} / {result.totalQuestions}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Accuracy</span>
            </div>
            <span className="text-sm font-semibold text-white">{accuracyPct}%</span>
          </div>
        </div>

        {/* Mandatory Advisory Disclaimer Banner */}
        <div className="p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-xl text-left flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed mb-6">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>{result.disclaimer}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToAssessments}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0f172a] text-white border border-[#1e293b] hover:border-slate-600 transition-colors"
          >
            Back to Assessments
          </button>

          {opportunityId && (
            <Link
              to={`/opportunities/${opportunityId}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-md shadow-blue-500/20"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>View Opportunity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
