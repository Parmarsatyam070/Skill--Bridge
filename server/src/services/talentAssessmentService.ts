import { prisma } from '../config/prisma.js';
import {
  TalentAssessmentStatus,
  TalentAssessmentQuestionType,
  TalentAssessmentOptionDto,
  TalentAssessmentAdminOptionDto,
  TalentAssessmentQuestionDto,
  TalentAssessmentAdminQuestionDto,
  TalentAssessmentSummaryDto,
  TalentAssessmentDetailDto,
  TalentAssessmentAdminDetailDto,
  TalentAssessmentSubmissionDto,
  TalentAssessmentStartResult,
  TalentAssessmentSubmitResult,
  TALENT_ASSESSMENT_ADVISORY_DISCLAIMER,
} from '../../../shared/types.js';

export interface CreateTalentAssessmentInput {
  title: string;
  description: string;
  durationMinutes?: number;
  passingScorePct?: number;
  opportunityId?: string;
  requiredSkills?: string[];
  questions?: Array<{
    type?: TalentAssessmentQuestionType;
    prompt: string;
    options: Array<{ id: string; text: string; isCorrect?: boolean }>;
    rubric?: string;
    points?: number;
    displayOrder?: number;
    skillId?: string;
  }>;
}

export interface CreateTalentAssessmentQuestionInput {
  type?: TalentAssessmentQuestionType;
  prompt: string;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  rubric?: string;
  points?: number;
  displayOrder?: number;
  skillId?: string;
}

export interface UpdateTalentAssessmentInput {
  title?: string;
  description?: string;
  durationMinutes?: number;
  passingScorePct?: number;
  opportunityId?: string | null;
  requiredSkills?: string[];
}

function parseJsonSafe<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

/**
 * Sanitizes question options so `isCorrect` is NEVER sent to the student client.
 */
function sanitizeQuestionForStudent(q: any): TalentAssessmentQuestionDto {
  const rawOptions: TalentAssessmentAdminOptionDto[] = parseJsonSafe(q.optionsJson, []);
  const sanitizedOptions: TalentAssessmentOptionDto[] = rawOptions.map(opt => ({
    id: opt.id,
    text: opt.text,
  }));

  return {
    id: q.id,
    assessmentId: q.assessmentId,
    type: (q.type as TalentAssessmentQuestionType) || 'MCQ',
    prompt: q.prompt,
    options: sanitizedOptions,
    points: q.points,
    displayOrder: q.displayOrder,
    skillId: q.skillId,
  };
}

/**
 * Maps question for Industry owner including `isCorrect` and `rubric`.
 */
function mapQuestionForAdmin(q: any): TalentAssessmentAdminQuestionDto {
  const options: TalentAssessmentAdminOptionDto[] = parseJsonSafe(q.optionsJson, []);

  return {
    id: q.id,
    assessmentId: q.assessmentId,
    type: (q.type as TalentAssessmentQuestionType) || 'MCQ',
    prompt: q.prompt,
    options,
    rubric: q.rubric,
    starterCode: q.starterCode,
    testCasesJson: q.testCasesJson,
    points: q.points,
    displayOrder: q.displayOrder,
    skillId: q.skillId,
  };
}

/**
 * Lists published assessments available to the authenticated student.
 */
export async function listAssessmentsForStudent(studentProfileId: string): Promise<TalentAssessmentSummaryDto[]> {
  const assessments = await prisma.assessment.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: { id: true, companyName: true },
          },
        },
      },
      company: {
        select: { id: true, companyName: true },
      },
      questions: {
        select: { id: true, points: true },
      },
      submissions: {
        where: { studentId: studentProfileId },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assessments.map(a => {
    const totalPoints = a.questions.reduce((sum, q) => sum + q.points, 0);
    const requiredSkills: string[] = parseJsonSafe(a.requiredSkillsJson, []);
    const latestSub = a.submissions[0];

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      durationMinutes: a.durationMinutes,
      passingScorePct: a.passingScorePct,
      status: (a.status as TalentAssessmentStatus) || 'PUBLISHED',
      opportunityId: a.opportunityId,
      opportunityTitle: a.opportunity?.title || null,
      companyId: a.companyId || a.opportunity?.company?.id || null,
      companyName: a.company?.companyName || a.opportunity?.company?.companyName || null,
      questionCount: a.questions.length,
      totalPoints,
      requiredSkills,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      mySubmission: latestSub
        ? {
            id: latestSub.id,
            score: latestSub.score,
            passed: latestSub.passed,
            timeSpentSeconds: latestSub.timeSpentSeconds,
            startedAt: latestSub.startedAt.toISOString(),
            submittedAt: latestSub.submittedAt ? latestSub.submittedAt.toISOString() : null,
          }
        : null,
    };
  });
}

/**
 * Lists assessments created / owned by the authenticated industry profile.
 */
export async function listAssessmentsForIndustry(industryProfileId: string): Promise<TalentAssessmentSummaryDto[]> {
  const assessments = await prisma.assessment.findMany({
    where: {
      OR: [
        { companyId: industryProfileId },
        { opportunity: { companyId: industryProfileId } },
      ],
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: { id: true, companyName: true },
          },
        },
      },
      company: {
        select: { id: true, companyName: true },
      },
      questions: {
        select: { id: true, points: true },
      },
      submissions: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assessments.map(a => {
    const totalPoints = a.questions.reduce((sum, q) => sum + q.points, 0);
    const requiredSkills: string[] = parseJsonSafe(a.requiredSkillsJson, []);

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      durationMinutes: a.durationMinutes,
      passingScorePct: a.passingScorePct,
      status: (a.status as TalentAssessmentStatus) || 'DRAFT',
      opportunityId: a.opportunityId,
      opportunityTitle: a.opportunity?.title || null,
      companyId: a.companyId || a.opportunity?.company?.id || industryProfileId,
      companyName: a.company?.companyName || a.opportunity?.company?.companyName || null,
      questionCount: a.questions.length,
      totalPoints,
      requiredSkills,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  });
}

/**
 * Retrieves assessment details by ID with appropriate role permissions.
 * Student view has all correct answers and rubrics completely removed.
 */
export async function getAssessmentById(
  assessmentId: string,
  user: { role: string; industryProfileId?: string; studentProfileId?: string }
): Promise<TalentAssessmentDetailDto | TalentAssessmentAdminDetailDto> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: { id: true, companyName: true },
          },
        },
      },
      company: {
        select: { id: true, companyName: true },
      },
      questions: {
        orderBy: { displayOrder: 'asc' },
      },
      submissions: user.studentProfileId
        ? {
            where: { studentId: user.studentProfileId },
            orderBy: { startedAt: 'desc' },
            take: 1,
          }
        : false,
    },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isIndustryOwner =
    user.role === 'ADMIN' ||
    (user.industryProfileId &&
      (assessment.companyId === user.industryProfileId ||
        assessment.opportunity?.company?.id === user.industryProfileId));

  if (!isIndustryOwner) {
    // If not owner, only published assessments can be viewed
    if (assessment.status !== 'PUBLISHED') {
      const err: any = new Error('Assessment is not available');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
  }

  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  const requiredSkills: string[] = parseJsonSafe(assessment.requiredSkillsJson, []);
  const latestSub = assessment.submissions && assessment.submissions[0];

  const baseSummary = {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    durationMinutes: assessment.durationMinutes,
    passingScorePct: assessment.passingScorePct,
    status: (assessment.status as TalentAssessmentStatus) || 'DRAFT',
    opportunityId: assessment.opportunityId,
    opportunityTitle: assessment.opportunity?.title || null,
    companyId: assessment.companyId || assessment.opportunity?.company?.id || null,
    companyName: assessment.company?.companyName || assessment.opportunity?.company?.companyName || null,
    questionCount: assessment.questions.length,
    totalPoints,
    requiredSkills,
    createdAt: assessment.createdAt.toISOString(),
    updatedAt: assessment.updatedAt.toISOString(),
    mySubmission: latestSub
      ? {
          id: latestSub.id,
          score: latestSub.score,
          passed: latestSub.passed,
          timeSpentSeconds: latestSub.timeSpentSeconds,
          startedAt: latestSub.startedAt.toISOString(),
          submittedAt: latestSub.submittedAt ? latestSub.submittedAt.toISOString() : null,
        }
      : null,
  };

  if (isIndustryOwner) {
    return {
      ...baseSummary,
      questions: assessment.questions.map(mapQuestionForAdmin),
    };
  }

  // Student view: sanitized questions (no answers/rubrics)
  return {
    ...baseSummary,
    questions: assessment.questions.map(sanitizeQuestionForStudent),
  };
}

/**
 * Creates an assessment transactionally.
 */
export async function createAssessment(
  input: CreateTalentAssessmentInput,
  industryProfileId: string
): Promise<TalentAssessmentSummaryDto> {
  // If opportunityId provided, verify industry ownership of opportunity
  if (input.opportunityId) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: input.opportunityId },
      select: { id: true, companyId: true },
    });
    if (!opp) {
      const err: any = new Error('Associated opportunity not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    if (opp.companyId !== industryProfileId) {
      const err: any = new Error('You do not own the specified opportunity');
      err.code = 'FORBIDDEN_OWNERSHIP';
      err.status = 403;
      throw err;
    }
  }

  const created = await prisma.$transaction(async tx => {
    const assessment = await tx.assessment.create({
      data: {
        companyId: industryProfileId,
        opportunityId: input.opportunityId || null,
        title: input.title,
        description: input.description,
        durationMinutes: input.durationMinutes ?? 45,
        passingScorePct: input.passingScorePct ?? 70.0,
        requiredSkillsJson: input.requiredSkills ? JSON.stringify(input.requiredSkills) : null,
        status: 'DRAFT',
      },
    });

    if (input.questions && input.questions.length > 0) {
      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        await tx.assessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            type: q.type || 'MCQ',
            prompt: q.prompt,
            optionsJson: JSON.stringify(q.options || []),
            rubric: q.rubric || null,
            points: q.points ?? 10.0,
            displayOrder: q.displayOrder ?? i + 1,
            skillId: q.skillId || null,
          },
        });
      }
    }

    return assessment;
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    durationMinutes: created.durationMinutes,
    passingScorePct: created.passingScorePct,
    status: 'DRAFT',
    opportunityId: created.opportunityId,
    companyId: industryProfileId,
    questionCount: input.questions?.length ?? 0,
    totalPoints: input.questions?.reduce((sum, q) => sum + (q.points ?? 10.0), 0) ?? 0,
    requiredSkills: input.requiredSkills ?? [],
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

/**
 * Adds a question to an assessment.
 */
export async function addQuestionToAssessment(
  assessmentId: string,
  input: CreateTalentAssessmentQuestionInput,
  industryProfileId: string
): Promise<TalentAssessmentAdminQuestionDto> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { opportunity: true },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isOwner =
    assessment.companyId === industryProfileId || assessment.opportunity?.companyId === industryProfileId;
  if (!isOwner) {
    const err: any = new Error('You do not have permission to modify this assessment');
    err.code = 'FORBIDDEN_OWNERSHIP';
    err.status = 403;
    throw err;
  }

  const question = await prisma.assessmentQuestion.create({
    data: {
      assessmentId,
      type: input.type || 'MCQ',
      prompt: input.prompt,
      optionsJson: JSON.stringify(input.options || []),
      rubric: input.rubric || null,
      points: input.points ?? 10.0,
      displayOrder: input.displayOrder ?? 1,
      skillId: input.skillId || null,
    },
  });

  return mapQuestionForAdmin(question);
}

/**
 * Updates assessment configuration.
 */
export async function updateAssessment(
  assessmentId: string,
  input: UpdateTalentAssessmentInput,
  industryProfileId: string
): Promise<TalentAssessmentSummaryDto> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { opportunity: true, questions: true },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isOwner =
    assessment.companyId === industryProfileId || assessment.opportunity?.companyId === industryProfileId;
  if (!isOwner) {
    const err: any = new Error('You do not have permission to modify this assessment');
    err.code = 'FORBIDDEN_OWNERSHIP';
    err.status = 403;
    throw err;
  }

  if (input.opportunityId) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: input.opportunityId },
      select: { id: true, companyId: true },
    });
    if (!opp || opp.companyId !== industryProfileId) {
      const err: any = new Error('Opportunity not found or not owned by your company');
      err.code = 'FORBIDDEN_OWNERSHIP';
      err.status = 403;
      throw err;
    }
  }

  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      title: input.title !== undefined ? input.title : undefined,
      description: input.description !== undefined ? input.description : undefined,
      durationMinutes: input.durationMinutes !== undefined ? input.durationMinutes : undefined,
      passingScorePct: input.passingScorePct !== undefined ? input.passingScorePct : undefined,
      opportunityId: input.opportunityId !== undefined ? input.opportunityId : undefined,
      requiredSkillsJson: input.requiredSkills ? JSON.stringify(input.requiredSkills) : undefined,
    },
  });

  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    durationMinutes: updated.durationMinutes,
    passingScorePct: updated.passingScorePct,
    status: (updated.status as TalentAssessmentStatus) || 'DRAFT',
    opportunityId: updated.opportunityId,
    companyId: updated.companyId,
    questionCount: assessment.questions.length,
    totalPoints,
    requiredSkills: parseJsonSafe(updated.requiredSkillsJson, []),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * Updates assessment status (publish / unpublish).
 */
export async function updateAssessmentStatus(
  assessmentId: string,
  status: TalentAssessmentStatus,
  industryProfileId: string
): Promise<{ id: string; status: TalentAssessmentStatus }> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { opportunity: true, questions: true },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isOwner =
    assessment.companyId === industryProfileId || assessment.opportunity?.companyId === industryProfileId;
  if (!isOwner) {
    const err: any = new Error('You do not have permission to modify this assessment');
    err.code = 'FORBIDDEN_OWNERSHIP';
    err.status = 403;
    throw err;
  }

  if (status === 'PUBLISHED' && assessment.questions.length === 0) {
    const err: any = new Error('Cannot publish an assessment with zero questions');
    err.code = 'INVALID_STATE';
    err.status = 422;
    throw err;
  }

  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status },
  });

  return { id: updated.id, status: updated.status as TalentAssessmentStatus };
}

/**
 * Starts a timed assessment attempt for a student.
 * Sanitizes questions (removes all correct answers/rubrics).
 * Enforces duplicate attempt and expiration rules.
 */
export async function startAssessmentAttempt(
  assessmentId: string,
  studentProfileId: string
): Promise<TalentAssessmentStartResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: { orderBy: { displayOrder: 'asc' } },
      submissions: {
        where: { studentId: studentProfileId },
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (assessment.status !== 'PUBLISHED') {
    const err: any = new Error('Assessment is not currently published or available');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const now = new Date();
  const existingSubmissions = assessment.submissions;

  // Check if student already submitted this assessment
  const completedSubmission = existingSubmissions.find(s => s.submittedAt !== null);
  if (completedSubmission) {
    const err: any = new Error('You have already submitted this assessment. Duplicate attempts are not permitted.');
    err.code = 'ALREADY_SUBMITTED';
    err.status = 409;
    throw err;
  }

  // Check if an attempt is currently in progress
  const activeSubmission = existingSubmissions.find(s => s.submittedAt === null);
  if (activeSubmission) {
    const elapsedSeconds = Math.floor((now.getTime() - activeSubmission.startedAt.getTime()) / 1000);
    const maxAllowedSeconds = (assessment.durationMinutes + 2) * 60; // 2 minute network grace buffer

    if (elapsedSeconds < maxAllowedSeconds) {
      // Resume existing active attempt
      const remainingSeconds = Math.max(0, assessment.durationMinutes * 60 - elapsedSeconds);
      return {
        submissionId: activeSubmission.id,
        assessmentId: assessment.id,
        title: assessment.title,
        durationMinutes: assessment.durationMinutes,
        startedAt: activeSubmission.startedAt.toISOString(),
        timeRemainingSeconds: remainingSeconds,
        questions: assessment.questions.map(sanitizeQuestionForStudent),
      };
    } else {
      // Past expiration window — close it out automatically
      await prisma.assessmentSubmission.update({
        where: { id: activeSubmission.id },
        data: {
          submittedAt: now,
          timeSpentSeconds: maxAllowedSeconds,
          score: 0,
          passed: false,
        },
      });
      const err: any = new Error('Previous assessment attempt expired');
      err.code = 'ATTEMPT_EXPIRED';
      err.status = 409;
      throw err;
    }
  }

  // Create new submission record atomically
  const newSubmission = await prisma.assessmentSubmission.create({
    data: {
      assessmentId,
      studentId: studentProfileId,
      startedAt: now,
      submittedAt: null,
      score: 0.0,
      passed: false,
      technicalScore: 0.0,
      answersJson: '{}',
    },
  });

  return {
    submissionId: newSubmission.id,
    assessmentId: assessment.id,
    title: assessment.title,
    durationMinutes: assessment.durationMinutes,
    startedAt: newSubmission.startedAt.toISOString(),
    timeRemainingSeconds: assessment.durationMinutes * 60,
    questions: assessment.questions.map(sanitizeQuestionForStudent),
  };
}

/**
 * Submits an assessment attempt.
 * Deterministically calculates the score on the backend.
 * Never trusts client-provided scores.
 */
export async function submitAssessmentAttempt(
  assessmentId: string,
  studentProfileId: string,
  answers: Record<string, any>
): Promise<TalentAssessmentSubmitResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: { orderBy: { displayOrder: 'asc' } },
      submissions: {
        where: { studentId: studentProfileId },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const submission = assessment.submissions[0];
  if (!submission) {
    const err: any = new Error('No active assessment session found to submit');
    err.code = 'NO_ACTIVE_SESSION';
    err.status = 404;
    throw err;
  }

  if (submission.submittedAt !== null) {
    const err: any = new Error('Assessment has already been submitted');
    err.code = 'ALREADY_SUBMITTED';
    err.status = 409;
    throw err;
  }

  const now = new Date();
  const timeSpentSeconds = Math.floor((now.getTime() - submission.startedAt.getTime()) / 1000);
  const maxAllowedSeconds = (assessment.durationMinutes + 2) * 60; // 2 min grace

  // Deterministic server-side evaluation
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  let earnedPoints = 0;
  let correctCount = 0;
  const skillBreakdown: Record<string, { score: number; total: number }> = {};

  for (const q of assessment.questions) {
    const studentAns = answers[q.id];
    let isQuestionCorrect = false;

    if (q.skillId && !skillBreakdown[q.skillId]) {
      skillBreakdown[q.skillId] = { score: 0, total: 0 };
    }
    if (q.skillId) {
      skillBreakdown[q.skillId].total += q.points;
    }

    if (q.type === 'MCQ' || q.type === 'SCENARIO' || q.type === 'BEHAVIORAL' || q.type === 'TECHNICAL') {
      const options: TalentAssessmentAdminOptionDto[] = parseJsonSafe(q.optionsJson, []);
      const correctOptionIds = options.filter(o => o.isCorrect).map(o => o.id);

      if (Array.isArray(studentAns)) {
        // Multi-select: check array equality
        const sortedStudent = [...studentAns].sort();
        const sortedCorrect = [...correctOptionIds].sort();
        if (
          sortedStudent.length === sortedCorrect.length &&
          sortedStudent.every((val, idx) => val === sortedCorrect[idx])
        ) {
          isQuestionCorrect = true;
        }
      } else if (typeof studentAns === 'string') {
        if (correctOptionIds.includes(studentAns)) {
          isQuestionCorrect = true;
        }
      }
    } else if (q.type === 'SHORT_ANSWER') {
      if (typeof studentAns === 'string' && q.rubric) {
        const cleanStudent = studentAns.trim().toLowerCase();
        const cleanRubric = q.rubric.trim().toLowerCase();
        if (cleanStudent === cleanRubric || cleanRubric.split('|').map(s => s.trim()).includes(cleanStudent)) {
          isQuestionCorrect = true;
        }
      }
    }

    if (isQuestionCorrect) {
      earnedPoints += q.points;
      correctCount++;
      if (q.skillId) {
        skillBreakdown[q.skillId].score += q.points;
      }
    }
  }

  // Calculate authoritative percentage score (0-100)
  const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10 : 0;
  const clampedScore = Math.max(0, Math.min(100, finalScore));
  const passed = clampedScore >= assessment.passingScorePct;

  // Persist submission atomically
  const updatedSubmission = await prisma.assessmentSubmission.update({
    where: { id: submission.id },
    data: {
      submittedAt: now,
      timeSpentSeconds: Math.min(timeSpentSeconds, maxAllowedSeconds),
      score: clampedScore,
      passed,
      technicalScore: clampedScore,
      answersJson: JSON.stringify(answers),
      skillScoreBreakdownJson: JSON.stringify(skillBreakdown),
    },
  });

  return {
    submissionId: updatedSubmission.id,
    assessmentId: assessment.id,
    score: clampedScore,
    passed,
    timeSpentSeconds: updatedSubmission.timeSpentSeconds,
    submittedAt: now.toISOString(),
    totalQuestions: assessment.questions.length,
    correctQuestions: correctCount,
    skillBreakdown,
    disclaimer: TALENT_ASSESSMENT_ADVISORY_DISCLAIMER,
  };
}

/**
 * Returns candidate submissions for an assessment to the authorized industry owner.
 * Strictly strips sensitive personal data (passwords, tokens, private phone/email).
 */
export async function getAssessmentSubmissions(
  assessmentId: string,
  industryProfileId: string
): Promise<TalentAssessmentSubmissionDto[]> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      opportunity: true,
      submissions: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  // Sensitive fields explicitly omitted: passwordHash, firebaseUid, phone, email, resetTokens
                },
              },
            },
          },
        },
        orderBy: { score: 'desc' },
      },
    },
  });

  if (!assessment) {
    const err: any = new Error('Assessment not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const isOwner =
    assessment.companyId === industryProfileId || assessment.opportunity?.companyId === industryProfileId;
  if (!isOwner) {
    const err: any = new Error('You do not have permission to view submissions for this assessment');
    err.code = 'FORBIDDEN_OWNERSHIP';
    err.status = 403;
    throw err;
  }

  return assessment.submissions.map(s => {
    return {
      id: s.id,
      assessmentId: s.assessmentId,
      studentId: s.studentId,
      studentName: s.student.user.name,
      studentAvatar: s.student.user.avatarUrl,
      institution: s.student.institution,
      headline: s.student.headline,
      startedAt: s.startedAt.toISOString(),
      submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
      timeSpentSeconds: s.timeSpentSeconds,
      score: s.score,
      passed: s.passed,
      technicalScore: s.technicalScore,
      skillScoreBreakdown: parseJsonSafe(s.skillScoreBreakdownJson, undefined),
      feedback: s.feedbackJson,
    };
  });
}

/**
 * Returns a student's own submission/result for an assessment.
 */
export async function getMySubmission(
  assessmentId: string,
  studentProfileId: string
): Promise<TalentAssessmentSubmissionDto | null> {
  const submission = await prisma.assessmentSubmission.findFirst({
    where: {
      assessmentId,
      studentId: studentProfileId,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (!submission) return null;

  return {
    id: submission.id,
    assessmentId: submission.assessmentId,
    studentId: submission.studentId,
    studentName: submission.student.user.name,
    studentAvatar: submission.student.user.avatarUrl,
    institution: submission.student.institution,
    headline: submission.student.headline,
    startedAt: submission.startedAt.toISOString(),
    submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
    timeSpentSeconds: submission.timeSpentSeconds,
    score: submission.score,
    passed: submission.passed,
    technicalScore: submission.technicalScore,
    skillScoreBreakdown: parseJsonSafe(submission.skillScoreBreakdownJson, undefined),
    feedback: submission.feedbackJson,
  };
}

export const talentAssessmentService = {
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
};
