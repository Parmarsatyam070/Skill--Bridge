import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radar,
  Sparkles,
  ArrowRight,
  Briefcase,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SkillRadarCard } from '../../components/SkillRadarCard';
import { MatchBadge } from '../../components/MatchBadge';
import { BridgeLine } from '../../components/BridgeLine';

import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;
  const [selectedDomain, setSelectedDomain] = React.useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );

  // 1. Fetch Student Profile with Verified Skill Scores and Benchmarks
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['studentProfile', studentProfileId],
    queryFn: () => api.get<{ student: any }>(`/students/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  // Fetch Tracked Domains
  const { data: domainsData } = useQuery({
    queryKey: ['studentDomains', studentProfileId],
    queryFn: () => api.get<{ domains: any[] }>(`/students/${studentProfileId}/domains`),
    enabled: !!studentProfileId,
  });

  const trackedDomains = domainsData?.domains || [];

  // Fetch Domain-Specific Radar Data
  const { data: radarData } = useQuery({
    queryKey: ['radarData', studentProfileId, selectedDomain],
    queryFn: () => api.get<{ domain: string; benchmarks: any[]; studentSkills: any[] }>(
      `/students/${studentProfileId}/radar?domain=${encodeURIComponent(selectedDomain)}`
    ),
    enabled: !!studentProfileId && !!selectedDomain,
  });

  // 2. Fetch Authoritative Match Scores from SINGLE SOURCE OF TRUTH endpoint
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['studentMatches', studentProfileId],
    queryFn: () => api.get<{ matches: any[] }>(`/students/${studentProfileId}/matches`),
    enabled: !!studentProfileId,
  });

  // 3. Fetch Student Applications
  const { data: appsData } = useQuery({
    queryKey: ['studentApplications', studentProfileId],
    queryFn: () => api.get<{ applications: any[] }>(`/applications/student/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const student = profileData?.student;
  const matches = matchesData?.matches || [];
  const applications = appsData?.applications || [];

  const topMatch = matches[0];

  // Identify skill gaps in the currently selected domain
  const domainSkills = radarData?.studentSkills || student?.skillScores || [];
  const domainBenchmarks = radarData?.benchmarks || student?.benchmarks || [];
  const benchmarkMap = new Map(domainBenchmarks.map((b: any) => [b.skillId, Number(b.benchmarkScore)]));

  const currentGaps = domainSkills
    .map((s: any) => {
      const benchmark = Number(benchmarkMap.get(s.skillId) || 75);
      const score = Number(s.score || 0);
      return {
        skillName: s.skillName,
        current: Math.round(score),
        benchmark: Math.round(benchmark),
        gap: Math.max(0, Math.round(benchmark - score)),
      };
    })
    .filter((g: any) => g.gap > 0)
    .sort((a: any, b: any) => b.gap - a.gap);

  const statusChips = {
    applied: { label: 'Applied', bg: 'bg-status-blue/15 text-status-blue border-status-blue/30' },
    under_review: { label: 'Under Review', bg: 'bg-status-amber/15 text-status-amber border-status-amber/30' },
    shortlisted: { label: 'Shortlisted', bg: 'bg-status-green/15 text-status-green border-status-green/30' },
    rejected: { label: 'Not Selected', bg: 'bg-status-red/15 text-status-red border-status-red/30' },
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Mandatory Daily Practice Set Banner */}
      <DailyPracticeBanner />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-console-panel-raised via-console-panel to-console-bg border border-console-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 text-xs font-mono font-medium">
              Verified Candidate Hub
            </span>
            <span className="text-xs font-mono text-console-text-muted">
              Target: {student?.targetDomain || 'Engineering'}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-console-text-muted max-w-xl leading-relaxed">
            Your skill radar is synced with current industry demand. You currently have{' '}
            <span className="text-bridge-teal font-semibold font-mono">{matches.filter(m => m.overallScore >= 80).length} high-match opportunities</span>{' '}
            ready for fast-track application.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/assessment"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Take Assessment</span>
          </Link>
          <Link
            to="/learn"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text font-semibold text-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-bridge-teal" />
            <span>Learning Hub</span>
          </Link>
          <Link
            to="/resume-builder"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text font-semibold text-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-industry-amber" />
            <span>AI Resume Builder</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Activity Streak & Competency Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="bg-console-panel border border-console-border rounded-xl p-4 flex items-center gap-3 group relative cursor-help"
          title="Streak Rule: A day only counts towards your streak if you complete and submit at least 1 practice set today."
        >
          <div className="w-10 h-10 rounded-xl bg-industry-amber/15 text-industry-amber border border-industry-amber/30 flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 fill-industry-amber" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-console-text-muted flex items-center gap-1">
              <span>Daily Streak</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-industry-amber/20 text-industry-amber">1 Set/Day</span>
            </div>
            <div className="text-lg font-bold font-mono text-console-text">
              {user?.currentStreak || 1} Day{user?.currentStreak !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="bg-console-panel border border-console-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-console-text-muted">Verified Points</div>
            <div className="text-lg font-bold font-mono text-bridge-teal">
              {(student?.rankings?.totalPoints || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-console-panel border border-console-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-campus-blue/15 text-campus-blue border border-campus-blue/30 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-console-text-muted">Verified Badges</div>
            <div className="text-lg font-bold font-mono text-campus-blue">
              {student?.rankings?.totalBadges || 0} Badges
            </div>
          </div>
        </div>

        <div className="bg-console-panel border border-console-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-green/15 text-status-green border border-status-green/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-console-text-muted">Competency Tier</div>
            <div className="text-lg font-bold font-mono text-status-green">
              Level {student?.rankings?.level || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Top Match Highlight & Signature Bridge Line */}
      {topMatch && (
        <div className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-console-text-muted block">
                Top Authoritative Match
              </span>
              <h3 className="font-serif text-lg font-bold text-console-text">
                {topMatch.internshipTitle} • {topMatch.companyName}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <MatchBadge score={topMatch.overallScore} tier={topMatch.tier} size="lg" />
              <Link
                to="/internships"
                className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold"
              >
                Apply Now →
              </Link>
            </div>
          </div>

          {/* Genuine Match Bridge Line */}
          <BridgeLine
            sourceLabel={`Your ${student?.targetDomain || 'Domain'} Skill Vector`}
            targetLabel={`${topMatch.internshipTitle} @ ${topMatch.companyName}`}
            matchScore={topMatch.overallScore}
            tier={topMatch.tier}
          />
        </div>
      )}

      {/* Grid: Skill Radar + High-Priority Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Skill Radar */}
        <div className="lg:col-span-7">
          {student && (
            <SkillRadarCard
              studentSkills={domainSkills}
              benchmarks={domainBenchmarks}
              targetDomain={selectedDomain}
            />
          )}
        </div>

        {/* Right: Gap Remediation Alerts */}
        <div className="lg:col-span-5 bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-console-border">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
                  Remediation Roadmap
                </span>
                <h3 className="font-serif text-base font-bold text-console-text">
                  Priority Skill Gaps
                </h3>
              </div>
              <span className="text-xs font-mono text-status-amber bg-status-amber/10 px-2 py-0.5 rounded border border-status-amber/20">
                {currentGaps.length} Gaps
              </span>
            </div>

            <div className="space-y-3">
              {currentGaps.slice(0, 3).map((g: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-console-panel-raised border border-console-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-console-text">{g.skillName}</span>
                    <span className="font-mono text-status-red font-semibold">-{g.gap}% Gap</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-console-text-muted">
                    <span>Current: {g.current}%</span>
                    <span>Industry Target: {g.benchmark}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-console-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-red rounded-full"
                      style={{ width: `${(g.current / g.benchmark) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/courses"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-xs font-semibold text-bridge-teal transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Enroll in Remediation Courses →</span>
          </Link>
        </div>
      </div>

      {/* Applications Tracker */}
      <div className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Application Pipeline
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              Active Internship Applications
            </h3>
          </div>
          <span className="text-xs font-mono text-console-text-muted">
            {applications.length} Submitted
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Briefcase className="w-8 h-8 text-console-text-muted mx-auto opacity-50" />
            <div className="text-xs font-medium text-console-text">No active applications yet</div>
            <p className="text-[11px] text-console-text-muted">
              Browse matched internships and submit applications with your verified resume.
            </p>
            <Link
              to="/internships"
              className="inline-block px-4 py-2 rounded-xl bg-bridge-teal text-white text-xs font-semibold mt-2"
            >
              Browse Matched Internships
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-console-border">
            {applications.map((app: any) => {
              const chip = statusChips[app.status as keyof typeof statusChips] || statusChips.applied;
              return (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-xs text-console-text">{app.internshipTitle}</div>
                    <div className="text-[11px] text-console-text-muted">
                      {app.companyName} • {app.location} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-console-text-muted">
                      Match at Apply: <span className="text-console-text font-bold">{Math.round(app.matchScoreAtApply)}%</span>
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${chip.bg}`}>
                      {chip.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
