import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ExternalLink,
  Code2,
  CheckCircle2,
  Clock,
  Circle,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Tag,
  BookOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DSAQuestionData, DSAPlatform, DSADifficulty, DSAAttemptStatus } from '@shared/types';

interface DsaProblemExplorerProps {
  onPracticeQuestion: (question: DSAQuestionData) => void;
}

export const DsaProblemExplorer: React.FC<DsaProblemExplorerProps> = ({ onPracticeQuestion }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch all questions from backend
  const { data, isLoading } = useQuery<{ questions: DSAQuestionData[]; total: number }>({
    queryKey: ['dsaQuestions', selectedPlatform, selectedDifficulty, selectedTopic, selectedStatus, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedPlatform !== 'All') params.append('platform', selectedPlatform);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      if (selectedTopic !== 'All') params.append('topic', selectedTopic);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '400');

      return api.get<{ questions: DSAQuestionData[]; total: number }>(`/dsa/questions?${params.toString()}`);
    },
  });

  const { data: topicsData } = useQuery<{ topics: string[] }>({
    queryKey: ['dsaTopics'],
    queryFn: () => api.get<{ topics: string[] }>('/dsa/topics'),
  });

  const allQuestions = data?.questions || [];
  const topics = topicsData?.topics || [];

  // Client-side pagination for smooth performance
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allQuestions.slice(start, start + itemsPerPage);
  }, [allQuestions, currentPage]);

  const totalPages = Math.ceil(allQuestions.length / itemsPerPage);

  const getPlatformBadge = (platform: DSAPlatform) => {
    switch (platform) {
      case 'LeetCode':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            LeetCode
          </span>
        );
      case 'GeeksforGeeks':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            GeeksforGeeks
          </span>
        );
      case 'CSES':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            CSES
          </span>
        );
      case 'Codeforces':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Codeforces
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {platform}
          </span>
        );
    }
  };

  const getDifficultyBadge = (diff: DSADifficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Hard
          </span>
        );
    }
  };

  const getStatusBadge = (status?: DSAAttemptStatus) => {
    switch (status) {
      case 'SOLVED':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Solved</span>
          </span>
        );
      case 'FAILED':
      case 'ATTEMPTED':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Attempted</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Circle className="w-3.5 h-3.5" />
            <span>Unattempted</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-serif text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-bridge-teal" />
            <span>DSA Problem Explorer</span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              ({allQuestions.length} Problems)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter, practice in sandbox, or jump directly to authentic external platforms
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search title, tag, topic..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-bridge-teal"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Platform filter */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Platform</label>
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-bridge-teal"
          >
            <option value="All">All Platforms</option>
            <option value="LeetCode">LeetCode</option>
            <option value="GeeksforGeeks">GeeksforGeeks</option>
            <option value="CSES">CSES</option>
            <option value="Codeforces">Codeforces</option>
          </select>
        </div>

        {/* Difficulty filter */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Difficulty</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-bridge-teal"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Topic filter */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Topic</label>
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-bridge-teal"
          >
            <option value="All">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-bridge-teal"
          >
            <option value="All">All Statuses</option>
            <option value="SOLVED">Solved</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="UNSEEN">Unattempted</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading problem repository...</p>
        </div>
      ) : allQuestions.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-850/60 border border-slate-800 space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No problems found matching your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedPlatform('All');
              setSelectedDifficulty('All');
              setSelectedTopic('All');
              setSelectedStatus('All');
            }}
            className="text-xs text-bridge-teal hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-850/40 overflow-hidden">
            {paginatedQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                {/* Left: Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(q.userAttemptStatus)}
                    {getDifficultyBadge(q.difficulty)}
                    {getPlatformBadge(q.platform)}
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-750">
                      {q.topic}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ~{q.estimatedMinutes}m
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white hover:text-bridge-teal transition-colors">
                    {q.title}
                  </h4>

                  {/* Tags */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {q.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onPracticeQuestion(q)}
                    className="px-3.5 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Practice Here</span>
                  </button>

                  <a
                    href={q.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    title={`Open on ${q.platform}`}
                  >
                    <span>{q.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-xs font-mono text-slate-400">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, allQuestions.length)} of {allQuestions.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
