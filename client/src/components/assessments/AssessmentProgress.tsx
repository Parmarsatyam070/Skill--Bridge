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
    <div className={`bg-[#111318] border border-[#2A2E38] rounded-2xl p-4 ${className}`}>
      {/* Progress Stats */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#F4F5F7]">Question Palette</span>
        <span className="text-xs font-mono text-[#2F8C82] font-semibold">{progressPct}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#1A1D24] rounded-full overflow-hidden mb-4 border border-[#2A2E38]">
        <div
          className="h-full bg-gradient-to-r from-[#2F8C82] to-[#4CC38A] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Answered / Unanswered counters */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-[#4CC38A]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{answeredCount} Answered</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#8B90A0]">
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
                  ? 'border-[#2F8C82] ring-2 ring-[#2F8C82]/50 text-white bg-[#1A1D24]'
                  : isAnswered
                  ? 'bg-[#2F8C82]/20 border-[#2F8C82]/40 text-[#4CC38A] hover:bg-[#2F8C82]/30'
                  : 'bg-[#1A1D24] border-[#2A2E38] text-[#8B90A0] hover:border-[#8B90A0]/50 hover:text-[#F4F5F7]'
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
