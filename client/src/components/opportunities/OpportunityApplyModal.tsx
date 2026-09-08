import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building2,
  Briefcase,
} from 'lucide-react';
import { api } from '../../lib/api';
import { OpportunitySummary, OpportunityMatchItem } from '@shared/types';

interface OpportunityApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunitySummary | null;
  matchItem?: OpportunityMatchItem | null;
  onSuccess?: () => void;
}

export const OpportunityApplyModal: React.FC<OpportunityApplyModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  matchItem,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverNote, setCoverNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Fetch student's resumes
  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ['studentResumes'],
    queryFn: () => api.get<{ resumes: any[] }>('/resumes'),
    enabled: isOpen,
  });

  const resumes = resumesData?.resumes || [];

  // Auto-select first resume once loaded
  React.useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // Reset state on open/close
  React.useEffect(() => {
    if (!isOpen) {
      setCoverNote('');
      setErrorMessage(null);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!opportunity) throw new Error('No opportunity selected');
      return api.post(`/opportunities/${opportunity.id}/apply`, {
        resumeId: selectedResumeId || undefined,
        coverNote: coverNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      queryClient.invalidateQueries({ queryKey: ['opportunityDetail', opportunity?.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunityMatches'] });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1600);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to submit application. Please try again.');
    },
  });

  if (!isOpen || !opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-xl bg-[#111318] border border-[#2A2E38] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#2A2E38] flex items-center justify-between bg-[#1A1D24]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F8C82]/15 border border-[#2F8C82]/30 flex items-center justify-center text-[#2F8C82]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F4F5F7]">Apply for Opportunity</h2>
              <p className="text-xs text-[#8B90A0] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{opportunity.company.name}</span>
                <span className="text-[#2A2E38]">•</span>
                <span className="text-[#2F8C82] font-medium">{opportunity.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B90A0] hover:text-[#F4F5F7] rounded-lg hover:bg-[#2A2E38]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#4CC38A]/15 border border-[#4CC38A]/30 flex items-center justify-center text-[#4CC38A] animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#F4F5F7]">Application Submitted!</h3>
              <p className="text-sm text-[#8B90A0] max-w-sm">
                Your profile, verified skill scores, and application note have been submitted directly to{' '}
                <span className="text-[#F4F5F7] font-semibold">{opportunity.company.name}</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Match and Eligibility Status Banner */}
              {matchItem && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    matchItem.eligibility
                      ? 'bg-[#4CC38A]/10 border-[#4CC38A]/30 text-[#F4F5F7]'
                      : 'bg-[#E8A23C]/10 border-[#E8A23C]/30 text-[#F4F5F7]'
                  }`}
                >
                  {matchItem.eligibility ? (
                    <ShieldCheck className="w-5 h-5 text-[#4CC38A] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#E8A23C] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {matchItem.eligibility ? 'Mandatory Requirements Satisfied' : 'Eligibility Notice'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          matchItem.tier === 'high'
                            ? 'bg-[#4CC38A]/20 text-[#4CC38A]'
                            : matchItem.tier === 'medium'
                            ? 'bg-[#E8A23C]/20 text-[#E8A23C]'
                            : 'bg-[#E5637C]/20 text-[#E5637C]'
                        }`}
                      >
                        {matchItem.score}% Match
                      </span>
                    </div>
                    {matchItem.eligibility ? (
                      <p className="text-[#8B90A0] mt-1 leading-relaxed">
                        Your verified skills satisfy all mandatory requirements for this role. Your authoritative 7-factor match score will be submitted with your application.
                      </p>
                    ) : (
                      <p className="text-[#E8A23C] mt-1 leading-relaxed">
                        {matchItem.ineligibilityReason ||
                          'You do not currently satisfy one or more mandatory skill requirements. Recruiters will see your unverified status.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-[#E5637C]/10 border border-[#E5637C]/30 rounded-xl text-xs text-[#E5637C] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resume Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#8B90A0] uppercase tracking-wider mb-2">
                  Select Resume for this Application
                </label>
                {resumesLoading ? (
                  <div className="p-4 bg-[#1A1D24] border border-[#2A2E38] rounded-xl flex items-center gap-2 text-xs text-[#8B90A0]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2F8C82]" />
                    <span>Loading your resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="p-4 bg-[#1A1D24] border border-[#2A2E38] rounded-xl text-xs text-[#8B90A0] space-y-2">
                    <p>No uploaded resumes found. Your live SkillBridge Career Profile will be used automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((r: any) => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedResumeId === r.id
                            ? 'bg-[#2F8C82]/10 border-[#2F8C82] text-[#F4F5F7]'
                            : 'bg-[#1A1D24] border-[#2A2E38] text-[#8B90A0] hover:border-[#3d4352]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedResume"
                            value={r.id}
                            checked={selectedResumeId === r.id}
                            onChange={() => setSelectedResumeId(r.id)}
                            className="text-[#2F8C82] focus:ring-[#2F8C82] focus:ring-offset-0 bg-[#111318] border-[#2A2E38]"
                          />
                          <FileText className="w-4 h-4 text-[#2F8C82]" />
                          <span className="text-xs font-medium text-[#F4F5F7]">{r.title || 'Untitled Resume'}</span>
                        </div>
                        <span className="text-[10px] text-[#8B90A0]">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Note */}
              <div>
                <label className="block text-xs font-semibold text-[#8B90A0] uppercase tracking-wider mb-2">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Highlight your specific interest in this role, relevant projects, or achievements..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-[#1A1D24] border border-[#2A2E38] rounded-xl text-xs text-[#F4F5F7] placeholder-[#8B90A0]/60 focus:outline-none focus:border-[#2F8C82] transition-colors resize-none"
                />
                <div className="flex justify-between text-[10px] text-[#8B90A0] mt-1">
                  <span>Concise notes help recruiters quickly assess project fit.</span>
                  <span>{coverNote.length} / 1000</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <div className="p-6 border-t border-[#2A2E38] flex items-center justify-end gap-3 bg-[#1A1D24]/40">
            <button
              onClick={onClose}
              disabled={applyMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-[#8B90A0] hover:text-[#F4F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-[#2F8C82] hover:bg-[#3aa398] text-[#F4F5F7] text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#2F8C82]/20 transition-all disabled:opacity-50"
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
