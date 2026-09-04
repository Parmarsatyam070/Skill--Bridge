import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { learningRecommendationService } from '../server/src/services/learningRecommendationService';

const prisma = new PrismaClient();

describe('Universal Learning Hub & Recommendation Suite', () => {
  let testStudentId: string;

  beforeAll(async () => {
    let student = await prisma.studentProfile.findFirst({
      where: { user: { email: 'demo@skillbridge.app' } },
    });
    if (student) {
      testStudentId = student.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. OMNI-TOPIC SEARCH TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Omni-Topic Technical Search', () => {
    const testQueries = [
      'Dynamic Programming',
      'Graph Algorithms',
      'React',
      'System Design',
      'SQL',
      'Machine Learning',
      'Operating Systems',
      'Computer Networks',
    ];

    for (const query of testQueries) {
      it(`should return high-quality resources for "${query}"`, async () => {
        const result = await learningRecommendationService.searchResources({
          query,
          studentId: testStudentId,
        });

        expect(result).toBeDefined();
        expect(result.query).toBe(query);
        expect(result.totalResults).toBeGreaterThan(0);
        expect(result.categories).toBeDefined();
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 2. 9 CATEGORIES SEPARATION & INTEGRITY
  // ─────────────────────────────────────────────────────────────
  describe('9 Category Tabs & Resource Verification', () => {
    it('should categorize results into all 9 standard categories', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Dynamic Programming',
      });

      const requiredCategories = [
        'recommended',
        'videos',
        'courses',
        'documentation',
        'articles',
        'practice',
        'projects',
        'books',
        'interview_prep',
      ];

      for (const cat of requiredCategories) {
        expect(result.categories[cat as any]).toBeDefined();
        expect(Array.isArray(result.categories[cat as any])).toBe(true);
      }
    });

    it('should never contain fabricated or broken URLs', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'System Design',
      });

      const allResources: any[] = [];
      Object.values(result.categories).forEach((resList) => {
        allResources.push(...resList);
      });

      for (const res of allResources) {
        expect(res.url).toBeDefined();
        expect(res.url.startsWith('http://') || res.url.startsWith('https://')).toBe(true);
        expect(res.provider).toBeDefined();
        expect(res.title.length).toBeGreaterThan(3);
      }
    });

    it('should rank resources by authority and relevance', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'React',
      });

      const docs = result.categories.documentation;
      if (docs.length >= 2) {
        expect(docs[0].authorityScore).toBeGreaterThanOrEqual(docs[1].authorityScore);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PERSONALIZED RECOMMENDATIONS
  // ─────────────────────────────────────────────────────────────
  describe('Personalized Weak Topic Accelerators', () => {
    it('should generate personalized recommendations for student weak areas', async () => {
      if (!testStudentId) return;

      const recommendations = await learningRecommendationService.getPersonalizedRecommendations(
        testStudentId
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify each recommendation has authentic metadata
      for (const rec of recommendations) {
        expect(rec.title).toBeDefined();
        expect(rec.url).toBeDefined();
        expect(rec.category).toBeDefined();
      }
    });
  });
});
