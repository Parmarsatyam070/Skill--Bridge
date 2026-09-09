import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Award,
  HelpCircle,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Briefcase,
  Play,
  FileText,
} from 'lucide-react';
import { TalentAssessmentSummaryDto } from '@shared/types';

interface AssessmentCardProps {
  assessment: TalentAssessmentSummaryDto;
  role: 'STUDENT' | 'INDUSTRY' | string;
  onStatusToggle?: (id: string, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => void;
  isStatusUpdating?: boolean;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  role,
  onStatusToggle,
  isStatusUpdating = false,
}) => {
  const isStudent = role === 'STUDENT';
  const isIndustry = role === 'INDUSTRY';
  const sub = assessment.mySubmission;
  const isSubmitted = sub && sub.submittedAt !== null;
  const isInProgress = sub && sub.submittedAt === null;

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 hover:border-blue-500/50 hover:bg-[#0d172e] transition-all duration-200 flex flex-col justify-between group shadow-sm">
      <div>
        {/* Header Tags & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {assessment.opportunityTitle ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0f172a] text-blue-400 border border-blue-500/30">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{assessment.opportunityTitle}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0f172a] text-slate-400 border border-[#1e293b]">
                <FileText className="w-3 h-3" />
                <span>General Assessment</span>
              </span>
            )}

            {isIndustry && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  assessment.status === 'PUBLISHED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : assessment.status === 'DRAFT'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}
              >
                {assessment.status}
              </span>
            )}
          </div>

          {/* Student completion status */}
          {isStudent && isSubmitted && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                sub.passed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {sub.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{sub.passed ? 'PASSED' : 'NOT PASSED'}</span>
              <span className="font-mono ml-0.5">({sub.score}%)</span>
            </span>
          )}

          {isStudent && isInProgress && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors mb-1.5 line-clamp-1">
          {assessment.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {assessment.description}
        </p>

        {/* Company info if available */}
        {assessment.companyName && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">{assessment.companyName}</span>
          </div>
        )}

        {/* Assessment Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#0f172a] border border-[#1e293b] rounded-xl mb-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>Duration</span>
            </div>
            <span className="text-xs font-semibold text-white">{assessment.durationMinutes}m</span>
          </div>
          <div className="border-x border-[#1e293b]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <HelpCircle className="w-3 h-3 text-blue-400" />
              <span>Questions</span>
            </div>
            <span className="text-xs font-semibold text-white">{assessment.questionCount}</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase font-mono">
              <Award className="w-3 h-3 text-blue-400" />
              <span>Pass Score</span>
            </div>
            <span className="text-xs font-semibold text-white">{assessment.passingScorePct}%</span>
          </div>
        </div>

        {/* Required Skills Chips */}
        {assessment.requiredSkills && assessment.requiredSkills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {assessment.requiredSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#0f172a] text-[11px] text-slate-400 border border-[#1e293b]"
              >
                {skill}
              </span>
            ))}
            {assessment.requiredSkills.length > 3 && (
              <span className="text-[10px] text-slate-400 font-mono">
                +{assessment.requiredSkills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-3">
        {isStudent && (
          <>
            {isSubmitted ? (
              <Link
                to={`/assessments/${assessment.id}/result`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#0f172a] text-white border border-[#1e293b] hover:border-blue-500/50 hover:text-blue-400 transition-colors"
              >
                <span>View Result Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : isInProgress ? (
              <Link
                to={`/assessments/${assessment.id}/take`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Resume Attempt</span>
              </Link>
            ) : (
              <Link
                to={`/assessments/${assessment.id}`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Assessment</span>
              </Link>
            )}
          </>
        )}

        {isIndustry && (
          <div className="w-full flex items-center justify-between gap-2">
            <Link
              to={`/assessments/${assessment.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#0f172a] text-white border border-[#1e293b] hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              <span>Manage & Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {onStatusToggle && (
              <button
                type="button"
                disabled={isStatusUpdating}
                onClick={() =>
                  onStatusToggle(
                    assessment.id,
                    assessment.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
                  )
                }
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  assessment.status === 'PUBLISHED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {assessment.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
