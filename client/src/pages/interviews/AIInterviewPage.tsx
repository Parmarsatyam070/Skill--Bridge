import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Award,
  ChevronRight,
  Filter,
  Plus,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  InterviewSessionSummaryDto,
  InterviewType,
  StartInterviewInput,
} from '@shared/types';
import { InterviewAdvisoryNotice } from '../../components/interviews/InterviewAdvisoryNotice';

export const AIInterviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<InterviewType>('TECHNICAL');
  const [selectedDomain, setSelectedDomain] = useState('Full-Stack Web');
  const [selectedOppId, setSelectedOppId] = useState<string>('');

  const isStudent = user?.role === 'STUDENT';
  const isIndustry = user?.role === 'INDUSTRY';

  // Fetch interview sessions
  const { data: sessions = [], isLoading, error } = useQuery<InterviewSessionSummaryDto[]>({
    queryKey: ['interviews-list'],
    queryFn: async () => {
      const res = await fetch('/api/interviews', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch interview sessions');
      }
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch opportunities for linking
  const { data: opportunities = [] } = useQuery<any[]>({
    queryKey: ['opportunities-active'],
    queryFn: async () => {
      const res = await fetch('/api/opportunities?limit=20');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStudent && isModalOpen,
  });

  // Start interview mutation
  const startMutation = useMutation({
    mutationFn: async (payload: StartInterviewInput) => {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to start interview');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews-list'] });
      setIsModalOpen(false);
      navigate(`/interviews/${data.data.id}/session`);
    },
  });

  const handleStartInterview = () => {
    startMutation.mutate({
      opportunityId: selectedOppId ? selectedOppId : null,
      type: selectedType,
      targetDomain: selectedDomain,
      totalQuestions: 5,
    });
  };

  const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS');
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
            completedSessions.length
        )
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#0b1329] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-600/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                AI Interview Copilot
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Advisory Only
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {isStudent ? 'Interactive AI Technical & Behavioral Interviews' : 'Candidate AI Interview Reviews'}
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              {isStudent
                ? 'Practice role-specific engineering and behavioral scenarios powered by Google Gemini. Receive rigorous, constructive feedback with concrete evidence and growth trajectories.'
                : 'Review structured candidate interview transcripts and multi-dimensional advisory signals for your company opportunities.'}
            </p>
          </div>

          {isStudent && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold shadow-xl shadow-blue-500/25 transition-all duration-150 active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start New AI Interview</span>
              </button>
            </div>
          )}
        </div>

        {/* Ambient Gradient glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Advisory Banner */}
      <InterviewAdvisoryNotice />

      {/* ── KPI STATS (STUDENT VIEW) ─────────────────────────────────── */}
      {isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 space-y-1 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Interviews
            </span>
            <div className="text-3xl font-extrabold text-white font-mono">
              {completedSessions.length}
            </div>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 space-y-1 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Advisory Score
            </span>
            <div className="text-3xl font-extrabold text-blue-400 font-mono">
              {avgScore !== null ? `${avgScore}%` : 'N/A'}
            </div>
          </div>

          <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 space-y-1 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              In-Progress Sessions
            </span>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              {activeSessions.length}
            </div>
          </div>
        </div>
      )}

      {/* ── IN PROGRESS SESSIONS (IF ANY) ────────────────────────────── */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Active In-Progress Sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(s => (
              <div
                key={s.id}
                className="bg-[#0b1329] border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-amber-500/50 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {s.type} Interview
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {s.answeredCount} / {s.questionCount || 5} answered
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {s.opportunityTitle || 'Domain Practice Interview'}
                  </h3>

                  {s.companyName && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      {s.companyName}
                    </p>
                  )}
                </div>

                <Link
                  to={`/interviews/${s.id}/session`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Resume Interview Session</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL SESSIONS LIST ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isStudent ? 'Interview History & Scorecards' : 'Candidate Interview Records'}
          </h2>
          <span className="text-xs text-slate-400">
            {sessions.length} total sessions
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#0b1329] border border-[#1e293b] rounded-2xl space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs text-slate-400">Loading interview records...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-12 bg-[#0b1329] border border-[#1e293b] rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-slate-400 mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-slate-200">
                No Interview Sessions Found
              </h3>
              <p className="text-xs text-slate-400">
                {isStudent
                  ? 'Start your first AI technical or behavioral interview to benchmark your preparation.'
                  : 'Candidates who complete AI interviews for your company opportunities will appear here.'}
              </p>
            </div>
            {isStudent && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Start Interview
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sessions.map(s => {
              const isDone = s.status === 'COMPLETED';

              return (
                <div
                  key={s.id}
                  className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-md hover:border-blue-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0f172a] text-slate-300 border border-[#1e293b]">
                        {s.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                          isDone
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-white line-clamp-1">
                        {s.opportunityTitle || 'Technical Domain Practice'}
                      </h3>
                      {s.companyName && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                          {s.companyName}
                        </p>
                      )}
                      {isIndustry && s.candidateName && (
                        <p className="text-xs text-slate-300 mt-1 font-medium">
                          Candidate: {s.candidateName}
                        </p>
                      )}
                    </div>

                    {isDone && s.overallScore !== undefined && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] text-xs">
                        <span className="text-slate-400">Advisory Score:</span>
                        <span className="font-mono text-base font-bold text-blue-400">
                          {s.overallScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1e293b]">
                    {isDone ? (
                      <Link
                        to={`/interviews/${s.id}/result`}
                        className="flex items-center justify-between w-full text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>View Scorecard & Transcript</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to={`/interviews/${s.id}/session`}
                        className="flex items-center justify-between w-full text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <span>Continue Session</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── START INTERVIEW MODAL ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0b1329] border border-[#1e293b] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                Configure New AI Interview
              </h3>
              <p className="text-xs text-slate-400">
                Select your focus domain or link directly to an open opportunity.
              </p>
            </div>

            <div className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Interview Category:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED'] as InterviewType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-left ${
                        selectedType === t
                          ? 'bg-blue-600/15 text-blue-400 border-blue-500/50'
                          : 'bg-[#0f172a] text-slate-400 border-[#1e293b] hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opportunity Link (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Link to Opportunity (Optional):
                </label>
                <select
                  value={selectedOppId}
                  onChange={e => setSelectedOppId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">General Domain Practice (No Opportunity)</option>
                  {opportunities.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.title} — {o.company?.companyName || 'Company'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technical Domain */}
              {!selectedOppId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Target Domain:
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={e => setSelectedDomain(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Full-Stack Web">Full-Stack Web Engineering</option>
                    <option value="AI/Data Science">AI & Machine Learning Systems</option>
                    <option value="Cloud/DevOps">Cloud Infrastructure & DevOps</option>
                    <option value="Mobile Development">Mobile App Development</option>
                    <option value="UI/UX Product Design">UI/UX & Product Design</option>
                  </select>
                </div>
              )}
            </div>

            <InterviewAdvisoryNotice variant="card" />

            {startMutation.isError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{(startMutation.error as any).message || 'Failed to start interview'}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={startMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={startMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all duration-150"
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Interview...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
