import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  learningRecommendationService,
  normalizeQuery,
  validateResource,
  calculateRelevanceScore,
  calculateQualityScore,
  deduplicateResources,
  rankResources,
  seedSmartLearningResources,
} from '../server/src/services/learningRecommendationService';

const prisma = new PrismaClient();

describe('SkillBridge Learning Hub & Recommendation Engine - Complete Test Suite', () => {
  let testStudentId: string;

  beforeAll(async () => {
    // Pre-seed the learning resources ONCE before any test runs.
    // The process-level guard in seedSmartLearningResources means subsequent
    // calls (made internally by searchLearningHub) return immediately (no DB work).
    // Without this, each of the 19 tests would trigger a full 20+ row upsert
    // against the remote DB, causing all to timeout.
    await seedSmartLearningResources();

    let student = await prisma.studentProfile.findFirst({
      where: { user: { email: 'demo@skillbridge.app' } },
    });
    if (student) {
      testStudentId = student.id;
    }
  }, 120_000); // 2-min budget for the one-time seed against remote Neon DB

  afterAll(async () => {
    await prisma.$disconnect();
  });


  // ─────────────────────────────────────────────────────────────
  // 1-4. BASIC SEARCH QUERIES
  // ─────────────────────────────────────────────────────────────
  describe('1-4: Core Technical Topic Searches', () => {
    it('1. Search "Dynamic Programming" returns authentic DP resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Dynamic Programming',
        studentId: testStudentId,
      });

      expect(result).toBeDefined();
      expect(result.totalResults).toBeGreaterThan(0);
      const allRes = Object.values(result.categories).flat();
      const hasDp = allRes.some((r) =>
        r.title.toLowerCase().includes('dynamic programming') ||
        r.description.toLowerCase().includes('dynamic programming') ||
        r.topic.toLowerCase().includes('dynamic programming') ||
        r.tags.some((t: string) => t.toLowerCase().includes('dp') || t.toLowerCase().includes('dynamic-programming'))
      );
      expect(hasDp).toBe(true);
    });

    it('2. Search "React" returns authentic React resources & official documentation', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'React',
        studentId: testStudentId,
      });

      expect(result.totalResults).toBeGreaterThan(0);
      const docRes = result.categories.documentation;
      expect(docRes.length).toBeGreaterThan(0);
      expect(docRes.some((d) => d.url.includes('react.dev') || d.title.includes('React'))).toBe(true);
    });

    it('3. Search "Python" returns authentic Python resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Python',
        studentId: testStudentId,
      });

      expect(result.totalResults).toBeGreaterThan(0);
      const allRes = Object.values(result.categories).flat();
      expect(allRes.some((r) => r.title.toLowerCase().includes('python') || r.url.includes('python.org'))).toBe(true);
    });

    it('4. Search "System Design" returns authoritative system design resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'System Design',
        studentId: testStudentId,
      });

      expect(result.totalResults).toBeGreaterThan(0);
      const allRes = Object.values(result.categories).flat();
      expect(allRes.some((r) => r.title.toLowerCase().includes('system design') || r.topic.toLowerCase().includes('system design'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5-7. CASE INSENSITIVITY, WHITESPACE & SYNONYM TOKEN SEARCH
  // ─────────────────────────────────────────────────────────────
  describe('5-7: Case-Insensitivity, Whitespace Trimming & Synonym / Tag Search', () => {
    it('5. Search case-insensitive queries ("dynamic programming", "Dynamic Programming", "DYNAMIC PROGRAMMING")', async () => {
      const lower = await learningRecommendationService.searchResources({ query: 'dynamic programming' });
      const mixed = await learningRecommendationService.searchResources({ query: 'Dynamic Programming' });
      const upper = await learningRecommendationService.searchResources({ query: 'DYNAMIC PROGRAMMING' });

      expect(lower.totalResults).toBeGreaterThan(0);
      expect(mixed.totalResults).toBeGreaterThan(0);
      expect(upper.totalResults).toBeGreaterThan(0);
      expect(lower.totalResults).toBe(mixed.totalResults);
      expect(mixed.totalResults).toBe(upper.totalResults);
    });

    it('6. Search with extra whitespace ("   dynamic programming   ", "   react   ")', async () => {
      const trimmed = await learningRecommendationService.searchResources({ query: 'dynamic programming' });
      const padded = await learningRecommendationService.searchResources({ query: '   dynamic programming   ' });

      expect(padded.totalResults).toBe(trimmed.totalResults);
    });

    it('7. Search by tags/keywords ("memoization", "dp", "tabulation", "react hooks", "sql queries")', async () => {
      const [dpTag, dpShort, reactHooks, sqlQuery] = await Promise.all([
        learningRecommendationService.searchResources({ query: 'memoization' }),
        learningRecommendationService.searchResources({ query: 'dp' }),
        learningRecommendationService.searchResources({ query: 'react hooks' }),
        learningRecommendationService.searchResources({ query: 'sql' }),
      ]);
      expect(dpTag.totalResults).toBeGreaterThan(0);
      expect(dpShort.totalResults).toBeGreaterThan(0);
      expect(reactHooks.totalResults).toBeGreaterThan(0);
      expect(sqlQuery.totalResults).toBeGreaterThan(0);
    }, 15000);
  });

  // ─────────────────────────────────────────────────────────────
  // 8-14. RESOURCE TYPE / CATEGORY FILTERS
  // ─────────────────────────────────────────────────────────────
  describe('8-14: Category & Resource Type Filters', () => {
    it('8. Video filter returns ONLY video resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Dynamic Programming',
        category: 'videos',
      });

      expect(result.categories.videos.length).toBeGreaterThan(0);
      for (const res of result.categories.videos) {
        expect(res.category === 'videos' || res.type.toLowerCase().includes('video') || res.type.toLowerCase().includes('lecture')).toBe(true);
      }
    });

    it('9. Course filter returns ONLY course resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Machine Learning',
        category: 'courses',
      });

      expect(result.categories.courses.length).toBeGreaterThan(0);
      for (const res of result.categories.courses) {
        expect(res.category === 'courses' || res.type.toLowerCase().includes('course')).toBe(true);
      }
    });

    it('10. Documentation filter returns official documentation', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'React',
        category: 'documentation',
      });

      expect(result.categories.documentation.length).toBeGreaterThan(0);
      for (const res of result.categories.documentation) {
        expect(res.category === 'documentation' || res.type.toLowerCase().includes('doc')).toBe(true);
      }
    });

    it('11. Practice filter returns coding & practice resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Algorithms',
        category: 'practice',
      });

      expect(result.categories.practice.length).toBeGreaterThan(0);
      for (const res of result.categories.practice) {
        expect(res.category === 'practice' || res.type.toLowerCase().includes('practice') || res.type.toLowerCase().includes('problem')).toBe(true);
      }
    });

    it('12. Projects filter returns hands-on project resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'React',
        category: 'projects',
      });

      expect(result.categories.projects.length).toBeGreaterThan(0);
      for (const res of result.categories.projects) {
        expect(res.category === 'projects' || res.type.toLowerCase().includes('project')).toBe(true);
      }
    });

    it('13. Books filter returns verified technical books', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'System Design',
        category: 'books',
      });

      expect(result.categories.books.length).toBeGreaterThan(0);
      for (const res of result.categories.books) {
        expect(res.category === 'books' || res.type.toLowerCase().includes('book')).toBe(true);
      }
    });

    it('14. Recommended filter prioritizes top authoritative & verified resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Dynamic Programming',
        category: 'recommended',
        studentId: testStudentId,
      });

      expect(result.categories.recommended.length).toBeGreaterThan(0);
      // Recommended should contain high quality / verified items
      for (const res of result.categories.recommended) {
        expect(res.authorityScore).toBeGreaterThanOrEqual(70);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 15-18. FILTER RESET, CHIPS, ERROR HANDLING & EMPTY STATES
  // ─────────────────────────────────────────────────────────────
  describe('15-18: Filters, Chips, Error & Empty Handling', () => {
    it('15. Reset filters / Default search returns full standard catalog', async () => {
      const defaultCatalog = await learningRecommendationService.searchResources({
        query: '',
      });

      expect(defaultCatalog.totalResults).toBeGreaterThan(20);
      expect(defaultCatalog.categories.videos.length).toBeGreaterThan(0);
      expect(defaultCatalog.categories.courses.length).toBeGreaterThan(0);
      expect(defaultCatalog.categories.documentation.length).toBeGreaterThan(0);
    });

    it('16. Suggested topic clicks produce rich results for all top suggested topics', async () => {
      const suggestedTopics = [
        'Dynamic Programming',
        'Graph Algorithms',
        'React',
        'System Design',
        'SQL',
        'Machine Learning',
        'Operating Systems',
        'Computer Networks',
      ];

      for (const topic of suggestedTopics) {
        const res = await learningRecommendationService.searchResources({ query: topic });
        expect(res.totalResults).toBeGreaterThan(0);
      }
    }, 15000);

    it('17. Normalization handles strange symbols safely without breaking', () => {
      const normalized = normalizeQuery('  <script>alert("test")</script> && || DP ??  ');
      expect(normalized.tokens).toContain('dp');
      expect(normalized.clean).not.toContain('<script>');
    });

    it('18. Non-existent technical query returns genuinely empty result gracefully', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'xyznonexistenttopic123456789foobar',
      });

      expect(result.totalResults).toBe(0);
      expect(result.categories.recommended.length).toBe(0);
      expect(result.categories.videos.length).toBe(0);
      expect(result.categories.documentation.length).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 19-22. QUALITY, VALIDATION, DEDUPLICATION & RANKING
  // ─────────────────────────────────────────────────────────────
  describe('19-22: Quality Pipeline, Ranking & Deduplication', () => {
    it('19. Deduplication removes duplicate URLs and titles', () => {
      const duplicates: any[] = [
        { id: '1', title: 'React Docs', url: 'https://react.dev', category: 'documentation', authorityScore: 90, type: 'Documentation', difficulty: 'Beginner', isFree: true, isOfficial: true },
        { id: '2', title: 'React Docs', url: 'https://react.dev', category: 'documentation', authorityScore: 95, type: 'Documentation', difficulty: 'Beginner', isFree: true, isOfficial: true },
        { id: '3', title: 'React Guide', url: 'https://react.dev/learn', category: 'documentation', authorityScore: 88, type: 'Documentation', difficulty: 'Beginner', isFree: true, isOfficial: true },
      ];

      const deduped = deduplicateResources(duplicates);
      expect(deduped.length).toBe(2);
    });

    it('20. Invalid URL filtering rejects malformed or fabricated URLs', () => {
      expect(validateResource({ url: 'javascript:void(0)', title: 'Test' })).toBe(false);
      expect(validateResource({ url: 'http://localhost/test', title: 'Test' })).toBe(false);
      expect(validateResource({ url: 'not-a-url', title: 'Test' })).toBe(false);
      expect(validateResource({ url: 'https://react.dev', title: 'React Docs' })).toBe(true);
      expect(validateResource({ url: 'https://www.youtube.com/watch?v=12345', title: 'Valid Video' })).toBe(true);
    });

    it('21. Resource ranking puts official documentation & top providers first', async () => {
      const result = await learningRecommendationService.searchResources({ query: 'React' });
      const docs = result.categories.documentation;

      expect(docs.length).toBeGreaterThan(0);
      const topDoc = docs[0];
      expect(topDoc.isOfficial || topDoc.authorityScore >= 95).toBe(true);
      expect(topDoc.url).toContain('react.dev');
    });

    it('22. Free-resource filtering correctly isolates free learning resources', async () => {
      const result = await learningRecommendationService.searchResources({
        query: 'Python',
        isFree: true,
      });

      const all = Object.values(result.categories).flat();
      for (const res of all) {
        expect(res.isFree).toBe(true);
      }
    });
  });
});
