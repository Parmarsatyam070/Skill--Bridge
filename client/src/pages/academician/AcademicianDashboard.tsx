import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  BookOpen,
  Award,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const AcademicianDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['academicOps'],
    queryFn: () => api.get<{ opportunities: any[] }>('/academic-opportunities'),
  });

  const opportunities = data?.opportunities || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-console-panel-raised via-console-panel to-console-bg border border-console-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-campus-blue/20 text-[#8cb4e6] border border-campus-blue/40 text-xs font-mono font-medium">
              Academic Faculty Portal
            </span>
            <span className="text-xs font-mono text-console-text-muted">
              {user?.academicianProfile?.institution} • {user?.academicianProfile?.department}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-console-text">
            Academia–Industry Collaboration Hub
          </h1>
          <p className="text-xs text-console-text-muted max-w-xl leading-relaxed">
            Bridge higher education curricula with real-world industry demands. Explore AICTE-accredited Faculty Development Programs (FDPs), sabbatical residencies, and corporate research grants.
          </p>
        </div>

        <Link
          to="/academician/opportunities"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-campus-blue hover:bg-campus-blue/90 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Post Collaboration Proposal</span>
        </Link>
      </div>

      {/* Program Opportunities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-console-border">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-console-text-muted block">
              Active Industry Initiatives
            </span>
            <h3 className="font-serif text-lg font-bold text-console-text">
              FDPs, Research Grants & Sabbaticals
            </h3>
          </div>
          <span className="text-xs font-mono text-console-text-muted">
            {opportunities.length} Active Programs
          </span>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-campus-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map(op => {
              const typeBadge = {
                fdp: { label: 'Faculty Development Program', color: 'bg-campus-blue/20 text-[#8cb4e6] border-campus-blue/40' },
                research: { label: 'Joint Industry Research', color: 'bg-industry-amber/15 text-industry-amber border-industry-amber/30' },
                industrial_training: { label: 'Industrial Sabbatical', color: 'bg-status-green/15 text-status-green border-status-green/30' },
              }[op.type as 'fdp' | 'research' | 'industrial_training'] || { label: 'Program', color: 'bg-console-panel' };

              return (
                <div
                  key={op.id}
                  className="bg-console-panel border border-console-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-console-text-muted transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold border ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      {op.deadline && (
                        <span className="text-[11px] font-mono text-console-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {op.deadline}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif text-lg font-bold text-console-text leading-snug">
                      {op.title}
                    </h4>

                    <p className="text-xs text-console-text-muted leading-relaxed">
                      {op.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-console-border flex items-center justify-between text-xs font-mono">
                    <span className="text-console-text-muted">
                      Organized by: <span className="text-console-text font-semibold">{op.postedBy}</span>
                    </span>
                    <button className="px-3.5 py-1.5 rounded-xl bg-console-panel-raised hover:bg-console-border border border-console-border text-bridge-teal font-semibold transition-colors">
                      Register Interest →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
