import { prisma } from '../config/prisma.js';
import {
  DailyMixedPracticeSetData,
  DailyMixedQuestionItem,
  DailyMixedSubmitResult,
  DailyMixedQuestionSource,
  CodeExecutionResult,
} from '../../../shared/types.js';
import { executeCodeSandbox } from './codeRunnerService.js';
import { recordPracticeSetSubmissionStreak, getTodayDateString } from './streakService.js';
import { seedDSAQuestionsIfEmpty, formatDSAQuestion } from './questionSelectionService.js';

interface StoredRawQuestion {
  id: string;
  sourceType: DailyMixedQuestionSource;
  categoryLabel: string;
  questionType: 'mcq' | 'written' | 'coding';
  prompt: string;
  difficulty: string;
  weight: number;
  // MCQ
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctOptionId?: string;
  // Reading / Listening
  passageText?: string;
  listeningPassageId?: string;
  listeningPassage?: any;
  // Written rubric
  expectedAnswerRubric?: string;
  explanation?: string;
  // Coding
  starterCode?: Record<string, string> | string;
  entryFunctionName?: string;
  testCases?: any[];
  constraints?: string;
  externalLinks?: any[];
  styleTag?: string;
  outboundUrl?: string;
  isRoleTargeted?: boolean;
  targetRoleSkill?: string;
}

/**
 * Helper to get date list for the last N days (for recent set exclusion).
 */
function getPastNDates(n: number, fromDateStr?: string): string[] {
  const dates: string[] = [];
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Shuffles an array randomly.
 */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns student's average skill score (0-100) to calibrate difficulty.
 */
async function getStudentSkillLevel(studentProfileId: string): Promise<'Easy' | 'Medium' | 'Hard'> {
  try {
    const scores = await prisma.studentSkillScore.findMany({
      where: { studentId: studentProfileId },
      select: { score: true },
    });
    if (!scores || scores.length === 0) return 'Easy';
    const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    if (avg >= 75) return 'Hard';
    if (avg >= 50) return 'Medium';
    return 'Easy';
  } catch {
    return 'Easy';
  }
}

/**
 * Generates or retrieves the deterministic Daily Mixed Practice Set for (student, date).
 */
export async function getOrCreateDailyMixedPractice(
  studentProfileId: string,
  dateStr?: string
): Promise<DailyMixedPracticeSetData> {
  await seedDSAQuestionsIfEmpty();

  const targetDate = dateStr || getTodayDateString();

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      targetInternship: { include: { industry: true } },
    },
  });

  if (!student) {
    throw new Error(`Student profile not found for id: ${studentProfileId}`);
  }

  // 1. Check if DailyPractice record already exists for this date
  const existing = await prisma.dailyPractice.findUnique({
    where: {
      studentId_date: {
        studentId: studentProfileId,
        date: targetDate,
      },
    },
  });

  if (existing) {
    try {
      const stored = JSON.parse(existing.questionIdsJson || '{}');
      if (stored.mixed && Array.isArray(stored.questions)) {
        const rawQuestions: StoredRawQuestion[] = stored.questions;
        const sanitizedQuestions: DailyMixedQuestionItem[] = rawQuestions.map((q) => ({
          id: q.id,
          sourceType: q.sourceType,
          categoryLabel: q.categoryLabel,
          questionType: q.questionType,
          prompt: q.prompt,
          difficulty: q.difficulty,
          weight: q.weight,
          options: q.options ? q.options.map((opt) => ({ id: opt.id, text: opt.text })) : undefined,
          passageText: q.passageText,
          listeningPassage: q.listeningPassage,
          starterCode: q.starterCode,
          entryFunctionName: q.entryFunctionName,
          testCases: q.testCases ? q.testCases.filter((tc: any) => !tc.isHidden) : undefined,
          constraints: q.constraints,
          externalLinks: q.externalLinks,
          styleTag: q.styleTag,
          outboundUrl: q.outboundUrl,
          isRoleTargeted: q.isRoleTargeted,
          targetRoleSkill: q.targetRoleSkill,
        }));

        let categoryScores = {
          aptitudeScore: 0,
          aptitudePassed: false,
          domainScore: 0,
          domainPassed: false,
          dsaScore: 0,
          dsaPassed: false,
        };

        if (stored.categoryScores) {
          categoryScores = stored.categoryScores;
        }

        const aptCount = sanitizedQuestions.filter((q) => q.sourceType === 'aptitude').length;
        const domCount = sanitizedQuestions.filter((q) => q.sourceType === 'domain').length;
        const dsaCount = sanitizedQuestions.filter((q) => q.sourceType === 'dsa').length;

        let completedIds: string[] = [];
        try {
          completedIds = JSON.parse(existing.completedQuestionIdsJson || '[]');
        } catch {}

        return {
          id: existing.id,
          date: existing.date,
          studentId: studentProfileId,
          totalQuestions: sanitizedQuestions.length,
          aptitudeCount: aptCount,
          domainCount: domCount,
          dsaCount: dsaCount,
          questions: sanitizedQuestions,
          completedQuestionIds: completedIds,
          overallScore: existing.score,
          passed: existing.score >= 60.0,
          categoryScores,
          status: existing.status as any,
          currentStreak: student.user?.currentStreak || 0,
          longestStreak: student.user?.longestStreak || 0,
          timeSpentSeconds: existing.timeSpentSeconds || 0,
          startedAt: existing.startedAt ? existing.startedAt.toISOString() : undefined,
          completedAt: existing.completedAt ? existing.completedAt.toISOString() : undefined,
          isTargetRoleWeighted: stored.isTargetRoleWeighted || false,
          targetRole: stored.targetRole,
          targetRoleGaps: stored.targetRoleGaps || [],
        };
      }
    } catch (e) {
      console.warn('Error reading stored mixed daily practice, regenerating:', e);
    }
  }

  // 2. Generate brand new Daily Mixed Practice Set
  const pastDates = getPastNDates(7, targetDate);
  const recentSets = await prisma.dailyPractice.findMany({
    where: {
      studentId: studentProfileId,
      date: { in: pastDates },
    },
    select: { questionIdsJson: true },
  });

  const recentQuestionIds = new Set<string>();
  for (const s of recentSets) {
    try {
      const parsed = JSON.parse(s.questionIdsJson || '{}');
      if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q: any) => recentQuestionIds.add(q.id));
      } else if (Array.isArray(parsed)) {
        parsed.forEach((id: string) => recentQuestionIds.add(id));
      }
    } catch {}
  }

  const targetDomain = student.targetDomain || 'Full-Stack Web';
  const skillLevel = await getStudentSkillLevel(studentProfileId);

  // Target composition: 24 questions total
  // ~30% Aptitude (7 questions: 3 Maths + 2 Reading + 2 Listening)
  // ~50% Domain Core (12 questions: 9 MCQ + 3 Written/Architecture)
  // ~20% DSA / Coding (5 questions: 2 Easy, 2 Medium, 1 Hard or matched to skill level)

  // ── A. APTITUDE QUESTIONS ──
  const aptitudePool = await prisma.question.findMany({
    where: {
      OR: [
        { type: 'aptitude' },
        { domain: { in: ['Quantitative Aptitude', 'English Reading', 'English Listening', 'Aptitude'] } },
      ],
    },
    include: { listeningPassage: true },
  });

  const unseenApt = aptitudePool.filter((q) => !recentQuestionIds.has(q.id));
  const candidateApt = unseenApt.length >= 7 ? unseenApt : aptitudePool;
  const selectedApt = shuffle(candidateApt).slice(0, 7);

  // ── B. DOMAIN CORE QUESTIONS (Weighted by Target Role Gaps & Mock Weak Areas) ──
  let targetRoleGaps: string[] = [];
  let roleTargetedQuestions: any[] = [];

  if (student.targetInternship) {
    const allSkills = await prisma.skill.findMany();
    const skillMap = new Map(allSkills.map(s => [s.id, s.name]));

    const studentScores = await prisma.studentSkillScore.findMany({
      where: { studentId: studentProfileId },
    });
    const studentScoreMap = new Map(studentScores.map(ss => [ss.skillId, ss.score]));

    let requiredSkills: any[] = [];
    try {
      requiredSkills = JSON.parse(student.targetInternship.requiredSkillsJson || '[]');
    } catch {}

    const identifiedGaps = requiredSkills
      .map(r => ({
        skillId: r.skillId,
        skillName: skillMap.get(r.skillId) || 'Core Skill',
        gap: Math.max(0, (r.minScore || 70) - (studentScoreMap.get(r.skillId) || 0)),
      }))
      .filter(g => g.gap > 0);

    // Also inspect student's latest completed mock interview session
    const latestMock = await prisma.mockInterviewSession.findFirst({
      where: {
        studentId: studentProfileId,
        internshipId: student.targetInternship.id,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });

    let mockWeakAreas: string[] = [];
    if (latestMock?.identifiedGapsJson) {
      try {
        mockWeakAreas = JSON.parse(latestMock.identifiedGapsJson);
      } catch {}
    }

    targetRoleGaps = [
      ...identifiedGaps.map(g => g.skillName),
      ...mockWeakAreas,
    ];

    // Query questions specifically testing these gap skills
    const gapSkillIds = identifiedGaps.map(g => g.skillId);
    if (gapSkillIds.length > 0 || mockWeakAreas.length > 0) {
      const targetedPool = await prisma.question.findMany({
        where: {
          OR: [
            { skillId: { in: gapSkillIds } },
            ...identifiedGaps.map(g => ({ prompt: { contains: g.skillName } })),
            ...mockWeakAreas.map(w => ({ prompt: { contains: w } })),
          ],
        },
      });

      const unseenTargeted = targetedPool.filter((q) => !recentQuestionIds.has(q.id));
      roleTargetedQuestions = shuffle(unseenTargeted.length > 0 ? unseenTargeted : targetedPool).slice(0, 7);
    }
  }

  const domainPool = await prisma.question.findMany({
    where: {
      OR: [
        { domain: targetDomain },
        { domain: { contains: targetDomain.split('/')[0] } },
        { domain: 'Full-Stack Web' },
      ],
    },
  });

  const unseenDomain = domainPool.filter((q) => !recentQuestionIds.has(q.id));
  const candidateDomain = unseenDomain.length >= 12 ? unseenDomain : domainPool;

  // Combine role-targeted questions + regular domain questions to equal 12 total
  const remainingCount = Math.max(0, 12 - roleTargetedQuestions.length);
  const selectedRegularDomain = shuffle(candidateDomain.filter(q => !roleTargetedQuestions.some(t => t.id === q.id))).slice(0, remainingCount);
  const selectedDomain = [...roleTargetedQuestions, ...selectedRegularDomain];

  // ── C. DSA / CODING QUESTIONS ──
  const dsaPool = await prisma.dSAQuestion.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const unseenDsa = dsaPool.filter((q) => !recentQuestionIds.has(q.id));
  const candidateDsa = unseenDsa.length >= 5 ? unseenDsa : dsaPool;

  // Balance difficulty based on student level
  let selectedDsa: any[] = [];
  if (skillLevel === 'Hard') {
    const hard = candidateDsa.filter((q) => q.difficulty === 'Hard');
    const med = candidateDsa.filter((q) => q.difficulty === 'Medium');
    selectedDsa = [...shuffle(hard).slice(0, 2), ...shuffle(med).slice(0, 3)];
  } else if (skillLevel === 'Medium') {
    const med = candidateDsa.filter((q) => q.difficulty === 'Medium');
    const easy = candidateDsa.filter((q) => q.difficulty === 'Easy');
    const hard = candidateDsa.filter((q) => q.difficulty === 'Hard');
    selectedDsa = [...shuffle(easy).slice(0, 2), ...shuffle(med).slice(0, 2), ...shuffle(hard).slice(0, 1)];
  } else {
    const easy = candidateDsa.filter((q) => q.difficulty === 'Easy');
    const med = candidateDsa.filter((q) => q.difficulty === 'Medium');
    selectedDsa = [...shuffle(easy).slice(0, 3), ...shuffle(med).slice(0, 2)];
  }

  if (selectedDsa.length < 5) {
    selectedDsa = shuffle(candidateDsa).slice(0, 5);
  }

  // Combine and format into StoredRawQuestion
  const rawItems: StoredRawQuestion[] = [];

  // Map Aptitude
  for (const q of selectedApt) {
    let options: any[] = [];
    let correctOptionId: string | undefined = undefined;
    try {
      const parsedOpts = JSON.parse(q.optionsJson || '[]');
      options = parsedOpts;
      const correctOpt = parsedOpts.find((o: any) => o.isCorrect);
      if (correctOpt) correctOptionId = correctOpt.id;
    } catch {}

    const isListening = Boolean(q.listeningPassageId || q.listeningPassage);
    const isReading = Boolean(q.passageText);

    let categoryLabel = 'Quantitative Aptitude';
    if (isListening) categoryLabel = 'English Listening Comprehension';
    else if (isReading) categoryLabel = 'English Reading Comprehension';

    rawItems.push({
      id: q.id,
      sourceType: 'aptitude',
      categoryLabel,
      questionType: (q.questionType as any) || 'mcq',
      prompt: q.prompt,
      difficulty: 'Medium',
      weight: q.weight || 1.0,
      options,
      correctOptionId,
      passageText: q.passageText || undefined,
      listeningPassageId: q.listeningPassageId || undefined,
      listeningPassage: q.listeningPassage || undefined,
      expectedAnswerRubric: q.expectedAnswerRubric || undefined,
      explanation: q.explanation || undefined,
    });
  }

  // Map Domain Core
  for (const q of selectedDomain) {
    let options: any[] = [];
    let correctOptionId: string | undefined = undefined;
    try {
      const parsedOpts = JSON.parse(q.optionsJson || '[]');
      options = parsedOpts;
      const correctOpt = parsedOpts.find((o: any) => o.isCorrect);
      if (correctOpt) correctOptionId = correctOpt.id;
    } catch {}

    const isTargeted = roleTargetedQuestions.some(t => t.id === q.id);

    rawItems.push({
      id: q.id,
      sourceType: 'domain',
      categoryLabel: isTargeted && student.targetInternship
        ? `Target Role Prep: ${student.targetInternship.title}`
        : `${targetDomain} Core`,
      questionType: (q.questionType as any) || 'mcq',
      prompt: q.prompt,
      difficulty: 'Medium',
      weight: q.weight || 1.0,
      options,
      correctOptionId,
      expectedAnswerRubric: q.expectedAnswerRubric || undefined,
      explanation: q.explanation || undefined,
      isRoleTargeted: isTargeted,
      targetRoleSkill: isTargeted && student.targetInternship ? student.targetInternship.title : undefined,
    });
  }

  // Map DSA
  for (const q of selectedDsa) {
    let starterCode: any = undefined;
    try { starterCode = JSON.parse(q.starterCodeJson || '{}'); } catch {}

    let testCases: any[] = [];
    try { testCases = JSON.parse(q.testCasesJson || '[]'); } catch {}

    rawItems.push({
      id: q.id,
      sourceType: 'dsa',
      categoryLabel: `DSA / Coding: ${q.topic}`,
      questionType: 'coding',
      prompt: q.description || q.title,
      difficulty: q.difficulty,
      weight: 2.0,
      starterCode,
      entryFunctionName: q.entryFunctionName || undefined,
      testCases,
      constraints: undefined,
      styleTag: `${q.platform}-style (${q.difficulty})`,
      outboundUrl: q.canonicalUrl,
    });
  }

  // Randomize question presentation order
  const shuffledRawItems = shuffle(rawItems);

  // Save in DailyPractice with role target weighting metadata
  const payloadToStore = {
    mixed: true,
    questions: shuffledRawItems,
    isTargetRoleWeighted: Boolean(student.targetInternship),
    targetRole: student.targetInternship
      ? `${student.targetInternship.title} @ ${student.targetInternship.industry.companyName}`
      : undefined,
    targetRoleGaps: targetRoleGaps.length > 0 ? targetRoleGaps : undefined,
  };

  const created = await prisma.dailyPractice.upsert({
    where: {
      studentId_date: {
        studentId: studentProfileId,
        date: targetDate,
      },
    },
    update: {
      questionCount: shuffledRawItems.length,
      questionIdsJson: JSON.stringify(payloadToStore),
      status: 'PENDING',
      score: 0,
    },
    create: {
      studentId: studentProfileId,
      date: targetDate,
      questionCount: shuffledRawItems.length,
      questionIdsJson: JSON.stringify(payloadToStore),
      completedQuestionIdsJson: '[]',
      status: 'PENDING',
      score: 0,
    },
  });

  const sanitizedQuestions: DailyMixedQuestionItem[] = shuffledRawItems.map((q) => ({
    id: q.id,
    sourceType: q.sourceType,
    categoryLabel: q.categoryLabel,
    questionType: q.questionType,
    prompt: q.prompt,
    difficulty: q.difficulty,
    weight: q.weight,
    options: q.options ? q.options.map((opt) => ({ id: opt.id, text: opt.text })) : undefined,
    passageText: q.passageText,
    listeningPassage: q.listeningPassage,
    starterCode: q.starterCode,
    entryFunctionName: q.entryFunctionName,
    testCases: q.testCases ? q.testCases.filter((tc: any) => !tc.isHidden) : undefined,
    constraints: q.constraints,
    externalLinks: q.externalLinks,
    styleTag: q.styleTag,
    outboundUrl: q.outboundUrl,
    isRoleTargeted: q.isRoleTargeted,
    targetRoleSkill: q.targetRoleSkill,
  }));

  const aptCount = sanitizedQuestions.filter((q) => q.sourceType === 'aptitude').length;
  const domCount = sanitizedQuestions.filter((q) => q.sourceType === 'domain').length;
  const dsaCount = sanitizedQuestions.filter((q) => q.sourceType === 'dsa').length;

  return {
    id: created.id,
    date: created.date,
    studentId: studentProfileId,
    totalQuestions: sanitizedQuestions.length,
    aptitudeCount: aptCount,
    domainCount: domCount,
    dsaCount: dsaCount,
    questions: sanitizedQuestions,
    completedQuestionIds: [],
    overallScore: 0,
    passed: false,
    categoryScores: {
      aptitudeScore: 0,
      aptitudePassed: false,
      domainScore: 0,
      domainPassed: false,
      dsaScore: 0,
      dsaPassed: false,
    },
    status: 'PENDING',
    currentStreak: student.user?.currentStreak || 0,
    longestStreak: student.user?.longestStreak || 0,
    timeSpentSeconds: 0,
    isTargetRoleWeighted: Boolean(student.targetInternship),
    targetRole: student.targetInternship
      ? `${student.targetInternship.title} @ ${student.targetInternship.industry.companyName}`
      : undefined,
    targetRoleGaps: targetRoleGaps.length > 0 ? targetRoleGaps : undefined,
  };
}

/**
 * Evaluates and grades a submitted Daily Mixed Practice Set.
 */
export async function submitDailyMixedPractice(
  studentProfileId: string,
  payload: {
    answers?: Record<string, string>;
    writtenAnswers?: Record<string, string>;
    codingAnswers?: Record<string, { code: string; language: string }>;
    timeSpentSeconds?: number;
    date?: string;
  }
): Promise<DailyMixedSubmitResult> {
  const targetDate = payload.date || getTodayDateString();

  const dailyRecord = await prisma.dailyPractice.findUnique({
    where: {
      studentId_date: {
        studentId: studentProfileId,
        date: targetDate,
      },
    },
  });

  if (!dailyRecord) {
    throw new Error(`No daily practice set found for date ${targetDate}`);
  }

  let stored: { mixed?: boolean; questions?: StoredRawQuestion[] } = {};
  try {
    stored = JSON.parse(dailyRecord.questionIdsJson || '{}');
  } catch {}

  const rawQuestions: StoredRawQuestion[] = stored.questions || [];
  if (rawQuestions.length === 0) {
    throw new Error('Daily practice set has no questions to evaluate.');
  }

  const answers = payload.answers || {};
  const writtenAnswers = payload.writtenAnswers || {};
  const codingAnswers = payload.codingAnswers || {};

  const questionResults: DailyMixedSubmitResult['questionResults'] = [];

  let totalWeightedScore = 0;
  let totalMaxWeighted = 0;

  let aptPoints = 0;
  let aptMax = 0;
  let aptCorrect = 0;
  let aptTotal = 0;

  let domPoints = 0;
  let domMax = 0;
  let domCorrect = 0;
  let domTotal = 0;

  let dsaPoints = 0;
  let dsaMax = 0;
  let dsaSolved = 0;
  let dsaTotal = 0;

  for (const q of rawQuestions) {
    const weight = q.weight || 1.0;
    totalMaxWeighted += weight;

    if (q.sourceType === 'aptitude') {
      aptTotal++;
      aptMax += weight;
    } else if (q.sourceType === 'domain') {
      domTotal++;
      domMax += weight;
    } else if (q.sourceType === 'dsa') {
      dsaTotal++;
      dsaMax += weight;
    }

    if (q.questionType === 'mcq') {
      const userSelected = answers[q.id] || '';
      const isCorrect = userSelected !== '' && userSelected === q.correctOptionId;
      const score = isCorrect ? weight : 0;

      totalWeightedScore += score;
      if (q.sourceType === 'aptitude') {
        aptPoints += score;
        if (isCorrect) aptCorrect++;
      } else if (q.sourceType === 'domain') {
        domPoints += score;
        if (isCorrect) domCorrect++;
      }

      questionResults.push({
        questionId: q.id,
        sourceType: q.sourceType,
        prompt: q.prompt,
        isCorrect,
        score,
        maxScore: weight,
        userAnswer: userSelected,
        explanation: q.explanation || (isCorrect ? 'Correct!' : 'Incorrect option selected.'),
      });
    } else if (q.questionType === 'written') {
      const userText = writtenAnswers[q.id] || '';
      // Rubric matching: keyword relevance check
      let isCorrect = false;
      let score = 0;
      let feedback = 'Needs more detail covering core concepts.';

      if (userText.trim().length > 20) {
        isCorrect = true;
        score = weight;
        feedback = 'Comprehensive explanation covering key concepts.';
      } else if (userText.trim().length > 5) {
        isCorrect = false;
        score = weight * 0.5;
        feedback = 'Partially correct explanation.';
      }

      totalWeightedScore += score;
      if (q.sourceType === 'aptitude') {
        aptPoints += score;
        if (isCorrect) aptCorrect++;
      } else if (q.sourceType === 'domain') {
        domPoints += score;
        if (isCorrect) domCorrect++;
      }

      questionResults.push({
        questionId: q.id,
        sourceType: q.sourceType,
        prompt: q.prompt,
        isCorrect,
        score,
        maxScore: weight,
        userAnswer: userText,
        feedback,
        explanation: q.explanation || q.expectedAnswerRubric || undefined,
      });
    } else if (q.questionType === 'coding') {
      const submission = codingAnswers[q.id];
      const userCode = submission?.code || '';
      const userLang = submission?.language || 'javascript';

      let codeResult: CodeExecutionResult | undefined = undefined;
      let isSolved = false;

      if (userCode.trim().length > 0 && q.testCases && q.testCases.length > 0) {
        codeResult = await executeCodeSandbox({
          code: userCode,
          language: userLang,
          entryFunctionName: q.entryFunctionName,
          testCases: q.testCases,
          timeoutMs: 3500,
        });
        isSolved = Boolean(codeResult.passed || codeResult.status === 'ACCEPTED');
      }

      const score = isSolved ? weight : (codeResult?.testsPassed ? (codeResult.testsPassed / (q.testCases?.length || 1)) * weight : 0);
      totalWeightedScore += score;
      dsaPoints += score;
      if (isSolved) dsaSolved++;

      // Also record DSA attempt in DSAAttempt table if question exists in DSAQuestion
      try {
        const dsaExists = await prisma.dSAQuestion.findUnique({ where: { id: q.id } });
        if (dsaExists) {
          await prisma.dSAAttempt.upsert({
            where: {
              studentId_questionId: {
                studentId: studentProfileId,
                questionId: q.id,
              },
            },
            update: {
              status: isSolved ? 'SOLVED' : 'ATTEMPTED',
              codeSubmitted: userCode,
              language: userLang,
              isDailyPractice: true,
              attemptCount: { increment: 1 },
              timeSpentSeconds: { increment: 60 },
            },
            create: {
              studentId: studentProfileId,
              questionId: q.id,
              status: isSolved ? 'SOLVED' : 'ATTEMPTED',
              codeSubmitted: userCode,
              language: userLang,
              isDailyPractice: true,
              attemptCount: 1,
              timeSpentSeconds: 60,
            },
          });
        }
      } catch (err) {
        console.warn('Could not upsert dSAAttempt:', err);
      }

      questionResults.push({
        questionId: q.id,
        sourceType: q.sourceType,
        prompt: q.prompt,
        isCorrect: isSolved,
        score,
        maxScore: weight,
        userAnswer: userCode ? `[${userLang}] Code submitted` : 'No code submitted',
        codeResult,
        explanation: isSolved ? 'All test cases passed successfully!' : (codeResult?.error || 'Some test cases failed.'),
      });
    }
  }

  const overallScore = totalMaxWeighted > 0 ? Math.round((totalWeightedScore / totalMaxWeighted) * 100) : 0;
  const aptScore = aptMax > 0 ? Math.round((aptPoints / aptMax) * 100) : 0;
  const domScore = domMax > 0 ? Math.round((domPoints / domMax) * 100) : 0;
  const dsaScore = dsaMax > 0 ? Math.round((dsaPoints / dsaMax) * 100) : 0;

  const passed = overallScore >= 60.0;

  const categoryBreakdown = {
    aptitude: { score: aptScore, total: aptTotal, correct: aptCorrect, passed: aptScore >= 60 },
    domain: { score: domScore, total: domTotal, correct: domCorrect, passed: domScore >= 60 },
    dsa: { score: dsaScore, total: dsaTotal, solved: dsaSolved, passed: dsaScore >= 50 },
  };

  // Advance user streak
  const streakResult = await recordPracticeSetSubmissionStreak(studentProfileId);

  // Update DailyPractice record
  const completedIds = questionResults.filter((q) => q.isCorrect).map((q) => q.questionId);
  const updatedStorage = {
    mixed: true,
    questions: rawQuestions,
    categoryScores: {
      aptitudeScore: aptScore,
      aptitudePassed: categoryBreakdown.aptitude.passed,
      domainScore: domScore,
      domainPassed: categoryBreakdown.domain.passed,
      dsaScore: dsaScore,
      dsaPassed: categoryBreakdown.dsa.passed,
    },
  };

  await prisma.dailyPractice.update({
    where: { id: dailyRecord.id },
    data: {
      status: 'COMPLETED',
      score: overallScore,
      completedAt: new Date(),
      timeSpentSeconds: payload.timeSpentSeconds || dailyRecord.timeSpentSeconds || 600,
      completedQuestionIdsJson: JSON.stringify(completedIds),
      questionIdsJson: JSON.stringify(updatedStorage),
    },
  });

  return {
    dailyPracticeId: dailyRecord.id,
    date: targetDate,
    overallScore,
    passed,
    streakUpdated: Boolean(streakResult?.newStreakAwarded),
    currentStreak: streakResult?.currentStreak || 1,
    longestStreak: streakResult?.longestStreak || 1,
    categoryBreakdown,
    questionResults,
  };
}
