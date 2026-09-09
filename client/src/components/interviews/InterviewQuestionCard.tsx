import React from 'react';
import { HelpCircle, BrainCircuit, Target, Award } from 'lucide-react';
import { InterviewQuestionItem } from '@shared/types';

interface InterviewQuestionCardProps {
  question: InterviewQuestionItem;
  totalQuestions: number;
}

export const InterviewQuestionCard: React.FC<InterviewQuestionCardProps> = ({
  question,
  totalQuestions,
}) => {
  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'ADVANCED':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'INTERMEDIATE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'BEGINNER':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'SYSTEM_DESIGN':
        return { label: 'System Design', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'BEHAVIORAL':
        return { label: 'Behavioral & STAR', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'PROBLEM_SOLVING':
        return { label: 'Problem Solving', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'EXPERIENCE':
        return { label: 'Past Experience', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'TECHNICAL':
      default:
        return { label: 'Technical Core', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
    }
  };

  const catMeta = getCategoryBadge(question.category);

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
            {question.questionNumber}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Question {question.questionNumber} of {totalQuestions}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${catMeta.color}`}>
            {catMeta.label}
          </span>

          {/* Difficulty */}
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${getDifficultyBadgeColor(question.difficulty)}`}>
            {question.difficulty}
          </span>

          {/* Target Skill */}
          {question.targetSkill && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#0f172a] text-slate-300 border border-[#1e293b]">
              <Target className="w-3 h-3 text-blue-400" />
              {question.targetSkill}
            </span>
          )}
        </div>
      </div>

      {/* Main Question Text */}
      <div className="space-y-3">
        <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug tracking-tight">
          {question.question}
        </h3>
        {question.context && (
          <p className="text-xs text-slate-400 italic">
            Objective: {question.context}
          </p>
        )}
      </div>

      {/* Tips Callout */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-xs text-slate-400">
        <BrainCircuit className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Take a moment to formulate your thoughts. Structure your answer with clear rationale, technical trade-offs, or concrete examples.
        </span>
      </div>
    </div>
  );
};
