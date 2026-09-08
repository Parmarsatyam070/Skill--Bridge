import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireIndustryProfile } from '../middleware/authorization.js';
import { aiRateLimiter, aiHeavyGenerationLimiter, validateAiInput } from '../middleware/aiRateLimit.js';
import { handleCopilotQuery, compareCandidates } from '../services/recruiterCopilot.js';

const router = Router();

/**
 * POST /api/recruiter-copilot/query
 * Natural language query to the recruiter copilot.
 * AI output is advisory only — no DB writes.
 */
router.post(
  '/query',
  authenticate,
  requireIndustryProfile,
  aiRateLimiter,
  validateAiInput(3000),
  async (req: AuthRequest, res: Response) => {
    try {
      const { query, opportunityId } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'query must be a non-empty string.' }
        });
      }

      const result = await handleCopilotQuery(
        query.trim(),
        req.user!.industryProfileId!,
        opportunityId || undefined
      );

      return res.json({ copilotResponse: result });
    } catch (err: any) {
      console.error('Copilot query error:', err);
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Copilot query failed.' }
      });
    }
  }
);

/**
 * POST /api/recruiter-copilot/compare
 * Compare 2-5 candidates for an opportunity.
 * AI output is advisory only — no DB writes.
 */
router.post(
  '/compare',
  authenticate,
  requireIndustryProfile,
  aiHeavyGenerationLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { candidateIds, opportunityId } = req.body;

      if (!Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 5) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Provide between 2 and 5 candidateIds.' }
        });
      }

      if (!opportunityId || typeof opportunityId !== 'string') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'opportunityId is required.' }
        });
      }

      const result = await compareCandidates(candidateIds, opportunityId);

      return res.json({ comparison: result });
    } catch (err: any) {
      console.error('Copilot compare error:', err);
      if (err.message?.includes('between 2 and 5') || err.message?.includes('not found')) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
      }
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Candidate comparison failed.' }
      });
    }
  }
);

export default router;
