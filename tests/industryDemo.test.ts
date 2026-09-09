import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { prisma } from '../server/src/config/prisma.js';
import {
  getIndustryDemoStats,
  getIndustryDemoOpportunities,
  getIndustryDemoOpportunityApplicants,
  getIndustryDemoCandidates,
  getIndustryDemoCandidateById,
  compareIndustryDemoCandidates,
  getIndustryDemoAnalytics,
} from '../server/src/services/industryDemoService.js';
import { seedIndustryDemoDataset } from '../server/src/scripts/seedIndustryDemo.js';

describe('SkillBridge Industry / Recruiter Demo Mode Suite', { timeout: 30000 }, () => {
  const dataDir = path.join(process.cwd(), 'server', 'data', 'industry');

  describe('1. Dataset Structure & Integrity Verification', () => {
    it('verifies all 5 CSV files exist on disk with correct row counts', () => {
      const files = [
        { name: '4763fc85-ae28-42d6-b2b6-97a0f900159b.csv', expectedRows: 150 },
        { name: 'sharda_university_dataset.csv', expectedRows: 80 },
        { name: 'galgotias_university_dataset.csv', expectedRows: 50 },
        { name: 'bennett_university_dataset.csv', expectedRows: 60 },
        { name: 'gautam_buddha_university_dataset.csv', expectedRows: 70 },
      ];

      let totalRows = 0;
      for (const file of files) {
        const filePath = path.join(dataDir, file.name);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const dataRows = lines.length - 1; // Subtract header
        expect(dataRows).toBe(file.expectedRows);
        totalRows += dataRows;
      }

      expect(totalRows).toBe(410);
    });

    it('verifies exactly 410 candidate records exist in the database with 1 skill per candidate', async () => {
      const candidates = await (prisma as any).industryDemoCandidate.findMany({
        where: { source: 'DEMO_DATASET' },
        include: { skills: true },
      });

      expect(candidates.length).toBe(410);

      // Verify each candidate has exactly 1 skill and no fabricated skills
      for (const cand of candidates) {
        expect(cand.skills.length).toBe(1);
        expect(cand.skills[0].skillScore).toBe(cand.averageScore);
        expect(cand.skills[0].skillScore).toBeGreaterThanOrEqual(0);
        expect(cand.skills[0].skillScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('2. Dynamic Statistical Audit', () => {
    it('dynamically computes dataset statistics matching the 410-record reality', async () => {
      const stats = await getIndustryDemoStats();

      expect(stats.totalRecords).toBe(410);
      expect(stats.uniqueCandidates).toBe(410);
      expect(stats.universitiesCount).toBe(4); // 4 actual universities
      expect(stats.sourcesCount).toBe(5); // 4 universities + 1 benchmark
      expect(stats.branchesCount).toBe(8);
      expect(stats.skillsCount).toBe(6);
      expect(stats.skillCategoriesCount).toBe(6);
      expect(stats.sourceDomainsCount).toBe(1); // Technical
      expect(Math.round(stats.averageScore)).toBe(72); // ~71.52%
      expect(stats.averageScore).toBeGreaterThanOrEqual(71.0);
      expect(stats.averageScore).toBeLessThanOrEqual(72.0);

      // Verify university breakdown
      expect(stats.universityBreakdown.length).toBe(5);
      const benchmarkUni = stats.universityBreakdown.find((u) => u.isBenchmark);
      expect(benchmarkUni).toBeDefined();
      expect(benchmarkUni?.candidateCount).toBe(150);
    });
  });

  describe('3. Multi-Skill Matching & Deterministic Scoring', () => {
    it('calculates deterministic match score, skill coverage, known skill, and missing skills', async () => {
      const opportunities = await getIndustryDemoOpportunities();
      expect(opportunities.length).toBe(6);

      const targetOpp = opportunities[0];
      expect(targetOpp.requiredSkills.length).toBeGreaterThan(1);

      const result = await getIndustryDemoOpportunityApplicants(targetOpp.id);
      expect(result.applicants.length).toBeGreaterThan(0);

      const applicant = result.applicants[0];
      expect(applicant.skillCoverageRatio).toMatch(/^\d+\s*\/\s*\d+$/);
      expect(applicant.knownSkills.length).toBeGreaterThanOrEqual(1);
      expect(applicant.missingSkills.length).toBeGreaterThanOrEqual(0);
      expect(applicant.matchScore).toBeGreaterThanOrEqual(0);
      expect(applicant.matchScore).toBeLessThanOrEqual(100);
    });
  });

  describe('4. Recruiter Copilot 2-5 Candidate Comparison Engine', () => {
    it('compares 2 to 5 candidates for a demo opportunity with advisory disclaimer', async () => {
      const opportunities = await getIndustryDemoOpportunities();
      const oppId = opportunities[0].id;

      const candidatesResult = await getIndustryDemoCandidates({ limit: 4 });
      const candidateIds = candidatesResult.candidates.map((c: any) => c.id);
      expect(candidateIds.length).toBe(4);

      const comparison = await compareIndustryDemoCandidates(candidateIds, oppId);

      expect(comparison.candidates.length).toBe(4);
      expect(comparison.advisoryRanking.length).toBe(4);
      expect(comparison.advisorySummary).toBeTruthy();
      expect(comparison.disclaimer).toContain('Advisory AI — Final hiring decisions remain with human recruiters');

      // Verify each candidate in comparison has explicit known and missing skills
      for (const cand of comparison.candidates) {
        expect(cand.skillCoverageRatio).toBeDefined();
        expect(cand.knownSkills.length).toBeGreaterThanOrEqual(0);
        expect(cand.missingSkills.length).toBeGreaterThanOrEqual(0);
        expect(cand.deterministicMatchScore).toBeGreaterThanOrEqual(0);
      }
    }, 30000);

    it('rejects comparison when candidate count is less than 2 or greater than 5', async () => {
      const opportunities = await getIndustryDemoOpportunities();
      const oppId = opportunities[0].id;
      const candidatesResult = await getIndustryDemoCandidates({ limit: 6 });

      // Test 1 candidate (too few)
      await expect(
        compareIndustryDemoCandidates([candidatesResult.candidates[0].id], oppId)
      ).rejects.toThrow('Please select between 2 and 5 candidates');

      // Test 6 candidates (too many)
      const sixIds = candidatesResult.candidates.slice(0, 6).map((c: any) => c.id);
      await expect(
        compareIndustryDemoCandidates(sixIds, oppId)
      ).rejects.toThrow('Please select between 2 and 5 candidates');
    });
  });

  describe('5. Assessment and Interview Simulation Labeling', () => {
    it('clearly labels assessment and interview contexts as DEMO with advisory disclaimers', async () => {
      const candidatesResult = await getIndustryDemoCandidates({ limit: 1 });
      const candidateId = candidatesResult.candidates[0].id;

      const details = await getIndustryDemoCandidateById(candidateId);

      expect(details.demoAssessment.badge).toBe('DEMO ASSESSMENT');
      expect(details.demoAssessment.disclaimer).toContain('simulated');
      expect(details.demoAssessment.score).toBe(details.candidate.averageScore);

      expect(details.demoInterview.badge).toBe('DEMO AI INTERVIEW');
      expect(details.demoInterview.disclaimer).toContain('advisory AI interview simulation');
      expect(details.demoInterview.technicalScore).toBe(details.candidate.averageScore);
    });
  });

  describe('6. Data Isolation Guarantee', () => {
    it('verifies demo dataset operations do not contaminate live platform tables', async () => {
      const demoCandidatesCount = await (prisma as any).industryDemoCandidate.count();
      expect(demoCandidatesCount).toBe(410);

      // Verify real opportunity or user tables do not have DEMO_DATASET source in production schemas
      const realOpportunities = await prisma.opportunity.findMany({
        where: { id: { in: (await getIndustryDemoOpportunities()).map((o: any) => o.id) } },
      });
      expect(realOpportunities.length).toBe(0);
    });
  });
});
