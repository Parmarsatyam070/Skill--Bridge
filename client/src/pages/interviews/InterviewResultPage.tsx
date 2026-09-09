import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  Briefcase,
  Calendar,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  AlertCircle,
  Compass,
  Play,
} from 'lucide-react';
import {
  InterviewSessionSummaryDto,
  InterviewEvaluation,
  InterviewAnswerItem,
} from '@shared/types';
import { InterviewFeedbackCard } from '../../components/interviews/InterviewFeedbackCard';
import { InterviewAdvisoryNotice } from '../../components/interviews/InterviewAdvisoryNotice';

export const InterviewResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'scorecard' | 'transcript'>('scorecard');

  const { data, isLoading, error } = useQuery<{
    session: InterviewSessionSummaryDto;
    evaluation: InterviewEvaluation;
    transcript: InterviewAnswerItem[];
  }>({
    queryKey: ['interview-result', id],
    queryFn: async () => {
      const res = await fetch(`/api/interviews/${id}/result`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to fetch interview result');
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="text-sm text-slate-400">Loading interview scorecard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Scorecard Not Available</h2>
        <p className="text-xs text-slate-400">
          {(error as any)?.message || 'The interview scorecard could not be retrieved.'}
        </p>
        <Link
          to="/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs font-semibold hover:border-blue-500/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Interviews</span>
        </Link>
      </div>
    );
  }

  const { session, evaluation, transcript } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* ── TOP NAV BAR ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <Link
            to="/interviews"
            className="p-2 rounded-xl bg-[#0b1329] border border-[#1e293b] text-slate-400 hover:text-white transition-colors"
            title="Back to All Interviews"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {session.opportunityTitle || 'Domain Practice Interview'}
            </h1>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>{session.type} Interview</span>
              {session.companyName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Briefcase className="w-3 h-3 text-blue-400" />
                    {session.companyName}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{transcript.length} questions completed</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/interviews"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0b1329] hover:bg-[#0f172a] text-slate-300 text-xs font-medium border border-[#1e293b] transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Practice Another</span>
          </Link>
          <Link
            to="/opportunities"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Opportunities</span>
          </Link>
        </div>
      </div>

      {/* Advisory Notice */}
      <InterviewAdvisoryNotice />

      {/* ── VIEW TABS ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('scorecard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scorecard'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Evaluation Scorecard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'transcript'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Full Transcript ({transcript.length})</span>
        </button>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      {activeTab === 'scorecard' ? (
        <InterviewFeedbackCard evaluation={evaluation} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
            <span>Verbatim Question & Candidate Response Log</span>
            <span>Deterministic Transcript Archive</span>
          </div>

          <div className="space-y-4">
            {transcript.map((item, idx) => (
              <div
                key={item.questionId || idx}
                className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-md"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1e293b]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-blue-400 font-semibold">
                      Question #{item.questionNumber}
                    </span>
                    <h4 className="text-base font-semibold text-slate-200">
                      {item.question}
                    </h4>
                  </div>
                  {item.timeSpentSeconds !== undefined && item.timeSpentSeconds > 0 && (
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timeSpentSeconds}s
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Candidate Response:
                  </span>
                  <div className="p-4 rounded-xl bg-[#030712] border border-[#1e293b] text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <InterviewAdvisoryNotice variant="card" />
        </div>
      )}
    </div>
  );
};
