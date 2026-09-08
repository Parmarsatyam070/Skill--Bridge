import React, { useState } from 'react';
import {
  useIndustryOverview,
  useIndustryFunnel,
  useIndustryOpportunityPerformance,
  useIndustrySkillDemand,
  useIndustryAssessmentAnalytics,
  useIndustryInterviewAnalytics,
  useGenerateIndustryAiSummary,
} from '../../hooks/useIndustryIntelligence';
import { IntelligenceKpiCard } from '../../components/intelligence/IntelligenceKpiCard';
import { HiringFunnelChart } from '../../components/intelligence/HiringFunnelChart';
import { SkillDemandChart } from '../../components/intelligence/SkillDemandChart';
import { SkillCoverageChart } from '../../components/intelligence/SkillCoverageChart';
import { OpportunityPerformanceTable } from '../../components/intelligence/OpportunityPerformanceTable';
import { AssessmentAnalyticsCard } from '../../components/intelligence/AssessmentAnalyticsCard';
import { InterviewAnalyticsCard } from '../../components/intelligence/InterviewAnalyticsCard';
import { IntelligenceInsightCard } from '../../components/intelligence/IntelligenceInsightCard';
import { IntelligenceEmptyState } from '../../components/intelligence/IntelligenceEmptyState';
import { IntelligenceLoadingState } from '../../components/intelligence/IntelligenceLoadingState';
import {
  Briefcase,
  Users,
  UserCheck,
  TrendingUp,
  Award,
  Bot,
  Filter,
  BarChart3,
  Layers,
} from 'lucide-react';

export const IndustryIntelligencePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | undefined>(undefined);

  const { data: overview, isLoading: isOverviewLoading } = useIndustryOverview();
  const { data: funnel, isLoading: isFunnelLoading } = useIndustryFunnel(selectedOpportunityId);
  const { data: oppPerformance, isLoading: isOppLoading } = useIndustryOpportunityPerformance({ page, limit: 10 });
  const { data: skillDemand, isLoading: isSkillLoading } = useIndustrySkillDemand();
  const { data: assessmentData, isLoading: isAssessLoading } = useIndustryAssessmentAnalytics();
  const { data: interviewData, isLoading: isInterviewLoading } = useIndustryInterviewAnalytics();

  const {
    mutate: generateAiSummary,
    data: aiInsight,
    isPending: isAiGenerating,
  } = useGenerateIndustryAiSummary();

  const isLoading = isOverviewLoading || isFunnelLoading || isOppLoading || isSkillLoading;

  if (isLoading) {
    return <IntelligenceLoadingState />;
  }

  const hasNoData = !overview || (overview.activeOpportunities === 0 && overview.totalApplications === 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: '#2A2E38' }}>
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(47, 140, 130, 0.15)', color: '#2F8C82' }}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight" style={{ color: '#F4F5F7' }}>
              Market & Recruitment Intelligence
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: '#8B90A0' }}>
            Deterministic hiring funnel analytics, candidate skill supply metrics, and advisory executive intelligence.
          </p>
        </div>

        {/* Opportunity Filter for Funnel */}
        {oppPerformance?.opportunities && oppPerformance.opportunities.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 opacity-60" style={{ color: '#8B90A0' }} />
            <select
              value={selectedOpportunityId || ''}
              onChange={e => setSelectedOpportunityId(e.target.value || undefined)}
              className="text-xs rounded-lg px-3 py-1.5 border bg-transparent font-medium focus:outline-none"
              style={{ borderColor: '#2A2E38', color: '#F4F5F7', background: '#111318' }}
            >
              <option value="">All Active Opportunities</option>
              {oppPerformance.opportunities.map(opp => (
                <option key={opp.id} value={opp.id}>
                  {opp.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hasNoData ? (
        <IntelligenceEmptyState
          icon={Briefcase}
          title="No Recruitment Activity Recorded"
          description="Create and publish opportunities in the Opportunity Hub or Post Internship section to start gathering deterministic funnel and candidate skill analytics."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <IntelligenceKpiCard
              title="Active Roles"
              value={overview?.activeOpportunities || 0}
              subtitle="Open opportunities accepting applications"
              icon={Briefcase}
              color="#2F8C82"
            />
            <IntelligenceKpiCard
              title="Applications"
              value={overview?.totalApplications || 0}
              subtitle="Total candidate submissions"
              icon={Users}
              color="#5B9BD9"
            />
            <IntelligenceKpiCard
              title="Shortlisted"
              value={overview?.shortlistedCandidates || 0}
              subtitle="Qualified candidates in review"
              icon={UserCheck}
              color="#E8A23C"
            />
            <IntelligenceKpiCard
              title="Overall Conversion"
              value={`${overview?.overallConversionRate || 0}%`}
              subtitle={`${overview?.hiredCandidates || 0} candidates hired`}
              icon={TrendingUp}
              color="#4CC38A"
            />
          </div>

          {/* AI Advisory Summary Card */}
          <IntelligenceInsightCard
            insight={aiInsight || null}
            isLoading={isAiGenerating}
            onRefresh={() => generateAiSummary()}
            title="Recruitment Executive Advisory"
          />

          {/* Funnel & Skill Supply Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Hiring Funnel */}
            <div className="lg:col-span-7 p-5 rounded-xl border space-y-4" style={{ background: '#111318', borderColor: '#2A2E38' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#2A2E38' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#F4F5F7' }}>
                    Recruitment Funnel Conversion
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#8B90A0' }}>
                    Stage-by-stage progression from initial application to hire
                  </p>
                </div>
                <Layers className="w-4 h-4 opacity-60" style={{ color: '#2F8C82' }} />
              </div>

              {funnel && (
                <HiringFunnelChart
                  stages={funnel.stages}
                  totalApplications={funnel.totalApplications}
                />
              )}
            </div>

            {/* Right: Skill Demand & Supply */}
            <div className="lg:col-span-5 p-5 rounded-xl border space-y-4" style={{ background: '#111318', borderColor: '#2A2E38' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#2A2E38' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#F4F5F7' }}>
                    Candidate Skill Supply
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#8B90A0' }}>
                    Market demand vs available verified talent
                  </p>
                </div>
                <Users className="w-4 h-4 opacity-60" style={{ color: '#4CC38A' }} />
              </div>

              {skillDemand && (
                <SkillCoverageChart items={skillDemand.skillSupplyComparison} />
              )}
            </div>
          </div>

          {/* Assessments & Interviews Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assessmentData && <AssessmentAnalyticsCard data={assessmentData} />}
            {interviewData && <InterviewAnalyticsCard data={interviewData} />}
          </div>

          {/* Opportunity Performance Table */}
          <div className="p-5 rounded-xl border space-y-4" style={{ background: '#111318', borderColor: '#2A2E38' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#F4F5F7' }}>
                  Opportunity Performance
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#8B90A0' }}>
                  Breakdown of candidate engagement, matches, and conversion per role
                </p>
              </div>
            </div>

            {oppPerformance && (
              <OpportunityPerformanceTable
                opportunities={oppPerformance.opportunities}
                pagination={oppPerformance.pagination}
                onPageChange={setPage}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IndustryIntelligencePage;
