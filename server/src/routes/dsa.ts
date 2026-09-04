import { Router, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  seedDSAQuestionsIfEmpty,
  selectRotatedQuestions,
  getOrCreateDailyPractice,
  submitDSAQuestionAttempt,
  getDSAProgressSummary,
  formatDSAQuestion,
  normalizeSetSize,
} from '../services/questionSelectionService.js';
import {
  GenerateDSAPracticeSchema,
  RecordDSAAttemptSchema,
  SubmitDailyDSAQuestionSchema,
} from '../../../shared/validation.js';

const router = Router();

/**
 * GET /api/dsa/questions
 * Returns searchable, filterable DSA questions explorer.
 */
router.get('/questions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await seedDSAQuestionsIfEmpty();

    const studentId = req.user?.studentProfileId;
    const { platform, difficulty, topic, search, status, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (platform && platform !== 'All') {
      where.platform = String(platform);
    }
    if (difficulty && difficulty !== 'All') {
      where.difficulty = String(difficulty);
    }
    if (topic && topic !== 'All') {
      where.topic = String(topic);
    }
    if (search && String(search).trim().length > 0) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { topic: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Fetch user attempts to map status
    let attempts: any[] = [];
    if (studentId) {
      attempts = await prisma.dSAAttempt.findMany({
        where: { studentId },
      });
    }
    const attemptMap = new Map(attempts.map(a => [a.questionId, a]));

    const [total, questions] = await Promise.all([
      prisma.dSAQuestion.count({ where }),
      prisma.dSAQuestion.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
      }),
    ]);

    let formatted = questions.map(q => formatDSAQuestion(q, attemptMap.get(q.id)));

    // Filter by attempt status if specified
    if (status && status !== 'All') {
      if (status === 'SOLVED') {
        formatted = formatted.filter(q => q.userAttemptStatus === 'SOLVED');
      } else if (status === 'ATTEMPTED') {
        formatted = formatted.filter(q => q.userAttemptStatus === 'ATTEMPTED' || q.userAttemptStatus === 'FAILED');
      } else if (status === 'UNSEEN') {
        formatted = formatted.filter(q => !q.userAttemptStatus || q.userAttemptStatus === 'UNSEEN');
      }
    }

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      questions: formatted,
      data: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        questions: formatted,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/dsa/questions:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * GET /api/dsa/topics
 * Returns list of distinct DSA topics with counts.
 */
router.get('/topics', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    await seedDSAQuestionsIfEmpty();

    const questions = await prisma.dSAQuestion.findMany({
      select: { topic: true },
    });

    const topicCounts: Record<string, number> = {};
    for (const q of questions) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }

    const result = Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      topics: result.map((r) => r.name),
      data: result,
    });
  } catch (error: any) {
    console.error('Error in GET /api/dsa/topics:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * GET /api/dsa/daily
 * Retrieves today's mandatory daily practice set (generated ONCE per calendar day).
 */
router.get('/daily', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can access daily practice.' } });
    }

    const dateQuery = typeof req.query.date === 'string' ? req.query.date : undefined;
    const dailyPractice = await getOrCreateDailyPractice(studentId, dateQuery);

    return res.json({
      success: true,
      dailyPractice,
      data: dailyPractice,
    });
  } catch (error: any) {
    console.error('Error in GET /api/dsa/daily:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * POST /api/dsa/daily/start
 * Marks daily practice session as started.
 */
router.post('/daily/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required.' } });
    }

    const todayStr = (req.body && req.body.date) || new Date().toISOString().split('T')[0];
    const daily = await getOrCreateDailyPractice(studentId, todayStr);

    if (daily.status === 'PENDING') {
      await prisma.dailyPractice.update({
        where: { id: daily.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });
      daily.status = 'IN_PROGRESS';
    }

    return res.json({
      success: true,
      dailyPractice: daily,
      data: daily,
    });
  } catch (error: any) {
    console.error('Error in POST /api/dsa/daily/start:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * POST /api/dsa/daily/submit-question
 * Records a question solution within daily practice or general practice.
 */
router.post('/daily/submit-question', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required.' } });
    }

    const parsed = SubmitDailyDSAQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
    }

    const attempt = await submitDSAQuestionAttempt(studentId, {
      questionId: parsed.data.questionId,
      status: parsed.data.status,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
      codeSubmitted: parsed.data.codeSubmitted,
      language: parsed.data.language,
      isDailyPractice: true,
      date: (req.body && req.body.date) || undefined,
    });

    const updatedDaily = await getOrCreateDailyPractice(studentId, (req.body && req.body.date) || undefined);

    return res.json({
      success: true,
      dailyPractice: updatedDaily,
      attempt,
      streak: updatedDaily.currentStreak,
      data: attempt,
    });
  } catch (error: any) {
    console.error('Error in POST /api/dsa/daily/submit-question:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * POST /api/dsa/practice/generate
 * Generates custom DSA practice sets strictly bounded to 15, 20, 25, or 30 questions.
 */
router.post('/practice/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required.' } });
    }

    const rawCount = req.body.questionCount;
    // Strict backend enforcement: reject or normalize if not in [15, 20, 25, 30]
    if (rawCount && ![15, 20, 25, 30].includes(rawCount)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUESTION_COUNT',
          message: 'DSA practice sets must contain exactly 15, 20, 25, or 30 questions.',
        },
      });
    }

    const parsed = GenerateDSAPracticeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
    }

    const questions = await selectRotatedQuestions(studentId, {
      count: parsed.data.questionCount,
      difficulty: parsed.data.difficulty,
      platform: parsed.data.platform,
      topic: parsed.data.topic,
      includeWeakTopics: parsed.data.includeWeakTopics,
      filterUnseenOnly: parsed.data.filterUnseenOnly,
    });

    const practiceSet = {
      id: `dsa-custom-${Date.now()}`,
      title: `${parsed.data.topic || 'Custom'} DSA Practice Set (${questions.length} Qs)`,
      description: `Targeted practice set featuring authentic problems across LeetCode, GeeksforGeeks, CSES, and Codeforces.`,
      domainName: 'DSA & Algorithms',
      type: 'dsa',
      difficulty: parsed.data.difficulty || 'Mixed',
      timeLimitMinutes: questions.length * 15,
      passingScorePct: 70,
      totalQuestions: questions.length,
      questionCount: questions.length,
      questions,
    };

    return res.json({
      success: true,
      practiceSet,
      data: {
        questionCount: questions.length,
        difficulty: parsed.data.difficulty,
        platform: parsed.data.platform,
        topic: parsed.data.topic || 'All Topics',
        questions,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/dsa/practice/generate:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * POST /api/dsa/questions/:id/attempt
 * Records an attempt (viewed/attempted/solved/failed) for an individual problem.
 */
router.post('/questions/:id/attempt', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required.' } });
    }

    const questionId = req.params.id;
    const parsed = RecordDSAAttemptSchema.safeParse({ ...req.body, questionId });
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.format() } });
    }

    const attempt = await submitDSAQuestionAttempt(studentId, {
      questionId,
      status: parsed.data.status,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
      codeSubmitted: parsed.data.codeSubmitted,
      language: parsed.data.language,
      isDailyPractice: parsed.data.isDailyPractice,
    });

    return res.json({
      success: true,
      attempt,
      data: attempt,
    });
  } catch (error: any) {
    console.error('Error in POST /api/dsa/questions/:id/attempt:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

/**
 * GET /api/dsa/progress
 * Aggregated analytics for DSA dashboard and radar calibration.
 */
router.get('/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentProfileId;
    if (!studentId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Student profile required.' } });
    }

    const progress = await getDSAProgressSummary(studentId);

    return res.json({
      success: true,
      progress,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error in GET /api/dsa/progress:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

export default router;
