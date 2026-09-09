import React from 'react';
import type { IndustryAssessmentAnalyticsDto } from '@shared/types';
import { Award, CheckCircle2, TrendingUp, Users } from 'lucide-react';

interface AssessmentAnalyticsCardProps {
  data: IndustryAssessmentAnalyticsDto;
}

export const AssessmentAnalyticsCard: React.FC<AssessmentAnalyticsCardProps> = ({ data }) => {
  if (!data || data.assessmentsCreated === 0) {
    return (
      <div className="p-8 text-center text-sm border border-[#1e293b] rounded-xl bg-[#0b1329] text-slate-400">
        No assessments created by this company yet. Deploy pre-hire talent assessments to measure candidate skills.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] space-y-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Talent Assessment Analytics
          </h3>
          <p className="text-xs mt-0.5 text-slate-400">
            Evaluation throughput and benchmark pass rates
          </p>
        </div>
        <Award className="w-5 h-5 text-blue-400" />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Assessments
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {data.assessmentsCreated}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Total Submissions
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {data.totalSubmissions}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Average Score
          </span>
          <span className="text-xl font-bold font-mono text-blue-400">
            {data.averageScore}%
          </span>
        </div>

        <div className="p-3 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          <span className="text-[11px] block font-medium text-slate-400">
            Pass Rate
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {data.passRate}%
          </span>
        </div>
      </div>

      {/* Assessment Breakdown */}
      {data.assessments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#1e293b]">
          <span className="text-xs font-semibold block text-slate-400">
            Assessment Breakdown
          </span>
          <div className="divide-y divide-[#1e293b]">
            {data.assessments.map(a => (
              <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-sm block text-white">
                    {a.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {a.submissionsCount} submissions • {a.passedCount} passed
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-semibold block text-blue-400">
                    {a.averageScore}% avg
                  </span>
                  <span className="text-[11px] text-emerald-400">
                    {a.passRate}% pass
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
