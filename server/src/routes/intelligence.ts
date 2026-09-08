/**
 * Intelligence Dashboard Routes
 *
 * Exposes deterministic analytics endpoints and safe advisory AI endpoints
 * for Industry recruiters and Institution Administrators.
 *
 * CRITICAL ACCESS CONTROL RULES:
 * - Industry endpoints strictly restricted to authenticated INDUSTRY role with valid industryProfileId.
 * - Institution endpoints strictly restricted to authenticated INSTITUTION_ADMIN role with valid institutionProfileId.
 * - No automatic cross-tenant leakage.
 * - AI endpoints protected by aiRateLimiter and input validation.
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/aiRateLimit.js';
import {
  IntelligencePaginationQuerySchema,
  IntelligenceDateFilterSchema,
  AffectedStudentsQuerySchema,
} from '../../../shared/validation.js';
import {
  getIndustryOverview,
  getIndustryFunnel,
  getIndustryOpportunityPerformance,
  getIndustrySkillDemand,
  getIndustryAssessmentAnalytics,
  getIndustryInterviewAnalytics,
  getIndustryTrends,
  generateIndustryAiSummary,
  getInstitutionOverview,
  getInstitutionSkillComparison,
  getInstitutionAffectedStudents,
  getInstitutionInterventions,
  getInstitutionTrends,
  generateInstitutionAiRecommendations,
} from '../services/intelligenceService.js';
import { generateCurrentSkillDemandSnapshot } from '../services/skillDemandSnapshotService.js';

const router = Router();

// ================================================================
// DEFENSIVE ROLE MIDDLEWARE
// ================================================================

function requireStrictIndustryRole(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }
  if (req.user.role !== 'INDUSTRY') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Industry role required.' },
    });
  }
  if (!req.user.industryProfileId) {
    return res.status(403).json({
      error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found for this account.' },
    });
  }
  return next();
}

function requireStrictInstitutionRole(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }
  if (req.user.role !== 'INSTITUTION_ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Institution Admin role required.' },
    });
  }
  if (!req.user.institutionProfileId) {
    return res.status(403).json({
      error: { code: 'NO_INSTITUTION_PROFILE', message: 'Institution profile not found for this account.' },
    });
  }
  return next();
}

// ================================================================
// INDUSTRY INTELLIGENCE ENDPOINTS
// ================================================================

/**
 * GET /api/intelligence/industry/overview
 */
router.get(
  '/industry/overview',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryOverview(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching industry overview:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch industry overview.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/funnel
 */
router.get(
  '/industry/funnel',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const filter = IntelligenceDateFilterSchema.safeParse(req.query);
      const opportunityId = filter.success ? filter.data.opportunityId : undefined;
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryFunnel(companyId, opportunityId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching industry funnel:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch industry funnel.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/opportunities
 */
router.get(
  '/industry/opportunities',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = IntelligencePaginationQuerySchema.safeParse(req.query);
      const query = parsed.success ? parsed.data : {};
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryOpportunityPerformance(companyId, query);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching opportunity performance:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch opportunity performance.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/skills
 */
router.get(
  '/industry/skills',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustrySkillDemand(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching skill demand:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch skill demand.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/assessments
 */
router.get(
  '/industry/assessments',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryAssessmentAnalytics(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching assessment analytics:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch assessment analytics.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/interviews
 */
router.get(
  '/industry/interviews',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryInterviewAnalytics(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching interview analytics:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch interview analytics.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/industry/trends
 */
router.get(
  '/industry/trends',
  authenticate,
  requireStrictIndustryRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await getIndustryTrends(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching industry trends:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch industry trends.' },
      });
    }
  }
);

/**
 * POST /api/intelligence/industry/ai-summary
 */
router.post(
  '/industry/ai-summary',
  authenticate,
  requireStrictIndustryRole,
  aiRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.user!.industryProfileId!;
      const data = await generateIndustryAiSummary(companyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error generating industry AI summary:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to generate AI summary.' },
      });
    }
  }
);

// ================================================================
// INSTITUTION INTELLIGENCE ENDPOINTS
// ================================================================

/**
 * GET /api/intelligence/institution/overview
 */
router.get(
  '/institution/overview',
  authenticate,
  requireStrictInstitutionRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const profileId = req.user!.institutionProfileId!;
      const data = await getInstitutionOverview(profileId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching institution overview:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution overview.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/institution/skills
 */
router.get(
  '/institution/skills',
  authenticate,
  requireStrictInstitutionRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const profileId = req.user!.institutionProfileId!;
      const data = await getInstitutionSkillComparison(profileId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching institution skills:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution skills.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/institution/affected-students
 */
router.get(
  '/institution/affected-students',
  authenticate,
  requireStrictInstitutionRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = AffectedStudentsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters' },
        });
      }
      const profileId = req.user!.institutionProfileId!;
      const data = await getInstitutionAffectedStudents(profileId, parsed.data);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching affected students:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch affected students.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/institution/interventions
 */
router.get(
  '/institution/interventions',
  authenticate,
  requireStrictInstitutionRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const profileId = req.user!.institutionProfileId!;
      const data = await getInstitutionInterventions(profileId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching institution interventions:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution interventions.' },
      });
    }
  }
);

/**
 * GET /api/intelligence/institution/trends
 */
router.get(
  '/institution/trends',
  authenticate,
  requireStrictInstitutionRole,
  async (req: AuthRequest, res: Response) => {
    try {
      const profileId = req.user!.institutionProfileId!;
      const data = await getInstitutionTrends(profileId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error fetching institution trends:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution trends.' },
      });
    }
  }
);

/**
 * POST /api/intelligence/institution/ai-recommendations
 */
router.post(
  '/institution/ai-recommendations',
  authenticate,
  requireStrictInstitutionRole,
  aiRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const profileId = req.user!.institutionProfileId!;
      const data = await generateInstitutionAiRecommendations(profileId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Error generating institution AI recommendations:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to generate recommendations.' },
      });
    }
  }
);

// ================================================================
// SNAPSHOT MAINTENANCE ENDPOINT
// ================================================================

/**
 * POST /api/intelligence/snapshots/generate
 * Generates monthly demand snapshot from open opportunities.
 */
router.post(
  '/snapshots/generate',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user || !['INDUSTRY', 'INSTITUTION_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Administrative or organizational role required.' },
        });
      }
      const result = await generateCurrentSkillDemandSnapshot();
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('Error generating snapshot:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to generate snapshot.' },
      });
    }
  }
);

export default router;
