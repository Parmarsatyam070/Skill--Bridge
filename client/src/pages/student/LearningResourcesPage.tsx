import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  RefreshCw,
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
  'Python',
  'TypeScript',
  'Docker',
  'Git',
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
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | LearningCategory>('all');
  const [isFreeOnly, setIsFreeOnly] = useState<boolean>(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 1. Search Query with robust unwrap
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useQuery<LearningHubSearchResponse>({
    queryKey: ['smartLearningSearch', debouncedQuery, isFreeOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) {
        params.append('query', debouncedQuery.trim());
        params.append('q', debouncedQuery.trim());
      }
      if (isFreeOnly) {
        params.append('freeOnly', 'true');
      }

      const res = await api.get<any>(`/resources/search?${params.toString()}`);
      if (res && res.categories) {
        return res;
      }
      if (res && res.data && res.data.categories) {
        return res.data;
      }
      return res;
    },
  });

  // 2. Personalized Weak Topic Recommendations
  const { data: rawPersonalizedData } = useQuery<any>({
    queryKey: ['smartPersonalizedResources', studentProfileId],
    queryFn: async () => {
      const res = await api.get<any>('/resources/personalized');
      return res && res.data ? res.data : res;
    },
  });

  // Extract resources based on active category
  const categories = searchData?.categories || (searchData as any)?.data?.categories;
  let displayedResources: SmartLearningResource[] = [];

  if (categories) {
    if (activeCategory === 'all') {
      const seen = new Set<string>();
      Object.values(categories).forEach((resList: any) => {
        if (Array.isArray(resList)) {
          resList.forEach((r: SmartLearningResource) => {
            if (!seen.has(r.id)) {
              seen.add(r.id);
              displayedResources.push(r);
            }
          });
        }
      });
      // Sort by relevance score descending
      displayedResources.sort(
        (a, b) => (b.relevanceScore || b.authorityScore) - (a.relevanceScore || a.authorityScore)
      );
    } else {
      displayedResources = (categories[activeCategory] as SmartLearningResource[]) || [];
    }
  }

  if (isFreeOnly) {
    displayedResources = displayedResources.filter((r) => r.isFree);
  }

  const personalizedWeakTopics =
    searchData?.personalizedWeakTopics || rawPersonalizedData?.personalizedWeakTopics || [];
  const personalizedList: SmartLearningResource[] =
    rawPersonalizedData?.recommendations ||
    (Array.isArray(rawPersonalizedData) ? rawPersonalizedData : []);

  const handleSuggestedClick = (topic: string) => {
    setSearchQuery(topic);
    setDebouncedQuery(topic);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveCategory('all');
    setIsFreeOnly(false);
  };

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
      case 'articles':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <FileText className="w-3 h-3" />
            Deep-Dive Article
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <Sparkles className="w-3 h-3 text-bridge-teal" />
            Recommended
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Daily Practice Mandatory Banner */}
      <DailyPracticeBanner />

      {/* Top Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="small-caps-label text-[11px] text-bridge-teal font-bold">
              [● VERIFIED KNOWLEDGE GRAPH & SMART LEARNING HUB]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-bridge-teal" />
            <span className="text-xs font-mono text-text-muted">Authoritative Technical Syllabus</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-sans">
            Universal Technical Learning Hub
          </h1>
        </div>

        <p className="text-xs text-text-muted max-w-2xl leading-relaxed font-sans">
          Search any computer science, software engineering, or technical domain. Verified official documentation, high-quality university courses, interactive sandboxes, and personalized guidance for your weak practice areas.
        </p>
      </div>

      {/* Personalized Weak Topic Recommendations Card */}
      {personalizedWeakTopics.length > 0 && personalizedList.length > 0 && (
        <div className="rounded-2xl bg-panel border border-border p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-signal-amber/15 border border-signal-amber/30 flex items-center justify-center text-signal-amber">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary font-sans flex items-center gap-2">
                  <span>Recommended for your weak practice areas</span>
                  <span className="text-xs font-mono text-signal-amber font-normal">
                    ({personalizedWeakTopics.join(', ')})
                  </span>
                </h3>
                <p className="text-xs text-text-muted font-sans">
                  Targeted learning accelerators to bridge your algorithmic and domain skill gaps
                </p>
              </div>
            </div>

            <span className="small-caps-label text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-signal-amber/15 text-signal-amber border border-signal-amber/30">
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
                className="p-4 rounded-2xl bg-panel-raised hover:bg-border border border-border hover:border-bridge-teal/40 transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {getCategoryBadge(res.category)}
                    <span className="text-[10px] font-mono text-text-muted">{res.provider}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-bridge-teal transition-colors line-clamp-2 font-sans">
                    {res.title}
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2 font-sans">
                    {res.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-2 border-t border-border">
                  <span className="text-signal-amber font-bold">{res.topicTag}</span>
                  <div className="flex items-center gap-1 group-hover:text-bridge-teal">
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
            <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedQuery(searchQuery);
                }
              }}
              placeholder="Search ANY technical topic (Dynamic Programming, React, System Design, SQL...)"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-void border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-bridge-teal transition-all shadow-inner"
              aria-label="Search technical resources"
            />
          </div>

          {/* 100% Free Only Toggle */}
          <button
            type="button"
            onClick={() => setIsFreeOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              isFreeOnly
                ? 'bg-signal-green/20 text-signal-green border-signal-green/40 shadow-md'
                : 'bg-panel text-text-muted border-border hover:text-text-primary'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isFreeOnly ? 'text-signal-green' : 'text-text-muted'}`} />
            <span>100% Free Resources Only</span>
          </button>
        </div>

        {/* Quick Suggestion Topic Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="small-caps-label text-[11px] font-mono text-text-muted uppercase font-semibold flex-shrink-0">
            SUGGESTED:
          </span>
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleSuggestedClick(topic)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                searchQuery.toLowerCase() === topic.toLowerCase()
                  ? 'bg-bridge-teal text-slate-950 font-bold shadow-md shadow-bridge-teal/20'
                  : 'bg-panel text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* 9 Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            let count = 0;
            if (categories) {
              if (tab.id === 'all') {
                const uniqueIds = new Set<string>();
                Object.values(categories).forEach((list: any) => {
                  if (Array.isArray(list)) list.forEach((r: any) => uniqueIds.add(r.id));
                });
                count = uniqueIds.size;
              } else {
                count = Array.isArray(categories[tab.id]) ? categories[tab.id].length : 0;
              }
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-bridge-teal text-slate-950 font-bold shadow-md shadow-bridge-teal/20'
                    : 'bg-panel text-text-muted hover:text-text-primary border border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {categories && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeCategory === tab.id ? 'bg-slate-900/40 text-slate-950' : 'bg-panel-raised text-text-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid / State Management */}
      {isSearchError ? (
        <div className="py-16 text-center rounded-2xl bg-panel border border-signal-red/30 space-y-4">
          <AlertCircle className="w-10 h-10 text-signal-red mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-signal-red font-sans">
            Unable to load learning resources.
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            There was an error communicating with the learning resources service. Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetchSearch()}
            className="bridge-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : isSearchLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-text-muted">Searching authoritative knowledge bases...</p>
        </div>
      ) : displayedResources.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-panel border border-border space-y-3">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-text-primary font-sans">No resources matched your query</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try searching for terms like "Dynamic Programming", "React", "System Design", "SQL", or reset your active filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-panel-raised text-xs font-semibold text-text-muted hover:text-text-primary border border-border transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedResources.map((res) => (
            <div
              key={res.id}
              className="flex flex-col justify-between rounded-2xl bg-panel border border-border hover:border-bridge-teal/40 p-5 sm:p-6 shadow-xl transition-all duration-200 group"
            >
              <div className="space-y-3.5">
                {/* Header row: Badge and Provider */}
                <div className="flex items-center justify-between gap-2">
                  {getCategoryBadge(res.category)}
                  <span className="text-xs font-bold text-text-muted bg-panel-raised px-2.5 py-0.5 rounded-lg border border-border truncate max-w-[140px]">
                    {res.provider}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-bridge-teal transition-colors leading-snug font-sans">
                    {res.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed line-clamp-3 font-sans">
                    {res.description}
                  </p>
                </div>

                {/* Topic Tags, Difficulty, Authority Score */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="small-caps-label text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-panel-raised text-text-muted border border-border">
                    #{res.topicTag}
                  </span>
                  {res.difficulty && (
                    <span className="small-caps-label text-[10px] font-mono px-2 py-0.5 rounded bg-panel-raised text-text-muted border border-border">
                      {res.difficulty}
                    </span>
                  )}
                  {res.authorityScore && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bridge-teal/10 text-bridge-teal border border-bridge-teal/30">
                      ★ {res.authorityScore}/100 Auth
                    </span>
                  )}
                  {res.isFree && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-signal-green/10 text-signal-green border border-signal-green/20">
                      100% FREE
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Authentic Outbound Link */}
              <div className="pt-4 mt-4 border-t border-border">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bridge-btn-primary w-full py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2"
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
