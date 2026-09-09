import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PracticeQuestionItemDto, PracticeResultDto } from '@shared/types';

interface AcademicPracticeRunnerProps {
  initialSubject?: string;
  availableSubjects?: string[];
}

export const AcademicPracticeRunner: React.FC<AcademicPracticeRunnerProps> = ({
  initialSubject = 'Data Structures',
  availableSubjects = ['Data Structures', 'Database Management Systems', 'Operating Systems', 'Computer Networks'],
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [practiceResult, setPracticeResult] = useState<PracticeResultDto | null>(null);

  // Synchronize when initialSubject changes
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
      setPracticeResult(null);
      setSelectedAnswers({});
    }
  }, [initialSubject]);

  // Fetch catalog of subjects & topics
  const { data: subjectsCatalog } = useQuery({
    queryKey: ['practiceSubjectsCatalog'],
    queryFn: () => api.get<{ subjects: { subject: string; topics: { topic: string; questionCount: number }[] }[] }>('/academic-performance/practice/subjects'),
  });

  // Fetch questions for active selection
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['practiceQuestions', selectedSubject, selectedTopic],
    queryFn: () => api.get<{ questions: PracticeQuestionItemDto[] }>(`/academic-performance/practice/questions?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(selectedTopic)}`),
    enabled: !!selectedSubject,
  });

  const questions = questionsData?.questions || [];

  // Mutation to submit answers and get score
  const submitMutation = useMutation({
    mutationFn: (answers: { questionId: string; selectedAnswer: string | number }[]) =>
      api.post<{ result: PracticeResultDto }>('/academic-performance/practice/submit', {
        subject: selectedSubject,
        topic: selectedTopic === 'all' ? 'Comprehensive' : selectedTopic,
        answers,
      }),
    onSuccess: (data) => {
      setPracticeResult(data.result);
    },
  });

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (practiceResult) return; // Prevent changing after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = () => {
    const payload = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));
    submitMutation.mutate(payload);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setPracticeResult(null);
    setShowHint({});
  };

  const activeSubjectData = subjectsCatalog?.subjects.find(
    s => s.subject.toLowerCase() === selectedSubject.toLowerCase()
  );

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Interactive Domain Practice Sets
            </h3>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
              Topic-Wise Sets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            MCQs, conceptual diagnostics, and problem-solving questions to remediate identified weak areas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic('all');
              handleReset();
            }}
            aria-label="Select Subject for Practice"
            className="bg-[#0f172a] border border-[#1e293b] text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {activeSubjectData && activeSubjectData.topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                handleReset();
              }}
              aria-label="Select Topic for Practice"
              className="bg-[#0f172a] border border-[#1e293b] text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">All Topics (Mixed Diagnostic)</option>
              {activeSubjectData.topics.map(t => (
                <option key={t.topic} value={t.topic}>{t.topic} ({t.questionCount} Qs)</option>
              ))}
            </select>
          )}

          {practiceResult && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 text-xs rounded-xl border border-[#1e293b] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Retake Set
            </button>
          )}
        </div>
      </div>

      {/* Result Diagnostics Card (Shown upon submission) */}
      {practiceResult && (
        <div className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                  practiceResult.passed
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                }`}
              >
                {practiceResult.percentage}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-white">
                    {practiceResult.passed ? 'Benchmark Passed' : 'Target Incomplete'}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      practiceResult.passed
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    Score: {practiceResult.score} / {practiceResult.totalQuestions}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {practiceResult.passed
                    ? 'Great understanding demonstrated. Keep practicing advanced problems.'
                    : 'Focus on reviewing the detailed explanations below to close this skill gap.'}
                </p>
              </div>
            </div>

            {practiceResult.weakTopics && practiceResult.weakTopics.length > 0 && (
              <div className="text-xs bg-[#131f37] border border-[#1e293b] p-3 rounded-xl max-w-sm">
                <div className="text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Identified Weak Subtopics:
                </div>
                <div className="flex flex-wrap gap-1">
                  {practiceResult.weakTopics.map(t => (
                    <span key={t} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-2 py-0.5 rounded-md font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      {questionsLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading practice questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs bg-[#0f172a] rounded-xl border border-[#1e293b]">
          No practice questions available for this specific topic filter.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[q.id];
            const qResult = practiceResult?.questionResults.find(r => r.questionId === q.id);

            return (
              <div
                key={q.id}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] flex items-center justify-center font-bold">
                      {qIdx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-[#131f37] px-2 py-0.5 rounded border border-[#1e293b]">
                      {q.topic}
                    </span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {q.type}
                    </span>
                  </div>

                  {qResult && (
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        qResult.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {qResult.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Correct (+1)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> Incorrect (0)
                        </>
                      )}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-medium text-white mb-3 leading-relaxed">
                  {q.question}
                </h4>

                {/* Options */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      let btnStyle = 'bg-[#131f37] border-[#1e293b] text-slate-300 hover:border-slate-600';

                      if (practiceResult && qResult) {
                        const isCorrectAnswer = optIdx === qResult.correctAnswer;
                        if (isCorrectAnswer) {
                          btnStyle = 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 font-medium';
                        } else if (isSelected && !qResult.isCorrect) {
                          btnStyle = 'bg-rose-950/30 border-rose-500/50 text-rose-300';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-blue-600/30 border-blue-500 text-white shadow-md shadow-blue-500/10';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={Boolean(practiceResult)}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="w-4 h-4 rounded-full border border-slate-500/60 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Hint & Explanation Section */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-[#1e293b]/60">
                  {q.hint && !practiceResult && (
                    <div>
                      {showHint[q.id] ? (
                        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Hint: {q.hint}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowHint(prev => ({ ...prev, [q.id]: true }))}
                          className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-400" /> Show Hint
                        </button>
                      )}
                    </div>
                  )}

                  {qResult && (
                    <div className="w-full text-xs text-slate-300 bg-[#131f37] border border-[#1e293b] p-3 rounded-lg mt-1">
                      <div className="font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Conceptual Explanation:
                      </div>
                      <p className="text-slate-300 leading-relaxed">{qResult.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          {!practiceResult && questions.length > 0 && (
            <div className="flex justify-end pt-4">
              <button
                disabled={Object.keys(selectedAnswers).length === 0 || submitMutation.isPending}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Grading Answers...
                  </>
                ) : (
                  <>
                    <span>Submit & Grade Practice Set ({Object.keys(selectedAnswers).length}/{questions.length} Answered)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
