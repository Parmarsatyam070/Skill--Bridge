import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { PersonalizedRoadmapDto } from '@shared/types';

interface AcademicRoadmapWidgetProps {
  roadmaps: PersonalizedRoadmapDto[];
}

export const AcademicRoadmapWidget: React.FC<AcademicRoadmapWidgetProps> = ({ roadmaps }) => {
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  if (!roadmaps || roadmaps.length === 0) {
    return (
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm">No weak domain subjects detected. Personalized roadmaps will appear here when domain skill gaps are analyzed.</p>
      </div>
    );
  }

  const activeRoadmap = roadmaps[selectedSubjectIdx] || roadmaps[0];

  const stagesList = [
    { key: 'foundation', data: activeRoadmap.stages.foundation, icon: Layers, badge: 'Stage 1' },
    { key: 'conceptBuilding', data: activeRoadmap.stages.conceptBuilding, icon: BookOpen, badge: 'Stage 2' },
    { key: 'guidedPractice', data: activeRoadmap.stages.guidedPractice, icon: ChevronRight, badge: 'Stage 3' },
    { key: 'advancedPractice', data: activeRoadmap.stages.advancedPractice, icon: Flame, badge: 'Stage 4' },
    { key: 'assessment', data: activeRoadmap.stages.assessment, icon: Award, badge: 'Stage 5' },
    { key: 'mastery', data: activeRoadmap.stages.mastery, icon: Sparkles, badge: 'Stage 6' },
  ];

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Calculate overall roadmap progress
  let totalTasks = 0;
  let finishedTasks = 0;
  stagesList.forEach(s => {
    s.data.actionableTasks.forEach((_, idx) => {
      totalTasks++;
      if (completedTasks[`${activeRoadmap.normalizedSubject}-${s.key}-${idx}`]) {
        finishedTasks++;
      }
    });
  });
  const progressPercent = totalTasks > 0 ? Math.round((finishedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 relative overflow-hidden shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Personalized 6-Stage Improvement Roadmap
            </h3>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
              Dynamic Stages
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structured step-by-step master plan targeting your specific domain weaknesses with actionable checkpoints.
          </p>
        </div>

        {/* Priority Subject Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {roadmaps.map((r, idx) => (
            <button
              key={r.normalizedSubject}
              onClick={() => setSelectedSubjectIdx(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedSubjectIdx === idx
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                  : 'bg-[#0f172a] text-slate-400 hover:text-white border border-[#1e293b] hover:border-slate-600'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <span>{r.subject}</span>
              <span className="text-[10px] opacity-80">({r.currentPerformance}%)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Target Milestone Banner */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
            #{selectedSubjectIdx + 1}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{activeRoadmap.subject}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Current Score: <strong className="text-rose-400">{activeRoadmap.currentPerformance}%</strong></span>
              <span>&rarr;</span>
              <span>Target Benchmark: <strong className="text-emerald-400">{activeRoadmap.targetPerformance}%</strong></span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Roadmap Completion</span>
            <span className="text-cyan-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6 Realistic Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stagesList.map((stage, sIdx) => {
          const Icon = stage.icon;
          const stageTasks = stage.data.actionableTasks || [];
          const isAllDone = stageTasks.length > 0 && stageTasks.every((_, tIdx) =>
            completedTasks[`${activeRoadmap.normalizedSubject}-${stage.key}-${tIdx}`]
          );

          return (
            <div
              key={stage.key}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                isAllDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-[#0f172a] border-[#1e293b] hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    {stage.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    ~{stage.data.estimatedHours}h study
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <h4 className="text-xs font-semibold text-white">{stage.data.title}</h4>
                </div>

                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  {stage.data.description}
                </p>

                {/* Topics Tag List */}
                {stage.data.topics && stage.data.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {stage.data.topics.map(t => (
                      <span
                        key={t}
                        className="bg-[#131f37] text-slate-300 text-[9px] px-1.5 py-0.5 rounded border border-[#1e293b]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Interactive Actionable Tasks */}
                <div className="space-y-2 mt-2 pt-2 border-t border-[#1e293b]">
                  {stageTasks.map((task, tIdx) => {
                    const taskKey = `${activeRoadmap.normalizedSubject}-${stage.key}-${tIdx}`;
                    const isChecked = Boolean(completedTasks[taskKey]);

                    return (
                      <div
                        key={taskKey}
                        onClick={() => toggleTask(taskKey)}
                        className="flex items-start gap-2 cursor-pointer group select-none text-[11px]"
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                        )}
                        <span
                          className={`transition-colors leading-tight ${
                            isChecked ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-white'
                          }`}
                        >
                          {task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
