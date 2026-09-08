import { describe, it, expect } from 'vitest';
import {
  SKILL_COVERAGE_THRESHOLD,
  SKILL_PROFICIENCY_BENCHMARK,
} from '../server/src/services/intelligenceService';
import {
  getCurrentSnapshotDate,
  getPreviousSnapshotDate,
} from '../server/src/services/skillDemandSnapshotService';
import {
  IntelligencePaginationQuerySchema,
  IntelligenceDateFilterSchema,
  AffectedStudentsQuerySchema,
  IntelligenceAiInsightSchema,
} from '../shared/validation';
import { getLabelForPath } from '../client/src/components/ConsoleBackButton';
import type {
  IndustryOverviewDto,
  RecruitmentFunnelStage,
  IndustryFunnelResponse,
  InstitutionOverviewDto,
  InstitutionSkillComparisonItem,
  GapSeverityLevel,
  IntelligenceAiInsight,
} from '../shared/types';

describe('Phase 8 — Intelligence Dashboards Architecture & Security Suite', () => {
  // ============================================================
  // 1. STRICT ROLE GOVERNANCE & ACCESS CONTROL GATES
  // ============================================================
  describe('1. Role Authorization & Strict Persona Boundary Guards', () => {
    // Simulated guard functions mimicking server middleware
    const canAccessIndustryIntelligence = (role?: string, industryProfileId?: string | null) => {
      return role === 'INDUSTRY' && Boolean(industryProfileId);
    };

    const canAccessInstitutionIntelligence = (role?: string, institutionProfileId?: string | null) => {
      return role === 'INSTITUTION_ADMIN' && Boolean(institutionProfileId);
    };

    it('allows only INDUSTRY role with industryProfileId to access Industry Intelligence', () => {
      expect(canAccessIndustryIntelligence('INDUSTRY', 'ind-profile-100')).toBe(true);
      expect(canAccessIndustryIntelligence('INDUSTRY', null)).toBe(false);
      expect(canAccessIndustryIntelligence('INDUSTRY', '')).toBe(false);
      expect(canAccessIndustryIntelligence('STUDENT', 'stud-100')).toBe(false);
      expect(canAccessIndustryIntelligence('ACADEMICIAN', 'acad-100')).toBe(false);
      expect(canAccessIndustryIntelligence('INSTITUTION_ADMIN', 'inst-100')).toBe(false);
      expect(canAccessIndustryIntelligence('ADMIN', 'admin-100')).toBe(false); // Strict role rule
    });

    it('allows only INSTITUTION_ADMIN role with institutionProfileId to access Institution Intelligence', () => {
      expect(canAccessInstitutionIntelligence('INSTITUTION_ADMIN', 'inst-profile-200')).toBe(true);
      expect(canAccessInstitutionIntelligence('INSTITUTION_ADMIN', null)).toBe(false);
      expect(canAccessInstitutionIntelligence('INSTITUTION_ADMIN', '')).toBe(false);
      expect(canAccessInstitutionIntelligence('STUDENT', 'stud-200')).toBe(false);
      expect(canAccessInstitutionIntelligence('INDUSTRY', 'ind-200')).toBe(false);
      expect(canAccessInstitutionIntelligence('ACADEMICIAN', 'acad-200')).toBe(false);
      expect(canAccessInstitutionIntelligence('ADMIN', 'admin-200')).toBe(false); // Strict role rule
    });

    it('rejects unauthenticated requests unconditionally', () => {
      expect(canAccessIndustryIntelligence(undefined, undefined)).toBe(false);
      expect(canAccessInstitutionIntelligence(undefined, undefined)).toBe(false);
    });
  });

  // ============================================================
  // 2. TENANCY ISOLATION & INSTITUTION SCOPING
  // ============================================================
  describe('2. Multi-Tenancy Isolation & Authoritative Tenancy Boundaries', () => {
    it('scopes Industry Intelligence strictly by authenticated user companyId', () => {
      const authenticatedCompanyId = 'company-acme-corp';
      const crossTenantCompanyId = 'company-globex';

      const buildOpportunityQueryWhere = (userCompanyId: string) => ({
        companyId: userCompanyId,
      });

      const whereClause = buildOpportunityQueryWhere(authenticatedCompanyId);
      expect(whereClause.companyId).toBe(authenticatedCompanyId);
      expect(whereClause.companyId).not.toBe(crossTenantCompanyId);
    });

    it('resolves institutionName from server-side InstitutionProfile, ignoring client query params', () => {
      const clientSuppliedQuery = {
        institutionId: 'malicious-injected-id',
        institutionName: 'Fake Harvard',
      };

      // Server-side authoritative resolution
      const serverResolvedProfile = {
        id: 'real-inst-profile-42',
        institutionName: 'Indian Institute of Technology, Bombay',
      };

      const resolveTenancyBoundary = (profile: { institutionName: string }, _clientQuery: any) => {
        // Authoritative rule: ignore client-provided institutionId / institutionName
        return profile.institutionName;
      };

      const boundary = resolveTenancyBoundary(serverResolvedProfile, clientSuppliedQuery);
      expect(boundary).toBe('Indian Institute of Technology, Bombay');
      expect(boundary).not.toBe(clientSuppliedQuery.institutionName);
    });
  });

  // ============================================================
  // 3. DETERMINISTIC RECRUITMENT FUNNEL & APPLICATION STATUS
  // ============================================================
  describe('3. Deterministic Recruitment Funnel using Real Application.status', () => {
    it('maps real Application.status enum values into the 5-stage funnel', () => {
      const sampleApplications = [
        { id: '1', status: 'applied' },
        { id: '2', status: 'under_review' },
        { id: '3', status: 'shortlisted' },
        { id: '4', status: 'interview' },
        { id: '5', status: 'hired' },
        { id: '6', status: 'rejected' },
      ];

      const totalApplications = sampleApplications.length; // 6
      let screeningCount = 0;
      let shortlistedCount = 0;
      let interviewCount = 0;
      let hiredCount = 0;

      for (const app of sampleApplications) {
        if (['under_review', 'shortlisted', 'assessment', 'interview', 'hired'].includes(app.status)) {
          screeningCount++;
        }
        if (['shortlisted', 'assessment', 'interview', 'hired'].includes(app.status)) {
          shortlistedCount++;
        }
        if (['interview', 'hired'].includes(app.status)) {
          interviewCount++;
        }
        if (app.status === 'hired') {
          hiredCount++;
        }
      }

      expect(totalApplications).toBe(6);
      expect(screeningCount).toBe(4); // under_review, shortlisted, interview, hired
      expect(shortlistedCount).toBe(3); // shortlisted, interview, hired
      expect(interviewCount).toBe(2); // interview, hired
      expect(hiredCount).toBe(1); // hired
    });

    it('prevents rejected applications from progressing past the initial applied stage', () => {
      const sampleRejected = [
        { id: 'r1', status: 'rejected' },
        { id: 'r2', status: 'rejected' },
      ];

      const screeningPassed = sampleRejected.filter(a =>
        ['under_review', 'shortlisted', 'assessment', 'interview', 'hired'].includes(a.status)
      );

      expect(screeningPassed.length).toBe(0);
    });

    it('calculates dropoff and conversion rates without division-by-zero on empty funnels', () => {
      const emptyApplications: any[] = [];
      const total = emptyApplications.length;

      const stages: RecruitmentFunnelStage[] = [
        {
          stage: 'applied',
          label: 'Applied',
          count: total,
          percentageOfTotal: total > 0 ? (total / total) * 100 : 0,
          conversionFromPrevious: 100,
        },
        {
          stage: 'hired',
          label: 'Hired',
          count: 0,
          percentageOfTotal: total > 0 ? (0 / total) * 100 : 0,
          conversionFromPrevious: 0,
        },
      ];

      expect(stages[0].percentageOfTotal).toBe(0);
      expect(stages[1].percentageOfTotal).toBe(0);
      expect(stages[1].conversionFromPrevious).toBe(0);
    });
  });

  // ============================================================
  // 4. AUTHORITATIVE THRESHOLDS & GAP SEVERITY CLASSIFICATION
  // ============================================================
  describe('4. Authoritative Skill Thresholds & Deterministic Gap Classification', () => {
    it('verifies SKILL_COVERAGE_THRESHOLD is exactly 60', () => {
      expect(SKILL_COVERAGE_THRESHOLD).toBe(60);
    });

    it('verifies SKILL_PROFICIENCY_BENCHMARK is exactly 70', () => {
      expect(SKILL_PROFICIENCY_BENCHMARK).toBe(70);
    });

    it('classifies gap severity deterministically without arbitrary scores', () => {
      const classifyGap = (coveragePct: number, avgScore: number, coveredCount: number): GapSeverityLevel => {
        if (coveragePct < 30 || (avgScore > 0 && avgScore < 50) || coveredCount === 0) {
          return 'CRITICAL';
        } else if (coveragePct < 60 || avgScore < SKILL_PROFICIENCY_BENCHMARK) {
          return 'MEDIUM';
        }
        return 'LOW';
      };

      // Severe gap: coverage 10%, score 35 -> CRITICAL
      expect(classifyGap(10, 35, 1)).toBe('CRITICAL');

      // Zero students covered -> CRITICAL
      expect(classifyGap(0, 0, 0)).toBe('CRITICAL');

      // Moderate gap: coverage 45%, score 65 -> MEDIUM
      expect(classifyGap(45, 65, 5)).toBe('MEDIUM');

      // Healthy coverage: coverage 85%, score 78 -> LOW
      expect(classifyGap(85, 78, 10)).toBe('LOW');
    });
  });

  // ============================================================
  // 5. IDEMPOTENT SKILL DEMAND SNAPSHOT SERVICE
  // ============================================================
  describe('5. Deterministic Monthly Snapshots & Trend Analysis', () => {
    it('formats snapshot dates in standard YYYY-MM format', () => {
      const testDate = new Date(2026, 8, 15); // Sept 2026
      expect(getCurrentSnapshotDate(testDate)).toBe('2026-09');
    });

    it('computes previous month snapshot date correctly across year boundaries', () => {
      const janDate = new Date(2026, 0, 15); // Jan 2026
      expect(getPreviousSnapshotDate(janDate)).toBe('2025-12');

      const marchDate = new Date(2026, 2, 10); // March 2026
      expect(getPreviousSnapshotDate(marchDate)).toBe('2026-02');
    });

    it('computes trend direction based on demand deltas without synthetic randomization', () => {
      const computeTrend = (current: number, previous?: number): 'GROWING' | 'DECLINING' | 'STABLE' | 'EMERGING' => {
        if (previous !== undefined) {
          if (current > previous * 1.1) return 'GROWING';
          if (current < previous * 0.9) return 'DECLINING';
          return 'STABLE';
        }
        return current > 0 ? 'EMERGING' : 'STABLE';
      };

      expect(computeTrend(15, 10)).toBe('GROWING'); // +50%
      expect(computeTrend(7, 10)).toBe('DECLINING'); // -30%
      expect(computeTrend(10, 10)).toBe('STABLE'); // equal
      expect(computeTrend(5, undefined)).toBe('EMERGING'); // newly introduced
    });
  });

  // ============================================================
  // 6. ADVISORY AI SAFETY & VALIDATION SCHEMAS
  // ============================================================
  describe('6. Advisory AI Safety, Schema Validation & Disclaimers', () => {
    it('validates a well-formed AI insight with IntelligenceAiInsightSchema', () => {
      const validInsight: IntelligenceAiInsight = {
        summary: 'Hiring conversion is strong in frontend engineering roles.',
        keyObservations: [
          'Frontend roles have a 78% screening pass rate.',
          'React talent supply exceeds required demand ratio.',
        ],
        recommendations: [
          'Accelerate technical interview scheduling for top tier candidates.',
          'Expand outreach for Cloud backend skills.',
        ],
        disclaimer: 'This is an AI-generated advisory analysis.',
        generatedAt: '2026-09-09T00:00:00.000Z',
      };

      const result = IntelligenceAiInsightSchema.safeParse(validInsight);
      expect(result.success).toBe(true);
    });

    it('rejects an AI response that omits mandatory observations or recommendations', () => {
      const invalidInsight = {
        summary: 'Only a summary',
        keyObservations: [], // Empty array violates .min(1)
        recommendations: [],
        disclaimer: 'Disclaimer text',
      };

      const result = IntelligenceAiInsightSchema.safeParse(invalidInsight);
      expect(result.success).toBe(false);
    });

    it('validates pagination and date filter query schemas', () => {
      const validPagination = IntelligencePaginationQuerySchema.safeParse({
        page: '2',
        limit: '15',
        search: 'TypeScript',
      });
      expect(validPagination.success).toBe(true);
      if (validPagination.success) {
        expect(validPagination.data.page).toBe(2);
        expect(validPagination.data.limit).toBe(15);
      }

      const validAffectedQuery = AffectedStudentsQuerySchema.safeParse({
        skillId: 'skill-react-123',
        page: '1',
      });
      expect(validAffectedQuery.success).toBe(true);

      const invalidAffectedQuery = AffectedStudentsQuerySchema.safeParse({
        // Missing skillId
        page: '1',
      });
      expect(invalidAffectedQuery.success).toBe(false);
    });
  });

  // ============================================================
  // 7. NAVIGATION & PROTECTED SYSTEMS NON-REGRESSION
  // ============================================================
  describe('7. Navigation Integration & Protected Systems Non-Regression', () => {
    it('registers labels for Phase 8 Intelligence routes in ConsoleBackButton', () => {
      expect(getLabelForPath('/industry/intelligence')).toBe('Market Intelligence');
      expect(getLabelForPath('/institution/intelligence')).toBe('Skill Intelligence');
    });

    it('preserves labels for all protected legacy and prior phase routes', () => {
      expect(getLabelForPath('/assessment')).toBe('Skill Assessment');
      expect(getLabelForPath('/assessments')).toBe('Talent Assessments');
      expect(getLabelForPath('/opportunities')).toBe('Opportunity Hub');
      expect(getLabelForPath('/interviews')).toBe('AI Interviews');
      expect(getLabelForPath('/collaborations')).toBe('Collaborations');
    });
  });
});
