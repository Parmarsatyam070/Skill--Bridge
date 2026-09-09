import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { requireExamAccess } from '../middleware/examIntegrityMiddleware.js';
import { triggerThreeDayBan, checkUserSuspension } from '../services/examIntegrityService.js';
import {
  generateMockInterviewQuestions,
  evaluateMockInterviewTranscript,
} from '../services/mockInterviewService.js';
import { getTodayDateString } from '../services/streakService.js';
import {
  MockInterviewHistoryResponse,
  MockInterviewHistoryItem,
} from '../../../shared/types.js';

const router = Router();

const DAILY_MOCK_INTERVIEW_CAP = 3;

/**
 * POST /api/mock-interview/start
 * Starts a 30-minute AI mock interview session with Sash.
 * Enforces daily session cap (3/day) and computes retakeNumber = priorCompletedCount + 1.
 */
router.post('/start', authenticate, requireRole(['STUDENT']), requireExamAccess, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Student profile required.' } });
  }

  const { internshipId } = req.body;
  if (!internshipId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Target internshipId is required.' } });
  }

  const today = getTodayDateString();

  // 1. Daily rate-limiting cap check (max 3 sessions per day)
  const todaySessionsCount = await prisma.mockInterviewSession.count({
    where: {
      studentId: studentProfileId,
      date: today,
    },
  });

  if (todaySessionsCount >= DAILY_MOCK_INTERVIEW_CAP) {
    return res.status(429).json({
      error: {
        code: 'DAILY_CAP_REACHED',
        message: `Daily mock interview limit reached (${todaySessionsCount}/${DAILY_MOCK_INTERVIEW_CAP} completed today). Please return tomorrow to protect your interview readiness pace.`,
      },
    });
  }

  // 2. Fetch target internship
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { industry: true },
  });

  if (!internship) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Internship posting not found.' } });
  }

  // 3. Compute retakeNumber = prior COMPLETED count + 1 for this same role/internship
  const priorCompletedCount = await prisma.mockInterviewSession.count({
    where: {
      studentId: studentProfileId,
      internshipId,
      status: 'COMPLETED',
    },
  });
  const retakeNumber = priorCompletedCount + 1;

  // 4. Generate questions with anti-duplicate rotation from recent sessions
  const questions = await generateMockInterviewQuestions(internshipId, studentProfileId);

  // 5. Create new session in DB
  const session = await prisma.mockInterviewSession.create({
    data: {
      studentId: studentProfileId,
      internshipId,
      targetRole: `${internship.title} @ ${internship.industry.companyName}`,
      companyName: internship.industry.companyName,
      date: today,
      status: 'IN_PROGRESS',
      questionsJson: JSON.stringify(questions),
      transcriptJson: JSON.stringify([]),
      retakeNumber,
    },
  });

  const sashGreeting = retakeNumber === 1
    ? `Hello! I'm Sash, your AI Technical Interviewer at SkillBridge. Today we'll conduct your initial 30-minute technical & behavioral interview for ${internship.title} at ${internship.industry.companyName}. I'll assess your architectural clarity and structured problem solving. You can respond by speaking or typing. Let's begin!`
    : `Welcome back! I'm Sash. This is your Retake Interview (Attempt #${retakeNumber}) for ${internship.title} at ${internship.industry.companyName}. I've rotated our question pool to test both technical depth and STAR-method execution. Let's see your progress!`;

  return res.status(201).json({
    message: 'Mock interview session initialized',
    session: {
      id: session.id,
      targetRole: session.targetRole,
      companyName: session.companyName,
      retakeNumber: session.retakeNumber,
      date: session.date,
      timeLimitMinutes: 30,
    },
    questions,
    sashGreeting,
    dailySessionsRemaining: Math.max(0, DAILY_MOCK_INTERVIEW_CAP - (todaySessionsCount + 1)),
  });
});

/**
 * POST /api/mock-interview/:id/submit-answer
 * Saves intermediate question response to prevent progress loss.
 */
router.post('/:id/submit-answer', authenticate, requireRole(['STUDENT']), requireExamAccess, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.id;
  const { questionIndex, questionText, category, skillTag, studentAnswer, timeTakenSeconds } = req.body;

  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found.' } });
  }

  let transcript: any[] = [];
  try {
    transcript = JSON.parse(session.transcriptJson || '[]');
  } catch {}

  // Update or append answer
  const existingIdx = transcript.findIndex((t: any) => t.questionIndex === questionIndex);
  const answerItem = {
    questionIndex,
    questionText,
    category,
    skillTag,
    studentAnswer: studentAnswer || '',
    timeTakenSeconds: timeTakenSeconds || 0,
    isSkipped: !studentAnswer || studentAnswer.trim().length === 0,
  };

  if (existingIdx >= 0) {
    transcript[existingIdx] = answerItem;
  } else {
    transcript.push(answerItem);
  }

  await prisma.mockInterviewSession.update({
    where: { id: sessionId },
    data: { transcriptJson: JSON.stringify(transcript) },
  });

  return res.json({ message: 'Answer recorded', currentAnswersCount: transcript.length });
});

/**
 * POST /api/mock-interview/:id/finish
 * Concludes mock interview (either by user completion or 30-min timeout),
 * runs the LLM analysis pass, generates scored feedback, and stores results.
 */
router.post('/:id/finish', authenticate, requireRole(['STUDENT']), requireExamAccess, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.id;
  const { answers, durationSeconds, isTimedOut } = req.body;

  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found.' } });
  }

  // Ensure answers array exists, pulling from DB transcript if client provided empty array
  let finalAnswers = answers;
  if (!Array.isArray(finalAnswers) || finalAnswers.length === 0) {
    try {
      finalAnswers = JSON.parse(session.transcriptJson || '[]');
    } catch {
      finalAnswers = [];
    }
  }

  // If not timed out (early submission), all questions must be answered
  if (!isTimedOut) {
    let questions: any[] = [];
    try {
      questions = JSON.parse(session.questionsJson || '[]');
    } catch {}

    const unansweredQuestions = questions.filter((q: any) => {
      const ans = finalAnswers.find((a: any) => a.questionIndex === q.questionIndex);
      return !ans || !ans.studentAnswer || ans.studentAnswer.trim().length === 0;
    });

    if (unansweredQuestions.length > 0) {
      return res.status(400).json({
        error: {
          code: 'INCOMPLETE_ANSWERS',
          message: `All ${questions.length} questions must be answered before early submission. You have ${unansweredQuestions.length} unanswered question(s).`,
        },
      });
    }
  }

  const evaluation = await evaluateMockInterviewTranscript(
    sessionId,
    finalAnswers,
    Math.min(1800, Math.max(1, durationSeconds || 0)),
    Boolean(isTimedOut)
  );

  return res.json({
    message: 'Mock interview evaluated successfully',
    sessionId,
    evaluation,
  });
});

/**
 * GET /api/mock-interview/history
 * Returns historical sessions, score trend over time, and identified recurring weak areas.
 * STRICTLY filters to status === 'COMPLETED' for average score and trend calculation.
 */
router.get('/history', authenticate, requireRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(400).json({ error: { code: 'NO_PROFILE', message: 'Student profile required.' } });
  }

  const internshipId = req.query.internshipId as string | undefined;

  // Query strictly COMPLETED sessions for analytics & trend calculation
  const completedSessions = await prisma.mockInterviewSession.findMany({
    where: {
      studentId: studentProfileId,
      status: 'COMPLETED',
      internshipId: internshipId || undefined,
    },
    orderBy: { createdAt: 'asc' }, // Ascending for chronological trend
  });

  if (completedSessions.length === 0) {
    const emptyResponse: MockInterviewHistoryResponse = {
      sessions: [],
      totalSessions: 0,
      averageScore: 0,
      overallTrend: 'neutral',
      scoreTrend: [],
      commonWeakAreas: [],
    };
    return res.json(emptyResponse);
  }

  const totalSessions = completedSessions.length;
  const totalScore = completedSessions.reduce((sum, s) => sum + s.overallScore, 0);
  const averageScore = Math.round(totalScore / totalSessions);

  // Chronological score trend points
  const scoreTrend = completedSessions.map(s => ({
    retakeNumber: s.retakeNumber,
    date: s.date,
    score: s.overallScore,
    targetRole: s.targetRole,
  }));

  // Determine trend direction
  let overallTrend: 'improving' | 'declining' | 'steady' | 'neutral' = 'neutral';
  if (completedSessions.length >= 2) {
    const latest = completedSessions[completedSessions.length - 1].overallScore;
    const previous = completedSessions[completedSessions.length - 2].overallScore;
    const delta = latest - previous;
    if (delta >= 3) overallTrend = 'improving';
    else if (delta <= -3) overallTrend = 'declining';
    else overallTrend = 'steady';
  } else if (completedSessions.length === 1) {
    overallTrend = 'steady';
  }

  // Aggregate recurring weak areas
  const weakAreaFrequency = new Map<string, number>();
  completedSessions.forEach(s => {
    try {
      const gaps: string[] = JSON.parse(s.identifiedGapsJson || '[]');
      gaps.forEach(g => {
        const count = weakAreaFrequency.get(g) || 0;
        weakAreaFrequency.set(g, count + 1);
      });
    } catch {}
  });

  const sortedWeakAreas = Array.from(weakAreaFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([gap]) => gap)
    .slice(0, 5);

  // Format session list descending for UI display
  const formattedSessions: MockInterviewHistoryItem[] = [...completedSessions]
    .reverse()
    .map(s => {
      let strengths: string[] = [];
      let gaps: string[] = [];
      try {
        const fb = JSON.parse(s.feedbackJson || '{}');
        strengths = fb.strengths || [];
        gaps = fb.weakAreas || JSON.parse(s.identifiedGapsJson || '[]');
      } catch {}

      return {
        id: s.id,
        internshipId: s.internshipId || undefined,
        targetRole: s.targetRole,
        companyName: s.companyName || undefined,
        date: s.date,
        durationSeconds: s.durationSeconds,
        overallScore: s.overallScore,
        communicationScore: s.communicationScore,
        technicalScore: s.technicalScore,
        structureScore: s.structureScore,
        readinessTier: s.readinessTier,
        retakeNumber: s.retakeNumber,
        identifiedGaps: gaps,
        strengths,
        completedAt: s.completedAt ? s.completedAt.toISOString() : s.createdAt.toISOString(),
      };
    });

  const response: MockInterviewHistoryResponse = {
    sessions: formattedSessions,
    totalSessions,
    averageScore,
    overallTrend,
    scoreTrend,
    commonWeakAreas: sortedWeakAreas,
    latestSession: formattedSessions[0],
  };

  return res.json(response);
});

/**
 * GET /api/mock-interview/:id
 * Retrieves full details of a specific session including transcript, feedback, and quoted snippets.
 */
router.get('/:id', authenticate, requireRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.id;

  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Session not found.' } });
  }

  let questions = [];
  let transcript = [];
  let feedback = null;
  let identifiedGaps = [];

  try {
    questions = JSON.parse(session.questionsJson || '[]');
    transcript = JSON.parse(session.transcriptJson || '[]');
    feedback = session.feedbackJson ? JSON.parse(session.feedbackJson) : null;
    identifiedGaps = JSON.parse(session.identifiedGapsJson || '[]');
  } catch {}

  return res.json({
    session: {
      id: session.id,
      studentId: session.studentId,
      internshipId: session.internshipId,
      targetRole: session.targetRole,
      companyName: session.companyName,
      date: session.date,
      status: session.status,
      durationSeconds: session.durationSeconds,
      overallScore: session.overallScore,
      communicationScore: session.communicationScore,
      technicalScore: session.technicalScore,
      structureScore: session.structureScore,
      readinessTier: session.readinessTier,
      retakeNumber: session.retakeNumber,
      isTimedOut: session.isTimedOut,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : undefined,
      questions,
      transcript,
      feedback,
      identifiedGaps,
    },
  });
});

/**
 * POST /api/mock-interview/attention-event
 * Dedicated endpoint: records eye/face and noise attention events.
 * Enforces progressive 3-warning policy:
 * - Strikes 1, 2, 3: Warning returned with remaining strikes.
 * - Strike 4 (>3 times): Immediate 3-day (72h) ban from Mock Interviews and DSA Questions.
 */
router.post('/attention-event', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId, eventType, strikeCount, details, timestamp } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'sessionId is required.' } });
  }

  try {
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      let transcript: any[] = [];
      try {
        transcript = JSON.parse(session.transcriptJson || '[]');
      } catch {}

      transcript.push({
        type: 'ATTENTION_EVENT',
        eventType: eventType || 'WARNING',
        strikeCount: strikeCount || 1,
        timestamp: timestamp || Date.now(),
        details: details || {},
      });

      await prisma.mockInterviewSession.update({
        where: { id: sessionId },
        data: { transcriptJson: JSON.stringify(transcript) },
      });
    }

    const currentStrike = typeof strikeCount === 'number' ? strikeCount : 1;

    // Check if 4th strike triggered (>3 warnings)
    if (currentStrike > 3 && userId) {
      const isNoise = String(eventType).toUpperCase().includes('NOISE');
      const banReason = isNoise
        ? 'Repeated external background noise and chatter detected (>3 violations). Access to Mock Interviews and DSA Questions is suspended for 3 days.'
        : 'Repeated eye movement and gaze deviation detected (>3 violations). Access to Mock Interviews and DSA Questions is suspended for 3 days.';

      const suspension = await triggerThreeDayBan(
        userId,
        banReason,
        sessionId,
        'MOCK_INTERVIEW'
      );

      // Terminate the active session
      if (session && session.status === 'IN_PROGRESS') {
        await prisma.mockInterviewSession.update({
          where: { id: sessionId },
          data: {
            status: 'TERMINATED',
            completedAt: new Date(),
          },
        });
      }

      return res.status(403).json({
        success: false,
        isSuspended: true,
        suspendedUntil: suspension.suspendedUntil,
        remainingSeconds: suspension.remainingSeconds,
        reason: suspension.reason,
        violationCount: currentStrike,
        message: banReason,
      });
    }

    const isNoise = String(eventType).toUpperCase().includes('NOISE');
    const warningMessage = currentStrike === 3
      ? `FINAL WARNING (${currentStrike}/3): ${isNoise ? 'External background noise detected.' : 'Eyes removed from screen.'} One more violation will immediately ban your account for 3 days from Mock Interviews and DSA Questions.`
      : `Warning ${currentStrike}/3: ${isNoise ? 'Background noise or external voices detected. Please ensure a quiet environment.' : 'Eye movement deviation detected. Please keep your eyes centered on the screen.'}`;

    return res.json({
      success: true,
      isSuspended: false,
      strikeCount: currentStrike,
      maxStrikes: 3,
      message: warningMessage,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Could not record event.' } });
  }
});

/**
 * POST /api/mock-interview/terminate
 * Dedicated endpoint: marks session terminated due to prolonged attention violations or manual quit.
 */
router.post('/terminate', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId, reason, triggerBan } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'sessionId is required.' } });
  }

  try {
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      let transcript: any[] = [];
      try {
        transcript = JSON.parse(session.transcriptJson || '[]');
      } catch {}

      transcript.push({
        type: 'TERMINATION_EVENT',
        reason: reason || 'Prolonged attention violations detected.',
        timestamp: Date.now(),
      });

      await prisma.mockInterviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'TERMINATED',
          completedAt: new Date(),
          transcriptJson: JSON.stringify(transcript),
        },
      });
    }

    let suspensionState = null;
    if (triggerBan && userId) {
      suspensionState = await triggerThreeDayBan(
        userId,
        reason || 'Suspended for 3 days due to multiple proctoring violations.',
        sessionId,
        'MOCK_INTERVIEW'
      );
    }

    return res.json({
      success: true,
      terminated: true,
      suspension: suspensionState,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Could not terminate session.' } });
  }
});

export default router;
