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
      <div className="relative w-full max-w-xl bg-[#0b1329] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Apply for Opportunity</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{opportunity.company.name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-blue-400 font-medium">{opportunity.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Your profile, verified skill scores, and application note have been submitted directly to{' '}
                <span className="text-white font-semibold">{opportunity.company.name}</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Match and Eligibility Status Banner */}
              {matchItem && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    matchItem.eligibility
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-amber-500/10 border-amber-500/30 text-white'
                  }`}
                >
                  {matchItem.eligibility ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {matchItem.eligibility ? 'Mandatory Requirements Satisfied' : 'Eligibility Notice'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          matchItem.tier === 'high'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : matchItem.tier === 'medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {matchItem.score}% Match
                      </span>
                    </div>
                    {matchItem.eligibility ? (
                      <p className="text-slate-400 mt-1 leading-relaxed">
                        Your verified skills satisfy all mandatory requirements for this role. Your authoritative 7-factor match score will be submitted with your application.
                      </p>
                    ) : (
                      <p className="text-amber-400 mt-1 leading-relaxed">
                        {matchItem.ineligibilityReason ||
                          'You do not currently satisfy one or more mandatory skill requirements. Recruiters will see your unverified status.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resume Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Resume for this Application
                </label>
                {resumesLoading ? (
                  <div className="p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading your resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-slate-400 space-y-2">
                    <p>No uploaded resumes found. Your live SkillBridge Career Profile will be used automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((r: any) => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedResumeId === r.id
                            ? 'bg-blue-600/10 border-blue-500 text-white'
                            : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedResume"
                            value={r.id}
                            checked={selectedResumeId === r.id}
                            onChange={() => setSelectedResumeId(r.id)}
                            className="text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-[#0b1329] border-[#1e293b]"
                          />
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-medium text-white">{r.title || 'Untitled Resume'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Highlight your specific interest in this role, relevant projects, or achievements..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#1e293b] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Concise notes help recruiters quickly assess project fit.</span>
                  <span>{coverNote.length} / 1000</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <div className="p-6 border-t border-[#1e293b] flex items-center justify-end gap-3 bg-[#0f172a]/40">
            <button
              onClick={onClose}
              disabled={applyMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
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
