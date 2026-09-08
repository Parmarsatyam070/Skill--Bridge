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
      <div className="bg-[#111318] border border-[#2A2E38] rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isPassed ? 'bg-[#4CC38A]' : 'bg-[#E5637C]'
          }`}
        />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border font-mono">
          {isPassed ? (
            <span className="flex items-center gap-1.5 text-[#4CC38A]">
              <CheckCircle2 className="w-4 h-4" />
              <span>ASSESSMENT PASSED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#E5637C]">
              <XCircle className="w-4 h-4" />
              <span>REQUIREMENT NOT MET</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F7] mb-2">{assessmentTitle}</h1>
        <p className="text-xs text-[#8B90A0] max-w-md mx-auto mb-8 leading-relaxed">
          Your assessment has been evaluated deterministically by the SkillBridge test engine.
        </p>

        {/* Score Ring / Number */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div
            className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-[#1A1D24] shadow-lg ${
              isPassed ? 'border-[#4CC38A] text-[#4CC38A]' : 'border-[#E5637C] text-[#E5637C]'
            }`}
          >
            <span className="text-3xl font-extrabold font-mono tracking-tight">{result.score}%</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8B90A0] mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#1A1D24] border border-[#2A2E38] rounded-2xl mb-6 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono mb-1">
              <Clock className="w-3.5 h-3.5 text-[#2F8C82]" />
              <span>Time Spent</span>
            </div>
            <span className="text-sm font-semibold text-[#F4F5F7]">
              {timeMinutes}m {timeSeconds}s
            </span>
          </div>

          <div className="border-x border-[#2A2E38]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#2F8C82]" />
              <span>Correct</span>
            </div>
            <span className="text-sm font-semibold text-[#F4F5F7]">
              {result.correctQuestions} / {result.totalQuestions}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono mb-1">
              <Award className="w-3.5 h-3.5 text-[#2F8C82]" />
              <span>Accuracy</span>
            </div>
            <span className="text-sm font-semibold text-[#F4F5F7]">{accuracyPct}%</span>
          </div>
        </div>

        {/* Mandatory Advisory Disclaimer Banner */}
        <div className="p-3.5 bg-[#1A1D24] border border-[#2A2E38] rounded-xl text-left flex items-start gap-2.5 text-[11px] text-[#8B90A0] leading-relaxed mb-6">
          <ShieldCheck className="w-4 h-4 text-[#2F8C82] shrink-0 mt-0.5" />
          <span>{result.disclaimer}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToAssessments}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38] hover:border-[#2F8C82] transition-colors"
          >
            Back to Assessments
          </button>

          {opportunityId && (
            <Link
              to={`/opportunities/${opportunityId}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm"
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
