import { Router, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  recordIntegrityEvent,
  getActiveSuspensionState,
} from '../services/examIntegrityService.js';

const router = Router();

// Rate limiter for integrity event ingestion: 60 requests per minute per authenticated user
const integrityRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 300 : 60,
  keyGenerator: (req: any) => req.user?.id || req.ip || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many integrity events submitted in a short period.',
    },
  },
});

const RecordIntegrityEventSchema = z.object({
  sessionId: z.string().min(1).max(100),
  sessionType: z.enum([
    'TALENT_ASSESSMENT',
    'PRACTICE_SET',
    'DAILY_SET',
    'DSA_PRACTICE',
    'MOCK_INTERVIEW',
    'AI_INTERVIEW',
    'PROTECTED_EXAM',
  ]),
  eventType: z.enum([
    'COPY_ATTEMPT',
    'PASTE_ATTEMPT',
    'FORCE_PASTE_ATTEMPT',
    'CUT_ATTEMPT',
    'CONTEXT_MENU_ATTEMPT',
    'DRAG_DROP_ATTEMPT',
    'PRINT_SCREEN_ATTEMPT',
    'SCREENSHOT_ATTEMPT',
    'TAB_SWITCH',
    'WINDOW_BLUR',
    'VISIBILITY_CHANGE',
    'FULLSCREEN_EXIT',
  ]),
  metadata: z
    .object({
      targetElement: z.string().max(100).optional(),
      keyCombo: z.string().max(50).optional(),
      clientTimestamp: z.number().optional(),
      url: z.string().max(500).optional(),
    })
    .optional(),
});

/**
 * POST /api/integrity/events
 * Record a browser integrity event from a protected session.
 * Server authoritatively manages warning and 5-minute suspension states.
 */
router.post(
  '/events',
  authenticate,
  integrityRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = RecordIntegrityEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid integrity event payload.',
            details: parsed.error.format(),
          },
        });
      }

      const userId = req.user!.id;
      const result = await recordIntegrityEvent(userId, parsed.data);

      return res.json({
        data: result,
      });
    } catch (err: any) {
      console.error('Failed to record exam integrity event:', err);
      return res.status(500).json({
        error: {
          code: 'INTEGRITY_EVENT_RECORD_FAILED',
          message: err.message || 'Failed to record integrity event.',
        },
      });
    }
  }
);

/**
 * GET /api/integrity/status
 * Get the current suspension and violation status for the authenticated user.
 */
router.get(
  '/status',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const status = await getActiveSuspensionState(userId);

      return res.json({
        data: status,
      });
    } catch (err: any) {
      console.error('Failed to retrieve integrity suspension status:', err);
      return res.status(500).json({
        error: {
          code: 'INTEGRITY_STATUS_FAILED',
          message: err.message || 'Failed to retrieve integrity status.',
        },
      });
    }
  }
);

export default router;
