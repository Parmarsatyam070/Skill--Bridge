import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { generateAccessToken, verifyAccessToken } from '../server/src/services/tokenService.js';
import { LoginSchema, RegisterStudentSchema } from '../shared/validation.js';

describe('Auth & Security Service Suite', () => {
  it('should securely hash and verify user passwords with bcrypt', async () => {
    const rawPassword = 'SecurePassword2026!';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and correctly verify JWT access tokens', () => {
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

  it('should generate valid OAuth 2.0 authorization URLs for Google, GitHub, and Microsoft', async () => {
    const { getAuthorizationUrl } = await import('../server/src/services/oauthService.js');
    const redirectUri = 'http://localhost:5173/auth/callback';

    const googleUrl = getAuthorizationUrl('google', redirectUri, 'state-123');
    expect(googleUrl.authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(googleUrl.authUrl).toContain('redirect_uri=' + encodeURIComponent(redirectUri));
    expect(googleUrl.authUrl).toContain('openid');

    const githubUrl = getAuthorizationUrl('github', redirectUri, 'state-456');
    expect(githubUrl.authUrl).toContain('github.com/login/oauth/authorize');
    expect(githubUrl.authUrl).toContain('redirect_uri=' + encodeURIComponent(redirectUri));

    const microsoftUrl = getAuthorizationUrl('microsoft', redirectUri, 'state-789');
    expect(microsoftUrl.authUrl).toContain('login.microsoftonline.com/common/oauth2/v2.0/authorize');
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
});
