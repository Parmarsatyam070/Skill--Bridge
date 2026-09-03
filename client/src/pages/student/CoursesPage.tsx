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
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', studentProfileId],
    queryFn: () => api.get<{ courses: any[] }>(`/courses?studentId=${studentProfileId}`),
    enabled: !!studentProfileId,
  });

  // 2. Fetch Course Providers
  const { data: providersData } = useQuery({
    queryKey: ['courseProviders'],
    queryFn: () => api.get<{ providers: any[] }>('/courses/providers'),
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
      c.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-console-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
            Accredited Partner Catalog
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Accredited Learning & Skill Remediation
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-console-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search courses or skills..."
              className="bg-console-panel-raised border border-console-border rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-console-text placeholder:text-console-text-muted focus:outline-none focus:border-bridge-teal"
            />
          </div>

          <select
            value={selectedProvider}
            onChange={e => setSelectedProvider(e.target.value)}
            className="bg-console-panel-raised border border-console-border rounded-xl px-3 py-1.5 text-xs font-semibold text-console-text focus:outline-none focus:border-bridge-teal font-mono"
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
        <div className="p-4 rounded-2xl bg-status-green/15 border border-status-green/30 text-status-green flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-medium">{completedNotice}</div>
        </div>
      )}

      {/* Honest Partner Explanation Callout */}
      <div className="p-4 rounded-2xl bg-console-panel-raised border border-console-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-bridge-teal flex-shrink-0" />
          <p className="text-console-text-muted leading-relaxed">
            Courses are seeded from our accredited learning partners (<span className="text-console-text font-semibold">NPTEL, SWAYAM, HCL TechBee, Coursera, upGrad</span>). Enrolling opens their official course portal. Completing courses immediately recalculates your SkillBridge radar.
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm hover:border-console-text-muted transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-campus-blue/20 text-[#8cb4e6] border border-campus-blue/30">
                    {course.provider.name}
                  </span>
                  <span className="text-[11px] font-mono text-console-text-muted">
                    {course.duration} • {course.level}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-console-text leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-console-text-muted line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Skills Covered & Point Gain Badges */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-console-text-muted block">
                    Skill Points Acceleration:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {course.skillsCovered.map((sc: any) => (
                      <span
                        key={sc.skillId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-console-panel-raised border border-console-border text-bridge-teal"
                      >
                        <span className="text-console-text">{sc.skillName}</span>
                        <span className="font-bold text-status-green">+{sc.pointsGain}pts</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-console-border flex items-center justify-between gap-3">
                {course.completed ? (
                  <div className="flex items-center gap-1.5 text-status-green font-mono text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed & Calibrated</span>
                  </div>
                ) : course.enrolled ? (
                  <div className="flex items-center gap-2 w-full">
                    <a
                      href={course.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-console-panel-raised border border-console-border text-console-text hover:border-bridge-teal text-xs font-semibold transition-colors"
                    >
                      <span>Partner Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => completeMutation.mutate(course.enrollmentId)}
                      disabled={completeMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-status-green hover:bg-status-green/90 text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white text-xs font-semibold shadow-sm transition-all"
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
