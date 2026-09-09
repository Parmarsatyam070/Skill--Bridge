import React from 'react';
import { TalentAssessmentQuestionDto } from '@shared/types';
import { Award, Layers, HelpCircle } from 'lucide-react';

interface AssessmentQuestionProps {
  question: TalentAssessmentQuestionDto;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: any;
  onAnswerChange: (questionId: string, answer: any) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
}) => {
  const isMultiSelect =
    question.type === 'MCQ' &&
    Array.isArray(currentAnswer); // or if multi-select is intended

  const handleOptionSelect = (optionId: string) => {
    if (isMultiSelect) {
      const currentList: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
      if (currentList.includes(optionId)) {
        onAnswerChange(question.id, currentList.filter(id => id !== optionId));
      } else {
        onAnswerChange(question.id, [...currentList, optionId]);
      }
    } else {
      onAnswerChange(question.id, optionId);
    }
  };

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 shadow-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#1e293b] mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#0f172a] text-blue-400 border border-[#1e293b]">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#0f172a] text-slate-400 border border-[#1e293b] uppercase">
            {question.type.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white px-2.5 py-1 rounded-lg bg-[#0f172a] border border-[#1e293b]">
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>{question.points} Points</span>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-line">
          {question.prompt}
        </h2>
      </div>

      {/* Answer Options */}
      {question.options && question.options.length > 0 ? (
        <div className="space-y-3" role="radiogroup" aria-label={`Options for question ${questionNumber}`}>
          {question.options.map((opt, idx) => {
            const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
            const isSelected = isMultiSelect
              ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
              : currentAnswer === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleOptionSelect(opt.id)}
                className={`w-full flex items-start gap-3.5 p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                    : 'bg-[#0f172a] border-[#1e293b] text-white hover:border-slate-600 hover:bg-[#0f172a]/80'
                }`}
              >
                {/* Option Letter Indicator */}
                <div
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-semibold flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0b1329] text-slate-400 border border-[#1e293b]'
                  }`}
                >
                  {letter}
                </div>

                {/* Option Text */}
                <span className="text-sm pt-0.5 leading-relaxed flex-1">{opt.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Short Answer / Text Input */
        <div className="space-y-2">
          <label htmlFor={`answer-${question.id}`} className="block text-xs font-medium text-slate-400">
            Enter your answer below:
          </label>
          <textarea
            id={`answer-${question.id}`}
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={e => onAnswerChange(question.id, e.target.value)}
            rows={4}
            placeholder="Type your response here..."
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
          />
          <div className="flex justify-end text-[11px] text-slate-400 font-mono">
            {(currentAnswer?.length || 0)} characters
          </div>
        </div>
      )}
    </div>
  );
};
