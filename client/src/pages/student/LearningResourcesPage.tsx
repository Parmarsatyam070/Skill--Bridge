import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  ExternalLink,
  Youtube,
  Globe,
  GraduationCap,
  Sparkles,
  Filter,
  CheckCircle2,
  Tag,
  Star,
  Flame,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { LearningResource, LearningResourceType } from '@shared/types';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';

const DOMAIN_OPTIONS = [
  'All Domains',
  'Full-Stack Web',
  'AI/Data Science',
  'Cloud/DevOps',
  'UI/UX Product Design',
  'Embedded/IoT',
  'DSA & Problem Solving',
];

const TYPE_OPTIONS: { label: string; value: string; icon: any }[] = [
  { label: 'All Types', value: 'all', icon: BookOpen },
  { label: 'Websites & Docs', value: 'website', icon: Globe },
  { label: 'YouTube Playlists', value: 'youtube_playlist', icon: Youtube },
  { label: 'YouTube Channels', value: 'youtube_channel', icon: Youtube },
  { label: 'Courses & Bootcamps', value: 'course', icon: GraduationCap },
  { label: 'Interactive Apps', value: 'app', icon: Sparkles },
];

export const LearningResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;

  const [selectedDomain, setSelectedDomain] = useState<string>('All Domains');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFreeOnly, setIsFreeOnly] = useState<boolean>(false);

  // Fetch all filtered resources
  const { data: resourcesData, isLoading } = useQuery<{ resources: LearningResource[] }>({
    queryKey: ['learningResources', selectedDomain, selectedType, searchQuery, isFreeOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDomain !== 'All Domains') params.append('domain', selectedDomain);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (isFreeOnly) params.append('isFree', 'true');

      return api.get<{ resources: LearningResource[] }>(`/resources?${params.toString()}`);
    },
  });

  // Fetch gap-targeted recommendations for current student
  const { data: gapsData } = useQuery<{
    domain: string;
    totalGaps: number;
    gaps: { skillName: string; currentScore: number; benchmarkScore: number; gap: number; resources: LearningResource[] }[];
  }>({
    queryKey: ['studentGapResources', studentProfileId],
    queryFn: () => api.get(`/resources/gaps/${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  const resources = resourcesData?.resources || [];
  const studentGaps = gapsData?.gaps || [];

  const getTypeBadge = (type: LearningResourceType) => {
    switch (type) {
      case 'youtube_channel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <Youtube className="w-3 h-3 text-rose-400" />
            Channel
          </span>
        );
      case 'youtube_playlist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <Youtube className="w-3 h-3 text-red-400" />
            Curated Playlist
          </span>
        );
      case 'course':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <GraduationCap className="w-3 h-3 text-indigo-400" />
            Course
          </span>
        );
      case 'app':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Interactive Tool
          </span>
        );
      case 'website':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Globe className="w-3 h-3 text-emerald-400" />
            Documentation & Practice
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Daily Practice Nudge */}
      <DailyPracticeBanner />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950/90 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curated High-Quality Resources Hub
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Learning Resource Engine
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Targeted tutorials, complete YouTube roadmaps, official documentation, and interactive practice platforms mapped directly to your domain competencies and verified skill gaps.
          </p>
        </div>
      </div>

      {/* Target Skill Gaps Recommendations (if student has deficits) */}
      {studentGaps.length > 0 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Targeted Gap Accelerators
                </h3>
                <span className="text-xs text-slate-400">
                  Curated to close your biggest benchmark gaps in {gapsData?.domain}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {studentGaps.length} Skill Deficit{studentGaps.length !== 1 ? 's' : ''} Identified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentGaps.slice(0, 3).map((gap, gIdx) => (
              <div
                key={gIdx}
                className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-200">{gap.skillName}</span>
                    <span className="text-[11px] font-bold text-amber-400">
                      Score: {gap.currentScore}% / {gap.benchmarkScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (gap.currentScore / gap.benchmarkScore) * 100)}%` }}
                    />
                  </div>

                  {/* Recommended Link */}
                  {gap.resources.length > 0 ? (
                    <div className="space-y-2">
                      {gap.resources.slice(0, 2).map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-slate-650 transition-all text-xs group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                              {res.title}
                            </p>
                            <span className="text-[11px] text-slate-400">{res.provider}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Exploring custom resources...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        {/* Search Bar & Free Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resources, topics (DSA, React, Andrew Ng...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Free Only Toggle */}
          <button
            type="button"
            onClick={() => setIsFreeOnly(prev => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isFreeOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-750 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isFreeOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>100% Free Resources Only</span>
          </button>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DOMAIN_OPTIONS.map(dom => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomain(dom)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDomain === dom
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-750 hover:border-slate-700'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Resource Type Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedType(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedType === opt.value
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading curated resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No resources matched your filter</h3>
          <p className="text-xs text-slate-500">
            Try loosening search terms or switching domain categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDomain('All Domains');
              setSelectedType('all');
              setSearchQuery('');
              setIsFreeOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map(res => (
            <div
              key={res.id}
              className="flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 p-5 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/20 group"
            >
              <div className="space-y-3.5">
                {/* Header row: Badge and Provider */}
                <div className="flex items-center justify-between gap-2">
                  {getTypeBadge(res.type)}
                  <span className="text-xs font-bold text-slate-300 bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
                    {res.provider}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                </div>

                {/* Topic Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-750">
                    {res.topicTag}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-850 text-slate-400">
                    {res.domain}
                  </span>
                  {res.isFree && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Honest Outbound Link */}
              <div className="pt-5 mt-4 border-t border-slate-800">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white text-xs font-bold border border-slate-700 group-hover:border-indigo-500 shadow-sm transition-all duration-200"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
