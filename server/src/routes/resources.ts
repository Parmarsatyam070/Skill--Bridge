import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { getLearningResources, getRecommendedResourcesForSkill } from '../services/learningResourceService.js';
import { searchLearningHub, getPersonalizedRecommendations } from '../services/learningRecommendationService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/resources/search
 * Comprehensive omni-topic search returning 9 categorized sections (Recommended, Videos, Courses, Documentation, Articles, Practice, Projects, Books, Interview Prep).
 */
router.get('/search', async (req, res: Response) => {
  try {
    const rawQ =
      (req.query.query as string) ||
      (req.query.q as string) ||
      (req.query.search as string) ||
      '';
    const category =
      (req.query.category as string) ||
      (req.query.type as string) ||
      'all';
    const isFreeParam =
      req.query.isFree !== undefined
        ? req.query.isFree === 'true'
        : req.query.freeOnly !== undefined
        ? req.query.freeOnly === 'true'
        : undefined;

    const results = await searchLearningHub({
      query: rawQ,
      category,
      isFree: isFreeParam,
    });

    return res.json({
      success: true,
      query: results.query,
      totalResults: results.totalResults,
      categories: results.categories,
      data: results,
    });
  } catch (error: any) {
    console.error('Error in GET /api/resources/search:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/resources/personalized
 * Returns personalized recommendations based on student's weak areas in DSA and skill assessments.
 */
router.get('/personalized', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      // Fallback for general personalized results
      const general = await searchLearningHub('DSA');
      return res.json({ success: true, data: general });
    }

    const personalized = await getPersonalizedRecommendations(studentId);
    return res.json({ success: true, data: personalized });
  } catch (error: any) {
    console.error('Error in GET /api/resources/personalized:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/resources
 * Retrieves all learning resources with optional filtering by domain, topicTag, type, isFree, search
 */
router.get('/', async (req, res: Response) => {
  const domain = req.query.domain as string | undefined;
  const topicTag = req.query.topicTag as string | undefined;
  const type = req.query.type as string | undefined;
  const search = req.query.search as string | undefined;
  const isFreeParam = req.query.isFree as string | undefined;
  const isFree = isFreeParam !== undefined ? isFreeParam === 'true' : undefined;

  try {
    const resources = await getLearningResources({
      domain,
      topicTag,
      type,
      search,
      isFree,
    });
    return res.json({ resources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/resources/skill/:skillIdOrName
 * Retrieves 2-3 recommended resources for a specific skill gap
 */
router.get('/skill/:skillIdOrName', async (req, res: Response) => {
  const { skillIdOrName } = req.params;
  const limit = parseInt(req.query.limit as string) || 3;

  try {
    const resources = await getRecommendedResourcesForSkill(skillIdOrName, limit);
    return res.json({ resources });
  } catch (error: any) {
    console.error('Error fetching skill recommendations:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/resources/gaps/:studentId
 * Analyzes the student's current domain skill gaps and returns matched resources per gap
 */
router.get('/gaps/:studentId', authenticate, async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        skillScores: { include: { skill: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student profile not found' } });
    }

    const domainName = student.targetDomain || 'Full-Stack Web';

    const domainRecord = await prisma.domain.findFirst({
      where: { OR: [{ name: domainName }, { slug: domainName }, { id: domainName }] },
      include: { requirements: { include: { skill: true } } },
    });

    const requirements = domainRecord ? domainRecord.requirements : [];
    const scoreMap = new Map(student.skillScores.map(ss => [ss.skillId, ss.score]));

    // Find all gaps
    const gaps = requirements.map(r => {
      const currentScore = scoreMap.get(r.skillId) || 0;
      return {
        skillId: r.skillId,
        skillName: r.skill.name,
        currentScore,
        benchmarkScore: r.benchmarkScore,
        gap: Math.max(0, r.benchmarkScore - currentScore),
      };
    }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);

    // Map each gap to recommended resources
    const gapRecommendations = await Promise.all(
      gaps.map(async g => {
        const resources = await getRecommendedResourcesForSkill(g.skillName, 2);
        return {
          ...g,
          resources,
        };
      })
    );

    return res.json({
      domain: domainName,
      totalGaps: gaps.length,
      gaps: gapRecommendations,
    });
  } catch (error: any) {
    console.error('Error fetching gap resources:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;

