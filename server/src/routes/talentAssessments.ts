import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  requireStudentProfile,
  requireIndustryProfile,
} from '../middleware/authorization.js';
import { recordAuditLog } from '../services/auditLogService.js';
import {
  listAssessmentsForStudent,
  listAssessmentsForIndustry,
  getAssessmentById,
  createAssessment,
  addQuestionToAssessment,
  updateAssessment,
  updateAssessmentStatus,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getAssessmentSubmissions,
  getMySubmission,
} from '../services/talentAssessmentService.js';

const router = Router();

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================

const CreateAssessmentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(3000),
  durationMinutes: z.number().int().min(5).max(180).default(45),
  passingScorePct: z.number().min(0).max(100).default(70.0),
  opportunityId: z.string().uuid().optional(),
  requiredSkills: z.array(z.string().min(1).max(100)).max(20).optional(),
  questions: z
    .array(
      z.object({
        type: z.enum(['MCQ', 'TECHNICAL', 'SCENARIO', 'BEHAVIORAL', 'SHORT_ANSWER']).default('MCQ'),
        prompt: z.string().min(3).max(2000),
        options: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(1).max(500),
              isCorrect: z.boolean().optional(),
            })
          )
          .min(2)
          .max(10)
          .default([]),
        rubric: z.string().max(1000).optional(),
        points: z.number().min(1).max(100).default(10.0),
        displayOrder: z.number().int().min(1).default(1),
        skillId: z.string().optional(),
      })
    )
    .max(50)
    .optional(),
});

const CreateQuestionSchema = z.object({
  type: z.enum(['MCQ', 'TECHNICAL', 'SCENARIO', 'BEHAVIORAL', 'SHORT_ANSWER']).default('MCQ'),
  prompt: z.string().min(3).max(2000),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(500),
        isCorrect: z.boolean().optional(),
      })
    )
    .min(2)
    .max(10)
    .optional(),
  rubric: z.string().max(1000).optional(),
  points: z.number().min(1).max(100).default(10.0),
  displayOrder: z.number().int().min(1).default(1),
  skillId: z.string().optional(),
});

const UpdateAssessmentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).max(3000).optional(),
  durationMinutes: z.number().int().min(5).max(180).optional(),
  passingScorePct: z.number().min(0).max(100).optional(),
  opportunityId: z.string().uuid().nullable().optional(),
  requiredSkills: z.array(z.string().min(1).max(100)).max(20).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

const SubmitAnswersSchema = z.object({
  answers: z.record(z.any()),
});

// ============================================================
// ENDPOINTS
// ============================================================

/**
 * GET /api/talent-assessments
 * - STUDENT: lists published assessments available to the student
 * - INDUSTRY: lists assessments created/owned by the company
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if (role === 'STUDENT') {
      if (!req.user?.studentProfileId) {
        return res.status(403).json({
          error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile not found' },
        });
      }
      const assessments = await listAssessmentsForStudent(req.user.studentProfileId);
      return res.json({ assessments });
    }

    if (role === 'INDUSTRY' || role === 'ADMIN') {
      const industryId = req.user?.industryProfileId;
      if (!industryId && role !== 'ADMIN') {
        return res.status(403).json({
          error: { code: 'NO_INDUSTRY_PROFILE', message: 'Industry profile not found' },
        });
      }
      const assessments = await listAssessmentsForIndustry(industryId || '');
      return res.json({ assessments });
    }

    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Access denied. Student or Industry role required.' },
    });
  } catch (error: any) {
    console.error('Error listing talent assessments:', error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/talent-assessments/:id
 * - STUDENT: safe assessment metadata (NO correct answers, NO rubrics)
 * - INDUSTRY: owner view (includes answers, options with isCorrect, rubric)
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = {
      role: req.user!.role,
      industryProfileId: req.user?.industryProfileId,
      studentProfileId: req.user?.studentProfileId,
    };

    const assessment = await getAssessmentById(id, user);
    return res.json({ assessment });
  } catch (error: any) {
    console.error(`Error fetching assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/talent-assessments
 * - INDUSTRY only
 * Creates an assessment transactionally.
 */
router.post('/', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = CreateAssessmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid assessment creation data',
          details: parseResult.error.flatten(),
        },
      });
    }

    const industryProfileId = req.user!.industryProfileId!;
    const assessment = await createAssessment(parseResult.data, industryProfileId);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_CREATED',
      entity: 'Assessment',
      entityId: assessment.id,
      metadata: {
        title: assessment.title,
        opportunityId: assessment.opportunityId,
        questionCount: assessment.questionCount,
      },
    });

    return res.status(201).json({ assessment });
  } catch (error: any) {
    console.error('Error creating talent assessment:', error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/talent-assessments/:id/questions
 * - INDUSTRY owner only
 * Adds a question safely to the assessment.
 */
router.post('/:id/questions', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = CreateQuestionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question data',
          details: parseResult.error.flatten(),
        },
      });
    }

    const industryProfileId = req.user!.industryProfileId!;
    const question = await addQuestionToAssessment(req.params.id, parseResult.data, industryProfileId);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_QUESTION_ADDED',
      entity: 'AssessmentQuestion',
      entityId: question.id,
      metadata: { assessmentId: req.params.id, prompt: question.prompt },
    });

    return res.status(201).json({ question });
  } catch (error: any) {
    console.error(`Error adding question to assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * PUT /api/talent-assessments/:id
 * - INDUSTRY owner only
 * Updates assessment configuration.
 */
router.put('/:id', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = UpdateAssessmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update payload',
          details: parseResult.error.flatten(),
        },
      });
    }

    const industryProfileId = req.user!.industryProfileId!;
    const assessment = await updateAssessment(req.params.id, parseResult.data, industryProfileId);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_UPDATED',
      entity: 'Assessment',
      entityId: assessment.id,
      metadata: parseResult.data,
    });

    return res.json({ assessment });
  } catch (error: any) {
    console.error(`Error updating assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * PATCH /api/talent-assessments/:id/status
 * - INDUSTRY owner only
 * Publishes / unpublishes / archives an assessment.
 */
router.patch('/:id/status', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = UpdateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status',
          details: parseResult.error.flatten(),
        },
      });
    }

    const industryProfileId = req.user!.industryProfileId!;
    const result = await updateAssessmentStatus(req.params.id, parseResult.data.status, industryProfileId);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_STATUS_UPDATED',
      entity: 'Assessment',
      entityId: req.params.id,
      metadata: { status: result.status },
    });

    return res.json(result);
  } catch (error: any) {
    console.error(`Error updating status for assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/talent-assessments/:id/start
 * - STUDENT only
 * Initializes timed student attempt. Sanitizes questions.
 */
router.post('/:id/start', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;
    const startData = await startAssessmentAttempt(req.params.id, studentProfileId);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_STARTED',
      entity: 'AssessmentSubmission',
      entityId: startData.submissionId,
      metadata: { assessmentId: req.params.id },
    });

    return res.json(startData);
  } catch (error: any) {
    console.error(`Error starting assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/talent-assessments/:id/submit
 * - STUDENT only
 * Atomically validates, deterministically scores, and persists submission.
 */
router.post('/:id/submit', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = SubmitAnswersSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid answers payload',
          details: parseResult.error.flatten(),
        },
      });
    }

    const studentProfileId = req.user!.studentProfileId!;
    const result = await submitAssessmentAttempt(req.params.id, studentProfileId, parseResult.data.answers);

    await recordAuditLog({
      userId: req.user!.id,
      action: 'ASSESSMENT_SUBMITTED',
      entity: 'AssessmentSubmission',
      entityId: result.submissionId,
      metadata: {
        assessmentId: req.params.id,
        score: result.score,
        passed: result.passed,
      },
    });

    return res.json(result);
  } catch (error: any) {
    console.error(`Error submitting assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/talent-assessments/:id/submissions
 * - INDUSTRY owner only
 * Returns candidate submissions without sensitive PII.
 */
router.get('/:id/submissions', authenticate, requireIndustryProfile, async (req: AuthRequest, res: Response) => {
  try {
    const industryProfileId = req.user!.industryProfileId!;
    const submissions = await getAssessmentSubmissions(req.params.id, industryProfileId);
    return res.json({ submissions });
  } catch (error: any) {
    console.error(`Error fetching submissions for assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/talent-assessments/:id/my-submission
 * - STUDENT only
 * Returns their own submission and authoritative result.
 */
router.get('/:id/my-submission', authenticate, requireStudentProfile, async (req: AuthRequest, res: Response) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;
    const submission = await getMySubmission(req.params.id, studentProfileId);

    if (!submission) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No submission found for this assessment' },
      });
    }

    return res.json({ submission });
  } catch (error: any) {
    console.error(`Error fetching student submission for assessment ${req.params.id}:`, error);
    return res.status(error.status || 500).json({
      error: { code: error.code || 'INTERNAL_ERROR', message: error.message },
    });
  }
});

export default router;
