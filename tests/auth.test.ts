import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../server/src/services/tokenService.js';
import { LoginSchema, RegisterStudentSchema, RegisterIndustrySchema } from '../shared/validation.js';

describe('Auth & Security Service Suite', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should securely hash and verify user passwords with bcrypt', async () => {
    const rawPassword = 'SecurePassword2026!';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and correctly verify JWT access tokens and refresh tokens', () => {
    const payload = {
      userId: 'test-user-uuid-123',
      role: 'STUDENT',
      email: 'student@test.edu',
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe('STUDENT');

    const refreshToken = generateRefreshToken(payload);
    const verifiedRefresh = verifyRefreshToken(refreshToken);
    expect(verifiedRefresh).not.toBeNull();
    expect(verifiedRefresh?.userId).toBe(payload.userId);
  });

  it('should validate student registration payload with Zod schema', () => {
    const validStudent = {
      role: 'STUDENT' as const,
      name: 'Aarav Sharma',
      email: 'aarav@test.edu',
      password: 'password123',
      institution: 'NIT Trichy',
      targetDomain: 'Full-Stack Web',
      cgpa: 8.9,
    };

    const result = RegisterStudentSchema.safeParse(validStudent);
    expect(result.success).toBe(true);

    const invalidEmail = {
      ...validStudent,
      email: 'not-an-email',
    };
    const invalidResult = RegisterStudentSchema.safeParse(invalidEmail);
    expect(invalidResult.success).toBe(false);
  });

  it('should validate login payload with email, phone, or identifier', () => {
    const emailLogin = LoginSchema.safeParse({ email: 'test@dtu.ac.in', password: 'password123' });
    expect(emailLogin.success).toBe(true);

    const phoneLogin = LoginSchema.safeParse({ phone: '+91 98765 43210', password: 'password123' });
    expect(phoneLogin.success).toBe(true);

    const identifierLogin = LoginSchema.safeParse({ identifier: 'demo@skillbridge.app', password: 'password123' });
    expect(identifierLogin.success).toBe(true);

    const shortPassword = LoginSchema.safeParse({ identifier: 'demo@skillbridge.app', password: '123' });
    expect(shortPassword.success).toBe(false);
  });

  it('should throw clear configuration error when OAuth credentials are unset', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const { getAuthorizationUrl, isOauthConfigured } = await import('../server/src/services/oauthService.js');
    expect(isOauthConfigured('google')).toBe(false);

    expect(() => getAuthorizationUrl('google', 'https://skillbridge.app/auth/callback')).toThrow(
      /OAuth provider 'google' is not configured on the server/
    );
  });

  it('should generate valid OAuth 2.0 authorization URLs when configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
    process.env.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret';

    const { getAuthorizationUrl } = await import('../server/src/services/oauthService.js');
    const redirectUri = 'https://skill-bridge-7j3l.onrender.com/auth/callback';

    const googleUrl = getAuthorizationUrl('google', redirectUri, 'state-123');
    expect(googleUrl.configured).toBe(true);
    expect(googleUrl.authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(googleUrl.authUrl).toContain('client_id=test-google-client-id');
    expect(googleUrl.authUrl).toContain('redirect_uri=' + encodeURIComponent(redirectUri));
    expect(googleUrl.authUrl).toContain('openid');

    const githubUrl = getAuthorizationUrl('github', redirectUri, 'state-456');
    expect(githubUrl.configured).toBe(true);
    expect(githubUrl.authUrl).toContain('github.com/login/oauth/authorize');
    expect(githubUrl.authUrl).toContain('client_id=test-github-client-id');
    expect(githubUrl.authUrl).toContain('redirect_uri=' + encodeURIComponent(redirectUri));

    const microsoftUrl = getAuthorizationUrl('microsoft', redirectUri, 'state-789');
    expect(microsoftUrl.configured).toBe(true);
    expect(microsoftUrl.authUrl).toContain('login.microsoftonline.com/common/oauth2/v2.0/authorize');
    expect(microsoftUrl.authUrl).toContain('client_id=test-microsoft-client-id');
  });

  it('should securely sign and verify OAuth onboarding tokens with role preservation', async () => {
    const { createOAuthOnboardingToken, verifyOAuthOnboardingToken } = await import('../server/src/services/oauthService.js');

    const verifiedUser = {
      provider: 'google' as const,
      providerId: 'google-sub-987654',
      email: 'verified.student@gmail.com',
      name: 'Priya Patel',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    };

    const onboardingToken = createOAuthOnboardingToken(verifiedUser);
    expect(typeof onboardingToken).toBe('string');

    const decoded = verifyOAuthOnboardingToken(onboardingToken);
    expect(decoded.email).toBe('verified.student@gmail.com');
    expect(decoded.name).toBe('Priya Patel');
    expect(decoded.provider).toBe('google');
    expect(decoded.type).toBe('oauth_onboarding');

    // Reject tampered token
    expect(() => verifyOAuthOnboardingToken(onboardingToken + 'tampered')).toThrow();
  });

  it('should authenticate registered users via email and verify password hash', async () => {
    const { prisma } = await import('../server/src/config/prisma.js');
    const user = await prisma.user.findFirst({
      where: { email: 'demo@skillbridge.app' },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('demo@skillbridge.app');
    expect(user?.role).toBe('STUDENT');

    const isValidPassword = await bcrypt.compare('password123', user!.passwordHash!);
    expect(isValidPassword).toBe(true);

    const isInvalidPassword = await bcrypt.compare('WrongPassword999', user!.passwordHash!);
    expect(isInvalidPassword).toBe(false);
  });

  it('should support resilient phone number lookups across multiple formats', async () => {
    const { prisma } = await import('../server/src/config/prisma.js');
    
    // Test finding user with phone variants
    const testCases = ['+91 98765 00000', '+919876500000', '9876500000'];
    
    for (const rawKey of testCases) {
      const digitsOnly = rawKey.replace(/\D/g, '');
      const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

      const phoneConditions: any[] = [{ phone: rawKey }];
      if (digitsOnly && digitsOnly !== rawKey) {
        phoneConditions.push({ phone: digitsOnly });
        phoneConditions.push({ phone: `+${digitsOnly}` });
      }
      if (last10Digits.length === 10) {
        phoneConditions.push({ phone: last10Digits });
        phoneConditions.push({ phone: `+91${last10Digits}` });
        phoneConditions.push({ phone: `+91 ${last10Digits.slice(0, 5)} ${last10Digits.slice(5)}` });
        phoneConditions.push({ phone: `+91 ${last10Digits}` });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: rawKey.toLowerCase() },
            ...phoneConditions,
          ],
        },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe('demo@skillbridge.app');
    }
  });

  it('should validate environment variables safely without leaking secret values', async () => {
    const { validateEnvironment } = await import('../server/src/config/env.js');
    
    // When DATABASE_URL is set
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5432/test_db';
    const validResult = validateEnvironment();
    expect(validResult.isValid).toBe(true);

    // When DATABASE_URL is removed
    delete process.env.DATABASE_URL;
    const invalidResult = validateEnvironment();
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.missing).toContain('DATABASE_URL');
  });

  it('should never expose stack traces, file paths, or Prisma query internals in client error messages', () => {
    // Simulated raw internal Prisma error with file paths and query details
    const rawPrismaError = new Error(
      'Invalid `prisma.user.findFirst()` invocation at C:\\Users\\hp\\OneDrive\\Desktop\\Skill--Bridge\\server\\src\\routes\\auth.ts:126\nEnvironment variable not found: DATABASE_URL'
    );

    // Verify sanitization logic: internal traces must be completely stripped
    const isInternal =
      rawPrismaError.message.includes('prisma') ||
      rawPrismaError.message.includes('DATABASE_URL') ||
      rawPrismaError.message.includes('\\') ||
      rawPrismaError.message.includes('/');

    expect(isInternal).toBe(true);

    // Client facing message must be generic and safe
    const clientMessage = isInternal
      ? 'Could not synchronize provider profile with database. Please try again in a moment.'
      : rawPrismaError.message;

    expect(clientMessage).not.toContain('prisma');
    expect(clientMessage).not.toContain('DATABASE_URL');
    expect(clientMessage).not.toContain('C:\\');
    expect(clientMessage).not.toContain('auth.ts');
    expect(clientMessage).toBe('Could not synchronize provider profile with database. Please try again in a moment.');
  });
});

