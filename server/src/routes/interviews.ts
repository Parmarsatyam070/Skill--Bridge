import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireStudentProfile } from '../middleware/authorization.js';
import { requireExamAccess } from '../middleware/examIntegrityMiddleware.js';
import { aiRateLimiter, aiHeavyGenerationLimiter, validateAiInput } from '../middleware/aiRateLimit.js';
import {
  StartInterviewSchema,
  SubmitInterviewAnswerSchema,
  CompleteInterviewSchema,
} from '../../../shared/validation.js';
import { interviewService } from '../services/interviewService.js';

const router = Router();

// ============================================================
// 1. START / CREATE INTERVIEW SESSION
// POST /api/interviews
// ============================================================
router.post(
  '/',
  authenticate,
  requireStudentProfile,
  requireExamAccess,
  aiHeavyGenerationLimiter,
  validateAiInput(1000),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = StartInterviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid interview creation payload',
            details: parsed.error.flatten(),
          },
        });
      }

      const session = await interviewService.startInterviewSession(
        req.user!.studentProfileId!,
        parsed.data
      );

      return res.status(201).json({
        success: true,
        data: session,
      });
    } catch (err: any) {
      console.error('[INTERVIEW_START_ERROR]', err);
      return res.status(err.message?.includes('not found') ? 404 : 500).json({
        error: {
          code: 'INTERVIEW_START_FAILED',
          message: err.message || 'Failed to initialize interview session',
        },
      });
    }
  }
);

// ============================================================
// 2. LIST AUTHORIZED INTERVIEWS
// GET /api/interviews
// ============================================================
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;

    if (role === 'STUDENT') {
      const candidateProfileId = req.user!.studentProfileId;
      if (!candidateProfileId) {
        return res.status(403).json({
          error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required' },
        });
      }
      const sessions = await interviewService.listCandidateInterviews(candidateProfileId);
      return res.json({ success: true, data: sessions });
    }

    if (role === 'INDUSTRY') {
      const industryProfileId = req.user!.industryProfileId;
      if (!industryProfileId) {
        return res.status(403).json({
          error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile required' },
        });
      }
      const opportunityId = req.query.opportunityId as string | undefined;
      const sessions = await interviewService.listIndustryInterviews(industryProfileId, opportunityId);
      return res.json({ success: true, data: sessions });
    }

    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Academician and Institution roles cannot access candidate interviews',
      },
    });
  } catch (err: any) {
    console.error('[INTERVIEWS_LIST_ERROR]', err);
    return res.status(500).json({
      error: { code: 'LIST_FAILED', message: err.message || 'Failed to list interviews' },
    });
  }
});

// ============================================================
// 3. GET INTERVIEW SESSION DETAIL
// GET /api/interviews/:id
// ============================================================
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const session = await interviewService.getInterviewSessionDetail(req.params.id, {
      userId: req.user!.id,
      role: req.user!.role,
      profileId: req.user!.studentProfileId || req.user!.industryProfileId,
    });

    return res.json({ success: true, data: session });
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: err.message },
      });
    }
    if (err.message?.includes('not found')) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Interview session not found' },
      });
    }
    console.error('[INTERVIEW_GET_ERROR]', err);
    return res.status(500).json({
      error: { code: 'FETCH_FAILED', message: err.message || 'Failed to fetch interview session' },
    });
  }
});

// ============================================================
// 4. SUBMIT ANSWER
// POST /api/interviews/:id/answer
// ============================================================
router.post(
  '/:id/answer',
  authenticate,
  requireStudentProfile,
  requireExamAccess,
  aiRateLimiter,
  validateAiInput(3000),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = SubmitInterviewAnswerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid answer payload',
            details: parsed.error.flatten(),
          },
        });
      }

      const result = await interviewService.submitInterviewAnswer(
        req.params.id,
        req.user!.studentProfileId!,
        parsed.data
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('Duplicate submission')) {
        return res.status(409).json({
          error: { code: 'DUPLICATE_SUBMISSION', message: err.message },
        });
      }
      if (err.message?.includes('FORBIDDEN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: err.message },
        });
      }
      if (err.message?.includes('not active') || err.message?.includes('cannot be modified')) {
        return res.status(422).json({
          error: { code: 'INTERVIEW_LOCKED', message: err.message },
        });
      }
      if (err.message?.includes('not found')) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: err.message },
        });
      }

      console.error('[INTERVIEW_ANSWER_ERROR]', err);
      return res.status(500).json({
        error: { code: 'SUBMIT_ANSWER_FAILED', message: err.message || 'Failed to record answer' },
      });
    }
  }
);

// ============================================================
// 5. COMPLETE INTERVIEW SESSION & GENERATE EVALUATION
// POST /api/interviews/:id/complete
// ============================================================
router.post(
  '/:id/complete',
  authenticate,
  requireStudentProfile,
  requireExamAccess,
  aiHeavyGenerationLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = CompleteInterviewSchema.safeParse(req.body);
      const input = parsed.success ? parsed.data : undefined;

      const evaluation = await interviewService.completeInterviewSession(
        req.params.id,
        req.user!.studentProfileId!,
        input
      );

      return res.json({
        success: true,
        data: evaluation,
      });
    } catch (err: any) {
      if (err.message?.includes('FORBIDDEN')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: err.message },
        });
      }
      if (err.message?.includes('zero recorded answers')) {
        return res.status(422).json({
          error: { code: 'INCOMPLETE_INTERVIEW', message: err.message },
        });
      }
      if (err.message?.includes('not found')) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: err.message },
        });
      }

      console.error('[INTERVIEW_COMPLETE_ERROR]', err);
      return res.status(500).json({
        error: { code: 'COMPLETE_FAILED', message: err.message || 'Failed to complete interview' },
      });
    }
  }
);

// ============================================================
// 6. GET INTERVIEW RESULT & SCORECARD
// GET /api/interviews/:id/result
// ============================================================
router.get('/:id/result', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await interviewService.getInterviewResult(req.params.id, {
      userId: req.user!.id,
      role: req.user!.role,
      profileId: req.user!.studentProfileId || req.user!.industryProfileId,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    if (err.message?.includes('FORBIDDEN')) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: err.message },
      });
    }
    if (err.message?.includes('not yet complete')) {
      return res.status(400).json({
        error: { code: 'NOT_COMPLETED', message: err.message },
      });
    }
    if (err.message?.includes('not found')) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }

    console.error('[INTERVIEW_RESULT_ERROR]', err);
    return res.status(500).json({
      error: { code: 'RESULT_FETCH_FAILED', message: err.message || 'Failed to retrieve result' },
    });
  }
});

export default router;
