import { prisma } from '../config/prisma.js';
import { z } from 'zod';
import { callLlmChat } from './llmService.js';
import { recordAuditLog } from './auditLogService.js';
import { toSafeRecruiterCandidateDto } from '../utils/safeCandidateDto.js';
import {
  AI_INTERVIEW_ADVISORY_DISCLAIMER,
  InterviewType,
  InterviewStatus,
  InterviewRecommendation,
  InterviewQuestionItem,
  InterviewAnswerItem,
  InterviewEvaluation,
  InterviewSessionSummaryDto,
  InterviewSessionDetailDto,
  StartInterviewInput,
  SubmitAnswerInput,
  CompleteInterviewInput,
} from '../../../shared/types.js';

// ============================================================
// ZOD SCHEMAS FOR STRUCTURED AI OUTPUT
// ============================================================

export const AiGeneratedQuestionSchema = z.object({
  question: z.string().min(10),
  category: z.enum(['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'PROBLEM_SOLVING', 'EXPERIENCE']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  targetSkill: z.string().optional(),
  context: z.string().optional(),
});

export const AiSkillObservationSchema = z.object({
  skill: z.string(),
  observation: z.string(),
  rating: z.number().min(0).max(100),
});

export const AiInterviewEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  technicalScore: z.number().min(0).max(100).optional(),
  communicationScore: z.number().min(0).max(100).optional(),
  readinessTier: z.enum(['READY', 'ALMOST_READY', 'DEVELOPING', 'NEEDS_WORK']),
  recommendation: z.enum(['STRONGLY_RECOMMEND', 'RECOMMEND', 'MAYBE', 'DO_NOT_RECOMMEND']),
  strengths: z.array(z.string()).min(1),
  improvementAreas: z.array(z.string()).min(1),
  evidenceObserved: z.array(z.string()).min(1),
  skillObservations: z.array(AiSkillObservationSchema).optional().default([]),
  communicationObservations: z.array(z.string()).optional().default([]),
  recommendations: z.array(z.string()).min(1),
});

// ============================================================
// CURATED HIGH-SIGNAL FALLBACK QUESTION BANKS
// ============================================================

export const FALLBACK_QUESTIONS: Record<InterviewType, InterviewQuestionItem[]> = {
  TECHNICAL: [
    {
      id: 'fallback-tech-1',
      questionNumber: 1,
      question: 'How do you design an API endpoint for high concurrency to guarantee idempotency and avoid duplicate mutations?',
      category: 'TECHNICAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'API Architecture',
      context: 'Core backend reliability question',
    },
    {
      id: 'fallback-tech-2',
      questionNumber: 2,
      question: 'Explain the difference between a clustered and non-clustered database index. How does index selection affect read latency versus write overhead?',
      category: 'TECHNICAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Database Optimization',
      context: 'Database indexing fundamentals',
    },
    {
      id: 'fallback-tech-3',
      questionNumber: 3,
      question: 'Walk through how asynchronous event loops handle I/O bound operations versus CPU bound workloads. When would you offload processing to worker threads or separate worker services?',
      category: 'SYSTEM_DESIGN',
      difficulty: 'ADVANCED',
      targetSkill: 'Concurrency & Scaling',
      context: 'Runtime concurrency mechanics',
    },
    {
      id: 'fallback-tech-4',
      questionNumber: 4,
      question: 'Describe a production debugging scenario where you had to diagnose an unexpected memory leak or latency spike. What telemetry and diagnostic tools did you use?',
      category: 'PROBLEM_SOLVING',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Observability & Troubleshooting',
      context: 'Production diagnostic capabilities',
    },
    {
      id: 'fallback-tech-5',
      questionNumber: 5,
      question: 'How do you balance data consistency with availability in a distributed microservices environment? Walk through an example utilizing eventual consistency or the Saga pattern.',
      category: 'SYSTEM_DESIGN',
      difficulty: 'ADVANCED',
      targetSkill: 'Distributed Systems',
      context: 'Distributed architecture trade-offs',
    },
  ],
  BEHAVIORAL: [
    {
      id: 'fallback-behav-1',
      questionNumber: 1,
      question: 'Tell me about a time when you strongly disagreed with a peer or technical lead on an architectural approach. How did you advocate for your point of view, and what was the outcome?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Conflict Resolution',
      context: 'Constructive technical debate',
    },
    {
      id: 'fallback-behav-2',
      questionNumber: 2,
      question: 'Describe a project where critical requirements shifted abruptly close to a deadline. How did you prioritize tasks and communicate trade-offs to stakeholders?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Adaptability',
      context: 'Handling shifting project constraints',
    },
    {
      id: 'fallback-behav-3',
      questionNumber: 3,
      question: 'Can you share an experience where you made a technical mistake that impacted your team or system? What steps did you take to mitigate the issue and prevent future occurrences?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Accountability',
      context: 'Blameless post-mortem ownership',
    },
    {
      id: 'fallback-behav-4',
      questionNumber: 4,
      question: 'How do you approach mentoring junior team members or onboarding teammates onto a complex codebase without reducing your own velocity?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Leadership & Collaboration',
      context: 'Team enablement and knowledge sharing',
    },
    {
      id: 'fallback-behav-5',
      questionNumber: 5,
      question: 'Tell me about a complex technical achievement you are most proud of. Why did it matter to the business or users, and what did you personally learn?',
      category: 'EXPERIENCE',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Impact & Ownership',
      context: 'Demonstrating end-to-end impact',
    },
  ],
  HR: [
    {
      id: 'fallback-hr-1',
      questionNumber: 1,
      question: 'What motivated you to pursue this specific engineering domain, and what key milestones are you aiming for over the next two years?',
      category: 'EXPERIENCE',
      difficulty: 'BEGINNER',
      targetSkill: 'Career Trajectory',
      context: 'Motivation and professional goals',
    },
    {
      id: 'fallback-hr-2',
      questionNumber: 2,
      question: 'How do you structure your continuous learning routine to stay current with rapidly shifting technologies and industry practices?',
      category: 'BEHAVIORAL',
      difficulty: 'BEGINNER',
      targetSkill: 'Continuous Learning',
      context: 'Self-directed development habits',
    },
    {
      id: 'fallback-hr-3',
      questionNumber: 3,
      question: 'What workplace environments and engineering team cultures enable you to perform at your absolute best?',
      category: 'BEHAVIORAL',
      difficulty: 'BEGINNER',
      targetSkill: 'Culture Alignment',
      context: 'Workplace fit and communication style',
    },
    {
      id: 'fallback-hr-4',
      questionNumber: 4,
      question: 'How do you communicate complex technical concepts or trade-offs to non-engineering cross-functional partners like Product Managers or Designers?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Cross-functional Communication',
      context: 'Bridge building with non-technical stakeholders',
    },
    {
      id: 'fallback-hr-5',
      questionNumber: 5,
      question: 'Do you have any questions for our engineering leadership regarding our technology stack, architecture roadmap, or engineering culture?',
      category: 'BEHAVIORAL',
      difficulty: 'BEGINNER',
      targetSkill: 'Engagement & Curiosity',
      context: 'Candidate inquiry and engagement',
    },
  ],
  MIXED: [
    {
      id: 'fallback-mix-1',
      questionNumber: 1,
      question: 'Walk through the architectural design of a full-stack feature you built recently. What were the key technical trade-offs you evaluated?',
      category: 'TECHNICAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'System Architecture',
      context: 'Full-stack design reasoning',
    },
    {
      id: 'fallback-mix-2',
      questionNumber: 2,
      question: 'How do you approach writing clean, maintainable unit and integration tests for critical business logic?',
      category: 'TECHNICAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Software Quality & Testing',
      context: 'Engineering craftsmanship and testing mindset',
    },
    {
      id: 'fallback-mix-3',
      questionNumber: 3,
      question: 'Describe a situation where you identified technical debt that was slowing your team down. How did you measure its impact and advocate for refactoring?',
      category: 'PROBLEM_SOLVING',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Technical Debt Management',
      context: 'Pragmatic refactoring advocacy',
    },
    {
      id: 'fallback-mix-4',
      questionNumber: 4,
      question: 'Tell me about a time when you received tough constructive feedback on a pull request or code review. How did you react and integrate the feedback?',
      category: 'BEHAVIORAL',
      difficulty: 'INTERMEDIATE',
      targetSkill: 'Feedback Reception',
      context: 'Growth mindset and code review conduct',
    },
    {
      id: 'fallback-mix-5',
      questionNumber: 5,
      question: 'What are the top three technical skills you are currently focusing on mastering, and how will they enhance your engineering impact?',
      category: 'EXPERIENCE',
      difficulty: 'BEGINNER',
      targetSkill: 'Career Growth',
      context: 'Proactive skill acquisition',
    },
  ],
};

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ============================================================
// SERVICE IMPLEMENTATION
// ============================================================

/**
 * Starts a new AI interview session for a student candidate.
 */
export async function startInterviewSession(
  candidateProfileId: string,
  input: StartInterviewInput
): Promise<InterviewSessionDetailDto> {
  const { opportunityId, type = 'TECHNICAL', targetDomain, totalQuestions = 5 } = input;

  // Verify candidate exists
  const candidate = await prisma.studentProfile.findUnique({
    where: { id: candidateProfileId },
    include: { user: true, skillScores: { include: { skill: true } } },
  });

  if (!candidate) {
    throw new Error('Student profile not found');
  }

  // Check if linked to an opportunity
  let recruiterId: string | null = null;
  let opportunityTitle: string | null = null;
  let companyName: string | null = null;

  if (opportunityId) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { company: true },
    });
    if (!opp) {
      throw new Error('Opportunity not found');
    }
    recruiterId = opp.companyId;
    opportunityTitle = opp.title;
    companyName = opp.company.companyName;
  }

  // Generate Question 1
  const firstQuestion = await generateDynamicQuestion({
    type,
    questionNumber: 1,
    totalQuestions,
    opportunityTitle: opportunityTitle || targetDomain || candidate.targetDomain,
    targetDomain: targetDomain || candidate.targetDomain,
    candidateSkills: candidate.skillScores.map(s => s.skill.name),
    previousQuestions: [],
    previousAnswers: [],
  });

  const questions: InterviewQuestionItem[] = [firstQuestion];

  // Create session in transaction with AuditLog
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.interviewSession.create({
      data: {
        candidateId: candidateProfileId,
        recruiterId: recruiterId || null,
        opportunityId: opportunityId || null,
        type,
        status: 'IN_PROGRESS',
        scheduledAt: new Date(),
        questionsJson: JSON.stringify(questions),
        transcriptJson: JSON.stringify([]),
      },
    });

    await recordAuditLog({
      userId: candidate.userId,
      action: 'INTERVIEW_CREATED',
      entity: 'InterviewSession',
      entityId: created.id,
      metadata: {
        opportunityId,
        type,
        totalQuestions,
      },
      tx,
    });

    await recordAuditLog({
      userId: candidate.userId,
      action: 'INTERVIEW_STARTED',
      entity: 'InterviewSession',
      entityId: created.id,
      metadata: {
        startedAt: new Date().toISOString(),
      },
      tx,
    });

    return created;
  });

  return formatSessionDetail(session, candidate, opportunityTitle, companyName);
}

/**
 * Lists interview sessions for a student candidate.
 */
export async function listCandidateInterviews(
  candidateProfileId: string
): Promise<InterviewSessionSummaryDto[]> {
  const sessions = await prisma.interviewSession.findMany({
    where: { candidateId: candidateProfileId },
    include: {
      opportunity: { include: { company: true } },
      candidate: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map(s => {
    const questions = safeJsonParse<InterviewQuestionItem[]>(s.questionsJson, []);
    const transcript = safeJsonParse<InterviewAnswerItem[]>(s.transcriptJson, []);
    return {
      id: s.id,
      opportunityId: s.opportunityId,
      opportunityTitle: s.opportunity?.title || null,
      companyName: s.opportunity?.company.companyName || null,
      candidateId: s.candidateId,
      candidateName: s.candidate.user.name,
      candidateAvatar: s.candidate.user.avatarUrl,
      institution: s.candidate.institution,
      headline: s.candidate.headline,
      type: s.type as InterviewType,
      status: s.status as InterviewStatus,
      questionCount: questions.length,
      answeredCount: transcript.length,
      overallScore: s.overallScore,
      recommendation: s.recommendation as InterviewRecommendation | null,
      createdAt: s.createdAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    };
  });
}

/**
 * Lists interview sessions for an industry recruiter.
 * Exclusively scoped to the recruiter's company opportunities.
 */
export async function listIndustryInterviews(
  industryProfileId: string,
  opportunityId?: string
): Promise<InterviewSessionSummaryDto[]> {
  const whereClause: any = {
    OR: [
      { recruiterId: industryProfileId },
      { opportunity: { companyId: industryProfileId } },
    ],
  };

  if (opportunityId) {
    whereClause.opportunityId = opportunityId;
  }

  const sessions = await prisma.interviewSession.findMany({
    where: whereClause,
    include: {
      opportunity: { include: { company: true } },
      candidate: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map(s => {
    const questions = safeJsonParse<InterviewQuestionItem[]>(s.questionsJson, []);
    const transcript = safeJsonParse<InterviewAnswerItem[]>(s.transcriptJson, []);

    // Sanitize candidate info for recruiter view (no phone/email/passwordHash)
    const safeCandidate = toSafeRecruiterCandidateDto(s.candidate);

    return {
      id: s.id,
      opportunityId: s.opportunityId,
      opportunityTitle: s.opportunity?.title || null,
      companyName: s.opportunity?.company.companyName || null,
      candidateId: s.candidateId,
      candidateName: safeCandidate.fullName,
      candidateAvatar: safeCandidate.avatarUrl,
      institution: safeCandidate.institutionName,
      headline: safeCandidate.department,
      type: s.type as InterviewType,
      status: s.status as InterviewStatus,
      questionCount: questions.length,
      answeredCount: transcript.length,
      overallScore: s.overallScore,
      recommendation: s.recommendation as InterviewRecommendation | null,
      createdAt: s.createdAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    };
  });
}

/**
 * Fetches single interview session detail with strict authorization.
 */
export async function getInterviewSessionDetail(
  sessionId: string,
  requester: { userId: string; role: string; profileId?: string | null }
): Promise<InterviewSessionDetailDto> {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      opportunity: { include: { company: true } },
      candidate: { include: { user: true, skillScores: { include: { skill: true } } } },
    },
  });

  if (!session) {
    throw new Error('Interview session not found');
  }

  // Authorization enforcement
  if (requester.role === 'STUDENT') {
    if (session.candidateId !== requester.profileId) {
      throw new Error('FORBIDDEN: You can only view your own interview session');
    }
  } else if (requester.role === 'INDUSTRY') {
    const isOwner =
      session.recruiterId === requester.profileId ||
      session.opportunity?.companyId === requester.profileId;
    if (!isOwner) {
      throw new Error('FORBIDDEN: You can only view interviews for your company opportunities');
    }
  } else if (requester.role !== 'ADMIN') {
    throw new Error('FORBIDDEN: Role not authorized to view candidate interview sessions');
  }

  const oppTitle = session.opportunity?.title || null;
  const compName = session.opportunity?.company.companyName || null;

  return formatSessionDetail(session, session.candidate, oppTitle, compName, requester.role === 'INDUSTRY');
}

/**
 * Submits an answer to the current interview question.
 * Rejects duplicates, checks session state, and advances progress atomically.
 */
export async function submitInterviewAnswer(
  sessionId: string,
  candidateProfileId: string,
  input: SubmitAnswerInput
): Promise<{ success: boolean; nextQuestionNumber: number; isCompleted: boolean }> {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      opportunity: true,
      candidate: { include: { user: true, skillScores: { include: { skill: true } } } },
    },
  });

  if (!session) {
    throw new Error('Interview session not found');
  }

  if (session.candidateId !== candidateProfileId) {
    throw new Error('FORBIDDEN: You cannot submit answers to another student\'s interview');
  }

  if (session.status !== 'IN_PROGRESS') {
    throw new Error('Interview session is not active. Completed or cancelled interviews cannot be modified');
  }

  const questions = safeJsonParse<InterviewQuestionItem[]>(session.questionsJson, []);
  const transcript = safeJsonParse<InterviewAnswerItem[]>(session.transcriptJson, []);

  // Validate that this question is part of the session
  const targetQuestion = questions.find(q => q.id === input.questionId || q.questionNumber === input.questionNumber);
  if (!targetQuestion) {
    throw new Error(`Question ${input.questionNumber} not found in this interview session`);
  }

  // Prevent duplicate submission for the same question
  const existingAnswer = transcript.find(a => a.questionId === targetQuestion.id || a.questionNumber === targetQuestion.questionNumber);
  if (existingAnswer) {
    throw new Error(`Duplicate submission: Question ${targetQuestion.questionNumber} has already been answered`);
  }

  // Create new answer record
  const newAnswer: InterviewAnswerItem = {
    questionId: targetQuestion.id,
    questionNumber: targetQuestion.questionNumber,
    question: targetQuestion.question,
    answer: input.answer.trim(),
    answeredAt: new Date().toISOString(),
    timeSpentSeconds: input.timeSpentSeconds || 0,
  };

  const updatedTranscript = [...transcript, newAnswer];
  const totalQuestionsConfigured = 5; // Standard 5-question interview
  const isLastQuestion = updatedTranscript.length >= totalQuestionsConfigured;

  // Generate next question if needed
  let updatedQuestions = [...questions];
  if (!isLastQuestion && updatedTranscript.length >= updatedQuestions.length) {
    const nextQNum = updatedQuestions.length + 1;
    const nextQ = await generateDynamicQuestion({
      type: session.type as InterviewType,
      questionNumber: nextQNum,
      totalQuestions: totalQuestionsConfigured,
      opportunityTitle: session.opportunity?.title || session.candidate.targetDomain,
      targetDomain: session.candidate.targetDomain,
      candidateSkills: session.candidate.skillScores.map(s => s.skill.name),
      previousQuestions: updatedQuestions.map(q => q.question),
      previousAnswers: updatedTranscript.map(a => a.answer),
    });
    updatedQuestions.push(nextQ);
  }

  // Atomic database update & AuditLog
  await prisma.$transaction(async (tx) => {
    await tx.interviewSession.update({
      where: { id: sessionId },
      data: {
        questionsJson: JSON.stringify(updatedQuestions),
        transcriptJson: JSON.stringify(updatedTranscript),
      },
    });

    await recordAuditLog({
      userId: session.candidate.userId,
      action: 'INTERVIEW_ANSWER_SUBMITTED',
      entity: 'InterviewSession',
      entityId: sessionId,
      metadata: {
        questionNumber: targetQuestion.questionNumber,
        questionId: targetQuestion.id,
        answeredCount: updatedTranscript.length,
      },
      tx,
    });
  });

  return {
    success: true,
    nextQuestionNumber: updatedTranscript.length + 1,
    isCompleted: isLastQuestion,
  };
}

/**
 * Completes the interview and generates the structured advisory evaluation.
 * Guarantees AI advisory bounds: will never mutate matches, skill scores, or hiring status.
 */
export async function completeInterviewSession(
  sessionId: string,
  candidateProfileId: string,
  input?: CompleteInterviewInput
): Promise<InterviewEvaluation> {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      opportunity: { include: { skills: { include: { skill: true } } } },
      candidate: { include: { user: true, skillScores: { include: { skill: true } } } },
    },
  });

  if (!session) {
    throw new Error('Interview session not found');
  }

  if (session.candidateId !== candidateProfileId) {
    throw new Error('FORBIDDEN: You cannot complete another student\'s interview');
  }

  if (session.status === 'COMPLETED' && session.evaluationJson) {
    // Already finalized — return existing evaluation (immutable)
    return safeJsonParse<InterviewEvaluation>(session.evaluationJson, generateOfflineEvaluation(session));
  }

  const questions = safeJsonParse<InterviewQuestionItem[]>(session.questionsJson, []);
  const transcript = safeJsonParse<InterviewAnswerItem[]>(session.transcriptJson, []);

  if (transcript.length === 0) {
    throw new Error('Cannot complete an interview with zero recorded answers');
  }

  // Generate structured evaluation via AI or offline fallback
  const evaluation = await generateEvaluation({
    session,
    questions,
    transcript,
  });

  // Stamp mandatory advisory disclaimer
  evaluation.advisoryDisclaimer = AI_INTERVIEW_ADVISORY_DISCLAIMER;

  // Persist within transaction
  await prisma.$transaction(async (tx) => {
    await tx.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        evaluationJson: JSON.stringify(evaluation),
        overallScore: evaluation.overallScore,
        recommendation: evaluation.recommendation,
        notes: input?.notes || null,
      },
    });

    await recordAuditLog({
      userId: session.candidate.userId,
      action: 'INTERVIEW_COMPLETED',
      entity: 'InterviewSession',
      entityId: sessionId,
      metadata: {
        questionsAnswered: transcript.length,
      },
      tx,
    });

    await recordAuditLog({
      userId: session.candidate.userId,
      action: 'INTERVIEW_EVALUATED',
      entity: 'InterviewSession',
      entityId: sessionId,
      metadata: {
        overallScore: evaluation.overallScore,
        recommendation: evaluation.recommendation,
        readinessTier: evaluation.readinessTier,
      },
      tx,
    });
  });

  return evaluation;
}

/**
 * Retrieves the finalized interview result and scorecard.
 */
export async function getInterviewResult(
  sessionId: string,
  requester: { userId: string; role: string; profileId?: string | null }
): Promise<{
  session: InterviewSessionSummaryDto;
  evaluation: InterviewEvaluation;
  transcript: InterviewAnswerItem[];
}> {
  const detail = await getInterviewSessionDetail(sessionId, requester);

  if (detail.status !== 'COMPLETED' || !detail.evaluation) {
    throw new Error('Interview evaluation is not yet complete');
  }

  const summary: InterviewSessionSummaryDto = {
    id: detail.id,
    opportunityId: detail.opportunityId,
    opportunityTitle: detail.opportunityTitle,
    companyName: detail.companyName,
    candidateId: detail.candidateId,
    candidateName: detail.candidateName,
    candidateAvatar: detail.candidateAvatar,
    institution: detail.institution,
    headline: detail.headline,
    type: detail.type,
    status: detail.status,
    questionCount: detail.totalQuestions,
    answeredCount: detail.transcript.length,
    overallScore: detail.overallScore,
    recommendation: detail.recommendation,
    createdAt: detail.createdAt,
    completedAt: detail.completedAt,
  };

  return {
    session: summary,
    evaluation: detail.evaluation,
    transcript: detail.transcript,
  };
}

// ============================================================
// AI GENERATION & EVALUATION LOGIC
// ============================================================

interface GenerateQuestionContext {
  type: InterviewType;
  questionNumber: number;
  totalQuestions: number;
  opportunityTitle?: string | null;
  targetDomain?: string | null;
  candidateSkills: string[];
  previousQuestions: string[];
  previousAnswers: string[];
}

async function generateDynamicQuestion(ctx: GenerateQuestionContext): Promise<InterviewQuestionItem> {
  const { type, questionNumber, totalQuestions, opportunityTitle, targetDomain, candidateSkills, previousQuestions, previousAnswers } = ctx;

  const systemPrompt = `You are the SkillBridge Senior Technical & Behavioral Interview Engine.
Your role is to conduct an insightful, structured interview tailored to the role/domain: "${opportunityTitle || targetDomain || 'Software Engineering'}".
Interview Type: ${type}.
Current Progress: Question ${questionNumber} of ${totalQuestions}.

RULES:
1. Ask clear, high-signal, professional interview questions.
2. If this is a follow-up (Question > 1), ground your question in the candidate's previous response where relevant, or explore a complementary skill domain.
3. Output MUST be strictly valid JSON matching this schema:
{
  "question": "string (the exact question to ask the candidate)",
  "category": "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "PROBLEM_SOLVING" | "EXPERIENCE",
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "targetSkill": "string (name of skill tested)",
  "context": "string (brief sentence on what this question assesses)"
}
4. DO NOT include markdown code blocks, backticks, or any conversational prose. Output ONLY the JSON object.`;

  const userPrompt = `Generate question ${questionNumber} of ${totalQuestions}.
Role Context: ${opportunityTitle || targetDomain}
Candidate Known Skills: ${candidateSkills.slice(0, 5).join(', ') || 'Software Engineering'}
Previous Questions Asked: ${JSON.stringify(previousQuestions)}
Previous Candidate Answers: ${JSON.stringify(previousAnswers.map(a => a.slice(0, 150)))}`;

  try {
    const res = await callLlmChat({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (res.text) {
      // Strip markdown codeblocks if LLM included them
      let cleanText = res.text.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '');
      else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '').replace(/```$/, '');

      const parsed = JSON.parse(cleanText);
      const validated = AiGeneratedQuestionSchema.parse(parsed);

      return {
        id: `gen-q-${questionNumber}-${Date.now()}`,
        questionNumber,
        question: validated.question,
        category: validated.category,
        difficulty: validated.difficulty,
        targetSkill: validated.targetSkill || 'Problem Solving',
        context: validated.context,
      };
    }
  } catch (err) {
    console.warn(`[INTERVIEW_AI_FALLBACK] Question generation falling back to offline bank for Q${questionNumber}:`, err);
  }

  // Offline Fallback
  return getFallbackQuestion(type, questionNumber);
}

function getFallbackQuestion(type: InterviewType, questionNumber: number): InterviewQuestionItem {
  const bank = FALLBACK_QUESTIONS[type] || FALLBACK_QUESTIONS.TECHNICAL;
  const index = Math.min(questionNumber - 1, bank.length - 1);
  const template = bank[index] || bank[0];

  return {
    ...template,
    id: `fallback-${type.toLowerCase()}-${questionNumber}`,
    questionNumber,
  };
}

interface GenerateEvaluationContext {
  session: any;
  questions: InterviewQuestionItem[];
  transcript: InterviewAnswerItem[];
}

async function generateEvaluation(ctx: GenerateEvaluationContext): Promise<InterviewEvaluation> {
  const { session, questions, transcript } = ctx;

  const roleOrDomain = session.opportunity?.title || session.candidate.targetDomain || 'Software Engineering';
  const requiredSkills = (session.opportunity?.skills || []).map((s: any) => s.skill?.name || s.skillName).filter(Boolean);

  const systemPrompt = `You are the SkillBridge Lead Interview Evaluation Evaluator.
Analyze the candidate's complete interview transcript for the position/domain: "${roleOrDomain}".
Required Skills: ${requiredSkills.join(', ') || 'Core Engineering, Problem Solving'}

Evaluate candidate answers with rigorous technical and behavioral criteria.
Provide constructive, actionable, respectful feedback.

OUTPUT FORMAT:
Return strictly valid JSON matching this schema:
{
  "overallScore": number between 40 and 98,
  "technicalScore": number between 40 and 98,
  "communicationScore": number between 50 and 98,
  "readinessTier": "READY" | "ALMOST_READY" | "DEVELOPING" | "NEEDS_WORK",
  "recommendation": "STRONGLY_RECOMMEND" | "RECOMMEND" | "MAYBE" | "DO_NOT_RECOMMEND",
  "strengths": ["string (2 to 4 bullet points of demonstrated competence)"],
  "improvementAreas": ["string (2 to 4 constructive growth opportunities)"],
  "evidenceObserved": ["string (specific reasoning, patterns, or metrics cited in candidate answers)"],
  "skillObservations": [
    { "skill": "string", "observation": "string", "rating": number between 40 and 100 }
  ],
  "communicationObservations": ["string (clarity, structure, technical precision)"],
  "recommendations": ["string (concrete preparation advice or study topics)"]
}
DO NOT include markdown backticks or commentary outside the JSON object.`;

  const transcriptSummary = transcript.map(t => ({
    questionNumber: t.questionNumber,
    question: t.question,
    answer: t.answer,
  }));

  const userPrompt = `Candidate Transcript:
${JSON.stringify(transcriptSummary, null, 2)}`;

  try {
    const res = await callLlmChat({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (res.text) {
      let cleanText = res.text.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '');
      else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '').replace(/```$/, '');

      const parsed = JSON.parse(cleanText);
      const validated = AiInterviewEvaluationSchema.parse(parsed);

      return {
        overallScore: Math.round(validated.overallScore),
        technicalScore: validated.technicalScore ? Math.round(validated.technicalScore) : Math.round(validated.overallScore),
        communicationScore: validated.communicationScore ? Math.round(validated.communicationScore) : 80,
        readinessTier: validated.readinessTier,
        recommendation: validated.recommendation,
        strengths: validated.strengths,
        improvementAreas: validated.improvementAreas,
        evidenceObserved: validated.evidenceObserved,
        skillObservations: validated.skillObservations || [],
        communicationObservations: validated.communicationObservations || [],
        recommendations: validated.recommendations,
        advisoryDisclaimer: AI_INTERVIEW_ADVISORY_DISCLAIMER,
      };
    }
  } catch (err) {
    console.warn('[INTERVIEW_AI_FALLBACK] Evaluation falling back to heuristic offline engine:', err);
  }

  // Fallback offline evaluation
  return generateOfflineEvaluation(session, transcript);
}

function generateOfflineEvaluation(session: any, transcript: InterviewAnswerItem[] = []): InterviewEvaluation {
  // Deterministic heuristic calculation based on transcript depth & completeness
  const totalAnswers = transcript.length;
  const avgAnswerLength = totalAnswers > 0
    ? transcript.reduce((sum, a) => sum + a.answer.length, 0) / totalAnswers
    : 100;

  let baseScore = 70;
  if (avgAnswerLength > 200) baseScore += 12;
  else if (avgAnswerLength > 100) baseScore += 6;
  else baseScore -= 10;

  const overallScore = Math.min(Math.max(Math.round(baseScore), 45), 90);

  let readinessTier: 'READY' | 'ALMOST_READY' | 'DEVELOPING' | 'NEEDS_WORK' = 'ALMOST_READY';
  let recommendation: InterviewRecommendation = 'RECOMMEND';

  if (overallScore >= 85) {
    readinessTier = 'READY';
    recommendation = 'STRONGLY_RECOMMEND';
  } else if (overallScore >= 70) {
    readinessTier = 'ALMOST_READY';
    recommendation = 'RECOMMEND';
  } else if (overallScore >= 55) {
    readinessTier = 'DEVELOPING';
    recommendation = 'MAYBE';
  } else {
    readinessTier = 'NEEDS_WORK';
    recommendation = 'DO_NOT_RECOMMEND';
  }

  return {
    overallScore,
    technicalScore: overallScore,
    communicationScore: Math.min(overallScore + 5, 92),
    readinessTier,
    recommendation,
    strengths: [
      'Structured responses addressing core prompt requirements',
      'Demonstrated foundational conceptual knowledge and clear terminology',
      'Consistent response completion throughout the interview session',
    ],
    improvementAreas: [
      'Provide more concrete architectural metrics and production failure trade-offs',
      'Elaborate on edge-case handling and concurrency limits under heavy load',
    ],
    evidenceObserved: [
      `Completed ${totalAnswers} structured responses with average length of ${Math.round(avgAnswerLength)} characters`,
      'Demonstrated relevant terminology matching target domain competencies',
    ],
    skillObservations: [
      { skill: 'Core Engineering', observation: 'Solid fundamental conceptual grounding demonstrated', rating: overallScore },
      { skill: 'Communication', observation: 'Clear and structured articulation', rating: Math.min(overallScore + 5, 90) },
    ],
    communicationObservations: [
      'Responses maintained professional engineering tone and structured explanations',
    ],
    recommendations: [
      'Review distributed systems edge cases and failure mode telemetry',
      'Practice deep-dive architectural trade-offs using the STAR communication framework',
    ],
    advisoryDisclaimer: AI_INTERVIEW_ADVISORY_DISCLAIMER,
  };
}

function formatSessionDetail(
  session: any,
  candidate: any,
  opportunityTitle?: string | null,
  companyName?: string | null,
  sanitizeCandidate: boolean = false
): InterviewSessionDetailDto {
  const questions = safeJsonParse<InterviewQuestionItem[]>(session.questionsJson, []);
  const transcript = safeJsonParse<InterviewAnswerItem[]>(session.transcriptJson, []);
  const evaluation = safeJsonParse<InterviewEvaluation | null>(session.evaluationJson, null);

  const safeCandidate = sanitizeCandidate ? toSafeRecruiterCandidateDto(candidate) : null;
  const currentQuestion = questions.find(q => q.questionNumber === transcript.length + 1) || null;

  return {
    id: session.id,
    opportunityId: session.opportunityId,
    opportunityTitle: opportunityTitle || null,
    companyName: companyName || null,
    candidateId: session.candidateId,
    candidateName: safeCandidate ? safeCandidate.fullName : candidate.user?.name || 'Candidate',
    candidateAvatar: safeCandidate ? safeCandidate.avatarUrl : candidate.user?.avatarUrl || null,
    institution: safeCandidate ? safeCandidate.institutionName : candidate.institution,
    headline: safeCandidate ? safeCandidate.department : candidate.headline,
    type: session.type as InterviewType,
    status: session.status as InterviewStatus,
    scheduledAt: session.scheduledAt ? session.scheduledAt.toISOString() : null,
    completedAt: session.completedAt ? session.completedAt.toISOString() : null,
    currentQuestionNumber: transcript.length + 1,
    totalQuestions: questions.length,
    questions,
    currentQuestion,
    transcript,
    evaluation,
    overallScore: session.overallScore,
    recommendation: session.recommendation as InterviewRecommendation | null,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export const interviewService = {
  startInterviewSession,
  listCandidateInterviews,
  listIndustryInterviews,
  getInterviewSessionDetail,
  submitInterviewAnswer,
  completeInterviewSession,
  getInterviewResult,
};
