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
    const tokenEmail = decodedToken.email || (decodedToken as any).claims?.email;
    const cleanEmail = tokenEmail ? String(tokenEmail).toLowerCase().trim() : undefined;
    const uid = decodedToken.uid;
    const isEmailVerified = Boolean(decodedToken.email_verified);

    const provider = decodedToken.firebase?.sign_in_provider;
    const isExplicitExternalProvider = Boolean(
      provider && ['google.com', 'github.com', 'microsoft.com', 'apple.com', 'password', 'phone', 'anonymous'].includes(provider)
    );
    const isFallbackToken = !isExplicitExternalProvider && Boolean(
      (decodedToken as any).isSkillBridgeFallback === true ||
      provider === 'custom' ||
      (!provider && (decodedToken as any).skillbridgeUserId) ||
      (!provider && !decodedToken.firebase)
    );
    const fallbackUserId = (decodedToken as any).skillbridgeUserId;

    let user: any = null;

    if (isFallbackToken) {
      // Controlled SkillBridge fallback token: match by user.id
      const targetId = fallbackUserId || uid;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (isUuid) {
        user = await prisma.user.findUnique({
          where: { id: targetId },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: 'insensitive' as const } },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
      // Note: DO NOT set user.firebaseUid = uid here because uid is user.id, not a genuine Firebase UID.
    } else {
      // Genuine Firebase ID token:
      // PRIMARY: Check by verified firebaseUid = verified token UID
      user = await prisma.user.findFirst({
        where: { firebaseUid: uid },
        include: {
          studentProfile: true,
          industryProfile: true,
          academicianProfile: true,
          institutionProfile: true,
        },
      });

      // SECONDARY: If not found by firebaseUid and token has a verified email, search by email (case-insensitive)
      if (!user && cleanEmail && isEmailVerified) {
        user = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: 'insensitive' as const } },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });

        // Link the genuine Firebase UID to this account if not yet linked
        if (user && user.firebaseUid !== uid) {
          // UID Collision Guard: reject if this UID already belongs to a DIFFERENT user
          const uidOwner = await prisma.user.findFirst({
            where: { firebaseUid: uid },
            select: { id: true },
          });
          if (uidOwner && uidOwner.id !== user.id) {
            // Another user already owns this Firebase UID — do not reassign
            // Log and reject rather than silently stealing the UID
            console.error(
              `[AUTH middleware] Firebase UID ${uid} is already linked to user ${uidOwner.id}, ` +
              `rejecting link attempt for user ${user.id} (${user.email}).`
            );
            return next(Object.assign(new Error('Firebase UID already linked to another user.'), { status: 409, code: 'FIREBASE_UID_ALREADY_LINKED' }));
          }
          user = await prisma.user.update({
            where: { id: user.id },
            data: { firebaseUid: uid },
            include: {
              studentProfile: true,
              industryProfile: true,
              academicianProfile: true,
              institutionProfile: true,
            },
          });
        }
      }
    }

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role, // Authoritative role from PostgreSQL
        studentProfileId: user.studentProfile?.id,
        industryProfileId: user.industryProfile?.id,
        academicianProfileId: user.academicianProfile?.id,
        institutionProfileId: user.institutionProfile?.id,
      };

      return next();
    }
  } catch (firebaseErr: any) {
    // Firebase verification failed or threw. Fall through to verify SkillBridge JWT.
  }

  // 2. Strict SkillBridge Access Token (JWT) verification (Rule 9)
  const payload = verifyAccessToken(token);
  if (payload && payload.userId && typeof payload.userId === 'string') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId);
    if (isUuid) {
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
          // Authoritative role from PostgreSQL User record, NOT from unverified token payload
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
        console.error('SkillBridge access token database lookup error:', dbErr);
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
    const tokenEmail = decodedToken.email || (decodedToken as any).claims?.email;
    const cleanEmail = tokenEmail ? String(tokenEmail).toLowerCase().trim() : undefined;
    const uid = decodedToken.uid;
    const isEmailVerified = Boolean(decodedToken.email_verified);

    const provider = decodedToken.firebase?.sign_in_provider;
    const isExplicitExternalProvider = Boolean(
      provider && ['google.com', 'github.com', 'microsoft.com', 'apple.com', 'password', 'phone', 'anonymous'].includes(provider)
    );
    const isFallbackToken = !isExplicitExternalProvider && Boolean(
      (decodedToken as any).isSkillBridgeFallback === true ||
      provider === 'custom' ||
      (!provider && (decodedToken as any).skillbridgeUserId) ||
      (!provider && !decodedToken.firebase)
    );
    const fallbackUserId = (decodedToken as any).skillbridgeUserId;

    let user: any = null;

    if (isFallbackToken) {
      const targetId = fallbackUserId || uid;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (isUuid) {
        user = await prisma.user.findUnique({
          where: { id: targetId },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: 'insensitive' as const } },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
    } else {
      user = await prisma.user.findFirst({
        where: { firebaseUid: uid },
        include: {
          studentProfile: true,
          industryProfile: true,
          academicianProfile: true,
          institutionProfile: true,
        },
      });

      if (!user && cleanEmail && isEmailVerified) {
        user = await prisma.user.findFirst({
          where: { email: { equals: cleanEmail, mode: 'insensitive' as const } },
          include: {
            studentProfile: true,
            industryProfile: true,
            academicianProfile: true,
            institutionProfile: true,
          },
        });
      }
    }

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
    // Firebase verification failed. Check SkillBridge access token.
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload && payload.userId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId);
      if (isUuid) {
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
    }
  } catch (err) {
    console.warn('Optional auth error:', err);
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
