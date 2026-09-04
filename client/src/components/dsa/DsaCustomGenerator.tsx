import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DSAPlatform, DSADifficulty, DSACustomSetRequest, PracticeSetData } from '@shared/types';

interface DsaCustomGeneratorProps {
  onGenerateSet: (set: PracticeSetData) => void;
}

const ALLOWED_COUNTS: (15 | 20 | 25 | 30)[] = [15, 20, 25, 30];
const DIFFICULTIES: ('All' | 'Easy' | 'Medium' | 'Hard')[] = ['All', 'Easy', 'Medium', 'Hard'];
const PLATFORMS: ('All' | DSAPlatform)[] = ['All', 'LeetCode', 'GeeksforGeeks', 'CSES', 'Codeforces'];

export const DsaCustomGenerator: React.FC<DsaCustomGeneratorProps> = ({ onGenerateSet }) => {
  const [questionCount, setQuestionCount] = useState<15 | 20 | 25 | 30>(15);
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [platform, setPlatform] = useState<'All' | DSAPlatform>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [includeWeakTopics, setIncludeWeakTopics] = useState<boolean>(true);
  const [filterUnseenOnly, setFilterUnseenOnly] = useState<boolean>(false);

  // Fetch available topics list from backend
  const { data: topicsData } = useQuery<{ topics: string[] }>({
    queryKey: ['dsaTopics'],
    queryFn: () => api.get<{ topics: string[] }>('/dsa/topics'),
  });

  const availableTopics = topicsData?.topics || [];

  const generateMutation = useMutation({
    mutationFn: (payload: DSACustomSetRequest) =>
      api.post<{ practiceSet: PracticeSetData }>('/dsa/practice/generate', payload),
    onSuccess: (res) => {
      onGenerateSet(res.practiceSet);
    },
    onError: (err: any) => {
      alert(`Could not generate custom practice set: ${err.message || 'Unknown error'}`);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      questionCount,
      difficulty,
      platform,
      topic: selectedTopic !== 'All' ? selectedTopic : undefined,
      includeWeakTopics,
      filterUnseenOnly,
    });
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bridge-teal/20 border border-bridge-teal/40 flex items-center justify-center text-bridge-teal">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-white">
              Custom DSA Practice Set Generator
            </h3>
            <p className="text-xs text-slate-400">
              Balanced, multi-platform problem rotation algorithm • Strictly 15–30 authentic problems
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-850 border border-slate-750 text-slate-300 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-bridge-teal" />
          Anti-Duplicate Rotation Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Strictly Enforced Question Count */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Set Size (Strict Rule)</span>
            <span className="text-[10px] text-bridge-teal font-normal">15–30 Qs</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {ALLOWED_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                  questionCount === count
                    ? 'bg-bridge-teal text-slate-950 shadow-md shadow-bridge-teal/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Difficulty */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
            Target Difficulty
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  difficulty === diff
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Platform */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
            Target Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-bridge-teal"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Platforms (LeetCode, GFG, CSES, Codeforces)' : p}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Topic */}
        <div className="space-y-2">
          <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
            DSA Topic
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-bridge-teal"
          >
            <option value="All">All Topics (Balanced Rotation)</option>
            {availableTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles & Generate Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={includeWeakTopics}
              onChange={(e) => setIncludeWeakTopics(e.target.checked)}
              className="w-4 h-4 rounded border-slate-750 bg-slate-800 text-bridge-teal focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              Prioritize my weak topic areas
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={filterUnseenOnly}
              onChange={(e) => setFilterUnseenOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-750 bg-slate-800 text-bridge-teal focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Filter unseen questions only</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-bridge-teal to-emerald-500 hover:from-bridge-teal/90 hover:to-emerald-450 text-slate-950 text-xs font-bold shadow-lg shadow-bridge-teal/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {generateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Set...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate {questionCount}-Question Set</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
