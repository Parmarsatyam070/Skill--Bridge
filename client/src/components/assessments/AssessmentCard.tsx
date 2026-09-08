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
    <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5 hover:border-[#2F8C82]/50 transition-all duration-200 flex flex-col justify-between group shadow-sm">
      <div>
        {/* Header Tags & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {assessment.opportunityTitle ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1D24] text-[#2F8C82] border border-[#2F8C82]/30">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{assessment.opportunityTitle}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1D24] text-[#8B90A0] border border-[#2A2E38]">
                <FileText className="w-3 h-3" />
                <span>General Assessment</span>
              </span>
            )}

            {isIndustry && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  assessment.status === 'PUBLISHED'
                    ? 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30'
                    : assessment.status === 'DRAFT'
                    ? 'bg-[#E8A23C]/10 text-[#E8A23C] border-[#E8A23C]/30'
                    : 'bg-[#8B90A0]/10 text-[#8B90A0] border-[#8B90A0]/30'
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
                  ? 'bg-[#4CC38A]/10 text-[#4CC38A] border border-[#4CC38A]/30'
                  : 'bg-[#E5637C]/10 text-[#E5637C] border border-[#E5637C]/30'
              }`}
            >
              {sub.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{sub.passed ? 'PASSED' : 'NOT PASSED'}</span>
              <span className="font-mono ml-0.5">({sub.score}%)</span>
            </span>
          )}

          {isStudent && isInProgress && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8A23C]/10 text-[#E8A23C] border border-[#E8A23C]/30 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-semibold text-[#F4F5F7] group-hover:text-white transition-colors mb-1.5 line-clamp-1">
          {assessment.title}
        </h3>
        <p className="text-xs text-[#8B90A0] line-clamp-2 mb-4 leading-relaxed">
          {assessment.description}
        </p>

        {/* Company info if available */}
        {assessment.companyName && (
          <div className="flex items-center gap-1.5 text-xs text-[#8B90A0] mb-3">
            <Building2 className="w-3.5 h-3.5 text-[#2F8C82]" />
            <span className="truncate">{assessment.companyName}</span>
          </div>
        )}

        {/* Assessment Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#1A1D24] border border-[#2A2E38] rounded-xl mb-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono">
              <Clock className="w-3 h-3 text-[#2F8C82]" />
              <span>Duration</span>
            </div>
            <span className="text-xs font-semibold text-[#F4F5F7]">{assessment.durationMinutes}m</span>
          </div>
          <div className="border-x border-[#2A2E38]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono">
              <HelpCircle className="w-3 h-3 text-[#2F8C82]" />
              <span>Questions</span>
            </div>
            <span className="text-xs font-semibold text-[#F4F5F7]">{assessment.questionCount}</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#8B90A0] uppercase font-mono">
              <Award className="w-3 h-3 text-[#2F8C82]" />
              <span>Pass Score</span>
            </div>
            <span className="text-xs font-semibold text-[#F4F5F7]">{assessment.passingScorePct}%</span>
          </div>
        </div>

        {/* Required Skills Chips */}
        {assessment.requiredSkills && assessment.requiredSkills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {assessment.requiredSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#1A1D24] text-[11px] text-[#8B90A0] border border-[#2A2E38]"
              >
                {skill}
              </span>
            ))}
            {assessment.requiredSkills.length > 3 && (
              <span className="text-[10px] text-[#8B90A0] font-mono">
                +{assessment.requiredSkills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#2A2E38] flex items-center justify-between gap-3">
        {isStudent && (
          <>
            {isSubmitted ? (
              <Link
                to={`/assessments/${assessment.id}/result`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38] hover:border-[#2F8C82] hover:text-[#2F8C82] transition-colors"
              >
                <span>View Result Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : isInProgress ? (
              <Link
                to={`/assessments/${assessment.id}/take`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E8A23C] text-black hover:bg-[#d49132] transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Resume Attempt</span>
              </Link>
            ) : (
              <Link
                to={`/assessments/${assessment.id}`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm"
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
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38] hover:border-[#2F8C82] transition-colors"
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
                    ? 'bg-[#E5637C]/10 text-[#E5637C] border-[#E5637C]/30 hover:bg-[#E5637C]/20'
                    : 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30 hover:bg-[#4CC38A]/20'
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
