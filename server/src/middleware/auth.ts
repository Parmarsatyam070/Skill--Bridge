import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';
import { prisma } from '../config/prisma.js';
import { adminAuth } from '../config/firebase.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    studentProfileId?: string;
    industryProfileId?: string;
    academicianProfileId?: string;
    institutionProfileId?: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // Check Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please sign in.' }
    });
  }

  // 1. Primary: Verify Firebase ID token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const cleanEmail = decodedToken.email?.toLowerCase().trim();

    // Find user in Postgres by Firebase UID OR by verified email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decodedToken.uid },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: {
        studentProfile: true,
        industryProfile: true,
        academicianProfile: true,
        institutionProfile: true,
      },
    });

    if (user) {
      // Auto-link Firebase UID if not yet saved on the PostgreSQL record
      if (!user.firebaseUid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: decodedToken.uid },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        studentProfileId: user.studentProfile?.id,
        industryProfileId: user.industryProfile?.id,
        academicianProfileId: user.academicianProfile?.id,
        institutionProfileId: user.institutionProfile?.id,
      };

      return next();
    }
  } catch (firebaseErr: any) {
    // Firebase verification failed or threw. Fall through to check if test-only fallback is allowed.
  }

  // 2. Fallback: Legacy JWT verification (STRICTLY gated to test / internal script environments)
  const isTestOrScript = process.env.NODE_ENV === 'test' || process.env.ALLOW_LEGACY_AUTH === 'true';
  if (isTestOrScript) {
    const payload = verifyAccessToken(token);
    if (payload) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            studentProfileId: user.studentProfile?.id,
            industryProfileId: user.industryProfile?.id,
            academicianProfileId: user.academicianProfile?.id,
            institutionProfileId: user.institutionProfile?.id,
          };
          return next();
        }
      } catch (dbErr) {
        console.error('Legacy auth database error:', dbErr);
      }
    }
  }

  return res.status(401).json({
    error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid token. Please log in again.' }
  });
}

export async function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const cleanEmail = decodedToken.email?.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decodedToken.uid },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: {
        studentProfile: true,
        industryProfile: true,
        academicianProfile: true,
        institutionProfile: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        studentProfileId: user.studentProfile?.id,
        industryProfileId: user.industryProfile?.id,
        academicianProfileId: user.academicianProfile?.id,
        institutionProfileId: user.institutionProfile?.id,
      };
      return next();
    }
  } catch {
    // Firebase verification failed. Check test/legacy fallback.
  }

  const isTestOrScript = process.env.NODE_ENV === 'test' || process.env.ALLOW_LEGACY_AUTH === 'true';
  if (isTestOrScript) {
    try {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            studentProfileId: user.studentProfile?.id,
            industryProfileId: user.industryProfile?.id,
            academicianProfileId: user.academicianProfile?.id,
            institutionProfileId: user.institutionProfile?.id,
          };
        }
      }
    } catch (err) {
      console.warn('Optional auth error:', err);
    }
  }

  return next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: [${allowedRoles.join(', ')}], your role: ${req.user.role}`,
        }
      });
    }

    next();
  };
}
