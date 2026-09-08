import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Layers,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  X,
  Clock,
  Award,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { TalentAssessmentSummaryDto, OpportunitySummary } from '@shared/types';
import { AssessmentCard } from '../../components/assessments/AssessmentCard';

export const TalentAssessmentsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isIndustry = user?.role === 'INDUSTRY';
  const isStudent = user?.role === 'STUDENT';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'COMPLETED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating an assessment (Industry only)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPassingScore, setNewPassingScore] = useState(70);
  const [newOpportunityId, setNewOpportunityId] = useState<string>('');
  const [newSkills, setNewSkills] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch assessments from /api/talent-assessments
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{ assessments: TalentAssessmentSummaryDto[] }>({
    queryKey: ['talent-assessments', user?.role],
    queryFn: () => api.get('/talent-assessments'),
    enabled: !!user,
  });

  // Fetch company opportunities if Industry
  const { data: opportunitiesData } = useQuery<{ opportunities: OpportunitySummary[] }>({
    queryKey: ['my-opportunity-listings'],
    queryFn: () => api.get('/opportunities/my/listings'),
    enabled: isIndustry,
  });

  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) =>
      api.patch(`/talent-assessments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-assessments'] });
    },
  });

  // Mutation for creating assessment
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/talent-assessments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-assessments'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create assessment');
    },
  });

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDuration(45);
    setNewPassingScore(70);
    setNewOpportunityId('');
    setNewSkills('');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setFormError('Title and description are required');
      return;
    }

    const skillsArray = newSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    createMutation.mutate({
      title: newTitle.trim(),
      description: newDescription.trim(),
      durationMinutes: Number(newDuration),
      passingScorePct: Number(newPassingScore),
      opportunityId: newOpportunityId || undefined,
      requiredSkills: skillsArray,
      questions: [
        {
          type: 'MCQ',
          prompt: 'Sample core competency question: Verify foundational knowledge in this domain.',
          options: [
            { id: 'opt-1', text: 'Option A: Correct answer approach', isCorrect: true },
            { id: 'opt-2', text: 'Option B: Common anti-pattern', isCorrect: false },
            { id: 'opt-3', text: 'Option C: Incomplete implementation', isCorrect: false },
            { id: 'opt-4', text: 'Option D: Deprecated syntax', isCorrect: false },
          ],
          points: 10,
          displayOrder: 1,
        },
      ],
    });
  };

  const assessments = data?.assessments || [];

  // Filter & search logic
  const filteredAssessments = assessments.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.opportunityTitle && a.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'PUBLISHED') return a.status === 'PUBLISHED';
    if (filterTab === 'DRAFT') return a.status === 'DRAFT';
    if (filterTab === 'COMPLETED') return a.mySubmission && a.mySubmission.submittedAt !== null;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2E38] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#2F8C82]/15 border border-[#2F8C82]/40 flex items-center justify-center text-[#2F8C82]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F5F7]">
              {isIndustry ? 'Assessment Management' : 'Talent Assessments'}
            </h1>
          </div>
          <p className="text-xs text-[#8B90A0]">
            {isIndustry
              ? 'Create, manage, and review candidate evaluations for your open opportunities.'
              : 'Take verified technical assessments to demonstrate role readiness and boost your match scores.'}
          </p>
        </div>

        {isIndustry && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111318] border border-[#2A2E38] rounded-xl self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTab === 'ALL'
                ? 'bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38]'
                : 'text-[#8B90A0] hover:text-[#F4F5F7]'
            }`}
          >
            All ({assessments.length})
          </button>

          {isIndustry && (
            <>
              <button
                type="button"
                onClick={() => setFilterTab('PUBLISHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'PUBLISHED'
                    ? 'bg-[#1A1D24] text-[#4CC38A] border border-[#2A2E38]'
                    : 'text-[#8B90A0] hover:text-[#F4F5F7]'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('DRAFT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'DRAFT'
                    ? 'bg-[#1A1D24] text-[#E8A23C] border border-[#2A2E38]'
                    : 'text-[#8B90A0] hover:text-[#F4F5F7]'
                }`}
              >
                Drafts
              </button>
            </>
          )}

          {isStudent && (
            <button
              type="button"
              onClick={() => setFilterTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'COMPLETED'
                  ? 'bg-[#1A1D24] text-[#4CC38A] border border-[#2A2E38]'
                  : 'text-[#8B90A0] hover:text-[#F4F5F7]'
              }`}
            >
              Completed
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8B90A0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assessments..."
            className="w-full bg-[#111318] border border-[#2A2E38] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82]"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-[#8B90A0]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F8C82] mb-3" />
          <span className="text-xs">Loading talent assessments...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-[#E5637C]/10 border border-[#E5637C]/30 rounded-2xl p-6 text-center text-[#E5637C] max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-sm font-semibold mb-1">Failed to load assessments</h3>
          <p className="text-xs mb-4">{(error as any)?.message || 'An unexpected error occurred.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E5637C] text-white hover:bg-[#c94962] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredAssessments.length === 0 && (
        <div className="bg-[#111318] border border-[#2A2E38] rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center mx-auto mb-4 text-[#8B90A0]">
            <CheckSquare className="w-6 h-6 text-[#2F8C82]" />
          </div>
          <h3 className="text-base font-semibold text-[#F4F5F7] mb-1.5">No Assessments Found</h3>
          <p className="text-xs text-[#8B90A0] max-w-sm mx-auto mb-6 leading-relaxed">
            {isIndustry
              ? 'You have not created any assessments yet. Create one to test candidates for your open opportunities.'
              : 'There are currently no assessments available matching your filter criteria.'}
          </p>
          {isIndustry && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Assessment</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of Assessments */}
      {!isLoading && !isError && filteredAssessments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map(assessment => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              role={user?.role || 'STUDENT'}
              onStatusToggle={(id, newStatus) => statusMutation.mutate({ id, status: newStatus })}
              isStatusUpdating={statusMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal: Create Assessment (Industry only) */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#111318] border border-[#2A2E38] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-[#8B90A0] hover:text-[#F4F5F7] p-1 rounded-lg hover:bg-[#1A1D24] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#2F8C82]/15 border border-[#2F8C82]/40 flex items-center justify-center text-[#2F8C82]">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 id="create-modal-title" className="text-base font-semibold text-[#F4F5F7]">
                  Create Opportunity Assessment
                </h3>
                <span className="text-xs text-[#8B90A0]">Configure evaluation parameters</span>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-[#E5637C]/10 border border-[#E5637C]/30 rounded-xl text-xs text-[#E5637C] mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Backend Node.js & Systems Evaluation"
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] placeholder-[#8B90A0]/50 focus:outline-none focus:border-[#2F8C82]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Briefly describe the purpose, domain, and focus of this test..."
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] placeholder-[#8B90A0]/50 focus:outline-none focus:border-[#2F8C82] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newPassingScore}
                    onChange={e => setNewPassingScore(Number(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                  Associate with Opportunity (Optional)
                </label>
                <select
                  value={newOpportunityId}
                  onChange={e => setNewOpportunityId(e.target.value)}
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82]"
                >
                  <option value="">None (Standalone Assessment)</option>
                  {opportunitiesData?.opportunities?.map(opp => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} ({opp.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B90A0] mb-1">
                  Target Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  placeholder="e.g. Node.js, PostgreSQL, REST APIs"
                  className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-xl px-3 py-2 text-xs text-[#F4F5F7] placeholder-[#8B90A0]/50 focus:outline-none focus:border-[#2F8C82]"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2E38] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1D24] text-[#F4F5F7] border border-[#2A2E38] hover:border-[#8B90A0]/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F8C82] text-white hover:bg-[#287970] transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
