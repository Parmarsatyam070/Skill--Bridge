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
  Flame,
  Target,
  Code2,
  Lightbulb,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  ReportCardSummaryData,
  HistoricalAttemptItem,
  HistoricalAttemptDetail,
  MockInterviewHistoryResponse,
  MockInterviewHistoryItem,
} from '@shared/types';
import { MatchCard } from '../../components/MatchCard';

export const ReportCardPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalAttemptId, setActiveModalAttemptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessments' | 'mock_interviews'>('assessments');
  const [selectedInterviewSessionId, setSelectedInterviewSessionId] = useState<string | null>(null);

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

  // Fetch Mock Interview history
  const { data: interviewHistoryData, isLoading: loadingInterviews } = useQuery({
    queryKey: ['mockInterviewHistory'],
    queryFn: () => api.get<MockInterviewHistoryResponse>('/mock-interview/history'),
  });

  // Fetch single interview session details for transcript modal
  const { data: interviewDetailData, isLoading: loadingInterviewDetail } = useQuery({
    queryKey: ['mockInterviewDetail', selectedInterviewSessionId],
    queryFn: () => api.get<{ session: any }>(`/mock-interview/${selectedInterviewSessionId}`),
    enabled: Boolean(selectedInterviewSessionId),
  });

  const report = reportData?.reportCard;
  const attempts = report?.attempts || [];

  // Filter attempts
  const filteredAttempts = attempts.filter(att => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'dsa' && att.type !== 'dsa') return false;
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
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 font-sans animate-fade-in">
      {/* Top Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="small-caps-label text-[11px] text-bridge-teal font-bold">
                [● PERMANENT ACADEMIC RECORD]
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal" />
              <span className="text-xs font-mono text-text-muted">Skill Assessment History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-sans">
              Verified Assessment Report Card
            </h1>
          </div>

          <Link
            to="/assessment"
            className="bridge-btn-primary self-start sm:self-auto px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take New Assessment</span>
          </Link>
        </div>

        <p className="text-xs text-text-muted max-w-2xl leading-relaxed font-sans">
          Comprehensive historical transcript of all completed domain competency sets and aptitude examinations. Serves as the authoritative source of truth for verified skills and internship matching calibrations.
        </p>

        {/* Tab Switcher: Assessments vs Mock Interview History */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-2 ${
              activeTab === 'assessments'
                ? 'bg-bridge-teal text-white font-bold shadow-md shadow-bridge-teal/20'
                : 'bg-panel border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Verified Assessments ({attempts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mock_interviews')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-2 ${
              activeTab === 'mock_interviews'
                ? 'bg-bridge-teal text-white font-bold shadow-md shadow-bridge-teal/20'
                : 'bg-panel border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mock Interview History ({interviewHistoryData?.totalSessions || 0})</span>
            {interviewHistoryData && interviewHistoryData.totalSessions >= 2 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                interviewHistoryData.overallTrend === 'improving'
                  ? 'bg-status-green/20 text-status-green border border-status-green/30'
                  : 'bg-panel-raised text-text-muted'
              }`}>
                {interviewHistoryData.overallTrend === 'improving' ? '↗ Improving Trend' : '→ Score Trend'}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'assessments' ? (
        <>
          {/* KPI Summary Cards using MatchCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MatchCard
              label="TOTAL ATTEMPTS"
              value={report?.totalAttempts ?? 0}
              subtitle={`${report?.passedAttempts ?? 0} Passed (${report?.passRate ?? 0}% Pass Rate)`}
              icon={FileText}
            />
            <MatchCard
              label="OVERALL PASS RATE"
              value={`${report?.passRate ?? 0}%`}
              progress={report?.passRate ?? 0}
              status={(report?.passRate ?? 0) >= 60 ? 'verified' : 'unverified'}
              icon={CheckCircle2}
            />
            <MatchCard
              label="AVERAGE SCORE"
              value={`${report?.averageScore ?? 0}%`}
              progress={report?.averageScore ?? 0}
              subtitle="Across all modalities"
              icon={Award}
            />
            <MatchCard
              label="DAILY STREAK"
              value={`${report?.streakHistory?.currentStreak ?? 0} Days`}
              subtitle={`Longest: ${report?.streakHistory?.longestStreak ?? 0}d • ${report?.streakHistory?.activeDaysLast30 ?? 0} active days`}
              icon={Flame}
            />
            <MatchCard
              label="PERFORMANCE TREND"
              value={
                report?.performanceTrend === 'improving'
                  ? 'IMPROVING'
                  : report?.performanceTrend === 'declining'
                  ? 'NEEDS FOCUS'
                  : 'STEADY'
              }
              trend={{
                direction:
                  report?.performanceTrend === 'improving'
                    ? 'up'
                    : report?.performanceTrend === 'declining'
                    ? 'down'
                    : 'neutral',
                value:
                  report?.performanceTrend === 'improving'
                    ? 'Momentum ↗'
                    : report?.performanceTrend === 'declining'
                    ? 'Focus ↘'
                    : 'Stable',
              }}
              subtitle="On consecutive attempts"
              icon={TrendingUp}
            />
          </div>

          {/* Category-Wise Score Breakdowns */}
          {report?.categoryBreakdown && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-bridge-teal" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                  Category Score Breakdowns
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Domain Core */}
                <div className="p-4 rounded-2xl bg-panel border border-border space-y-2 hover:border-bridge-teal/30 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-bridge-teal" />
                      <span>Domain Core Sets</span>
                    </span>
                    <span className="font-mono text-text-muted text-[11px]">
                      {report.categoryBreakdown.domain.totalAttempts} taken
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-text-primary">
                      {report.categoryBreakdown.domain.averageScore}%
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {report.categoryBreakdown.domain.passRate}% Pass Rate
                    </span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-bridge-teal h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.categoryBreakdown.domain.passRate}%` }}
                    />
                  </div>
                </div>

                {/* Aptitude */}
                <div className="p-4 rounded-2xl bg-panel border border-border space-y-2 hover:border-signal-green/30 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-signal-green" />
                      <span>Aptitude (Quant/Verbal)</span>
                    </span>
                    <span className="font-mono text-text-muted text-[11px]">
                      {report.categoryBreakdown.aptitude.totalAttempts} taken
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-text-primary">
                      {report.categoryBreakdown.aptitude.averageScore}%
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {report.categoryBreakdown.aptitude.passRate}% Pass Rate
                    </span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-signal-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.categoryBreakdown.aptitude.passRate}%` }}
                    />
                  </div>
                </div>

                {/* DSA & Coding */}
                <div className="p-4 rounded-2xl bg-panel border border-border space-y-2 hover:border-bridge-blue/30 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-bridge-blue" />
                      <span>DSA & Coding Problems</span>
                    </span>
                    <span className="font-mono text-text-muted text-[11px]">
                      {report.categoryBreakdown.dsa.totalAttempts} attempted
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-text-primary">
                      {report.categoryBreakdown.dsa.averageScore}%
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {report.categoryBreakdown.dsa.passedAttempts} Solved ({report.categoryBreakdown.dsa.passRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-bridge-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.categoryBreakdown.dsa.passRate}%` }}
                    />
                  </div>
                </div>

                {/* Daily Mixed Sets */}
                <div className="p-4 rounded-2xl bg-panel border border-border space-y-2 hover:border-industry-amber/30 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-industry-amber" />
                      <span>Daily Mixed Sets</span>
                    </span>
                    <span className="font-mono text-text-muted text-[11px]">
                      {report.categoryBreakdown.dailyMixed.totalAttempts} completed
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-text-primary">
                      {report.categoryBreakdown.dailyMixed.averageScore}%
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      {report.categoryBreakdown.dailyMixed.passRate}% Pass Rate
                    </span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-industry-amber h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.categoryBreakdown.dailyMixed.passRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ACTIONABLE FOCUS AREAS SECTION [AI-GROUNDED TRIAGE]
          ───────────────────────────────────────────────────────────── */}
          {report?.focusAreas && report.focusAreas.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-panel via-panel-raised to-panel border border-border/80 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-industry-amber animate-pulse" />
                    <span className="small-caps-label text-[11px] text-industry-amber font-bold font-mono">
                      [● ACTIONABLE FOCUS AREAS]
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight font-sans">
                    Priority Growth Topics & Diagnostic Next Actions
                  </h2>
                  <p className="text-xs text-text-muted max-w-2xl leading-relaxed font-sans">
                    Targeted weak areas identified from your real attempt history, repeated failures, and skill decay. Each focus area pairs diagnostic observations with specific problem-solving tips and a directly-linked practice set.
                  </p>
                </div>

                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-industry-amber/15 text-industry-amber border border-industry-amber/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>{report.focusAreas.length} Weak Areas Detected</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {report.focusAreas.map((area, idx) => (
                  <div
                    key={area.topic || idx}
                    className="p-5 rounded-2xl bg-void/80 border border-border hover:border-bridge-teal/40 transition-all flex flex-col justify-between space-y-4 group shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Category & Accuracy Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          area.category === 'dsa'
                            ? 'bg-bridge-blue/15 text-bridge-blue border-bridge-blue/30'
                            : area.category === 'aptitude'
                            ? 'bg-signal-green/15 text-signal-green border-signal-green/30'
                            : 'bg-bridge-teal/15 text-bridge-teal border-bridge-teal/30'
                        }`}>
                          {area.category === 'dsa' ? 'DSA / Algorithms' : area.category === 'aptitude' ? 'Aptitude' : 'Domain Core'}
                        </span>

                        <span className="text-[10px] font-mono font-semibold text-industry-amber bg-industry-amber/10 px-2 py-0.5 rounded-full border border-industry-amber/25">
                          {area.metrics.accuracyPct}% Accuracy
                        </span>
                      </div>

                      {/* Topic Title & Failure Pattern */}
                      <div>
                        <h3 className="text-base font-bold text-text-primary group-hover:text-bridge-teal transition-colors font-sans">
                          {area.topic}
                        </h3>
                        <p className="text-[11px] font-mono text-text-muted mt-0.5">
                          {area.failureSummary}
                        </p>
                      </div>

                      {/* AI Pattern Explanation */}
                      <div className="p-3 rounded-xl bg-panel-raised border border-border/80 text-xs text-text-primary/90 italic leading-relaxed space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-bridge-teal not-italic font-bold">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Pattern Analysis</span>
                        </div>
                        <p>"{area.explanation}"</p>
                      </div>

                      {/* Tips & Tricks Bullets */}
                      {area.tips && area.tips.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-text-muted font-bold tracking-wider">
                            <Lightbulb className="w-3 h-3 text-industry-amber" />
                            <span>Actionable Pro Tips</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] text-text-muted">
                            {area.tips.map((tip, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-2 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal mt-1.5 shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Direct Practice Set CTA */}
                    <div className="border-t border-border pt-3">
                      <Link
                        to={area.practiceSet.url}
                        className="w-full py-2.5 px-4 rounded-xl bg-bridge-teal text-white hover:bg-bridge-teal/90 font-bold text-xs flex items-center justify-between transition-all shadow-md group/btn"
                      >
                        <div className="flex flex-col text-left truncate pr-2">
                          <span className="truncate text-[10px] font-mono opacity-80">
                            Targeted: {area.practiceSet.title}
                          </span>
                          <span className="font-bold">Launch Practice Set</span>
                        </div>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform shrink-0" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SKILL RADAR PROGRESSION OVER TIME
          ───────────────────────────────────────────────────────────── */}
          {report?.radarProgression && report.radarProgression.length > 0 && (
            <div className="p-5 rounded-2xl bg-panel border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-bridge-teal" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
                      Skill Radar Progression & Inactivity Trajectory
                    </h2>
                  </div>
                  <p className="text-xs text-text-muted">
                    Evaluated skill trajectory against industry benchmarks, tracking score deltas and inactivity decays over time.
                  </p>
                </div>

                <span className="text-xs font-mono text-text-muted">
                  {report.radarProgression.length} Skills Calibrated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.radarProgression.map((sk) => {
                  const isMet = sk.currentScore >= sk.benchmarkScore;
                  const hasDecay = sk.decayDaysCount >= 7 || sk.inactivityDecayPct > 0;
                  const lastDelta = sk.history && sk.history.length > 0 ? sk.history[0].delta : null;

                  return (
                    <div
                      key={sk.skillId}
                      className="p-3.5 rounded-xl bg-void border border-border/80 space-y-2 hover:border-bridge-teal/30 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary truncate" title={sk.skillName}>
                          {sk.skillName}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isMet
                            ? 'bg-status-green/15 text-status-green border-status-green/30'
                            : 'bg-industry-amber/15 text-industry-amber border-industry-amber/30'
                        }`}>
                          {isMet ? 'Verified' : 'Gap'}
                        </span>
                      </div>

                      {/* Score & Benchmark bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                          <span>Score: <strong className="text-text-primary">{sk.currentScore}%</strong></span>
                          <span>Benchmark: {sk.benchmarkScore}%</span>
                        </div>
                        <div className="w-full bg-panel-raised h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMet ? 'bg-status-green' : 'bg-bridge-teal'
                            }`}
                            style={{ width: `${Math.min(sk.currentScore, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Status alerts: Decay & Latest Delta */}
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                        {hasDecay ? (
                          <span className="text-signal-red font-semibold">
                            ⚠️ -{sk.inactivityDecayPct}% decay ({sk.decayDaysCount}d inactive)
                          </span>
                        ) : (
                          <span className="text-text-muted">
                            {sk.lastAttemptDate ? `Last: ${formatDate(sk.lastAttemptDate)}` : 'Recently calibrated'}
                          </span>
                        )}

                        {lastDelta !== null && lastDelta !== 0 && (
                          <span className={lastDelta > 0 ? 'text-status-green font-bold' : 'text-signal-red font-bold'}>
                            {lastDelta > 0 ? `+${lastDelta}%` : `${lastDelta}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter & Controls Bar */}
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Modalities' },
                { id: 'dsa', label: 'DSA & Coding' },
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-bridge-teal text-white font-bold shadow-md shadow-bridge-teal/20'
                      : 'bg-panel text-text-muted hover:text-text-primary border border-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel p-3.5 rounded-2xl border border-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assessment attempts by topic, practice set title, or domain..."
              className="w-full pl-10 pr-4 py-2 bg-void border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-bridge-teal"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="small-caps-label text-xs font-mono text-text-muted whitespace-nowrap">SORT:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-void border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-bridge-teal cursor-pointer"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal text-white font-bold text-xs shadow-md shadow-bridge-teal/20 hover:bg-bridge-teal/90 transition-all"
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
              className="p-5 rounded-2xl bg-panel border border-border hover:border-bridge-teal/40 transition-all duration-200 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Column: Title & Domain Badges */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="small-caps-label text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-panel-raised border border-border text-text-primary">
                    {att.domainName}
                  </span>
                  <span className="small-caps-label text-[10px] px-2.5 py-0.5 rounded-full bg-panel-raised border border-border text-text-muted">
                    {att.difficulty}
                  </span>
                  {att.isBestScore && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Best Score</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-text-primary group-hover:text-bridge-teal transition-colors font-sans">
                  {att.practiceSetTitle}
                </h3>

                <div className="flex items-center gap-4 text-[11px] font-mono text-text-muted">
                  <span>Taken: {formatDate(att.submittedAt)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-bridge-teal" />
                    <span>{formatSeconds(att.timeSpentSeconds)} spent</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Score, Pass/Fail & Action */}
              <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xl font-bold font-mono text-text-primary">
                      {att.score}%
                    </span>
                    {att.passed ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-signal-green/15 text-signal-green border border-signal-green/30">
                        Passed
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-signal-red/15 text-signal-red border border-signal-red/30">
                        Below Pass Mark
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted">
                    Pass Mark: {att.passingScorePct}%
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalAttemptId(att.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-panel-raised hover:bg-border text-text-primary hover:text-bridge-teal border border-border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* Mock Interview History Tab */
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MatchCard
              label="TOTAL MOCK SESSIONS"
              value={interviewHistoryData?.totalSessions ?? 0}
              subtitle={
                interviewHistoryData?.latestSession
                  ? `Latest: ${interviewHistoryData.latestSession.targetRole}`
                  : 'No completed sessions'
              }
              icon={Sparkles}
            />
            <MatchCard
              label="AVERAGE INTERVIEW SCORE"
              value={`${interviewHistoryData?.averageScore ?? 0}%`}
              progress={interviewHistoryData?.averageScore ?? 0}
              status={(interviewHistoryData?.averageScore ?? 0) >= 70 ? 'verified' : 'unverified'}
              subtitle="Evaluated across Technical & Behavioral"
              icon={Award}
            />
            <MatchCard
              label="READINESS CALIBRATION"
              value={interviewHistoryData?.latestSession?.readinessTier ?? 'Pending'}
              subtitle="Based on Sash's rubric assessment"
              icon={ShieldCheck}
            />
            <MatchCard
              label="SCORE PROGRESSION"
              value={
                interviewHistoryData?.overallTrend === 'improving'
                  ? 'IMPROVING'
                  : interviewHistoryData?.overallTrend === 'declining'
                  ? 'NEEDS FOCUS'
                  : 'STEADY'
              }
              trend={{
                direction:
                  interviewHistoryData?.overallTrend === 'improving'
                    ? 'up'
                    : interviewHistoryData?.overallTrend === 'declining'
                    ? 'down'
                    : 'neutral',
                value:
                  interviewHistoryData?.overallTrend === 'improving'
                    ? 'Progress ↗'
                    : interviewHistoryData?.overallTrend === 'declining'
                    ? 'Focus ↘'
                    : 'Stable',
              }}
              subtitle="Across completed retakes"
              icon={TrendingUp}
            />
          </div>

          {/* Score Progression Timeline across retakes */}
          {interviewHistoryData && interviewHistoryData.scoreTrend && interviewHistoryData.scoreTrend.length > 1 && (
            <div className="p-5 rounded-2xl bg-panel border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="small-caps-label text-[10px] text-bridge-teal font-bold">
                      [● SCORE EVOLUTION]
                    </span>
                    <h3 className="text-sm font-bold text-text-primary">
                      Performance Across Retakes
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Tracking score improvement and gap closure over consecutive interview attempts
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-bridge-teal bg-bridge-teal/10 px-2.5 py-1 rounded-full border border-bridge-teal/20">
                  {interviewHistoryData.scoreTrend.length} Completed Attempts
                </span>
              </div>

              {/* Step / Timeline Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {interviewHistoryData.scoreTrend.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-panel-raised border border-border space-y-1.5 text-center relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                      <span>#{item.retakeNumber}</span>
                      <span>{item.date}</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-text-primary">
                      {item.score}%
                    </div>
                    <div className="text-[10px] text-text-muted truncate font-sans" title={item.targetRole}>
                      {item.targetRole}
                    </div>
                    <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-bridge-teal h-full rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Identified Common Weak Areas feeding Roadmap & Daily Prep */}
              {interviewHistoryData.commonWeakAreas && interviewHistoryData.commonWeakAreas.length > 0 && (
                <div className="p-3 rounded-xl bg-industry-amber/10 border border-industry-amber/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-industry-amber font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Identified Growth Areas Feeding Roadmap & Practice:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {interviewHistoryData.commonWeakAreas.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-panel border border-industry-amber/30 text-[11px] font-mono text-text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completed Session Cards List */}
          {loadingInterviews ? (
            <div className="py-16 text-center space-y-3 bg-panel rounded-2xl border border-border">
              <div className="w-7 h-7 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-text-muted">Loading mock interview history...</p>
            </div>
          ) : !interviewHistoryData?.sessions || interviewHistoryData.sessions.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-panel border border-border text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-bridge-teal/15 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-bold text-base text-text-primary">
                  No Completed Mock Interviews Yet
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Target a job or internship on the Internships board to generate a 30-minute voice-enabled mock interview with Sash. Your transcripts, quoted feedback, and score trends will appear here.
                </p>
              </div>
              <Link
                to="/internships"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bridge-teal text-white text-xs font-bold shadow-md hover:bg-bridge-teal/90 transition-all"
              >
                <span>Browse Internships to Practice</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-text-muted font-mono px-1">
                <span>Completed Interview Sessions ({interviewHistoryData.sessions.length})</span>
                <span>Sorted by Most Recent</span>
              </div>

              {interviewHistoryData.sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl bg-panel border border-border hover:border-bridge-teal/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group shadow-sm"
                >
                  {/* Left Column: Role, Company, Attempt badge, Date */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30">
                        Attempt #{session.retakeNumber}
                      </span>
                      {session.companyName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-panel-raised text-text-muted border border-border">
                          {session.companyName}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-text-muted">
                        {formatDate(session.date)}
                      </span>
                      <span className="text-text-muted text-[11px]">•</span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-text-muted">
                        <Clock className="w-3 h-3 text-bridge-teal" />
                        <span>{formatSeconds(session.durationSeconds)}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-text-primary group-hover:text-bridge-teal transition-colors">
                      {session.targetRole}
                    </h3>

                    {/* Subscores breakdown */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                      <span className="text-text-muted">
                        Technical: <strong className="text-text-primary">{session.technicalScore}%</strong>
                      </span>
                      <span className="text-text-muted">
                        Communication: <strong className="text-text-primary">{session.communicationScore}%</strong>
                      </span>
                      <span className="text-text-muted">
                        Structure: <strong className="text-text-primary">{session.structureScore}%</strong>
                      </span>
                    </div>

                    {/* Identified Gaps / Weak Areas */}
                    {session.identifiedGaps && session.identifiedGaps.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase text-industry-amber font-semibold">
                          Target Gaps:
                        </span>
                        {session.identifiedGaps.map((gap, gIdx) => (
                          <span
                            key={gIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-industry-amber/10 text-industry-amber border border-industry-amber/25"
                          >
                            {gap}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Score, Readiness Badge & Review Transcript Button */}
                  <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-2xl font-bold font-mono text-text-primary">
                          {session.overallScore}%
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          session.overallScore >= 70
                            ? 'bg-status-green/15 text-status-green border-status-green/30'
                            : 'bg-industry-amber/15 text-industry-amber border-industry-amber/30'
                        }`}>
                          {session.readinessTier}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-text-muted">
                        Sash Scored Evaluation
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedInterviewSessionId(session.id)}
                      className="px-4 py-2.5 rounded-xl bg-panel-raised hover:bg-border text-text-primary hover:text-bridge-teal border border-border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Transcript</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Mock Interview Transcript & Quoted Feedback Modal */}
      {selectedInterviewSessionId && (
        <div
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-console-panel border border-console-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-xs text-console-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-console-border flex items-center justify-between gap-4 bg-console-panel-raised">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bridge-teal/15 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-console-text">
                    Sash Mock Interview Evaluation
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    {interviewDetailData?.session?.targetRole} • Attempt #{interviewDetailData?.session?.retakeNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInterviewSessionId(null)}
                className="p-1 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-bg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {loadingInterviewDetail ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-7 h-7 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-console-text-muted text-xs font-mono">Loading session transcript...</p>
                </div>
              ) : interviewDetailData?.session ? (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-4 rounded-xl bg-console-panel-raised border border-console-border flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-bridge-teal text-white font-bold flex items-center justify-center text-lg shadow-md">
                        {interviewDetailData.session.overallScore}%
                      </div>
                      <div>
                        <div className="font-bold text-console-text text-sm">
                          {interviewDetailData.session.readinessTier}
                        </div>
                        <div className="text-[11px] text-console-text-muted">
                          Duration: {Math.floor(interviewDetailData.session.durationSeconds / 60)}m {interviewDetailData.session.durationSeconds % 60}s • Date: {interviewDetailData.session.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question-by-Question Transcript & Quoted Rubric Feedback */}
                  <div className="space-y-3">
                    <h4 className="font-mono text-[11px] uppercase tracking-wider text-console-text-muted font-bold">
                      Questions, Candidate Answers & Sash Critique
                    </h4>

                    {(interviewDetailData.session.feedback?.questionFeedback || []).map((fb: any) => {
                      const ansItem = (interviewDetailData.session.transcript || []).find((t: any) => t.questionIndex === fb.questionIndex);
                      const qItem = (interviewDetailData.session.questions || []).find((q: any) => q.questionIndex === fb.questionIndex);

                      return (
                        <div key={fb.questionIndex} className="p-4 rounded-xl bg-console-bg border border-console-border space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono font-bold text-bridge-teal text-[11px]">
                              Question {fb.questionIndex}: {qItem?.category === 'behavioral' ? 'Behavioral (STAR)' : `Technical (${qItem?.skillTag})`}
                            </span>
                            <span className="font-mono font-bold px-2 py-0.5 rounded text-[10px] bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30">
                              {fb.score} / {fb.maxScore} pts
                            </span>
                          </div>

                          <p className="text-xs font-medium text-console-text leading-relaxed">
                            {qItem?.questionText}
                          </p>

                          <div className="p-3 rounded-lg bg-console-panel border border-console-border space-y-1 text-[11px]">
                            <span className="text-console-text-muted font-mono font-semibold">Candidate Answer:</span>
                            <p className="text-console-text leading-relaxed italic">
                              "{ansItem?.studentAnswer || '[Unanswered / Skipped]'}"
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-bridge-teal/10 border border-bridge-teal/25 space-y-1 text-[11px]">
                            <div className="font-bold text-bridge-teal flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Sash Quoted Feedback:</span>
                            </div>
                            <p className="text-console-text leading-relaxed">
                              {fb.feedback}
                            </p>
                            {fb.improvements && (
                              <p className="text-console-text-muted pt-1 text-[10px]">
                                <span className="font-semibold text-bridge-teal">Improvement Focus: </span>
                                {fb.improvements}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-console-text-muted">Could not load session transcript.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-console-panel-raised border-t border-console-border flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedInterviewSessionId(null)}
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
