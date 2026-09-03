import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';
import { prisma } from '../config/prisma.js';

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

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid token. Please log in again.' }
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        studentProfile: true,
        industryProfile: true,
        academicianProfile: true,
        institutionProfile: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists.' }
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

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error during authentication.' }
    });
  }
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
