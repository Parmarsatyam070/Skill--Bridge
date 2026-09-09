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
      {/* Header — Academic Faculty Intelligence Portal */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="small-caps-label flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f172a] text-blue-400 border border-blue-500/30 text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Academic Faculty Portal
            </span>
            <span className="text-xs font-mono text-slate-400">
              {user?.academicianProfile?.institution || 'Accredited Institution'} • {user?.academicianProfile?.department || 'Faculty Department'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Academia–Industry Collaboration Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Bridge higher education curricula with real-world industry demands. Explore AICTE-accredited Faculty Development Programs (FDPs), sabbatical residencies, and corporate research grants.
          </p>
        </div>

        <Link
          to="/academician/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Collaboration Proposal</span>
        </Link>
      </div>

      {/* Program Opportunities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block">
              Active Industry Initiatives
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              FDPs, Research Grants & Sabbaticals
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-[#0f172a] px-2.5 py-1 rounded-md border border-[#1e293b]">
            {opportunities.length} Active Programs
          </span>
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {opportunities.map(op => {
              const typeBadge = {
                fdp: { label: 'Faculty Development Program', color: 'bg-[#0f172a] text-blue-400 border-blue-500/30' },
                research: { label: 'Joint Industry Research', color: 'bg-[#0f172a] text-[#E8A23C] border-[#E8A23C]/30' },
                industrial_training: { label: 'Industrial Sabbatical', color: 'bg-[#0f172a] text-[#4CC38A] border-[#4CC38A]/30' },
              }[op.type as 'fdp' | 'research' | 'industrial_training'] || { label: 'Program', color: 'bg-[#0f172a] text-slate-400 border-[#1e293b]' };

              return (
                <div
                  key={op.id}
                  className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold border ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      {op.deadline && (
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Deadline: {op.deadline}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {op.title}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {op.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Organized by: <span className="text-white font-semibold">{op.postedBy}</span>
                    </span>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 border border-[#1e293b] text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer text-xs">
                      <span>Register Interest</span>
                      <ArrowRight className="w-3 h-3" />
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
