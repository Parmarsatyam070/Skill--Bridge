import React from 'react';
import type { IndustryAssessmentAnalyticsDto } from '@shared/types';
import { Award, CheckCircle2, TrendingUp, Users } from 'lucide-react';

interface AssessmentAnalyticsCardProps {
  data: IndustryAssessmentAnalyticsDto;
}

export const AssessmentAnalyticsCard: React.FC<AssessmentAnalyticsCardProps> = ({ data }) => {
  if (!data || data.assessmentsCreated === 0) {
    return (
      <div className="p-8 text-center text-sm border rounded-xl" style={{ borderColor: '#2A2E38', background: '#111318', color: '#8B90A0' }}>
        No assessments created by this company yet. Deploy pre-hire talent assessments to measure candidate skills.
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border space-y-5" style={{ background: '#111318', borderColor: '#2A2E38' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#F4F5F7' }}>
            Talent Assessment Analytics
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#8B90A0' }}>
            Evaluation throughput and benchmark pass rates
          </p>
        </div>
        <Award className="w-5 h-5" style={{ color: '#2F8C82' }} />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Assessments
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#F4F5F7' }}>
            {data.assessmentsCreated}
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Total Submissions
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#F4F5F7' }}>
            {data.totalSubmissions}
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Average Score
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#2F8C82' }}>
            {data.averageScore}%
          </span>
        </div>

        <div className="p-3 rounded-lg border bg-white/[0.02]" style={{ borderColor: '#2A2E38' }}>
          <span className="text-[11px] block font-medium" style={{ color: '#8B90A0' }}>
            Pass Rate
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: '#4CC38A' }}>
            {data.passRate}%
          </span>
        </div>
      </div>

      {/* Assessment Breakdown */}
      {data.assessments.length > 0 && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#2A2E38' }}>
          <span className="text-xs font-semibold block" style={{ color: '#8B90A0' }}>
            Assessment Breakdown
          </span>
          <div className="divide-y" style={{ borderColor: '#2A2E38' }}>
            {data.assessments.map(a => (
              <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-sm block" style={{ color: '#F4F5F7' }}>
                    {a.title}
                  </span>
                  <span className="text-[11px]" style={{ color: '#8B90A0' }}>
                    {a.submissionsCount} submissions • {a.passedCount} passed
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-semibold block" style={{ color: '#2F8C82' }}>
                    {a.averageScore}% avg
                  </span>
                  <span className="text-[11px]" style={{ color: '#4CC38A' }}>
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
