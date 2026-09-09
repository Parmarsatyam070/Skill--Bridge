import { prisma } from '../config/prisma.js';
import {
  ExamIntegrityEventType,
  ExamIntegritySessionType,
  ExamIntegrityEventPayload,
  ExamIntegrityResponse,
  ExamSuspensionState,
  ExamIntegrityStatusDto,
} from '../../../shared/types.js';

// Confirmed violations that count toward the 2-step progressive penalty
export const CONFIRMED_VIOLATIONS: ReadonlySet<ExamIntegrityEventType> = new Set([
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'FORCE_PASTE_ATTEMPT',
  'CUT_ATTEMPT',
  'CONTEXT_MENU_ATTEMPT',
  'DRAG_DROP_ATTEMPT',
  'PRINT_SCREEN_ATTEMPT',
  'SCREENSHOT_ATTEMPT',
  'EYE_GAZE_VIOLATION',
  'NOISE_VIOLATION',
]);

// Observational events logged for audit trail only
export const OBSERVATIONAL_EVENTS: ReadonlySet<ExamIntegrityEventType> = new Set([
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'VISIBILITY_CHANGE',
  'FULLSCREEN_EXIT',
]);

// In-memory deduplication cache: key -> timestamp (epoch ms)
// Key format: `${userId}:${sessionId}:${eventType}`
const deduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 1500;

// Helper to clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of deduplicationCache.entries()) {
    if (now - timestamp > 5000) {
      deduplicationCache.delete(key);
    }
  }
}, 30000);

export function humanReadableEventName(eventType: ExamIntegrityEventType): string {
  switch (eventType) {
    case 'COPY_ATTEMPT':
      return 'Copy Attempt';
    case 'PASTE_ATTEMPT':
      return 'Paste Attempt';
    case 'FORCE_PASTE_ATTEMPT':
      return 'Special / Force Paste Attempt';
    case 'CUT_ATTEMPT':
      return 'Cut Attempt';
    case 'CONTEXT_MENU_ATTEMPT':
      return 'Right-Click / Context Menu Attempt';
    case 'DRAG_DROP_ATTEMPT':
      return 'Suspicious Drag & Drop Attempt';
    case 'PRINT_SCREEN_ATTEMPT':
    case 'SCREENSHOT_ATTEMPT':
      return 'Screenshot / Capture Attempt';
    case 'TAB_SWITCH':
      return 'Tab Switch';
    case 'WINDOW_BLUR':
      return 'Window Focus Lost';
    case 'VISIBILITY_CHANGE':
      return 'Visibility Change';
    case 'FULLSCREEN_EXIT':
      return 'Fullscreen Exit';
    case 'EYE_GAZE_VIOLATION':
      return 'Eye Movement / Looking Away from Screen';
    case 'NOISE_VIOLATION':
      return 'External Background Noise / Speech Detected';
    default:
      return eventType;
  }
}

/**
 * Check if the user is currently under an active 5-minute exam suspension.
 */
export async function checkUserSuspension(userId: string): Promise<ExamSuspensionState> {
  if (!userId) {
    return {
      isSuspended: false,
      suspendedUntil: null,
      remainingSeconds: 0,
      violationCount: 0,
    };
  }

  const record = await prisma.userExamSuspension.findUnique({
    where: { userId },
  });

  if (!record) {
    return {
      isSuspended: false,
      suspendedUntil: null,
      remainingSeconds: 0,
      violationCount: 0,
    };
  }

  const now = new Date();
  if (record.suspendedUntil > now) {
    const remainingSeconds = Math.max(
      1,
      Math.ceil((record.suspendedUntil.getTime() - now.getTime()) / 1000)
    );
    return {
      isSuspended: true,
      suspendedUntil: record.suspendedUntil.toISOString(),
      remainingSeconds,
      reason: record.reason,
      violationCount: record.violationCount,
    };
  }

  // Suspension has expired
  return {
    isSuspended: false,
    suspendedUntil: null,
    remainingSeconds: 0,
    reason: undefined,
    violationCount: record.violationCount,
  };
}

/**
 * Atomically record an integrity event and enforce the progressive violation policy.
 */
export async function recordIntegrityEvent(
  userId: string,
  payload: ExamIntegrityEventPayload
): Promise<ExamIntegrityResponse> {
  const { sessionId, sessionType, eventType, metadata } = payload;
  const now = new Date();
  const nowEpoch = now.getTime();

  // Deduplication check
  const dedupeKey = `${userId}:${sessionId}:${eventType}`;
  const lastTime = deduplicationCache.get(dedupeKey);
  if (lastTime && nowEpoch - lastTime < DEDUPLICATION_WINDOW_MS) {
    // Return existing suspension/warning state without re-incrementing
    const currentSuspension = await checkUserSuspension(userId);
    const sessionViolationCount = await prisma.examIntegrityEvent.count({
      where: { userId, sessionId, isConfirmedViolation: true },
    });
    return {
      status: currentSuspension.isSuspended ? 'SUSPENDED' : 'OK',
      action: 'NONE',
      isConfirmedViolation: CONFIRMED_VIOLATIONS.has(eventType),
      violationCount: sessionViolationCount,
      warningIssued: false,
      suspensionTriggered: false,
      suspension: currentSuspension.isSuspended ? currentSuspension : undefined,
      eventType,
      occurredAt: now.toISOString(),
    };
  }

  const isConfirmed = CONFIRMED_VIOLATIONS.has(eventType);
  const severity = isConfirmed ? 'VIOLATION' : 'INFO';

  // Sanitize metadata to guarantee ZERO clipboard text, passwords, or sensitive data
  const sanitizedMetadata = metadata
    ? JSON.stringify({
        targetElement: metadata.targetElement?.slice(0, 100),
        keyCombo: metadata.keyCombo?.slice(0, 50),
        clientTimestamp: metadata.clientTimestamp,
      })
    : null;

  try {
    return await prisma.$transaction(async (tx) => {
    // 1. Record the integrity event
    const event = await tx.examIntegrityEvent.create({
      data: {
        userId,
        sessionId,
        sessionType,
        eventType,
        severity,
        isConfirmedViolation: isConfirmed,
        warningIssued: false,
        suspensionTriggered: false,
        occurredAt: now,
        metadataJson: sanitizedMetadata,
      },
    });

    if (!isConfirmed) {
      // Observational event (e.g. TAB_SWITCH)
      const currentConfirmedCount = await tx.examIntegrityEvent.count({
        where: { userId, sessionId, isConfirmedViolation: true },
      });
      return {
        status: 'OK',
        action: 'NONE',
        isConfirmedViolation: false,
        violationCount: currentConfirmedCount,
        warningIssued: false,
        suspensionTriggered: false,
        eventType,
        occurredAt: now.toISOString(),
      };
    }

    // 2. Count confirmed violations for this specific user in this session
    const confirmedCount = await tx.examIntegrityEvent.count({
      where: {
        userId,
        sessionId,
        isConfirmedViolation: true,
      },
    });

    if (confirmedCount === 1) {
      // FIRST CONFIRMED VIOLATION: Issue strong warning, do not suspend
      await tx.examIntegrityEvent.update({
        where: { id: event.id },
        data: { warningIssued: true },
      });

      const warningMessage = `A prohibited action was detected: ${humanReadableEventName(
        eventType
      )}. This is your first warning. A further prohibited action will temporarily suspend your assessment access for 5 minutes. Please continue without using prohibited assistance.`;

      return {
        status: 'WARNING',
        action: 'WARNING',
        message: warningMessage,
        isConfirmedViolation: true,
        violationCount: 1,
        warningIssued: true,
        warningMessage,
        suspensionTriggered: false,
        eventType,
        occurredAt: now.toISOString(),
      };
    }

    // SECOND OR HIGHER CONFIRMED VIOLATION: Immediately trigger 5-minute suspension
    const suspendedUntil = new Date(nowEpoch + 5 * 60 * 1000); // 300 seconds

    await tx.examIntegrityEvent.update({
      where: { id: event.id },
      data: { suspensionTriggered: true },
    });

    await tx.userExamSuspension.upsert({
      where: { userId },
      create: {
        userId,
        suspendedAt: now,
        suspendedUntil,
        reason: `Second integrity violation detected during protected session (${humanReadableEventName(
          eventType
        )}).`,
        violationCount: confirmedCount,
        sessionId,
        sessionType,
      },
      update: {
        suspendedAt: now,
        suspendedUntil,
        reason: `Second integrity violation detected during protected session (${humanReadableEventName(
          eventType
        )}).`,
        violationCount: confirmedCount,
        sessionId,
        sessionType,
      },
    });

    const suspensionState: ExamSuspensionState = {
      isSuspended: true,
      suspendedUntil: suspendedUntil.toISOString(),
      remainingSeconds: 300,
      reason: `Repeated integrity violations detected (${humanReadableEventName(
        eventType
      )}).`,
      violationCount: confirmedCount,
    };

    return {
      status: 'SUSPENDED',
      action: 'SUSPENDED',
      message: `Assessment Temporarily Suspended. A second integrity violation was detected. Your protected assessment access has been temporarily suspended for 5 minutes.`,
      isConfirmedViolation: true,
      violationCount: confirmedCount,
      warningIssued: false,
      suspensionTriggered: true,
      suspension: suspensionState,
      eventType,
      occurredAt: now.toISOString(),
    };
  });
  } finally {
    deduplicationCache.set(dedupeKey, Date.now());
  }
}

/**
 * Query active status & session violations summary for authenticated user.
 */
export async function getActiveSuspensionState(userId: string): Promise<ExamIntegrityStatusDto> {
  const suspension = await checkUserSuspension(userId);

  // Query recent confirmed violations per session
  const recentEvents = await prisma.examIntegrityEvent.findMany({
    where: {
      userId,
      isConfirmedViolation: true,
      occurredAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
      },
    },
    select: {
      sessionId: true,
    },
  });

  const activeSessionViolations: Record<string, number> = {};
  for (const ev of recentEvents) {
    activeSessionViolations[ev.sessionId] = (activeSessionViolations[ev.sessionId] || 0) + 1;
  }

  return {
    userId,
    isSuspended: suspension.isSuspended,
    suspendedUntil: suspension.suspendedUntil,
    remainingSeconds: suspension.remainingSeconds,
    reason: suspension.reason,
    activeSessionViolations,
  };
}

export function isProhibitedViolation(eventType: ExamIntegrityEventType): boolean {
  return CONFIRMED_VIOLATIONS.has(eventType);
}

export const checkUserExamSuspension = checkUserSuspension;

export async function recordExamIntegrityEvent(
  userId: string,
  sessionId: string,
  sessionType: ExamIntegritySessionType,
  eventType: ExamIntegrityEventType,
  metadata?: Record<string, any>
): Promise<ExamIntegrityResponse> {
  return recordIntegrityEvent(userId, {
    sessionId,
    sessionType,
    eventType,
    metadata,
  });
}

export async function getExamIntegrityStatus(
  userId: string,
  sessionId: string,
  sessionType: ExamIntegritySessionType
): Promise<ExamIntegrityStatusDto & { violationCount: number }> {
  const status = await getActiveSuspensionState(userId);
  const violationCount = status.activeSessionViolations[sessionId] || 0;
  return {
    ...status,
    violationCount,
  };
}

/**
 * Testing helper to reset suspension state for a user.
 */
export async function clearSuspensionForTesting(userId: string): Promise<void> {
  await prisma.userExamSuspension.deleteMany({
    where: { userId },
  });
  await prisma.examIntegrityEvent.deleteMany({
    where: { userId },
  });
}

/**
 * Trigger a 3-day (72-hour) suspension from Mock Interviews and DSA Questions
 * due to repeated proctoring violations (>3 strikes of eye gaze or background noise).
 */
export async function triggerThreeDayBan(
  userId: string,
  reason: string,
  sessionId?: string,
  sessionType: string = 'MOCK_INTERVIEW'
): Promise<ExamSuspensionState> {
  const now = new Date();
  const BAN_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days = 72 hours
  const suspendedUntil = new Date(now.getTime() + BAN_DURATION_MS);
  const remainingSeconds = 3 * 24 * 60 * 60; // 259,200 seconds

  await prisma.userExamSuspension.upsert({
    where: { userId },
    create: {
      userId,
      suspendedAt: now,
      suspendedUntil,
      reason,
      violationCount: 4,
      sessionId,
      sessionType,
    },
    update: {
      suspendedAt: now,
      suspendedUntil,
      reason,
      violationCount: 4,
      sessionId,
      sessionType,
    },
  });

  try {
    await prisma.examIntegrityEvent.create({
      data: {
        userId,
        sessionId: sessionId || 'mock-interview',
        sessionType,
        eventType: reason.toLowerCase().includes('noise') ? 'NOISE_VIOLATION' : 'EYE_GAZE_VIOLATION',
        severity: 'VIOLATION',
        isConfirmedViolation: true,
        warningIssued: false,
        suspensionTriggered: true,
        occurredAt: now,
        metadataJson: JSON.stringify({ reason, banDurationHours: 72 }),
      },
    });
  } catch (err) {
    console.error('Failed to log 3-day ban integrity event:', err);
  }

  return {
    isSuspended: true,
    suspendedUntil: suspendedUntil.toISOString(),
    remainingSeconds,
    reason,
    violationCount: 4,
  };
}
