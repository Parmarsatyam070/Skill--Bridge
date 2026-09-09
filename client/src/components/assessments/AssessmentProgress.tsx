import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface AssessmentProgressProps {
  totalQuestions: number;
  currentIndex: number;
  questionIds: string[];
  answers: Record<string, any>;
  onSelectQuestion: (index: number) => void;
  className?: string;
}

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  totalQuestions,
  currentIndex,
  questionIds,
  answers,
  onSelectQuestion,
  className = '',
}) => {
  const answeredCount = questionIds.filter(id => {
    const val = answers[id];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const unansweredCount = totalQuestions - answeredCount;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className={`bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 ${className}`}>
      {/* Progress Stats */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-white">Question Palette</span>
        <span className="text-xs font-mono text-blue-400 font-semibold">{progressPct}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#0f172a] rounded-full overflow-hidden mb-4 border border-[#1e293b]">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Answered / Unanswered counters */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{answeredCount} Answered</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Circle className="w-3.5 h-3.5" />
          <span>{unansweredCount} Unanswered</span>
        </div>
      </div>

      {/* Question Number Palette Buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
        {questionIds.map((qid, idx) => {
          const isCurrent = idx === currentIndex;
          const val = answers[qid];
          const isAnswered =
            val !== undefined &&
            val !== null &&
            (typeof val === 'string' ? val.trim() !== '' : Array.isArray(val) ? val.length > 0 : true);

          return (
            <button
              key={qid}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              aria-label={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}${
                isCurrent ? ', Currently selected' : ''
              }`}
              className={`h-9 rounded-xl font-mono text-xs font-semibold transition-all flex items-center justify-center border ${
                isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-500/50 text-white bg-[#0f172a]'
                  : isAnswered
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                  : 'bg-[#0f172a] border-[#1e293b] text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
