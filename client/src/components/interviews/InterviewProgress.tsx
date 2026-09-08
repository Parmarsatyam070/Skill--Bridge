import React from 'react';
import { Check } from 'lucide-react';

interface InterviewProgressProps {
  currentQuestionNumber: number;
  totalQuestions: number;
  answeredCount: number;
}

export const InterviewProgress: React.FC<InterviewProgressProps> = ({
  currentQuestionNumber,
  totalQuestions,
  answeredCount,
}) => {
  const percentage = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="bg-[#111318] border border-[#2A2E38] rounded-xl p-4 space-y-3 shadow-md">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-zinc-300">
          Interview Progression
        </span>
        <span className="font-mono text-[#2F8C82] font-medium">
          {answeredCount} of {totalQuestions} answered ({percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#1A1D24] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2F8C82] to-[#4CC38A] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stepper Dots */}
      <div className="flex items-center justify-between pt-1">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qNum => {
          const isAnswered = qNum <= answeredCount;
          const isCurrent = qNum === currentQuestionNumber;

          return (
            <div key={qNum} className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-medium transition-all duration-200 ${
                  isAnswered
                    ? 'bg-[#4CC38A] text-zinc-950 font-bold'
                    : isCurrent
                    ? 'bg-[#2F8C82] text-white ring-2 ring-[#2F8C82]/40 font-bold scale-110'
                    : 'bg-[#1A1D24] text-zinc-500 border border-[#2A2E38]'
                }`}
              >
                {isAnswered ? <Check className="w-3 h-3 stroke-[3]" /> : qNum}
              </div>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Q{qNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
