import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  recordExamIntegrityEvent,
  getExamIntegrityStatus,
  checkUserExamSuspension,
  isProhibitedViolation,
} from '../server/src/services/examIntegrityService.js';
import {
  ExamIntegrityEventType,
  ExamIntegritySessionType,
} from '../shared/types.js';

describe('Centralized Exam Integrity / Anti-Cheating System', () => {
  let testUserId: string;
  let testStudentProfileId: string;
  const testSessionId = `session_test_${Date.now()}`;

  beforeAll(async () => {
    // Create test user and student profile
    const user = await prisma.user.create({
      data: {
        email: `integrity_student_${Date.now()}@skillbridge.test`,
        name: 'Integrity Test Student',
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

  it('correctly categorizes prohibited violations vs observational events', () => {
    // Prohibited violation events
    expect(isProhibitedViolation('COPY_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('PASTE_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('FORCE_PASTE_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('CUT_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('CONTEXT_MENU_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('DRAG_DROP_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('PRINT_SCREEN_ATTEMPT')).toBe(true);
    expect(isProhibitedViolation('SCREENSHOT_ATTEMPT')).toBe(true);

    // Observational events (NOT confirmed violations)
    expect(isProhibitedViolation('TAB_SWITCH')).toBe(false);
    expect(isProhibitedViolation('WINDOW_BLUR')).toBe(false);
    expect(isProhibitedViolation('VISIBILITY_CHANGE')).toBe(false);
    expect(isProhibitedViolation('FULLSCREEN_EXIT')).toBe(false);
  });

  it('1st confirmed violation (COPY_ATTEMPT) issues exactly ONE warning and does NOT suspend', async () => {
    const res = await recordExamIntegrityEvent(
      testUserId,
      testSessionId,
      'TALENT_ASSESSMENT',
      'COPY_ATTEMPT'
    );

    expect(res.action).toBe('WARNING');
    expect(res.violationCount).toBe(1);
    expect(res.warningIssued).toBe(true);
    expect(res.suspensionTriggered).toBe(false);
    expect(res.suspension).toBeUndefined();
    expect(res.message).toContain('first warning');

    // Verify user is not suspended
    const suspensionCheck = await checkUserExamSuspension(testUserId);
    expect(suspensionCheck.isSuspended).toBe(false);
  });

  it('observational TAB_SWITCH does NOT increment confirmed violation count or suspend', async () => {
    const res = await recordExamIntegrityEvent(
      testUserId,
      testSessionId,
      'TALENT_ASSESSMENT',
      'TAB_SWITCH'
    );

    expect(res.action).toBe('NONE');
    expect(res.violationCount).toBe(1); // Remains 1 from previous violation
    expect(res.warningIssued).toBe(false);
    expect(res.suspensionTriggered).toBe(false);

    const suspensionCheck = await checkUserExamSuspension(testUserId);
    expect(suspensionCheck.isSuspended).toBe(false);
  });

  it('observational WINDOW_BLUR does NOT increment confirmed violation count or suspend', async () => {
    const res = await recordExamIntegrityEvent(
      testUserId,
      testSessionId,
      'TALENT_ASSESSMENT',
      'WINDOW_BLUR'
    );

    expect(res.action).toBe('NONE');
    expect(res.violationCount).toBe(1); // Remains 1
    expect(res.warningIssued).toBe(false);
    expect(res.suspensionTriggered).toBe(false);
  });

  it('deduplicates rapid events within 800ms window (e.g. keydown + paste)', async () => {
    const dedupUser = await prisma.user.create({
      data: {
        email: `dedup_${Date.now()}@skillbridge.test`,
        name: 'Dedup Student',
        role: 'STUDENT',
        passwordHash: 'hashed_pw',
      },
    });
    const newSession = `session_dedup_${Date.now()}`;
    const firstRes = await recordExamIntegrityEvent(
      dedupUser.id,
      newSession,
      'DSA',
      'PASTE_ATTEMPT'
    );
    expect(firstRes.action).toBe('WARNING');
    expect(firstRes.violationCount).toBe(1);

    // Immediate duplicate event within window
    const dupeRes = await recordExamIntegrityEvent(
      dedupUser.id,
      newSession,
      'DSA',
      'PASTE_ATTEMPT'
    );
    expect(dupeRes.action).toBe('NONE');
    expect(dupeRes.violationCount).toBe(1); // Not incremented to 2

    // Cleanup dedup user
    await prisma.examIntegrityEvent.deleteMany({ where: { userId: dedupUser.id } });
    await prisma.user.deleteMany({ where: { id: dedupUser.id } });
  });

  it('2nd confirmed violation (PASTE_ATTEMPT) immediately triggers a 5-minute (300s) server suspension', async () => {
    // Wait slightly past deduplication window (1500ms)
    await new Promise((r) => setTimeout(r, 1600));

    const res = await recordExamIntegrityEvent(
      testUserId,
      testSessionId,
      'TALENT_ASSESSMENT',
      'PASTE_ATTEMPT'
    );

    expect(res.action).toBe('SUSPENDED');
    expect(res.violationCount).toBe(2);
    expect(res.warningIssued).toBe(false);
    expect(res.suspensionTriggered).toBe(true);
    expect(res.suspension).toBeDefined();
    expect(res.suspension?.isSuspended).toBe(true);
    expect(res.suspension?.remainingSeconds).toBeGreaterThanOrEqual(295);
    expect(res.suspension?.remainingSeconds).toBeLessThanOrEqual(300);

    // Verify timestamps in database
    const dbSuspension = await prisma.userExamSuspension.findUnique({
      where: { userId: testUserId },
    });
    expect(dbSuspension).toBeDefined();
    expect(dbSuspension?.violationCount).toBe(2);

    const suspendedAtMs = new Date(dbSuspension!.suspendedAt).getTime();
    const suspendedUntilMs = new Date(dbSuspension!.suspendedUntil).getTime();
    const diffSeconds = Math.round((suspendedUntilMs - suspendedAtMs) / 1000);
    expect(diffSeconds).toBe(300); // Exactly 5 minutes
  }, 15000);

  it('server-authoritative checkUserExamSuspension blocks access while suspended', async () => {
    const status = await checkUserExamSuspension(testUserId);
    expect(status.isSuspended).toBe(true);
    expect(status.suspendedUntil).toBeDefined();
    expect(status.reason).toContain('Second integrity violation detected');
  });

  it('suspension status endpoint returns authoritative suspension state and countdown', async () => {
    const statusDto = await getExamIntegrityStatus(
      testUserId,
      testSessionId,
      'TALENT_ASSESSMENT'
    );
    expect(statusDto.isSuspended).toBe(true);
    expect(statusDto.violationCount).toBe(2);
    expect(statusDto.remainingSeconds).toBeGreaterThan(0);
  });

  it('suspension expiration restores access automatically without database deletion', async () => {
    // Set suspendedUntil to 1 second in the past
    const pastTime = new Date(Date.now() - 1000);
    await prisma.userExamSuspension.update({
      where: { userId: testUserId },
      data: {
        suspendedUntil: pastTime,
      },
    });

    const check = await checkUserExamSuspension(testUserId);
    expect(check.isSuspended).toBe(false);
  });

  it('privacy protection: clipboard content and screenshots are NEVER persisted', async () => {
    const events = await prisma.examIntegrityEvent.findMany({
      where: { userId: testUserId },
    });

    events.forEach((evt) => {
      // Event metadata must not contain clipboard, token, password, or base64 image data
      if (evt.metadataJson) {
        expect(evt.metadataJson).not.toContain('clipboard');
        expect(evt.metadataJson).not.toContain('base64');
        expect(evt.metadataJson).not.toContain('screenshot');
        expect(evt.metadataJson).not.toContain('password');
        expect(evt.metadataJson).not.toContain('token');
      }
    });
  });

  it('ExamIntegrityEvent accurately records confirmed integrity warnings and suspensions', async () => {
    const events = await prisma.examIntegrityEvent.findMany({
      where: {
        userId: testUserId,
      },
    });

    expect(events.length).toBeGreaterThanOrEqual(2);
    const warningEvent = events.find((e) => e.warningIssued === true);
    expect(warningEvent).toBeDefined();

    const suspensionEvent = events.find((e) => e.suspensionTriggered === true);
    expect(suspensionEvent).toBeDefined();
  });
});
