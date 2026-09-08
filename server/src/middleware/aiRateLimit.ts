import rateLimit from 'express-rate-limit';
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

/**
 * Dedicated AI Endpoint Rate Limiter
 *
 * Prevents denial-of-service and runaway token consumption.
 * Keyed on authenticated req.user.id (fallback to IP for unauthenticated).
 * Standard: 20 AI generation requests per minute per user.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 100 : 20, // 20 requests per minute in production
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI query rate limit exceeded. Please wait a minute before requesting further AI insights.',
    },
  },
});

/**
 * Stricter Rate Limiter for Heavy AI Generation (Interviews & Full Evaluations)
 *
 * 5 requests per 2 minutes per user.
 */
export const aiHeavyGenerationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: process.env.NODE_ENV === 'test' ? 50 : 6,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Heavy AI generation limit exceeded. Please wait a few moments before trying again.',
    },
  },
});

/**
 * AI Input Length Guard Middleware
 *
 * Enforces maximum prompt/text length of 3,000 characters to prevent prompt injection,
 * token exhaustion, and context window overflows.
 */
export function validateAiInput(maxChars: number = 3000) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const checkValue = (val: any, fieldName: string): boolean => {
      if (typeof val === 'string' && val.length > maxChars) {
        res.status(400).json({
          error: {
            code: 'PROMPT_TOO_LONG',
            message: `Field '${fieldName}' exceeds the maximum allowed length of ${maxChars} characters (got ${val.length}).`,
          },
        });
        return false;
      }
      return true;
    };

    if (req.body) {
      if (req.body.prompt && !checkValue(req.body.prompt, 'prompt')) return;
      if (req.body.query && !checkValue(req.body.query, 'query')) return;
      if (req.body.message && !checkValue(req.body.message, 'message')) return;
      if (req.body.answer && !checkValue(req.body.answer, 'answer')) return;
      if (req.body.text && !checkValue(req.body.text, 'text')) return;
    }

    return next();
  };
}
