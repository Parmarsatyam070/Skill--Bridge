import jwt from 'jsonwebtoken';
import { UserSession } from '../../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_jwt_secret_default_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'skillbridge_refresh_secret_default_2026';

export const SKILLBRIDGE_TOKEN_ISSUER = 'skillbridge-auth';
export const SKILLBRIDGE_ACCESS_TOKEN_TYPE = 'access';
export const SKILLBRIDGE_REFRESH_TOKEN_TYPE = 'refresh';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  iss?: string;
  tokenType?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      tokenType: SKILLBRIDGE_ACCESS_TOKEN_TYPE,
    },
    JWT_SECRET,
    {
      expiresIn: '2h',
      issuer: SKILLBRIDGE_TOKEN_ISSUER,
    }
  );
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      tokenType: SKILLBRIDGE_REFRESH_TOKEN_TYPE,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: SKILLBRIDGE_TOKEN_ISSUER,
    }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || typeof decoded !== 'object') return null;
    if (!decoded.userId || typeof decoded.userId !== 'string') return null;
    // Check issuer if specified in token
    if (decoded.iss && decoded.iss !== SKILLBRIDGE_TOKEN_ISSUER) return null;
    // Check tokenType if specified in token
    if (decoded.tokenType && decoded.tokenType !== SKILLBRIDGE_ACCESS_TOKEN_TYPE) return null;
    return decoded as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (!decoded || typeof decoded !== 'object') return null;
    if (!decoded.userId || typeof decoded.userId !== 'string') return null;
    if (decoded.iss && decoded.iss !== SKILLBRIDGE_TOKEN_ISSUER) return null;
    if (decoded.tokenType && decoded.tokenType !== SKILLBRIDGE_REFRESH_TOKEN_TYPE) return null;
    return decoded as TokenPayload;
  } catch (err) {
    return null;
  }
}
