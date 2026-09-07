import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/**
 * Robust Environment Variable Loader & Safe Startup Validator
 * 
 * Guarantees environment variables (DATABASE_URL, PORT, JWT_SECRET, JWT_REFRESH_SECRET)
 * are loaded synchronously before PrismaClient or any database-dependent route is evaluated.
 */

// Compute directory of current file regardless of working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate paths in order of precedence:
// 1. server/.env (relative to cwd or server directory)
// 2. .env (root directory)
const candidateEnvPaths: string[] = [
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '..', '..', '.env'),       // server/.env from server/src/config
  path.resolve(__dirname, '..', '..', '..', '.env'), // root .env from server/src/config
];

let envLoadedFrom: string | null = null;

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    if (!envLoadedFrom) {
      envLoadedFrom = envPath;
    }
  }
}

// Fallback to default dotenv lookup if no candidate was matched
if (!envLoadedFrom) {
  dotenv.config();
}

/**
 * Safe startup validation
 * NEVER prints or exposes secret values.
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    missing.push('DATABASE_URL');
    console.error('❌ [CONFIG ERROR] DATABASE_URL is not configured. Please add it to server/.env.');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    missing.push('JWT_SECRET');
    console.warn('⚠️ [CONFIG WARNING] JWT_SECRET is not configured. Using temporary fallback (set JWT_SECRET in server/.env for security).');
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.trim() === '') {
    missing.push('JWT_REFRESH_SECRET');
    console.warn('⚠️ [CONFIG WARNING] JWT_REFRESH_SECRET is not configured. Using temporary fallback (set JWT_REFRESH_SECRET in server/.env for security).');
  }

  const isDev = process.env.NODE_ENV !== 'production';
  if (process.env.DATABASE_URL) {
    // Confirm presence without exposing credentials
    const isPostgres = process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://');
    if (isDev) {
      console.log(`✅ [CONFIG] Database configuration detected: ${isPostgres ? 'PostgreSQL' : 'Custom protocol'}`);
    }
  }

  return {
    isValid: !missing.includes('DATABASE_URL'),
    missing,
  };
}

// Execute validation immediately upon module import
export const envStatus = validateEnvironment();

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'skillbridge_jwt_secret_default_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'skillbridge_refresh_secret_default_2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

export default ENV;
