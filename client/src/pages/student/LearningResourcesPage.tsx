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
  SlidersHorizontal,
  Code2,
  Layers,
  Award,
  Book,
  FileText,
  Brain,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  SmartLearningResource,
  LearningCategory,
  LearningHubSearchResponse,
} from '@shared/types';
import { DailyPracticeBanner } from '../../components/DailyPracticeBanner';

const QUICK_TOPICS = [
  'Dynamic Programming',
  'Graph Algorithms',
  'React',
  'System Design',
  'SQL',
  'Machine Learning',
  'Operating Systems',
  'Computer Networks',
  'Cloud & DevOps',
  'Data Structures',
  'Competitive Programming',
];

const CATEGORY_TABS: { id: 'all' | LearningCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All Resources', icon: Compass },
  { id: 'recommended', label: 'Recommended', icon: Sparkles },
  { id: 'videos', label: 'Videos', icon: Youtube },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'documentation', label: 'Documentation', icon: Globe },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'practice', label: 'Practice', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'books', label: 'Books', icon: Book },
  { id: 'interview_prep', label: 'Interview Prep', icon: Award },
];

export const LearningResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | LearningCategory>('all');
  const [isFreeOnly, setIsFreeOnly] = useState<boolean>(false);

  // 1. Search Query
  const { data: searchData, isLoading: isSearchLoading } = useQuery<LearningHubSearchResponse>({
    queryKey: ['smartLearningSearch', searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      return api.get<LearningHubSearchResponse>(`/resources/search?${params.toString()}`);
    },
  });

  // 2. Personalized Weak Topic Recommendations
  const { data: personalizedData } = useQuery<{
    domain: string;
    personalizedWeakTopics: string[];
    recommendations: SmartLearningResource[];
  }>({
    queryKey: ['smartPersonalizedResources'],
    queryFn: () => api.get('/resources/personalized'),
  });

  // Extract resources based on active category
  const categories = searchData?.categories;
  let displayedResources: SmartLearningResource[] = [];

  if (categories) {
    if (activeCategory === 'all') {
      const seen = new Set<string>();
      Object.values(categories).forEach((resList) => {
        resList.forEach((r) => {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            displayedResources.push(r);
          }
        });
      });
      // Sort by relevance / authority
      displayedResources.sort((a, b) => (b.relevanceScore || b.authorityScore) - (a.relevanceScore || a.authorityScore));
    } else {
      displayedResources = categories[activeCategory] || [];
    }
  }

  if (isFreeOnly) {
    displayedResources = displayedResources.filter((r) => r.isFree);
  }

  const personalizedWeakTopics = searchData?.personalizedWeakTopics || personalizedData?.personalizedWeakTopics || [];
  const personalizedList = personalizedData?.recommendations || [];

  const getCategoryBadge = (category: LearningCategory) => {
    switch (category) {
      case 'videos':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Youtube className="w-3 h-3" />
            Video Lecture
          </span>
        );
      case 'courses':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <GraduationCap className="w-3 h-3" />
            Full Course
          </span>
        );
      case 'documentation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Globe className="w-3 h-3" />
            Official Docs
          </span>
        );
      case 'practice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Code2 className="w-3 h-3" />
            Hands-on Practice
          </span>
        );
      case 'interview_prep':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Award className="w-3 h-3" />
            Interview Prep
          </span>
        );
      case 'projects':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Layers className="w-3 h-3" />
            Project Tutorial
          </span>
        );
      case 'books':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <Book className="w-3 h-3" />
            Standard Text
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Sparkles className="w-3 h-3 text-bridge-teal" />
            Authoritative
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Daily Practice Mandatory Banner */}
      <DailyPracticeBanner />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-bridge-teal/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Smart Technical Learning Hub & Knowledge Graph
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-serif">
            Universal Technical Learning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Search any computer science, software engineering, or technical domain. Verified official documentation, high-quality university courses, interactive sandboxes, and personalized guidance for your weak practice areas.
          </p>
        </div>
      </div>

      {/* Personalized Weak Topic Recommendations Card */}
      {personalizedWeakTopics.length > 0 && personalizedList.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-serif flex items-center gap-2">
                  <span>Recommended for your weak practice areas</span>
                  <span className="text-xs font-mono text-amber-400 font-normal">
                    ({personalizedWeakTopics.join(', ')})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted learning accelerators to bridge your algorithmic and domain skill gaps
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Personalized Calibration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {personalizedList.slice(0, 3).map((res) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {getCategoryBadge(res.category)}
                    <span className="text-[10px] font-mono text-slate-400">{res.provider}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {res.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <span className="text-amber-400 font-bold">{res.topicTag}</span>
                  <div className="flex items-center gap-1 group-hover:text-amber-300">
                    <span>Open Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Omni-Topic Search Bar & Quick Suggestion Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ANY technical topic (Dynamic Programming, React, System Design, SQL...)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-750 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-bridge-teal transition-all shadow-inner"
            />
          </div>

          {/* 100% Free Only Toggle */}
          <button
            type="button"
            onClick={() => setIsFreeOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
              isFreeOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900 text-slate-400 border-slate-750 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isFreeOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>100% Free Resources Only</span>
          </button>
        </div>

        {/* Quick Suggestion Topic Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex-shrink-0">
            Suggested:
          </span>
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setSearchQuery(topic)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                searchQuery === topic
                  ? 'bg-bridge-teal text-slate-950 font-bold shadow-md shadow-bridge-teal/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* 9 Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? displayedResources.length : categories?.[tab.id]?.length || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === tab.id
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-bridge-teal" />
                <span>{tab.label}</span>
                {categories && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-850 text-slate-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid */}
      {isSearchLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Searching authoritative knowledge bases...</p>
        </div>
      ) : displayedResources.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No resources matched your query</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try a different search term like "Dynamic Programming", "React", "System Design", or reset your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setIsFreeOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedResources.map((res) => (
            <div
              key={res.id}
              className="flex flex-col justify-between rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-bridge-teal/40 p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/40 group"
            >
              <div className="space-y-3.5">
                {/* Header row: Badge, Provider, and Rating */}
                <div className="flex items-center justify-between gap-2">
                  {getCategoryBadge(res.category)}
                  <span className="text-xs font-bold text-slate-300 bg-slate-850 px-2.5 py-0.5 rounded-lg border border-slate-750">
                    {res.provider}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-bridge-teal transition-colors leading-snug">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                </div>

                {/* Topic Tags, Difficulty, Authority Score */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-750">
                    #{res.topicTag}
                  </span>
                  {res.difficulty && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-400">
                      {res.difficulty}
                    </span>
                  )}
                  {res.authorityScore && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                      ★ {res.authorityScore}/100 Auth
                    </span>
                  )}
                  {res.isFree && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      100% FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Authentic Outbound Link */}
              <div className="pt-4 mt-4 border-t border-slate-800">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-bridge-teal text-slate-200 hover:text-slate-950 text-xs font-bold border border-slate-700 hover:border-bridge-teal shadow-sm transition-all duration-200"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
