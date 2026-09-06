import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Award,
  Filter,
  Search,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const studentProfileId = user?.studentProfile?.id;

  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  // 1. Fetch Courses with enrollment states
  const { data: coursesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courses', studentProfileId],
    queryFn: () => api.get<{ courses: any[] }>(studentProfileId ? `/courses?studentId=${studentProfileId}` : '/courses'),
    retry: 2,
    staleTime: 60 * 1000,
  });

  // 2. Fetch Course Providers
  const { data: providersData } = useQuery({
    queryKey: ['courseProviders'],
    queryFn: () => api.get<{ providers: any[] }>('/courses/providers'),
    staleTime: 5 * 60 * 1000,
  });

  // Enroll Mutation (Records enrollment and opens partner link)
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) =>
      api.post('/courses/enroll', { studentId: studentProfileId, courseId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      // Open external partner course page
      if (res.externalUrl) {
        window.open(res.externalUrl, '_blank', 'noopener,noreferrer');
      }
    },
  });

  // Complete Mutation (Bumps skills in DB and invalidates match queries)
  const completeMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.post(`/courses/enrollments/${enrollmentId}/complete`),
    onSuccess: (res) => {
      const skillsGained = res.result?.updatedSkills?.map((s: any) => `+${s.pointsGained}pts to ${s.skillId.replace('skill-', '').toUpperCase()}`).join(', ');
      setCompletedNotice(`Course completion verified! Gained: ${skillsGained}. Match scores recalculated.`);
      // CRITICAL: Invalidate match queries so all match % badges in UI update immediately!
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentMatches'] });
      setTimeout(() => setCompletedNotice(null), 5000);
    },
  });

  const courses = coursesData?.courses || [];
  const providers = providersData?.providers || [];

  const filteredCourses = courses.filter(c => {
    const matchesProvider = selectedProvider === 'all' || c.providerId === selectedProvider;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.provider?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-bridge-border">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-bridge-teal uppercase font-semibold block mb-1">
            [● ACCREDITED PARTNER CATALOG]
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-bridge-text tracking-tight">
            Accredited Learning & Skill Remediation
          </h1>
          <p className="text-xs text-bridge-text-muted mt-1">
            Official partner courses calibrated to close specific skill gap thresholds with verified proof.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-bridge-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search courses or skills..."
              className="bg-bridge-panel-raised border border-bridge-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-bridge-text placeholder:text-bridge-text-muted focus:outline-none focus:border-bridge-teal"
            />
          </div>

          <select
            value={selectedProvider}
            onChange={e => setSelectedProvider(e.target.value)}
            className="bg-bridge-panel-raised border border-bridge-border rounded-xl px-3 py-1.5 text-xs font-semibold text-bridge-text focus:outline-none focus:border-bridge-teal font-mono"
          >
            <option value="all">All Content Partners</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Completion Toast Banner */}
      {completedNotice && (
        <div className="p-4 rounded-2xl bg-signal-green/10 border border-signal-green/30 text-signal-green flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-mono font-medium">{completedNotice}</div>
        </div>
      )}

      {/* Course Catalog Content */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-bridge-panel border border-signal-red/30 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-signal-red/10 border border-signal-red/20 text-signal-red flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-bridge-text">Unable to Load Course Catalog</h3>
            <p className="text-xs text-bridge-text-muted">
              {error?.message || 'A network error occurred while connecting to the course directory.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            Retry Catalog Query
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-bridge-panel border border-bridge-border rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-bridge-text-muted mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-bridge-text">No Matching Courses Found</h3>
            <p className="text-xs text-bridge-text-muted max-w-sm mx-auto">
              {courses.length === 0
                ? 'No accredited partner courses were found in the catalog. The database may need to be refreshed.'
                : 'No accredited courses matched your current filter or search criteria.'}
            </p>
          </div>
          {courses.length === 0 && (
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white font-semibold text-xs transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-bridge-panel border border-bridge-border rounded-2xl p-5 sm:p-6 hover:border-bridge-teal/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-bridge-panel-raised text-bridge-teal border border-bridge-border uppercase tracking-wider">
                    {course.provider.name}
                  </span>
                  <span className="text-[11px] font-mono text-bridge-text-muted">
                    {course.duration} • {course.level}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-bridge-text leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-bridge-text-muted line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Skills Covered & Point Gain Badges */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-bridge-text-muted block">
                    Skill Points Acceleration:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {course.skillsCovered.map((sc: any) => (
                      <span
                        key={sc.skillId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-bridge-panel-raised border border-bridge-border text-bridge-teal"
                      >
                        <span className="text-bridge-text">{sc.skillName}</span>
                        <span className="font-bold text-signal-green">+{sc.pointsGain}pts</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-bridge-border flex items-center justify-between gap-3">
                {course.completed ? (
                  <div className="flex items-center gap-1.5 text-signal-green font-mono text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>COMPLETED & CALIBRATED</span>
                  </div>
                ) : course.enrolled ? (
                  <div className="flex items-center gap-2 w-full">
                    <a
                      href={course.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-bridge-panel-raised border border-bridge-border text-bridge-text hover:border-bridge-teal text-xs font-semibold transition-colors"
                    >
                      <span>Partner Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => completeMutation.mutate(course.enrollmentId)}
                      disabled={completeMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-signal-green hover:bg-signal-green/90 text-bridge-void text-xs font-semibold transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal-hover text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Enroll on Partner Site →</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
