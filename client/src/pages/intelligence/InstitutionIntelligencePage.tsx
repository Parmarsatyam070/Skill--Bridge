import React, { useState } from 'react';
import {
  useInstitutionOverview,
  useInstitutionSkills,
  useInstitutionAffectedStudents,
  useInstitutionInterventions,
  useGenerateInstitutionAiRecommendations,
} from '../../hooks/useInstitutionIntelligence';
import { IntelligenceKpiCard } from '../../components/intelligence/IntelligenceKpiCard';
import { SkillGapTable } from '../../components/intelligence/SkillGapTable';
import { AffectedStudentsTable } from '../../components/intelligence/AffectedStudentsTable';
import { IntelligenceInsightCard } from '../../components/intelligence/IntelligenceInsightCard';
import { IntelligenceEmptyState } from '../../components/intelligence/IntelligenceEmptyState';
import { IntelligenceLoadingState } from '../../components/intelligence/IntelligenceLoadingState';
import {
  GraduationCap,
  Award,
  AlertOctagon,
  BookOpen,
  TrendingUp,
  Radar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const InstitutionIntelligencePage: React.FC = () => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [affectedStudentsPage, setAffectedStudentsPage] = useState(1);
  const [affectedStudentsSearch, setAffectedStudentsSearch] = useState<string | undefined>(undefined);

  const { data: overview, isLoading: isOverviewLoading } = useInstitutionOverview();
  const { data: skillsData, isLoading: isSkillsLoading } = useInstitutionSkills();
  const { data: interventionsData, isLoading: isInterventionsLoading } = useInstitutionInterventions();

  const { data: affectedStudentsData, isLoading: isAffectedLoading } = useInstitutionAffectedStudents({
    skillId: selectedSkillId || '',
    page: affectedStudentsPage,
    limit: 10,
    search: affectedStudentsSearch,
  });

  const {
    mutate: generateAiRecommendations,
    data: aiInsight,
    isPending: isAiGenerating,
  } = useGenerateInstitutionAiRecommendations();

  const isLoading = isOverviewLoading || isSkillsLoading;

  if (isLoading) {
    return <IntelligenceLoadingState />;
  }

  const hasNoData = !overview || overview.totalStudents === 0;

  const handleSelectSkill = (skillId: string) => {
    if (selectedSkillId === skillId) {
      setSelectedSkillId(null);
    } else {
      setSelectedSkillId(skillId);
      setAffectedStudentsPage(1);
      setAffectedStudentsSearch(undefined);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600/15 text-blue-400 border border-blue-500/30"
          >
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
              Institutional Skill Intelligence
            </h1>
            <p className="text-xs mt-0.5 text-slate-400">
              Deterministic cohort skill gaps, industry benchmark comparison, and targeted curriculum interventions for{' '}
              <span className="font-semibold text-white">{skillsData?.institutionName || 'Institution'}</span>.
            </p>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <IntelligenceEmptyState
          icon={GraduationCap}
          title="No Enrolled Students Recorded"
          description="Students enrolled with this institution affiliation will automatically appear here once registered. Their verified skills and assessment completions will generate live gap benchmarks."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <IntelligenceKpiCard
              title="Cohort Size"
              value={overview?.totalStudents || 0}
              subtitle="Enrolled student profiles"
              icon={GraduationCap}
              color="#3b82f6"
            />
            <IntelligenceKpiCard
              title="Verified Badges"
              value={overview?.verifiedSkillsCount || 0}
              subtitle="Assessment & course verified skills"
              icon={Award}
              color="#10b981"
            />
            <IntelligenceKpiCard
              title="Market Demand"
              value={overview?.highDemandSkillsCount || 0}
              subtitle="Live industry required skills"
              icon={TrendingUp}
              color="#60a5fa"
            />
            <IntelligenceKpiCard
              title="Identified Gaps"
              value={overview?.skillGapsCount || 0}
              subtitle={`${overview?.affectedStudentsCount || 0} students affected`}
              icon={AlertOctagon}
              color="#f43f5e"
            />
          </div>

          {/* AI Advisory Guidance */}
          <IntelligenceInsightCard
            insight={aiInsight || null}
            isLoading={isAiGenerating}
            onRefresh={() => generateAiRecommendations()}
            title="AI Curriculum & Upskilling Advisory"
          />

          {/* Skill Comparison Table */}
          <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Industry vs Cohort Skill Comparison
                </h3>
                <p className="text-xs mt-0.5 text-slate-400">
                  Coverage benchmarked against live industry opportunity specifications (Coverage threshold ≥ 60%, Benchmark ≥ 70%)
                </p>
              </div>
            </div>

            {skillsData && (
              <SkillGapTable
                skills={skillsData.comparison}
                selectedSkillId={selectedSkillId}
                onSelectSkill={handleSelectSkill}
              />
            )}
          </div>

          {/* Affected Students Drawer / Panel */}
          {selectedSkillId && affectedStudentsData && (
            <div className="scroll-mt-4" id="affected-students-section">
              <AffectedStudentsTable
                data={affectedStudentsData}
                onClose={() => setSelectedSkillId(null)}
                onPageChange={setAffectedStudentsPage}
                onSearch={term => {
                  setAffectedStudentsSearch(term);
                  setAffectedStudentsPage(1);
                }}
              />
            </div>
          )}

          {/* Recommended Interventions */}
          <div className="p-5 rounded-xl border border-[#1e293b] bg-[#0b1329] space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Curriculum & Diagnostic Interventions
                </h3>
                <p className="text-xs mt-0.5 text-slate-400">
                  Recommended courses, resources, and talent assessments from the platform to bridge cohort gaps
                </p>
              </div>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>

            {interventionsData && interventionsData.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventionsData.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-[#1e293b] bg-[#030712] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/30"
                        >
                          {rec.interventionType}
                        </span>
                        <span className="text-xs font-medium text-amber-400">
                          Target: {rec.skillName}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold line-clamp-2 text-white">
                        {rec.title}
                      </h4>

                      <p className="text-xs line-clamp-2 text-slate-400">
                        {rec.rationale}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-slate-400">
                        {rec.provider}
                      </span>
                      {rec.url && (
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                        >
                          <span>Explore</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No specific course recommendations currently matched to active gaps.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InstitutionIntelligencePage;
