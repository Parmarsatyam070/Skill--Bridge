import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  getAllPracticeSets,
  getPracticeSetDetail,
  startPracticeSetAttempt,
  submitPracticeSetAttempt,
  getReportCardSummary,
  getAttemptDetail,
  getDailyPracticeStatus,
} from '../services/assessmentService.js';

const router = Router();

/**
 * GET /api/assessments/sets
 * Lists practice sets grouped by domain or aptitude sub-category,
 * with question counts, time limits, and the student's previous best scores.
 */
router.get('/sets', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  const domain = req.query.domain as string | undefined;
  const type = req.query.type as string | undefined;

  try {
    const sets = await getAllPracticeSets(studentProfileId, domain, type);
    return res.json({ sets });
  } catch (error: any) {
    console.error('Error fetching practice sets:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/assessments/sets/:setId/start
 * Starts a timed attempt for a practice set.
 * Dynamically samples non-repeating questions, rotates listening passages,
 * shuffles MCQ options, and creates a trackable AssessmentAttempt session.
 */
router.post('/sets/:setId/start', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  const { setId } = req.params;

  try {
    const startData = await startPracticeSetAttempt(setId, studentProfileId);
    return res.json(startData);
  } catch (error: any) {
    console.error('Error starting practice set attempt:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/assessments/sets/:setId
 * Fetches practice set details, questions, and attached listening passages.
 */
router.get('/sets/:setId', authenticate, async (req: AuthRequest, res: Response) => {
  const { setId } = req.params;

  try {
    const { set, questions } = await getPracticeSetDetail(setId);
    return res.json({ set, questions });
  } catch (error: any) {
    console.error('Error fetching practice set detail:', error);
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
  }
});

/**
 * GET /api/assessments/daily-status
 * Checks if the student completed their mandatory practice set today
 */
router.get('/daily-status', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students have a daily practice status.' } });
  }

  try {
    const dailyStatus = await getDailyPracticeStatus(studentProfileId);
    return res.json(dailyStatus);
  } catch (error: any) {
    console.error('Error fetching daily practice status:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/assessments/run-code
 * Runs code in the sandbox environment against provided test cases for immediate feedback
 */
router.post('/run-code', authenticate, async (req: AuthRequest, res: Response) => {
  const { code, language, testCases } = req.body;

  try {
    const { executeCodeSandbox } = await import('../services/codeRunnerService.js');
    const result = await executeCodeSandbox({
      code: code || '',
      language: language || 'javascript',
      testCases: testCases || [],
    });
    return res.json(result);
  } catch (error: any) {
    console.error('Error executing code sandbox:', error);
    return res.status(500).json({ error: { code: 'SANDBOX_ERROR', message: error.message } });
  }
});

/**
 * POST /api/assessments/sets/:setId/submit
 * Submits answers for a practice set attempt.
 * Evaluates MCQs, runs AI rubric grading on written questions, judges coding problems,
 * computes pass/fail, and updates two-directional rolling Skill Radar vectors.
 */
router.post('/sets/:setId/submit', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students can submit assessments.' } });
  }

  const { setId } = req.params;
  const { attemptId, answers, writtenAnswers, codingAnswers, timeSpentSeconds } = req.body;

  try {
    const result = await submitPracticeSetAttempt(studentProfileId, {
      practiceSetId: setId,
      attemptId,
      timeSpentSeconds: timeSpentSeconds || 0,
      answers: answers || {},
      writtenAnswers: writtenAnswers || {},
      codingAnswers: codingAnswers || {},
    });

    return res.json({ result, message: 'Assessment evaluated successfully.' });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/assessments/report-card
 * Retrieves the complete historical Report Card summary for the authenticated student.
 */
router.get('/report-card', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only students have a Report Card.' } });
  }

  try {
    const reportCard = await getReportCardSummary(studentProfileId);
    return res.json({ reportCard });
  } catch (error: any) {
    console.error('Error fetching report card summary:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/assessments/attempts/:attemptId
 * Retrieves detailed historical attempt results for read-only review.
 */
router.get('/attempts/:attemptId', authenticate, async (req: AuthRequest, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
  }

  const { attemptId } = req.params;

  try {
    const attempt = await getAttemptDetail(attemptId, studentProfileId);
    return res.json({ attempt });
  } catch (error: any) {
    console.error('Error fetching attempt:', error);
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
  }
});

export default router;
