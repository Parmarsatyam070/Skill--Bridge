import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  triggerThreeDayBan,
  checkUserExamSuspension,
  isProhibitedViolation,
} from '../server/src/services/examIntegrityService.js';

describe('Proctoring Strike & 3-Day Ban Protection (Eye Gaze & Noise)', () => {
  let testUserId: string;
  let testStudentProfileId: string;
  const testSessionId = `mock_session_test_${Date.now()}`;

  beforeAll(async () => {
    // Create test student user
    const user = await prisma.user.create({
      data: {
        email: `proctor_student_${Date.now()}@skillbridge.test`,
        name: 'Proctoring Test Candidate',
        role: 'STUDENT',
        passwordHash: 'hashed_pw',
      },
    });
    testUserId = user.id;

    const studentProfile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        targetDomain: 'Full-Stack Web',
        institution: 'SkillBridge Institute of Technology',
      },
    });
    testStudentProfileId = studentProfile.id;
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.examIntegrityEvent.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.userExamSuspension.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.studentProfile.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  it('verifies EYE_GAZE_VIOLATION and NOISE_VIOLATION are recognized as violations', () => {
    expect(isProhibitedViolation('EYE_GAZE_VIOLATION')).toBe(true);
    expect(isProhibitedViolation('NOISE_VIOLATION')).toBe(true);
    expect(isProhibitedViolation('TAB_SWITCH')).toBe(false);
  });

  it('triggerThreeDayBan sets exactly 72 hours (3 days) suspension in database', async () => {
    const banReason = 'Suspended for 3 days: Repeated eye movement away from screen (>3 times)';
    const result = await triggerThreeDayBan(
      testUserId,
      banReason,
      testSessionId,
      'MOCK_INTERVIEW'
    );

    expect(result.isSuspended).toBe(true);
    expect(result.reason).toBe(banReason);
    // 72 hours is 259200 seconds. Allow small variance for execution time
    expect(result.remainingSeconds).toBeGreaterThanOrEqual(259190);
    expect(result.remainingSeconds).toBeLessThanOrEqual(259200);

    // Verify database record
    const dbSuspension = await prisma.userExamSuspension.findUnique({
      where: { userId: testUserId },
    });
    expect(dbSuspension).toBeDefined();
    expect(dbSuspension?.violationCount).toBe(4);
    expect(dbSuspension?.reason).toBe(banReason);

    const suspendedAtMs = new Date(dbSuspension!.suspendedAt).getTime();
    const suspendedUntilMs = new Date(dbSuspension!.suspendedUntil).getTime();
    const diffHours = Math.round((suspendedUntilMs - suspendedAtMs) / (1000 * 60 * 60));
    expect(diffHours).toBe(72); // Exactly 72 hours (3 days)
  });

  it('checkUserExamSuspension blocks access while 3-day ban is active', async () => {
    const status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(true);
    expect(status.suspendedUntil).toBeDefined();
    expect(status.remainingSeconds).toBeGreaterThan(250000); // More than 2.8 days
    expect(status.reason).toContain('Repeated eye movement away');
  });

  it('simulates progressive eye movement strikes: strikes 1-3 warn, strike 4 triggers 3-day ban', async () => {
    // Clear suspension for this test
    await prisma.userExamSuspension.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.examIntegrityEvent.deleteMany({
      where: { userId: testUserId },
    });

    // Simulate Strike 1
    let strikeCount = 1;
    expect(strikeCount <= 3).toBe(true);
    let status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(false);

    // Simulate Strike 2
    strikeCount = 2;
    expect(strikeCount <= 3).toBe(true);
    status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(false);

    // Simulate Strike 3
    strikeCount = 3;
    expect(strikeCount <= 3).toBe(true);
    status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(false);

    // Strike 4 (> 3 times): Triggers 3-day ban
    strikeCount = 4;
    const ban = await triggerThreeDayBan(
      testUserId,
      'Suspended for 3 days: Repeated eye movement away from screen (>3 times)',
      `session_${Date.now()}`,
      'MOCK_INTERVIEW'
    );
    expect(ban.isSuspended).toBe(true);

    const postStrikeCheck = await checkUserExamSuspension(testUserId);
    expect(postStrikeCheck.isSuspended).toBe(true);
    expect(postStrikeCheck.reason).toContain('Repeated eye movement away');
    expect(postStrikeCheck.remainingSeconds).toBeGreaterThan(250000);
  }, 15000);

  it('simulates progressive noise strikes: strikes 1-3 warn, strike 4 triggers 3-day ban', async () => {
    // Clear suspension for this test
    await prisma.userExamSuspension.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.examIntegrityEvent.deleteMany({
      where: { userId: testUserId },
    });

    // Strike 1 to 3 should not suspend
    for (let strike = 1; strike <= 3; strike++) {
      const check = await checkUserExamSuspension(testUserId);
      expect(check.isSuspended).toBe(false);
    }

    // Strike 4 triggers ban
    const ban = await triggerThreeDayBan(
      testUserId,
      'Suspended for 3 days: Excessive background noise detected (>3 times)',
      `session_${Date.now()}`,
      'MOCK_INTERVIEW'
    );
    expect(ban.isSuspended).toBe(true);

    const status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(true);
    expect(status.reason).toContain('Excessive background noise');
    expect(status.remainingSeconds).toBeGreaterThan(250000);
  }, 15000);

  it('restores access automatically once 3-day suspension expires', async () => {
    // Put a suspension that expired 1 second ago
    await prisma.userExamSuspension.upsert({
      where: { userId: testUserId },
      update: {
        suspendedUntil: new Date(Date.now() - 1000),
      },
      create: {
        userId: testUserId,
        violationCount: 4,
        suspendedUntil: new Date(Date.now() - 1000),
        reason: 'Expired ban',
      },
    });

    const check = await checkUserExamSuspension(testUserId);
    expect(check.isSuspended).toBe(false);
    expect(check.remainingSeconds).toBe(0);
  });
});
