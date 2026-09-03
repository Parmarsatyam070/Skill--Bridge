import jwt from 'jsonwebtoken';
import { UserSession } from '../../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_jwt_secret_default_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'skillbridge_refresh_secret_default_2026';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
