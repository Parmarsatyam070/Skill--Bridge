import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Clock,
  Award,
  HelpCircle,
  Building2,
  Briefcase,
  Play,
  ArrowLeft,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  TalentAssessmentDetailDto,
  TalentAssessmentAdminDetailDto,
  TalentAssessmentSubmissionDto,
} from '@shared/types';

export const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isIndustry = user?.role === 'INDUSTRY';
  const isStudent = user?.role === 'STUDENT';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'SUBMISSIONS'>('OVERVIEW');
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  // New question form state
  const [qPrompt, setQPrompt] = useState('');
  const [qType, setQType] = useState<'MCQ' | 'SHORT_ANSWER'>('MCQ');
  const [qPoints, setQPoints] = useState(10);
  const [qRubric, setQRubric] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOptIndex, setCorrectOptIndex] = useState(0);
  const [addQuestionError, setAddQuestionError] = useState<string | null>(null);

  // Fetch Assessment details
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<{ assessment: TalentAssessmentDetailDto | TalentAssessmentAdminDetailDto }>({
    queryKey: ['talent-assessment-detail', id],
    queryFn: () => api.get(`/talent-assessments/${id}`),
    enabled: !!id,
  });

  // Fetch candidate submissions if Industry
  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
  } = useQuery<{ submissions: TalentAssessmentSubmissionDto[] }>({
    queryKey: ['talent-assessment-submissions', id],
    queryFn: () => api.get(`/talent-assessments/${id}/submissions`),
    enabled: isIndustry && !!id && activeTab === 'SUBMISSIONS',
  });

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') =>
      api.patch(`/talent-assessments/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-assessment-detail', id] });
    },
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/talent-assessments/${id}/questions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-assessment-detail', id] });
      setIsAddQuestionModalOpen(false);
      resetQuestionForm();
    },
    onError: (err: any) => {
      setAddQuestionError(err.message || 'Failed to add question');
    },
  });

  const resetQuestionForm = () => {
    setQPrompt('');
    setQType('MCQ');
    setQPoints(10);
    setQRubric('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setCorrectOptIndex(0);
    setAddQuestionError(null);
  };

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) {
      setAddQuestionError('Prompt is required');
      return;
    }

    if (qType === 'MCQ') {
      if (!opt1.trim() || !opt2.trim()) {
        setAddQuestionError('At least 2 options are required');
        return;
      }
      const rawOptions = [opt1, opt2, opt3, opt4].filter(o => o.trim().length > 0);
      const options = rawOptions.map((text, idx) => ({
        id: `opt-${idx + 1}`,
        text: text.trim(),
        isCorrect: idx === correctOptIndex,
      }));

      addQuestionMutation.mutate({
        type: 'MCQ',
        prompt: qPrompt.trim(),
        options,
        points: Number(qPoints),
      });
    } else {
      if (!qRubric.trim()) {
        setAddQuestionError('Rubric / expected answer is required for short answer');
        return;
      }
      addQuestionMutation.mutate({
        type: 'SHORT_ANSWER',
        prompt: qPrompt.trim(),
        rubric: qRubric.trim(),
        points: Number(qPoints),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#8B90A0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F8C82] mb-3" />
        <span className="text-xs">Loading assessment details...</span>
      </div>
    );
  }

  if (isError || !data?.assessment) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="p-6 bg-[#E5637C]/10 border border-[#E5637C]/30 rounded-2xl text-[#E5637C]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-sm font-semibold mb-1">Assessment Not Found</h3>
          <p className="text-xs mb-4">{(error as any)?.message || 'Could not load assessment details.'}</p>
          <Link
            to="/assessments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessments</span>
          </Link>
        </div>
      </div>
    );
  }

  const assessment = data.assessment;
  const sub = assessment.mySubmission;
  const isSubmitted = sub && sub.submittedAt !== null;
  const isInProgress = sub && sub.submittedAt === null;
  const adminAssessment = assessment as TalentAssessmentAdminDetailDto;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-[#8B90A0] hover:text-[#F4F5F7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessments</span>
        </Link>

        {isIndustry && (
          <button
            type="button"
            disabled={statusMutation.isPending}
            onClick={() =>
              statusMutation.mutate(assessment.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              assessment.status === 'PUBLISHED'
                ? 'bg-[#E5637C]/10 text-[#E5637C] border-[#E5637C]/30 hover:bg-[#E5637C]/20'
                : 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30 hover:bg-[#4CC38A]/20'
            }`}
          >
            {assessment.status === 'PUBLISHED' ? 'Unpublish Assessment' : 'Publish Assessment'}
          </button>
        )}
      </div>

      {/* Main Assessment Header Card */}
      <div className="bg-[#111318] border border-[#2A2E38] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {assessment.opportunityTitle && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A1D24] text-[#2F8C82] border border-[#2F8C82]/30">
                  <Briefcase className="w-3 h-3" />
                  <span>{assessment.opportunityTitle}</span>
                </span>
              )}
              {isIndustry && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                    assessment.status === 'PUBLISHED'
                      ? 'bg-[#4CC38A]/10 text-[#4CC38A] border-[#4CC38A]/30'
                      : 'bg-[#E8A23C]/10 text-[#E8A23C] border-[#E8A23C]/30'
                  }`}
                >
                  {assessment.status}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F7] mb-2">{assessment.title}</h1>
            <p className="text-xs sm:text-sm text-[#8B90A0] leading-relaxed max-w-2xl">
              {assessment.description}
            </p>
          </div>

          {/* Student Action Buttons */}
          {isStudent && (
            <div className="shrink-0 flex flex-col items-end gap-2">
              {isSubmitted ? (
                <Link
                  to={`/assessments/${assessment.id}/result`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1D24] text-[#4CC38A] border border-[#4CC38A]/30 hover:bg-[#1A1D24]/80 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Submission Result ({sub.score}%)</span>
                </Link>
              ) : isInProgress ? (
                <Link
                  to={`/assessments/${assessment.id}/take`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#E8A23C] text-black hover:bg-[#d49132] transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Resume Attempt</span>
                </Link>
              ) : (
                <Link
                  to={`/assessments/${assessment.id}/take`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Assessment</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-[#2A2E38] my-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#2F8C82]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#8B90A0] uppercase font-mono">Time Limit</div>
              <div className="text-xs font-semibold text-[#F4F5F7]">{assessment.durationMinutes} Minutes</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#2F8C82]">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#8B90A0] uppercase font-mono">Questions</div>
              <div className="text-xs font-semibold text-[#F4F5F7]">{assessment.questionCount} Questions</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#2F8C82]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#8B90A0] uppercase font-mono">Passing Standard</div>
              <div className="text-xs font-semibold text-[#F4F5F7]">{assessment.passingScorePct}% Score</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center text-[#2F8C82]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#8B90A0] uppercase font-mono">Total Points</div>
              <div className="text-xs font-semibold text-[#F4F5F7]">{assessment.totalPoints} Points</div>
            </div>
          </div>
        </div>

        {/* Required Skills Chips */}
        {assessment.requiredSkills && assessment.requiredSkills.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#8B90A0]">Evaluated Skills:</span>
            {assessment.requiredSkills.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-[#1A1D24] text-xs text-[#F4F5F7] border border-[#2A2E38]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Tabs (Industry View) */}
      {isIndustry && (
        <div className="flex items-center gap-2 border-b border-[#2A2E38] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-[#2F8C82] text-[#2F8C82]'
                : 'border-transparent text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            Overview & Guidelines
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('QUESTIONS')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'QUESTIONS'
                ? 'border-[#2F8C82] text-[#2F8C82]'
                : 'border-transparent text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            Questions ({assessment.questionCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUBMISSIONS')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'SUBMISSIONS'
                ? 'border-[#2F8C82] text-[#2F8C82]'
                : 'border-transparent text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            Candidate Submissions
          </button>
        </div>
      )}

      {/* Tab: Overview & Rules */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F4F5F7] mb-2">Assessment Instructions & Guidelines</h2>
          <ul className="space-y-2 text-xs text-[#8B90A0] list-disc list-inside leading-relaxed">
            <li>
              Once started, the assessment timer will run continuously for <strong>{assessment.durationMinutes} minutes</strong>.
            </li>
            <li>You may navigate forward and backward between questions using the Question Palette.</li>
            <li>All questions must be submitted before the countdown expires.</li>
            <li>
              Scores are calculated deterministically on the backend against authoritative benchmark keys.
            </li>
            <li>Submitting an attempt is final and cannot be modified or re-submitted.</li>
          </ul>

          {isStudent && !isSubmitted && (
            <div className="pt-4">
              <Link
                to={`/assessments/${assessment.id}/take`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" />
                <span>Begin Timed Attempt</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab: Questions Management (Industry Only) */}
      {isIndustry && activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#8B90A0]">
              Configure question prompts, correct answers, and point weighting.
            </span>
            <button
              type="button"
              onClick={() => setIsAddQuestionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          {adminAssessment.questions && adminAssessment.questions.length > 0 ? (
            <div className="space-y-3">
              {adminAssessment.questions.map((q, idx) => (
                <div key={q.id} className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#2F8C82]">Q{idx + 1}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1A1D24] text-[#8B90A0] border border-[#2A2E38]">
                        {q.type}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#F4F5F7]">{q.points} pts</span>
                  </div>

                  <p className="text-xs font-medium text-[#F4F5F7] mb-3">{q.prompt}</p>

                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl text-xs border flex items-center justify-between ${
                            opt.isCorrect
                              ? 'bg-[#4CC38A]/10 border-[#4CC38A]/40 text-[#4CC38A]'
                              : 'bg-[#1A1D24] border-[#2A2E38] text-[#8B90A0]'
                          }`}
                        >
                          <span>{opt.text}</span>
                          {opt.isCorrect && (
                            <span className="text-[10px] font-mono uppercase bg-[#4CC38A]/20 px-1.5 py-0.5 rounded">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : q.rubric ? (
                    <div className="p-2.5 bg-[#1A1D24] border border-[#2A2E38] rounded-xl text-xs text-[#8B90A0]">
                      <span className="text-[#F4F5F7] font-mono">Expected Answer: </span>
                      {q.rubric}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-[#111318] border border-[#2A2E38] rounded-2xl text-center text-xs text-[#8B90A0]">
              No questions added yet. Click "Add Question" to build this assessment.
            </div>
          )}
        </div>
      )}

      {/* Tab: Submissions Review (Industry Only) */}
      {isIndustry && activeTab === 'SUBMISSIONS' && (
        <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl overflow-hidden">
          {isSubmissionsLoading ? (
            <div className="py-16 text-center text-xs text-[#8B90A0]">
              <Loader2 className="w-6 h-6 animate-spin text-[#2F8C82] mx-auto mb-2" />
              <span>Loading candidate submissions...</span>
            </div>
          ) : submissionsData?.submissions && submissionsData.submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1D24] text-[#8B90A0] border-b border-[#2A2E38] uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3.5">Candidate</th>
                    <th className="p-3.5">Institution</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Time Spent</th>
                    <th className="p-3.5">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E38]">
                  {submissionsData.submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-[#1A1D24]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              sub.studentAvatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                sub.studentName
                              )}`
                            }
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-[#2A2E38]"
                          />
                          <span className="font-medium text-[#F4F5F7]">{sub.studentName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#8B90A0]">{sub.institution || '—'}</td>
                      <td className="p-3.5 font-mono font-semibold text-[#F4F5F7]">{sub.score}%</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sub.passed
                              ? 'bg-[#4CC38A]/10 text-[#4CC38A] border border-[#4CC38A]/30'
                              : 'bg-[#E5637C]/10 text-[#E5637C] border border-[#E5637C]/30'
                          }`}
                        >
                          {sub.passed ? 'PASSED' : 'NOT PASSED'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[#8B90A0]">
                        {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                      </td>
                      <td className="p-3.5 font-mono text-[#8B90A0]">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'In Progress'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-[#8B90A0]">
              No candidate submissions recorded for this assessment yet.
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Question (Industry only) */}
      {isAddQuestionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#111318] border border-[#2A2E38] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddQuestionModalOpen(false)}
              className="absolute top-5 right-5 text-[#8B90A0] hover:text-[#F4F5F7] p-1 rounded-lg hover:bg-[#1A1D24]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-[#F4F5F7] mb-4">Add Assessment Question</h3>

            {addQuestionError && (
              <div className="p-3 bg-[#E5637C]/10 border border-[#E5637C]/30 rounded-xl text-xs text-[#E5637C] mb-4">
                {addQuestionError}
              </div>
            )}

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">Question Type</label>
                <select
                  value={qType}
                  onChange={e => setQType(e.target.value as any)}
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7]"
                >
                  <option value="MCQ">Multiple Choice (Single Answer)</option>
                  <option value="SHORT_ANSWER">Short Answer (Keyword Match)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">Question Prompt *</label>
                <textarea
                  required
                  rows={3}
                  value={qPrompt}
                  onChange={e => setQPrompt(e.target.value)}
                  placeholder="Enter the question text..."
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl p-3 text-xs text-[#F4F5F7] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">Points</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={qPoints}
                  onChange={e => setQPoints(Number(e.target.value))}
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7]"
                />
              </div>

              {qType === 'MCQ' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#8B90A0]">
                    Options & Correct Answer Selection:
                  </label>
                  {[
                    { val: opt1, set: setOpt1, label: 'Option A' },
                    { val: opt2, set: setOpt2, label: 'Option B' },
                    { val: opt3, set: setOpt3, label: 'Option C' },
                    { val: opt4, set: setOpt4, label: 'Option D' },
                  ].map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOptIndex === idx}
                        onChange={() => setCorrectOptIndex(idx)}
                        className="accent-[#2F8C82]"
                      />
                      <input
                        type="text"
                        value={field.val}
                        onChange={e => field.set(e.target.value)}
                        placeholder={`${field.label}...`}
                        className="flex-1 bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-1.5 text-xs text-[#F4F5F7]"
                      />
                    </div>
                  ))}
                  <span className="text-[11px] text-[#8B90A0]">
                    Select the radio button next to the correct answer.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                    Expected Rubric / Answer Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={qRubric}
                    onChange={e => setQRubric(e.target.value)}
                    placeholder="e.g. idempotency or exact keyword"
                    className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#2A2E38] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addQuestionMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970]"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
