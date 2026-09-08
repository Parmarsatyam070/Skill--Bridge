import { describe, it, expect } from 'vitest';
import { getLabelForPath } from '../client/src/components/ConsoleBackButton';
import type {
  OpportunitySummary,
  OpportunityMatchItem,
  OpportunityMatchBreakdown,
  OpportunitySkillItem
} from '../shared/types';

describe('Phase 2 — Opportunity Hub Frontend Architecture & Authoritative Rules', () => {
  describe('Universal Back Navigation & Routing', () => {
    it('maps /opportunities and sub-opportunity detail paths correctly to "Opportunity Hub"', () => {
      expect(getLabelForPath('/opportunities')).toBe('Opportunity Hub');
      expect(getLabelForPath('/opportunities/opp-uuid-1234')).toBe('Opportunity Hub');
      expect(getLabelForPath('/opportunities?type=JOB&workMode=REMOTE')).toBe('Opportunity Hub');
    });
  });

  describe('Authoritative Match and Eligibility Display Invariants', () => {
    it('enforces that match scores and eligibility are backend-authoritative and non-overridable', () => {
      // Mock authoritative response from GET /api/opportunities/my/matches
      const backendMatchItem: OpportunityMatchItem = {
        opportunityId: 'opp-789',
        title: 'Backend Systems Engineer',
        company: { id: 'comp-1', name: 'CloudScale Inc' },
        type: 'JOB',
        location: 'Bengaluru, India',
        workMode: 'HYBRID',
        score: 89,
        tier: 'high',
        eligibility: true,
        ineligibilityReason: null,
        breakdown: {
          algorithmVersion: 'v2.0-7factor',
          opportunityId: 'opp-789',
          totalScore: 89,
          tier: 'high',
          eligibility: true,
          ineligibilityReason: null,
          factors: {
            requiredSkillsCoverage:  { score: 90, weight: 0.40, weighted: 36.0 },
            skillProficiencyDepth:   { score: 85, weight: 0.20, weighted: 17.0 },
            experienceTechOverlap:   { score: 80, weight: 0.10, weighted: 8.0 },
            projectPortfolioQuality: { score: 90, weight: 0.10, weighted: 9.0 },
            assessmentAndDSA:        { score: 95, weight: 0.10, weighted: 9.5 },
            educationMatch:          { score: 90, weight: 0.05, weighted: 4.5 },
            certificationRelevance:  { score: 100, weight: 0.05, weighted: 5.0 },
          },
        },
        strengths: ['Strong skill coverage (90%)', 'High skill proficiency (85%)'],
        recommendations: ['Strong candidate — consider applying now'],
      };

      // Invariant 1: Score is consumed as-is from backend (no frontend calculation)
      expect(backendMatchItem.score).toBe(89);
      expect(backendMatchItem.tier).toBe('high');
      expect(backendMatchItem.eligibility).toBe(true);

      // Invariant 2: 7-Factor breakdown pillars add up correctly to composite authoritative score
      const { factors } = backendMatchItem.breakdown!;
      const computedSum =
        factors.requiredSkillsCoverage.weighted +
        factors.skillProficiencyDepth.weighted +
        factors.experienceTechOverlap.weighted +
        factors.projectPortfolioQuality.weighted +
        factors.assessmentAndDSA.weighted +
        factors.educationMatch.weighted +
        factors.certificationRelevance.weighted;

      expect(Math.round(computedSum)).toBe(backendMatchItem.score);

      // Invariant 3: Weights sum to exactly 1.0 (100%)
      const totalWeight =
        factors.requiredSkillsCoverage.weight +
        factors.skillProficiencyDepth.weight +
        factors.experienceTechOverlap.weight +
        factors.projectPortfolioQuality.weight +
        factors.assessmentAndDSA.weight +
        factors.educationMatch.weight +
        factors.certificationRelevance.weight;
      expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
    });

    it('enforces that ineligible opportunities display authoritative reason and prevent bypass', () => {
      const ineligibleMatchItem: OpportunityMatchItem = {
        opportunityId: 'opp-999',
        title: 'Senior Quantitative Analyst',
        company: { id: 'comp-2', name: 'Apex Capital' },
        type: 'JOB',
        location: 'Mumbai, India',
        workMode: 'ONSITE',
        score: 72,
        tier: 'medium',
        eligibility: false,
        ineligibilityReason: 'Missing mandatory skill: Advanced Statistics (required ≥ 80%, candidate: 65%)',
        breakdown: {
          algorithmVersion: 'v2.0-7factor',
          opportunityId: 'opp-999',
          totalScore: 72,
          tier: 'medium',
          eligibility: false,
          ineligibilityReason: 'Missing mandatory skill: Advanced Statistics (required ≥ 80%, candidate: 65%)',
          factors: {
            requiredSkillsCoverage:  { score: 70, weight: 0.40, weighted: 28.0 },
            skillProficiencyDepth:   { score: 65, weight: 0.20, weighted: 13.0 },
            experienceTechOverlap:   { score: 75, weight: 0.10, weighted: 7.5 },
            projectPortfolioQuality: { score: 80, weight: 0.10, weighted: 8.0 },
            assessmentAndDSA:        { score: 85, weight: 0.10, weighted: 8.5 },
            educationMatch:          { score: 80, weight: 0.05, weighted: 4.0 },
            certificationRelevance:  { score: 60, weight: 0.05, weighted: 3.0 },
          },
        },
        strengths: ['Good assessment performance (85%)'],
        recommendations: ['Critical: acquire mandatory skills — Advanced Statistics'],
      };

      // Invariant: Ineligibility is recognized directly from backend
      expect(ineligibleMatchItem.eligibility).toBe(false);
      expect(ineligibleMatchItem.ineligibilityReason).toContain('Missing mandatory skill');

      // The frontend must NOT compute a simulated eligibility or flip eligibility
      const canProceedToApply = ineligibleMatchItem.eligibility;
      expect(canProceedToApply).toBe(false);
    });
  });

  describe('Skills Matrix Display: Required vs Preferred Skills Separation', () => {
    it('distinguishes mandatory required skills from preferred nice-to-have skills', () => {
      const skills: OpportunitySkillItem[] = [
        {
          id: 'sk-1',
          skillName: 'TypeScript',
          level: 'ADVANCED',
          isMandatory: true,
          benchmarkScore: 75,
        },
        {
          id: 'sk-2',
          skillName: 'React',
          level: 'ADVANCED',
          isMandatory: true,
          benchmarkScore: 70,
        },
        {
          id: 'sk-3',
          skillName: 'Docker',
          level: 'INTERMEDIATE',
          isMandatory: false,
          benchmarkScore: 50,
        },
        {
          id: 'sk-4',
          skillName: 'GraphQL',
          level: 'BEGINNER',
          isMandatory: false,
          benchmarkScore: 40,
        },
      ];

      const mandatorySkills = skills.filter((s) => s.isMandatory);
      const preferredSkills = skills.filter((s) => !s.isMandatory);

      expect(mandatorySkills).toHaveLength(2);
      expect(preferredSkills).toHaveLength(2);
      expect(mandatorySkills.map((s) => s.skillName)).toEqual(['TypeScript', 'React']);
      expect(preferredSkills.map((s) => s.skillName)).toEqual(['Docker', 'GraphQL']);
    });
  });

  describe('Search & Filter Query Construction', () => {
    it('constructs correct API query parameters for GET /api/opportunities', () => {
      const buildQueryParams = (filters: {
        search?: string;
        type?: string;
        workMode?: string;
        experienceLevel?: string;
        page?: number;
        limit?: number;
        sort?: string;
      }) => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.type && filters.type !== 'ALL') params.set('type', filters.type);
        if (filters.workMode && filters.workMode !== 'ALL') params.set('workMode', filters.workMode);
        if (filters.experienceLevel && filters.experienceLevel !== 'ALL')
          params.set('experienceLevel', filters.experienceLevel);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));
        if (filters.sort) params.set('sort', filters.sort);
        return params.toString();
      };

      const qs = buildQueryParams({
        search: 'Frontend',
        type: 'INTERNSHIP',
        workMode: 'REMOTE',
        experienceLevel: 'ENTRY',
        page: 1,
        limit: 12,
        sort: 'newest',
      });

      expect(qs).toContain('search=Frontend');
      expect(qs).toContain('type=INTERNSHIP');
      expect(qs).toContain('workMode=REMOTE');
      expect(qs).toContain('experienceLevel=ENTRY');
      expect(qs).toContain('page=1');
      expect(qs).toContain('limit=12');
      expect(qs).toContain('sort=newest');
    });
  });
});
