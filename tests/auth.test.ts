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
});
