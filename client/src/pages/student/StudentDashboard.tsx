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
  CheckCircle2,
  TrendingUp,
  FileText,
  Flame,
  Zap,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SkillRadarCard } from '../../components/SkillRadarCard';
import { MatchBadge } from '../../components/MatchBadge';
import { BridgeLine } from '../../components/BridgeLine';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';
import { MatchCard } from '../../components/MatchCard';
import { VerifiedActivityCard, VerifiedActivityItem } from '../../components/VerifiedActivityCard';
import { TodayTargetCard } from '../../components/TodayTargetCard';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;
  const [selectedDomain, setSelectedDomain] = React.useState<string>(
    user?.studentProfile?.targetDomain || 'Full-Stack Web'
  );

  // 1. Fetch Student Profile with Verified Skill Scores and Benchmarks
  const { data: profileData } = useQuery({
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
  const { data: matchesData } = useQuery({
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
    applied: { label: 'Applied', bg: 'bg-[#0f172a] text-slate-400 border-[#1e293b]' },
    under_review: { label: 'Under Review', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    rejected: { label: 'Not Selected', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
  };

  // Convert gaps into VerifiedActivityItem format
  const gapActivityItems: VerifiedActivityItem[] = currentGaps.slice(0, 4).map((g: any, i: number) => ({
    id: `gap-${i}`,
    title: g.skillName,
    subtitle: `Current: ${g.current}% · Target: ${g.benchmark}%`,
    value: `-${g.gap}%`,
    trend: {
      direction: 'down',
      value: `${g.gap}% Gap`,
    },
    icon: Radar,
  }));

  // Convert applications into VerifiedActivityItem format
  const appActivityItems: VerifiedActivityItem[] = applications.map((app: any) => {
    const chip = statusChips[app.status as keyof typeof statusChips] || statusChips.applied;
    return {
      id: app.id,
      title: app.internshipTitle,
      subtitle: `${app.companyName} • ${app.location}`,
      value: `${Math.round(app.matchScoreAtApply)}%`,
      badge: chip.label,
      timestamp: new Date(app.appliedAt).toLocaleDateString(),
      icon: Briefcase,
    };
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Mandatory Daily Practice Set Banner */}
      <DailyPracticeBanner />

      {/* Sash Daily Target — compact strip */}
      <TodayTargetCard variant="compact" />

      {/* Welcome Banner - Black & Blue Theme */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md shadow-xl shadow-blue-950/20">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="small-caps-label flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f172a] text-[#38bdf8] border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
              Verified Candidate Hub
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Target: <span className="text-white font-medium">{student?.targetDomain || 'Engineering'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Welcome back, {user?.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Your skill radar is calibrated against live industry benchmarks. You currently have{' '}
            <span className="text-[#38bdf8] font-mono font-medium">
              {matches.filter(m => m.overallScore >= 80).length} high-match opportunities
            </span>{' '}
            ready for fast-track review.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <Link
            to="/assessment"
            className="bridge-btn-primary text-xs py-2.5 px-5"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>Take Assessment</span>
          </Link>
          <Link
            to="/learn"
            className="bridge-btn-secondary text-xs py-2.5 px-4"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            <span>Learning Hub</span>
          </Link>
          <Link
            to="/resume-builder"
            className="bridge-btn-secondary text-xs py-2.5 px-4"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-[#E8A23C]" />
            <span>AI Resume</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Metrics — MatchCard Language */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MatchCard
          label="DAILY STREAK"
          value={`${user?.currentStreak || 1}d`}
          subValue="1 Set/Day Protocol"
          progress={100}
          icon={Flame}
        />
        <MatchCard
          label="VERIFIED POINTS"
          value={(student?.rankings?.totalPoints || 0).toLocaleString()}
          subValue="Skill Assessment Score"
          progress={Math.min(100, Math.round(((student?.rankings?.totalPoints || 0) % 1000) / 10))}
          icon={TrendingUp}
        />
        <MatchCard
          label="VERIFIED BADGES"
          value={student?.rankings?.totalBadges || 0}
          subValue="NPTEL & System Accreditations"
          icon={Award}
        />
        <MatchCard
          label="COMPETENCY TIER"
          value={`Level ${student?.rankings?.level || 1}`}
          subValue="Recency Weighted Scoring"
          icon={CheckCircle2}
        />
      </div>

      {/* Top Match Highlight & Signature Bridge Line */}
      {topMatch && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg shadow-blue-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="small-caps-label flex items-center gap-1.5 text-blue-400 mb-1">
                <Zap className="w-3 h-3 text-blue-400" />
                Top Authoritative Match
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {topMatch.internshipTitle} • <span className="text-slate-400">{topMatch.companyName}</span>
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <MatchBadge score={topMatch.overallScore} tier={topMatch.tier} size="lg" />
              <Link
                to="/internships"
                className="bridge-btn-primary text-xs py-2 px-4"
              >
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
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

        {/* Right: Gap Remediation Alerts in VerifiedActivityCard Language */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <VerifiedActivityCard
            title="PRIORITY SKILL GAPS"
            subtitle="Skills with highest divergence from industry benchmarks"
            actionText="Enroll in Courses"
            onAction={() => window.location.assign('/courses')}
            items={gapActivityItems}
            emptyMessage="Zero priority gaps detected in current target domain."
            className="h-full"
          />
        </div>
      </div>

      {/* Academic Performance & Improvement Feature Banner */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Academic Performance & Improvement</h3>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                Semester Marksheets
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Upload previous semester transcripts, extract academic records, identify domain-weighted weak subjects, and view personalized 6-stage learning roadmaps.
            </p>
          </div>
        </div>

        <Link
          to="/academic-performance"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <span>Open Academic Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Applications Tracker in VerifiedActivityCard Language */}
      <VerifiedActivityCard
        title="APPLICATION PIPELINE"
        subtitle="Active submissions tracked by verified employers"
        actionText="Browse Internships"
        onAction={() => window.location.assign('/internships')}
        items={appActivityItems}
        emptyMessage="No active applications yet. Browse matched internships to apply with verified proof."
      />
    </div>
  );
};

export default StudentDashboard;
