import React from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import {
  TalentAssessmentDetailDto,
  TalentAssessmentSubmissionDto,
  TalentAssessmentSubmitResult,
  TALENT_ASSESSMENT_ADVISORY_DISCLAIMER,
} from '@shared/types';
import { AssessmentResultSummary } from '../../components/assessments/AssessmentResultSummary';

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Location state if navigated immediately from taking page
  const stateResult = (location.state as any)?.submitResult as TalentAssessmentSubmitResult | undefined;
  const stateTitle = (location.state as any)?.assessmentTitle as string | undefined;

  // Query assessment details for metadata/opportunity link
  const { data: assessmentData } = useQuery<{ assessment: TalentAssessmentDetailDto }>({
    queryKey: ['talent-assessment-detail', id],
    queryFn: () => api.get(`/talent-assessments/${id}`),
    enabled: !!id,
  });

  // Query student's submission if not passed via location state
  const {
    data: subData,
    isLoading: isSubLoading,
    isError: isSubError,
  } = useQuery<{ submission: TalentAssessmentSubmissionDto }>({
    queryKey: ['my-talent-assessment-submission', id],
    queryFn: () => api.get(`/talent-assessments/${id}/my-submission`),
    enabled: !!id && !stateResult,
  });

  if (!stateResult && isSubLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
        <span className="text-xs">Fetching assessment results...</span>
      </div>
    );
  }

  const assessment = assessmentData?.assessment;
  const submission = subData?.submission;

  if (!stateResult && (isSubError || !submission)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">No Submission Found</h3>
          <p className="text-xs mb-5">You have not completed an attempt for this assessment yet.</p>
          <Link
            to={`/assessments/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0f172a] text-white border border-[#1e293b]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Assessment Page</span>
          </Link>
        </div>
      </div>
    );
  }

  // Normalize result payload
  const result: TalentAssessmentSubmitResult = stateResult || {
    submissionId: submission!.id,
    assessmentId: id!,
    score: submission!.score,
    passed: submission!.passed,
    timeSpentSeconds: submission!.timeSpentSeconds,
    submittedAt: submission!.submittedAt || new Date().toISOString(),
    totalQuestions: assessment?.questionCount || 0,
    correctQuestions: Math.round(((submission!.score / 100) * (assessment?.questionCount || 0))),
    disclaimer:
      'Assessments are scored deterministically by the SkillBridge test engine. Results are advisory evaluations of technical proficiency for matching and recruitment purposes.',
  };

  const title = stateTitle || assessment?.title || 'Talent Assessment';
  const opportunityId = assessment?.opportunityId || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessments</span>
        </Link>
      </div>

      <AssessmentResultSummary
        result={result}
        assessmentTitle={title}
        opportunityId={opportunityId}
        onBackToAssessments={() => navigate('/assessments')}
      />
    </div>
  );
};
