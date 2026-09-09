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
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 space-y-3 shadow-md">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">
          Interview Progression
        </span>
        <span className="font-mono text-blue-400 font-medium">
          {answeredCount} of {totalQuestions} answered ({percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#0f172a] border border-[#1e293b] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-out rounded-full"
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
                    ? 'bg-blue-500 text-white font-bold shadow-xs shadow-blue-500/30'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400/50 font-bold scale-110'
                    : 'bg-[#0f172a] text-slate-500 border border-[#1e293b]'
                }`}
              >
                {isAnswered ? <Check className="w-3 h-3 stroke-[3]" /> : qNum}
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                Q{qNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
