import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  HelpCircle,
  X,
  BookOpen,
  Calculator,
  Headphones,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  ReportCardSummaryData,
  HistoricalAttemptItem,
  HistoricalAttemptDetail,
} from '@shared/types';

export const ReportCardPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalAttemptId, setActiveModalAttemptId] = useState<string | null>(null);

  // Fetch Report Card summary from backend
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['reportCard'],
    queryFn: () => api.get<{ reportCard: ReportCardSummaryData }>('/assessments/report-card'),
  });

  // Fetch single attempt detail for review modal
  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['attemptDetail', activeModalAttemptId],
    queryFn: () => api.get<{ attempt: HistoricalAttemptDetail }>(`/assessments/attempts/${activeModalAttemptId}`),
    enabled: Boolean(activeModalAttemptId),
  });

  const report = reportData?.reportCard;
  const attempts = report?.attempts || [];

  // Filter attempts
  const filteredAttempts = attempts.filter(att => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'daily_mixed' && att.type !== 'daily_mixed') return false;
      if (selectedCategory === 'aptitude_quant' && att.type !== 'aptitude_quant') return false;
      if (selectedCategory === 'aptitude_english_reading' && att.type !== 'aptitude_english_reading') return false;
      if (selectedCategory === 'aptitude_english_listening' && att.type !== 'aptitude_english_listening') return false;
      if (selectedCategory === 'domain_web' && (att.type !== 'domain' || !att.domainName.includes('Web'))) return false;
      if (selectedCategory === 'domain_ai' && (att.type !== 'domain' || !att.domainName.includes('AI'))) return false;
      if (selectedCategory === 'domain_cloud' && (att.type !== 'domain' || !att.domainName.includes('Cloud'))) return false;
      if (selectedCategory === 'domain_ui' && (att.type !== 'domain' || !att.domainName.includes('UI'))) return false;
      if (selectedCategory === 'domain_iot' && (att.type !== 'domain' || !att.domainName.includes('Embedded'))) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = att.practiceSetTitle.toLowerCase().includes(q);
      const matchDomain = att.domainName.toLowerCase().includes(q);
      return matchTitle || matchDomain;
    }

    return true;
  });

  // Sort attempts
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    if (sortBy === 'date_asc') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    if (sortBy === 'score_desc') return b.score - a.score;
    if (sortBy === 'score_asc') return a.score - b.score;
    return 0;
  });

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans p-4 sm:p-6 animate-fade-in">
      {/* Top Header */}
      <div className="space-y-3 border-b border-console-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-bridge-teal font-semibold">
                Permanent Academic Record
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal" />
              <span className="text-xs font-mono text-console-text-muted">Skill Assessment History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-console-text">
              Verified Assessment Report Card
            </h1>
          </div>

          <Link
            to="/assessment"
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold transition-all shadow-md shadow-bridge-teal/20 flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take New Assessment</span>
          </Link>
        </div>

        <p className="text-xs text-console-text-muted max-w-2xl leading-relaxed">
          Comprehensive historical transcript of all completed domain competency sets and aptitude examinations. Serves as the authoritative source of truth for verified skills and internship matching calibrations.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider font-semibold">
              Total Attempts
            </span>
            <div className="w-8 h-8 rounded-xl bg-console-panel-raised border border-console-border text-bridge-teal flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-console-text">
            {report?.totalAttempts ?? 0}
          </div>
          <div className="text-[11px] font-mono text-console-text-muted">
            {report?.passedAttempts ?? 0} Passed ({report?.passRate ?? 0}% Pass Rate)
          </div>
        </div>

        {/* Overall Pass Rate */}
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider font-semibold">
              Pass Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-status-green/15 border border-status-green/30 text-status-green flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-status-green">
            {report?.passRate ?? 0}%
          </div>
          <div className="w-full bg-console-bg h-1.5 rounded-full overflow-hidden border border-console-border">
            <div
              className="bg-status-green h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, report?.passRate ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider font-semibold">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-campus-blue/15 border border-campus-blue/30 text-campus-blue flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-console-text">
            {report?.averageScore ?? 0}%
          </div>
          <div className="text-[11px] font-mono text-console-text-muted">
            Across all technical & aptitude sets
          </div>
        </div>

        {/* Performance Trend */}
        <div className="p-5 rounded-2xl bg-console-panel border border-console-border shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-console-text-muted uppercase tracking-wider font-semibold">
              Performance Trend
            </span>
            <div className="w-8 h-8 rounded-xl bg-console-panel-raised border border-console-border text-console-text flex items-center justify-center">
              {report?.performanceTrend === 'improving' ? (
                <TrendingUp className="w-4 h-4 text-status-green" />
              ) : report?.performanceTrend === 'declining' ? (
                <TrendingDown className="w-4 h-4 text-status-red" />
              ) : (
                <Minus className="w-4 h-4 text-bridge-teal" />
              )}
            </div>
          </div>
          <div className="text-2xl font-serif font-bold capitalize text-console-text">
            {report?.performanceTrend === 'improving'
              ? 'Improving ↗'
              : report?.performanceTrend === 'declining'
              ? 'Needs Focus ↘'
              : 'Steady →'}
          </div>
          <div className="text-[11px] font-mono text-console-text-muted">
            On consecutive attempt retakes
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Sets' },
            { id: 'daily_mixed', label: 'Daily Mixed Sets' },
            { id: 'domain_web', label: 'Full-Stack Web' },
            { id: 'domain_ai', label: 'AI/Data Science' },
            { id: 'domain_cloud', label: 'Cloud/DevOps' },
            { id: 'domain_ui', label: 'UI/UX Design' },
            { id: 'domain_iot', label: 'Embedded/IoT' },
            { id: 'aptitude_quant', label: 'Quantitative Maths' },
            { id: 'aptitude_english_reading', label: 'English Reading' },
            { id: 'aptitude_english_listening', label: 'Voice Listening' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-bridge-teal text-slate-950 font-bold shadow-md shadow-bridge-teal/20'
                  : 'bg-console-panel text-console-text-muted hover:text-console-text border border-console-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-console-panel p-3.5 rounded-2xl border border-console-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-console-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assessment attempts by topic, practice set title, or domain..."
              className="w-full pl-10 pr-4 py-2 bg-console-bg border border-console-border rounded-xl text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-console-text-muted whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-console-bg border border-console-border rounded-xl text-xs text-console-text focus:outline-none focus:border-bridge-teal"
            >
              <option value="date_desc">Latest Attempt First</option>
              <option value="date_asc">Oldest Attempt First</option>
              <option value="score_desc">Highest Score First</option>
              <option value="score_asc">Lowest Score First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attempts Table & Card List */}
      {isLoading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-console-text-muted">Loading historical assessment report card...</p>
        </div>
      ) : sortedAttempts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-console-panel border border-console-border text-center space-y-4 shadow-lg">
          <Award className="w-12 h-12 text-console-text-muted mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-console-text">No Assessment Records Found</h3>
            <p className="text-xs text-console-text-muted max-w-md mx-auto">
              You haven't completed any assessments matching the current filter. Take a practice set to build your verified transcript.
            </p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal text-slate-950 font-bold text-xs shadow-md shadow-bridge-teal/20 hover:bg-bridge-teal/90 transition-all"
          >
            <span>Start Practice Set</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAttempts.map(att => (
            <div
              key={att.id}
              onClick={() => setActiveModalAttemptId(att.id)}
              className="p-5 rounded-2xl bg-console-panel border border-console-border hover:border-bridge-teal/50 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Column: Title & Domain Badges */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-console-panel-raised border border-console-border text-console-text">
                    {att.domainName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-console-panel-raised border border-console-border text-console-text-muted">
                    {att.difficulty}
                  </span>
                  {att.isBestScore && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Best Score</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-sm text-console-text group-hover:text-bridge-teal transition-colors">
                  {att.practiceSetTitle}
                </h3>

                <div className="flex items-center gap-4 text-[11px] font-mono text-console-text-muted">
                  <span>Taken: {formatDate(att.submittedAt)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-bridge-teal" />
                    <span>{formatSeconds(att.timeSpentSeconds)} spent</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Score, Pass/Fail & Action */}
              <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-console-border/60">
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-lg font-bold font-mono text-console-text">
                      {att.score}%
                    </span>
                    {att.passed ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/30">
                        Passed
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-status-red/15 text-status-red border border-status-red/30">
                        Below Pass Mark
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-console-text-muted">
                    Pass Mark: {att.passingScorePct}%
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalAttemptId(att.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-bridge-teal/20 text-console-text hover:text-bridge-teal border border-console-border hover:border-bridge-teal/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HISTORICAL ATTEMPT REVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeModalAttemptId && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setActiveModalAttemptId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl bg-console-panel border border-console-border rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-console-panel-raised border-b border-console-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-console-bg border border-console-border text-bridge-teal">
                    Historical Attempt Transcript
                  </span>
                  <span className="text-xs font-mono text-console-text-muted">
                    ID: {activeModalAttemptId.slice(0, 8)}...
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-console-text">
                  {detailData?.attempt?.practiceSetTitle || 'Assessment Review'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalAttemptId(null)}
                aria-label="Close review dialog"
                className="p-1.5 rounded-lg hover:bg-white/10 text-console-text-muted hover:text-console-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingDetail ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-console-text-muted">Loading question transcript...</p>
                </div>
              ) : detailData?.attempt ? (
                <>
                  {/* Summary Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                      detailData.attempt.passed
                        ? 'bg-status-green/10 border-status-green/30 text-status-green'
                        : 'bg-industry-amber/10 border-industry-amber/30 text-industry-amber'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          detailData.attempt.passed ? 'bg-status-green' : 'bg-industry-amber'
                        }`}
                      >
                        {detailData.attempt.score}%
                      </div>
                      <div>
                        <div className="font-bold">
                          {detailData.attempt.passed ? 'Competency Verified & Passed' : 'Below Passing Threshold'}
                        </div>
                        <div className="text-[11px] opacity-80">
                          Pass Threshold: {detailData.attempt.passingScorePct}% • Time Taken: {formatSeconds(detailData.attempt.timeSpentSeconds)}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-semibold">
                      {formatDate(detailData.attempt.submittedAt)}
                    </span>
                  </div>

                  {/* Question Breakdown List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-console-text-muted">
                      Question Transcript & Solutions ({detailData.attempt.questionResults.length} Questions)
                    </h4>

                    {detailData.attempt.questionResults.map((q, idx) => (
                      <div
                        key={q.questionId || idx}
                        className={`p-4 rounded-xl bg-console-bg border space-y-3 ${
                          q.isCorrect ? 'border-status-green/30' : 'border-status-red/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-console-panel-raised border border-console-border font-mono font-bold flex items-center justify-center text-[10px] text-console-text">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-console-text-muted uppercase">
                              {q.questionType === 'written' ? 'AI-Evaluated Subjective' : 'Multiple Choice'}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              q.isCorrect
                                ? 'bg-status-green/15 text-status-green border-status-green/30'
                                : 'bg-status-red/15 text-status-red border-status-red/30'
                            }`}
                          >
                            {q.score} / {q.maxScore} pts
                          </span>
                        </div>

                        <p className="text-xs font-medium text-console-text leading-relaxed">
                          {q.prompt}
                        </p>

                        {/* User Answer vs Correct Answer */}
                        <div className="p-3 rounded-lg bg-console-panel border border-console-border space-y-1.5 text-[11px]">
                          <div>
                            <span className="text-console-text-muted font-mono font-semibold">Your Answer: </span>
                            <span className={q.isCorrect ? 'text-status-green font-medium' : 'text-status-red font-medium'}>
                              {q.userAnswer}
                            </span>
                          </div>
                          {q.correctAnswerText && !q.isCorrect && (
                            <div>
                              <span className="text-console-text-muted font-mono font-semibold">Correct Answer: </span>
                              <span className="text-status-green font-medium">{q.correctAnswerText}</span>
                            </div>
                          )}
                        </div>

                        {/* Written Rubric Feedback */}
                        {q.questionType === 'written' && q.aiFeedback && (
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-purple-300">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Rubric Evaluation</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                              {q.aiFeedback}
                            </p>
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-console-panel-raised border border-console-border text-[11px] text-console-text-muted leading-relaxed">
                            <span className="font-semibold text-bridge-teal font-mono">Solution Notes: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-console-text-muted text-xs">
                  Could not load attempt details.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-console-panel-raised border-t border-console-border flex items-center justify-end">
              <button
                onClick={() => setActiveModalAttemptId(null)}
                className="px-4 py-2 rounded-xl bg-console-panel hover:bg-console-border border border-console-border text-xs font-semibold text-console-text transition-colors"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
