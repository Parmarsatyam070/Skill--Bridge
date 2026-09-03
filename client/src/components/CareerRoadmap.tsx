import React, { useState } from 'react';
import { Flag, CheckCircle2, ChevronRight, BookOpen, Briefcase, Award, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RoadmapResponse, RoadmapMilestone } from '@shared/types';

interface CareerRoadmapProps {
  targetDomain: string;
}

export const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ targetDomain }) => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('m2');

  const { data: roadmapData, isLoading } = useQuery({
    queryKey: ['roadmapData', studentProfileId, targetDomain],
    queryFn: () => api.get<RoadmapResponse>(`/students/${studentProfileId}/roadmap?domain=${encodeURIComponent(targetDomain)}`),
    enabled: !!studentProfileId && !!targetDomain,
  });

  const milestones: RoadmapMilestone[] = roadmapData?.milestones || [];
  const current = milestones.find((m: RoadmapMilestone) => m.id === selectedMilestoneId) || milestones[1] || milestones[0];

  if (isLoading) {
    return (
      <div className="bg-console-panel border border-console-border rounded-xl p-8 shadow-sm flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="bg-console-panel border border-console-border rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-console-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-bridge-teal" />
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted">
              AI Career Path Generator
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-console-text mt-0.5">
            2-Year Career Execution Roadmap
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-bridge-teal bg-bridge-teal/15 px-3 py-1 rounded-full border border-bridge-teal/30">
            Domain: {targetDomain}
          </span>
        </div>
      </div>

      {/* Target Role & Readiness Callout */}
      {roadmapData && (
        <div className="p-4 rounded-xl bg-console-panel-raised border border-console-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-console-text-muted">
              Target Graduate Industry Role:
            </span>
            <div className="text-base font-bold text-console-text flex items-center gap-2">
              <span>{roadmapData.targetRole}</span>
              <span className="text-xs font-mono font-normal text-status-green bg-status-green/15 px-2 py-0.5 rounded border border-status-green/20">
                {roadmapData.projectedSalaryRange}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-mono text-console-text-muted block">Current Readiness:</span>
              <span className="text-sm font-bold font-mono text-bridge-teal">{roadmapData.readinessScore}%</span>
            </div>
            <div className="w-24 h-2 bg-console-bg rounded-full overflow-hidden border border-console-border">
              <div
                className="h-full bg-bridge-teal rounded-full"
                style={{ width: `${roadmapData.readinessScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Routed Infographic Path */}
      <div className="relative">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-console-border -translate-y-1/2 hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {milestones.map((m: RoadmapMilestone) => {
            const isSelected = m.id === (current?.id || m.id);
            const isCompleted = m.status === 'completed';
            const isCurrent = m.status === 'current';

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-console-panel-raised border-bridge-teal shadow-console-glow scale-[1.02]'
                    : 'bg-console-panel/80 border-console-border hover:border-console-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-medium text-console-text-muted">
                    {m.timeframe}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-status-green" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-bridge-teal shadow-[0_0_8px_#2F8C82] animate-ping" />
                  ) : (
                    <Flag className="w-3.5 h-3.5 text-console-text-muted opacity-60" />
                  )}
                </div>

                <div className="text-xs font-mono text-bridge-teal font-semibold mb-1">
                  {m.phase}
                </div>
                <div className="text-sm font-semibold text-console-text line-clamp-1 mb-1">
                  {m.title}
                </div>
                <div className="text-xs text-console-text-muted line-clamp-2 leading-relaxed">
                  {m.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Milestone Action Card */}
      {current && (
        <div className="p-5 rounded-xl bg-console-panel-raised border border-console-border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-bridge-teal/15 text-bridge-teal border border-bridge-teal/30">
                  {current.phase}: {current.timeframe}
                </span>
                <span className="text-xs font-medium text-console-text-muted">
                  {current.status === 'completed'
                    ? '✓ Completed Milestone'
                    : current.status === 'current'
                    ? '⚡ Active In-Progress Phase'
                    : '🎯 Target Phase'}
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-console-text">
                {current.title}
              </h4>
              <p className="text-xs text-console-text-muted max-w-2xl leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-medium font-sans shadow-sm transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Accredited Courses</span>
              </Link>
            </div>
          </div>

          {/* Action checklist */}
          <div className="space-y-2 pt-2 border-t border-console-border/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-console-text-muted block mb-1">
              Required Execution Items:
            </span>
            {current.actions.map((act: any, i: number) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-console-text">
                <CheckCircle2
                  className={`w-4 h-4 flex-shrink-0 ${act.isDone ? 'text-status-green' : 'text-console-border'}`}
                />
                <span className={act.isDone ? 'line-through text-console-text-muted' : ''}>{act.text}</span>
                {act.link && !act.isDone && (
                  <Link to={act.link} className="text-bridge-teal hover:underline font-mono text-[11px] ml-1">
                    Execute →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Recommended Remediation Courses (if in Phase 2) */}
          {current.recommendedCourses && current.recommendedCourses.length > 0 && (
            <div className="pt-3 border-t border-console-border/60 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-bridge-teal block">
                🎯 Curated Remediation Courses for this Domain:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.recommendedCourses.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-console-bg border border-console-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-console-text block line-clamp-1">{c.title}</span>
                      <span className="text-[10px] font-mono text-console-text-muted">
                        {c.provider} • {c.duration}
                      </span>
                    </div>
                    <Link
                      to="/courses"
                      className="px-2.5 py-1 rounded-md bg-bridge-teal/15 text-bridge-teal hover:bg-bridge-teal hover:text-white transition-colors text-[11px] font-mono font-medium flex-shrink-0"
                    >
                      Enroll +{c.pointsGain}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
