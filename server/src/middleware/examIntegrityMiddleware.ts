import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { checkUserSuspension } from '../services/examIntegrityService.js';

/**
 * Middleware ensuring the authenticated user is NOT currently under an active
 * 5-minute exam suspension before starting, answering, submitting, or executing protected exam sessions.
 */
export async function requireExamAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for protected examination access.',
      },
    });
  }

  try {
    const suspension = await checkUserSuspension(userId);
    if (suspension.isSuspended) {
      return res.status(403).json({
        error: {
          code: 'EXAM_ACCESS_SUSPENDED',
          message:
            'Your assessment access is temporarily suspended due to multiple integrity violations.',
          suspendedUntil: suspension.suspendedUntil,
          remainingSeconds: suspension.remainingSeconds,
          reason: suspension.reason,
          violationCount: suspension.violationCount,
        },
      });
    }

    next();
  } catch (err: any) {
    console.error('Error verifying exam integrity suspension status:', err);
    // Fail-open for unanticipated server exceptions to prevent accidental system lockouts
    next();
  }
}
