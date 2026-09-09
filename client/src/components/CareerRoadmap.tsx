import React, { useState } from 'react';
import { Flag, CheckCircle2, ChevronRight, BookOpen, Briefcase, Award, Sparkles, AlertCircle, Youtube, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RoadmapResponse, RoadmapMilestone } from '@shared/types';

interface CareerRoadmapProps {
  targetDomain: string;
  internshipId?: string;
}

export const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ targetDomain, internshipId }) => {
  const { user } = useAuth();
  const studentProfileId = user?.studentProfile?.id;
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('m2');

  const queryUrl = internshipId
    ? `/students/${studentProfileId}/roadmap?internshipId=${encodeURIComponent(internshipId)}`
    : `/students/${studentProfileId}/roadmap?domain=${encodeURIComponent(targetDomain)}`;

  const { data: roadmapData, isLoading } = useQuery({
    queryKey: ['roadmapData', studentProfileId, targetDomain, internshipId],
    queryFn: () => api.get<RoadmapResponse>(queryUrl),
    enabled: !!studentProfileId,
  });

  const milestones: RoadmapMilestone[] = roadmapData?.milestones || [];
  const current = milestones.find((m: RoadmapMilestone) => m.id === selectedMilestoneId) || milestones[1] || milestones[0];

  if (isLoading) {
    return (
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-8 shadow-sm flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              AI Career Path Generator
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-white mt-0.5">
            2-Year Career Execution Roadmap
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {roadmapData?.isRoleSpecific ? (
            <span className="text-xs font-mono text-blue-400 bg-blue-600/15 px-3 py-1 rounded-full border border-blue-500/30 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Role Scoped</span>
            </span>
          ) : (
            <span className="text-xs font-mono text-blue-400 bg-blue-600/15 px-3 py-1 rounded-full border border-blue-500/30">
              Domain: {targetDomain}
            </span>
          )}
        </div>
      </div>

      {/* Target Role & Readiness Callout */}
      {roadmapData && (
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Target Graduate Industry Role:
            </span>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{roadmapData.targetRole}</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                {roadmapData.projectedSalaryRange}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block">Current Readiness:</span>
              <span className="text-sm font-bold font-mono text-blue-400">{roadmapData.readinessScore}%</span>
            </div>
            <div className="w-24 h-2 bg-[#0b1329] rounded-full overflow-hidden border border-[#1e293b]">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                style={{ width: `${roadmapData.readinessScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sash Mock Interview Weak Areas Callout (If active role roadmap) */}
      {roadmapData?.mockInterviewWeakAreas && roadmapData.mockInterviewWeakAreas.length > 0 && (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-300 flex-shrink-0" />
            <div>
              <span className="font-bold text-purple-300">Sash Mock Interview Gaps Detected: </span>
              <span className="opacity-90">{roadmapData.mockInterviewWeakAreas.join(', ')}</span>
              <span className="text-[11px] opacity-75 block sm:inline sm:ml-1">
                — Action items prioritized in Phase 2 & 3 below.
              </span>
            </div>
          </div>
          <Link
            to="/report-card"
            className="font-mono text-[11px] text-purple-300 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <span>View Interview Feedback</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Routed Infographic Path */}
      <div className="relative">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#1e293b] -translate-y-1/2 hidden md:block" />

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
                    ? 'bg-[#0f172a] border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02] ring-1 ring-blue-500'
                    : 'bg-[#0b1329] border-[#1e293b] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {m.timeframe}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-ping" />
                  ) : (
                    <Flag className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                  )}
                </div>

                <div className="text-xs font-mono text-blue-400 font-semibold mb-1">
                  {m.phase}
                </div>
                <div className="text-sm font-semibold text-white line-clamp-1 mb-1">
                  {m.title}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {m.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Milestone Action Card */}
      {current && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-[#1e293b] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/30">
                  {current.phase}: {current.timeframe}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {current.status === 'completed'
                    ? '✓ Completed Milestone'
                    : current.status === 'current'
                    ? '⚡ Active In-Progress Phase'
                    : '🎯 Target Phase'}
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white">
                {current.title}
              </h4>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold font-sans shadow-md shadow-blue-500/20 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Accredited Courses</span>
              </Link>
            </div>
          </div>

          {/* Action checklist */}
          <div className="space-y-2 pt-2 border-t border-[#1e293b]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Required Execution Items:
            </span>
            {current.actions.map((act: any, i: number) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2
                  className={`w-4 h-4 flex-shrink-0 ${act.isDone ? 'text-emerald-400' : 'text-slate-600'}`}
                />
                <span className={act.isDone ? 'line-through text-slate-500' : ''}>{act.text}</span>
                {act.link && !act.isDone && (
                  <Link to={act.link} className="text-blue-400 hover:underline font-mono text-[11px] ml-1">
                    Execute →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Recommended Remediation Courses (if in Phase 2) */}
          {current.recommendedCourses && current.recommendedCourses.length > 0 && (
            <div className="pt-3 border-t border-[#1e293b] space-y-2">
              <span className="text-[11px] font-mono font-semibold text-blue-400 block">
                🎯 Curated Remediation Courses for this Domain:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.recommendedCourses.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-[#0b1329] border border-[#1e293b] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block line-clamp-1">{c.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {c.provider} • {c.duration}
                      </span>
                    </div>
                    <Link
                      to="/courses"
                      className="px-2.5 py-1 rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-colors text-[11px] font-mono font-medium flex-shrink-0"
                    >
                      Enroll +{c.pointsGain}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Books for this Phase */}
          {current.recommendedBooks && current.recommendedBooks.length > 0 && (
            <div className="pt-3 border-t border-[#1e293b] space-y-2">
              <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Recommended Books · {current.phase}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.recommendedBooks.map((book, i) => (
                  <a
                    key={i}
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2.5 p-3 rounded-lg bg-[#0b1329] border border-[#1e293b] hover:border-amber-500/50 transition-colors text-xs"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1 block">
                        {book.title}
                      </span>
                      {book.author && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {book.author}
                        </span>
                      )}
                      {book.whyRecommended && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2 leading-relaxed">
                          {book.whyRecommended}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Curated YouTube Channels/Playlists for this Phase */}
          {current.recommendedYoutube && current.recommendedYoutube.length > 0 && (
            <div className="pt-3 border-t border-[#1e293b] space-y-2">
              <span className="text-[11px] font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5" />
                YouTube Channels &amp; Playlists · {current.phase}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {current.recommendedYoutube.map((yt, i) => (
                  <a
                    key={i}
                    href={yt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2.5 p-3 rounded-lg bg-[#0b1329] border border-[#1e293b] hover:border-rose-500/50 transition-colors text-xs"
                  >
                    <Youtube className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1 block">
                        {yt.title}
                      </span>
                      {yt.author && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {yt.author}
                        </span>
                      )}
                      {yt.whyRecommended && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2 leading-relaxed">
                          {yt.whyRecommended}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
