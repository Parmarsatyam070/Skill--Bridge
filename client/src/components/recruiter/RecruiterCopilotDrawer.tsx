import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Bot,
  X,
  Send,
  Users,
  Scale,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  CopilotQueryResult,
  CopilotComparisonResult,
  SafeCandidateDto,
} from '@shared/types';

export interface RecruiterCopilotDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  opportunityId?: string;
  preselectedCandidateIds?: string[];
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  intent?: string;
  supportingData?: any;
  disclaimer?: string;
  timestamp: string;
  isError?: boolean;
  errorMessage?: string;
}

const DEFAULT_ADVISORY_DISCLAIMER =
  'This is an AI-generated advisory analysis. All hiring decisions must be made by humans based on verified data. ' +
  'AI outputs may contain errors and should not be used as the sole basis for any employment decision.';

const SUGGESTED_QUERIES = [
  'Which candidates are strongest for this opportunity?',
  'Show candidates with strong Python proficiency.',
  'Compare these candidates.',
  'What skill gaps are common among applicants?',
];

export const RecruiterCopilotDrawer: React.FC<RecruiterCopilotDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  opportunityId: initialOppId,
  preselectedCandidateIds,
}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else setInternalOpen(false);
  };

  const [activeTab, setActiveTab] = useState<'chat' | 'compare'>('chat');
  const [inputQuery, setInputQuery] = useState('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(initialOppId || '');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    preselectedCandidateIds || []
  );
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your **Recruiter Copilot** on SkillBridge.\n\nI can analyze verified candidate proficiencies, summarize cohort skill strengths, identify common prerequisite gaps, and provide advisory side-by-side comparisons using our deterministic matching engine.\n\nAll recommendations are strictly **advisory** — human recruiters retain final decision-making authority.`,
      disclaimer: DEFAULT_ADVISORY_DISCLAIMER,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (initialOppId) setSelectedOpportunityId(initialOppId);
  }, [initialOppId]);

  useEffect(() => {
    if (preselectedCandidateIds && preselectedCandidateIds.length > 0) {
      setSelectedCandidateIds(preselectedCandidateIds.slice(0, 5));
      setActiveTab('compare');
    }
  }, [preselectedCandidateIds]);

  // Listen for global custom event to open copilot from any recruiter view
  useEffect(() => {
    const handleOpenEvent = (
      e: CustomEvent<{ opportunityId?: string; candidateIds?: string[] }>
    ) => {
      setInternalOpen(true);
      if (e.detail?.opportunityId) setSelectedOpportunityId(e.detail.opportunityId);
      if (e.detail?.candidateIds && e.detail.candidateIds.length > 0) {
        setSelectedCandidateIds(e.detail.candidateIds.slice(0, 5));
        setActiveTab('compare');
      }
    };

    window.addEventListener('skillbridge:open-copilot', handleOpenEvent as EventListener);
    return () =>
      window.removeEventListener('skillbridge:open-copilot', handleOpenEvent as EventListener);
  }, []);

  // Keyboard accessibility: Escape to close & auto-focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, activeTab]);

  // Fetch recruiter's opportunities for selection context
  const isIndustry = user?.role === 'INDUSTRY';
  const { data: listingsData } = useQuery({
    queryKey: ['recruiterOpportunitiesListings'],
    queryFn: () =>
      api.get<{ opportunities: Array<{ id: string; title: string; type: string }> }>(
        '/opportunities/my/listings'
      ),
    enabled: isIndustry && isOpen,
  });

  const opportunities = listingsData?.opportunities || [];

  // If no opportunity selected yet, select the first one available
  useEffect(() => {
    if (!selectedOpportunityId && opportunities.length > 0) {
      setSelectedOpportunityId(opportunities[0].id);
    }
  }, [opportunities, selectedOpportunityId]);

  // Fetch applicants for the selected opportunity for comparison picker
  const { data: applicantsData, isLoading: isLoadingApplicants } = useQuery({
    queryKey: ['opportunityApplicantsForCopilot', selectedOpportunityId],
    queryFn: () =>
      api.get<{
        applicants: Array<{
          applicationId: string;
          candidate: SafeCandidateDto;
          liveMatchScore: number;
          eligibility: boolean;
          ineligibilityReason: string | null;
        }>;
      }>(`/opportunities/${selectedOpportunityId}/applicants`),
    enabled: isIndustry && isOpen && !!selectedOpportunityId && activeTab === 'compare',
  });

  const availableApplicants = applicantsData?.applicants || [];

  // Query Mutation (POST /api/recruiter-copilot/query)
  const queryMutation = useMutation({
    mutationFn: async (text: string) => {
      setRateLimitMessage(null);
      return api.post<{ copilotResponse: CopilotQueryResult }>('/recruiter-copilot/query', {
        query: text,
        opportunityId: selectedOpportunityId || undefined,
      });
    },
    onSuccess: (res) => {
      const { copilotResponse } = res;
      setMessages((prev) => [
        ...prev,
        {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          text: copilotResponse.answer,
          intent: copilotResponse.intent,
          supportingData: copilotResponse.supportingData,
          disclaimer: copilotResponse.disclaimer || DEFAULT_ADVISORY_DISCLAIMER,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
    onError: (err: any) => {
      const status = err?.status || err?.response?.status;
      let errorText = 'Unable to complete Copilot query. Please try again.';

      if (status === 429) {
        errorText =
          'AI rate limit reached (20 queries/min). Please wait a moment before sending another question.';
        setRateLimitMessage(errorText);
      } else if (status === 403) {
        errorText = 'Access denied: An Industry recruiter profile is required to use Recruiter Copilot.';
      } else if (status === 400) {
        errorText = err?.message || 'Invalid query format. Please enter at least 3 characters.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          isError: true,
          errorMessage: errorText,
          disclaimer: DEFAULT_ADVISORY_DISCLAIMER,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    },
  });

  // Compare Mutation (POST /api/recruiter-copilot/compare)
  const compareMutation = useMutation({
    mutationFn: async ({
      candidateIds,
      opportunityId,
    }: {
      candidateIds: string[];
      opportunityId: string;
    }) => {
      setRateLimitMessage(null);
      return api.post<{ comparison: CopilotComparisonResult }>('/recruiter-copilot/compare', {
        candidateIds,
        opportunityId,
      });
    },
    onError: (err: any) => {
      const status = err?.status || err?.response?.status;
      if (status === 429) {
        setRateLimitMessage(
          'Heavy AI generation rate limit reached (6 comparisons / 2 min). Please wait a moment before comparing candidates again.'
        );
      }
    },
  });

  const handleSendQuery = (customPrompt?: string) => {
    const text = (customPrompt || inputQuery).trim();
    if (!text || queryMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        role: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (!customPrompt) setInputQuery('');
    queryMutation.mutate(text);
  };

  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 5) {
        return prev; // Maximum 5 candidates
      }
      return [...prev, candidateId];
    });
  };

  const handleExecuteComparison = () => {
    if (selectedCandidateIds.length < 2 || selectedCandidateIds.length > 5 || !selectedOpportunityId) {
      return;
    }
    compareMutation.mutate({
      candidateIds: selectedCandidateIds,
      opportunityId: selectedOpportunityId,
    });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        text: 'Conversation cleared. What questions can I assist you with regarding your candidate pipeline?',
        disclaimer: DEFAULT_ADVISORY_DISCLAIMER,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setRateLimitMessage(null);
  };

  // Only render for INDUSTRY recruiters
  if (!user || user.role !== 'INDUSTRY') {
    return null;
  }

  return (
    <>
      {/* ── Floating Copilot Trigger Button (when uncontrolled and closed) ── */}
      {!propIsOpen && !isOpen && (
        <button
          onClick={() => setInternalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#111318] border border-[#2A2E38] hover:border-[#2F8C82] text-[#F4F5F7] shadow-2xl hover:shadow-[#2F8C82]/20 transition-all transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8C82]"
          aria-label="Open Recruiter Copilot Assistant"
        >
          <div className="relative flex items-center justify-center text-[#2F8C82]">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4CC38A] rounded-full border-2 border-[#111318] animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold font-sans tracking-wide flex items-center gap-1.5">
              <span>Recruiter Copilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#2F8C82]/20 text-[#2F8C82]">
                AI
              </span>
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#E8A23C]" />
        </button>
      )}

      {/* ── Backdrop Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in Drawer Dialog ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recruiter-copilot-title"
        aria-describedby="recruiter-copilot-desc"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] md:w-[600px] bg-[#111318] border-l border-[#2A2E38] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-[#1A1D24] border-b border-[#2A2E38] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2F8C82]/15 border border-[#2F8C82]/30 flex items-center justify-center text-[#2F8C82]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="recruiter-copilot-title" className="text-sm font-bold text-[#F4F5F7] tracking-tight">
                  Recruiter Copilot
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#E8A23C]/15 text-[#E8A23C] border border-[#E8A23C]/30">
                  ADVISORY AI
                </span>
              </div>
              <p id="recruiter-copilot-desc" className="text-[11px] text-[#8B90A0]">
                {user.industryProfile?.companyName || 'Enterprise Recruiter'} • Deterministic Matching Grounded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'chat' && (
              <button
                onClick={handleResetChat}
                className="p-2 rounded-lg text-[#8B90A0] hover:text-[#F4F5F7] hover:bg-[#111318] transition-colors"
                title="Reset conversation"
                aria-label="Reset chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-[#8B90A0] hover:text-[#F4F5F7] hover:bg-[#111318] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8C82]"
              title="Close drawer"
              aria-label="Close Recruiter Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Opportunity Context & Tab Selector Bar */}
        <div className="px-4 py-3 bg-[#111318] border-b border-[#2A2E38] space-y-2.5 shrink-0">
          {/* Opportunity selector */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#8B90A0] flex items-center gap-1.5 shrink-0 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-[#2F8C82]" />
              <span>Role Context:</span>
            </span>
            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              className="flex-1 max-w-[340px] px-2.5 py-1 text-xs rounded-lg bg-[#1A1D24] border border-[#2A2E38] text-[#F4F5F7] focus:outline-none focus:border-[#2F8C82] truncate"
              aria-label="Select Role Context"
            >
              <option value="">All Active Postings (General Scope)</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.type})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-lg bg-[#1A1D24] p-1 border border-[#2A2E38]" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#2F8C82] text-[#F4F5F7] shadow-sm'
                  : 'text-[#8B90A0] hover:text-[#F4F5F7]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Query & Search</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'compare'}
              onClick={() => setActiveTab('compare')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'compare'
                  ? 'bg-[#2F8C82] text-[#F4F5F7] shadow-sm'
                  : 'text-[#8B90A0] hover:text-[#F4F5F7]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Candidate Comparison</span>
              {selectedCandidateIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#111318] text-[#F4F5F7]">
                  {selectedCandidateIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advisory Guardrail Banner */}
        <div className="px-4 py-2 bg-[#E8A23C]/10 border-b border-[#E8A23C]/20 flex items-start gap-2 text-[11px] text-[#E8A23C] shrink-0">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="leading-snug">
            <strong className="font-semibold">Advisory AI Notice:</strong> AI responses assist your evaluation. Final hiring and interview decisions remain with human recruiters.
          </p>
        </div>

        {/* Rate Limit Warning Banner (if active) */}
        {rateLimitMessage && (
          <div className="px-4 py-2.5 bg-[#E5637C]/15 border-b border-[#E5637C]/30 flex items-start gap-2 text-xs text-[#E5637C] shrink-0">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <strong className="font-bold">Rate Limit Exceeded:</strong> {rateLimitMessage}
            </div>
            <button
              onClick={() => setRateLimitMessage(null)}
              className="text-[#E5637C] hover:text-white"
              aria-label="Dismiss rate limit alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── TAB 1: AI QUERY & NATURAL LANGUAGE SEARCH ── */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Scroll Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 touch-scroll"
              aria-live="polite"
              aria-busy={queryMutation.isPending}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  } space-y-1.5`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8B90A0] font-mono px-1">
                    {m.role === 'assistant' ? (
                      <>
                        <Bot className="w-3 h-3 text-[#2F8C82]" />
                        <span>Recruiter Copilot</span>
                      </>
                    ) : (
                      <span>You</span>
                    )}
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[92%] ${
                      m.role === 'user'
                        ? 'bg-[#2F8C82] text-[#F4F5F7] rounded-tr-xs'
                        : m.isError
                        ? 'bg-[#E5637C]/15 border border-[#E5637C]/30 text-[#F4F5F7] rounded-tl-xs'
                        : 'bg-[#1A1D24] border border-[#2A2E38] text-[#F4F5F7] rounded-tl-xs'
                    }`}
                  >
                    {m.isError ? (
                      <div className="flex items-start gap-2 text-[#E5637C]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{m.errorMessage}</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line space-y-2">
                        <p>{m.text}</p>
                      </div>
                    )}

                    {/* Supporting data preview (if candidates or demand returned) */}
                    {m.supportingData && Array.isArray(m.supportingData) && m.supportingData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#2A2E38] space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B90A0] flex items-center justify-between">
                          <span>Deterministic Database Supporting Data</span>
                          <span className="text-[#4CC38A]">Verified Records</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {m.supportingData.map((item: any, idx: number) => {
                            if (item.fullName) {
                              // Candidate Card Preview
                              const cand = item as SafeCandidateDto;
                              return (
                                <div
                                  key={cand.id || idx}
                                  className="p-2.5 rounded-xl bg-[#111318] border border-[#2A2E38] flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-[#F4F5F7] flex items-center gap-2">
                                      <span>{cand.fullName}</span>
                                      {cand.degree && (
                                        <span className="text-[10px] text-[#8B90A0]">
                                          • {cand.degree}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#8B90A0] flex items-center gap-2">
                                      <span>{cand.institutionName || 'Accredited Institution'}</span>
                                      {cand.generalLocation && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5">
                                            <MapPin className="w-2.5 h-2.5" />
                                            {cand.generalLocation}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {cand.skills && cand.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {cand.skills.slice(0, 3).map((s, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.2 rounded text-[9.5px] bg-[#1A1D24] text-[#8B90A0] border border-[#2A2E38]"
                                          >
                                            {s.name} ({s.score}%)
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-mono font-bold text-[#4CC38A]">
                                      {cand.matchScore !== undefined ? `${cand.matchScore}%` : 'N/A'}
                                    </div>
                                    <span className="text-[9px] uppercase tracking-wider text-[#8B90A0]">
                                      Authoritative
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            if (item.skillName) {
                              // Market Demand snapshot
                              return (
                                <div
                                  key={idx}
                                  className="p-2 rounded-lg bg-[#111318] border border-[#2A2E38] flex items-center justify-between text-xs"
                                >
                                  <span className="font-medium text-[#F4F5F7]">{item.skillName}</span>
                                  <div className="flex items-center gap-2 text-[11px] font-mono">
                                    <span className="text-[#2F8C82]">{item.demandCount} openings</span>
                                    <span className="text-[#4CC38A]">({item.trendDirection})</span>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer at bottom of AI response */}
                    {m.role === 'assistant' && !m.isError && m.disclaimer && (
                      <div className="mt-3 pt-2 border-t border-[#2A2E38]/50 text-[10px] text-[#8B90A0]/80 italic">
                        {m.disclaimer}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {queryMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-[#8B90A0] p-3 rounded-xl bg-[#1A1D24] border border-[#2A2E38] max-w-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2F8C82]" />
                  <span className="font-mono text-[11px]">Analyzing verified talent database...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Query Chips */}
            <div className="px-4 py-2 bg-[#111318] border-t border-[#2A2E38] flex items-center gap-2 overflow-x-auto touch-scroll">
              <span className="text-[10px] text-[#8B90A0] font-mono uppercase tracking-wider shrink-0">
                Suggested:
              </span>
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuery(sq)}
                  disabled={queryMutation.isPending}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-[#1A1D24] border border-[#2A2E38] text-[#8B90A0] hover:text-[#F4F5F7] hover:border-[#2F8C82] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 bg-[#1A1D24] border-t border-[#2A2E38] flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value.slice(0, 3000))}
                placeholder="Ask Recruiter Copilot about candidates or skills..."
                disabled={queryMutation.isPending}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[#111318] border border-[#2A2E38] text-[#F4F5F7] placeholder-[#8B90A0] focus:outline-none focus:border-[#2F8C82] disabled:opacity-50"
                aria-label="Recruiter Copilot Query Input"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || queryMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-[#2F8C82] hover:bg-[#3aa398] text-[#F4F5F7] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#2F8C82]/20"
                aria-label="Send Query"
              >
                {queryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: CANDIDATE COMPARISON (2-5 CANDIDATES) ── */}
        {activeTab === 'compare' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 touch-scroll">
            {/* Header & Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B90A0]">
                    Select Candidates for Side-by-Side Comparison
                  </h3>
                  <p className="text-[11px] text-[#8B90A0]">
                    Select between <strong>2 and 5</strong> candidates from your applicant pipeline.
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    selectedCandidateIds.length >= 2 && selectedCandidateIds.length <= 5
                      ? 'bg-[#4CC38A]/15 text-[#4CC38A] border border-[#4CC38A]/30'
                      : 'bg-[#E8A23C]/15 text-[#E8A23C] border border-[#E8A23C]/30'
                  }`}
                >
                  Selected: {selectedCandidateIds.length} / 5
                </span>
              </div>

              {/* Applicant Picker Grid */}
              {isLoadingApplicants ? (
                <div className="p-6 rounded-xl bg-[#1A1D24] border border-[#2A2E38] flex items-center justify-center gap-2 text-xs text-[#8B90A0]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2F8C82]" />
                  <span>Loading applicants for selected opportunity...</span>
                </div>
              ) : availableApplicants.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#1A1D24] border border-[#2A2E38] text-center space-y-2">
                  <Users className="w-6 h-6 text-[#8B90A0] mx-auto" />
                  <p className="text-xs font-semibold text-[#F4F5F7]">No Applicants Found for this Opportunity</p>
                  <p className="text-[11px] text-[#8B90A0]">
                    Select another role context above or wait for student applications to arrive.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-[#111318] rounded-xl border border-[#2A2E38]">
                  {availableApplicants.map((app) => {
                    const isSelected = selectedCandidateIds.includes(app.candidate.studentProfileId);
                    return (
                      <button
                        key={app.applicationId}
                        type="button"
                        onClick={() => handleToggleCandidate(app.candidate.studentProfileId)}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#2F8C82]/15 border-[#2F8C82] text-[#F4F5F7]'
                            : 'bg-[#1A1D24] border-[#2A2E38] hover:border-[#3d4352] text-[#8B90A0]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F4F5F7] truncate">
                            {app.candidate.fullName}
                          </div>
                          <div className="text-[10px] text-[#8B90A0] truncate">
                            {app.candidate.degree || app.candidate.institutionName || 'Verified Candidate'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-[#4CC38A]">
                            {app.liveMatchScore}%
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-3.5 h-3.5 rounded border-[#2A2E38] text-[#2F8C82] focus:ring-0 cursor-pointer pointer-events-none"
                            aria-label={`Select ${app.candidate.fullName}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleExecuteComparison}
                disabled={
                  selectedCandidateIds.length < 2 ||
                  selectedCandidateIds.length > 5 ||
                  compareMutation.isPending ||
                  !selectedOpportunityId
                }
                className="w-full py-2.5 rounded-xl bg-[#2F8C82] hover:bg-[#3aa398] text-[#F4F5F7] text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#2F8C82]/20"
              >
                {compareMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Candidates with Copilot...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Run AI Advisory Comparison ({selectedCandidateIds.length} candidates)</span>
                  </>
                )}
              </button>
            </div>

            {/* Comparison Results Area */}
            {compareMutation.data?.comparison && (
              <div className="space-y-6 pt-2 border-t border-[#2A2E38]">
                {/* Advisory Summary Text */}
                <div className="p-4 rounded-xl bg-[#1A1D24] border border-[#2A2E38] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2F8C82] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#E8A23C]" />
                    <span>Copilot Advisory Analysis</span>
                  </div>
                  <div className="text-xs text-[#F4F5F7] leading-relaxed whitespace-pre-line">
                    {compareMutation.data.comparison.advisorySummary}
                  </div>
                  <p className="text-[10px] text-[#8B90A0] italic pt-1 border-t border-[#2A2E38]">
                    {compareMutation.data.comparison.disclaimer}
                  </p>
                </div>

                {/* Structured Rankings Table / Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B90A0]">
                    Deterministic Match & Advisory Ranking
                  </h4>

                  <div className="space-y-2.5">
                    {compareMutation.data.comparison.advisoryRanking.map((rank, idx) => {
                      const strengths =
                        compareMutation.data?.comparison?.topStrengths?.[rank.candidateId] || [];
                      const gaps =
                        compareMutation.data?.comparison?.topGaps?.[rank.candidateId] || [];

                      return (
                        <div
                          key={rank.candidateId}
                          className="p-4 rounded-xl bg-[#1A1D24] border border-[#2A2E38] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#111318] border border-[#2A2E38] text-xs font-mono font-bold flex items-center justify-center text-[#F4F5F7]">
                                #{idx + 1}
                              </span>
                              <div>
                                <h5 className="text-sm font-bold text-[#F4F5F7]">
                                  {rank.candidateName}
                                </h5>
                                <p className="text-[11px] text-[#8B90A0] mt-0.5">
                                  {rank.advisoryReason}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-base font-mono font-bold text-[#4CC38A]">
                                {rank.advisoryScore.toFixed(1)}%
                              </div>
                              <span className="text-[9px] uppercase tracking-wider text-[#8B90A0]">
                                Authoritative Score
                              </span>
                            </div>
                          </div>

                          {/* Strengths and Gaps Pills */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#2A2E38]/60 text-xs">
                            {strengths.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-[#4CC38A] block mb-1">
                                  Key Verified Strengths:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {strengths.map((str, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded text-[10px] bg-[#4CC38A]/10 text-[#4CC38A] border border-[#4CC38A]/20"
                                    >
                                      {str}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="text-[10px] font-bold text-[#E8A23C] block mb-1">
                                Gap Considerations:
                              </span>
                              {gaps.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {gaps.map((gap, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded text-[10px] bg-[#E8A23C]/10 text-[#E8A23C] border border-[#E8A23C]/20"
                                    >
                                      {gap}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#4CC38A] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  No mandatory prerequisite gaps
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
