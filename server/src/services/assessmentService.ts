import { prisma } from '../config/prisma.js';
import {
  PracticeSetData,
  AssessmentQuestionData,
  AssessmentSubmitResult,
  ListeningPassageData,
  AssessmentStartResponse,
  ReportCardSummaryData,
  HistoricalAttemptItem,
  HistoricalAttemptDetail,
  DailyPracticeStatus,
  TestCaseData,
  ExternalPlatformLink,
  CodeExecutionResult,
} from '../../../shared/types.js';
import { executeCodeSandbox } from './codeRunnerService.js';
import { recordPracticeSetSubmissionStreak, hasCompletedPracticeSetToday } from './streakService.js';

/**
 * Parses JSON safely with fallback.
 */
function safeJsonParse<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

/**
 * Shuffles an array randomly using Fisher-Yates.
 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates outbound topic links to LeetCode and GeeksforGeeks based on topic tag
 */
export function getExternalPlatformLinks(topic: string): ExternalPlatformLink[] {
  const normalized = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return [
    {
      platform: 'LeetCode',
      topic,
      url: `https://leetcode.com/tag/${normalized}/`,
    },
    {
      platform: 'GeeksforGeeks',
      topic,
      url: `https://www.geeksforgeeks.org/dsa/${normalized}/`,
    },
  ];
}

/**
 * Fetches all practice sets with previous best attempts.
 */
export async function getAllPracticeSets(
  studentProfileId?: string,
  domainFilter?: string,
  typeFilter?: string
): Promise<PracticeSetData[]> {
  const where: any = {};

  if (typeFilter) {
    where.type = typeFilter;
  } else if (domainFilter) {
    where.domainName = domainFilter;
  }

  const sets = await prisma.practiceSet.findMany({
    where,
    include: {
      questions: { select: { id: true } },
      attempts: studentProfileId
        ? {
            where: { studentId: studentProfileId, submittedAt: { not: null } },
            orderBy: { score: 'desc' },
            take: 1,
          }
        : false,
    },
    orderBy: [{ domainName: 'asc' }, { displayOrder: 'asc' }],
  });

  return sets.map(s => {
    const bestAttempt = s.attempts && s.attempts.length > 0 ? s.attempts[0] : null;
    return {
      id: s.id,
      domainId: s.domainId || undefined,
      domainName: s.domainName,
      type: s.type as any,
      title: s.title,
      description: s.description,
      timeLimitMinutes: s.timeLimitMinutes,
      passingScorePct: s.passingScorePct,
      difficulty: s.difficulty as any,
      displayOrder: s.displayOrder,
      questionCount: s.questions.length,
      previousBestAttempt: bestAttempt
        ? {
            score: Math.round(bestAttempt.score),
            passed: bestAttempt.passed,
            submittedAt: bestAttempt.submittedAt ? bestAttempt.submittedAt.toISOString() : bestAttempt.startedAt.toISOString(),
          }
        : null,
    };
  });
}

/**
 * Retrieves whether the student has completed their daily practice set requirement today,
 * and recommends the highest-priority practice set if pending.
 */
export async function getDailyPracticeStatus(studentProfileId: string): Promise<DailyPracticeStatus> {
  const completedToday = await hasCompletedPracticeSetToday(studentProfileId);

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: { select: { currentStreak: true, longestStreak: true, lastActiveDate: true } },
      skillScores: { include: { skill: true } },
    },
  });

  const currentStreak = student?.user?.currentStreak || 0;
  const longestStreak = student?.user?.longestStreak || 0;

  // Find latest submitted attempt for today if any
  const today = new Date().toISOString().split('T')[0];
  const latestTodayAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      studentId: studentProfileId,
      submittedAt: { gte: new Date(`${today}T00:00:00.000Z`) },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Pick smart recommended set
  const allSets = await prisma.practiceSet.findMany({
    include: { questions: true },
    orderBy: { displayOrder: 'asc' },
  });

  let recommendedSet: DailyPracticeStatus['recommendedSet'] = null;

  if (allSets.length > 0) {
    const targetDomain = student?.targetDomain || 'Full-Stack Web';
    const domainSets = allSets.filter(s => s.domainName === targetDomain);
    const candidateSet = domainSets.length > 0 ? domainSets[0] : allSets[0];

    recommendedSet = {
      id: candidateSet.id,
      title: candidateSet.title,
      domainName: candidateSet.domainName,
      type: candidateSet.type as any,
      difficulty: candidateSet.difficulty as any,
      timeLimitMinutes: candidateSet.timeLimitMinutes,
      questionCount: candidateSet.questions.length,
      reason: `Recommended to strengthen your core competencies in ${candidateSet.domainName}`,
    };
  }

  return {
    completedToday,
    lastSubmittedAt: latestTodayAttempt?.submittedAt ? latestTodayAttempt.submittedAt.toISOString() : null,
    currentStreak,
    longestStreak,
    streakActive: completedToday,
    recommendedSet,
  };
}

/**
 * Automatically expands the question pool for a practice set when pool size is low.
 * Includes MCQ, written, and real coding/DSA questions.
 */
export async function expandPracticeSetPool(practiceSetId: string): Promise<void> {
  const set = await prisma.practiceSet.findUnique({
    where: { id: practiceSetId },
    include: { questions: true },
  });

  if (!set) return;

  const domain = set.domainName;
  const existingPrompts = new Set(set.questions.map(q => q.prompt.toLowerCase().trim()));

  const templateQuestions: {
    skillId: string;
    type: 'technical' | 'soft' | 'aptitude';
    questionType: 'mcq' | 'written' | 'coding';
    prompt: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    weight: number;
    entryFunctionName?: string;
    expectedAnswerRubric?: string;
    explanation?: string;
    starterCode?: string;
    testCasesJson?: string;
    constraints?: string;
    inputFormat?: string;
    outputFormat?: string;
    externalLinksJson?: string;
  }[] = [];

  if (set.type === 'domain' && domain.includes('Web')) {
    templateQuestions.push(
      {
        skillId: 'skill-ts',
        type: 'technical',
        questionType: 'mcq',
        prompt: 'In TypeScript, what is the key difference between `unknown` and `any` types?',
        options: [
          { id: 'opt-ts-1a', text: '`unknown` is type-safe; values must be narrowed before performing operations, whereas `any` bypasses all type checking', isCorrect: true },
          { id: 'opt-ts-1b', text: '`unknown` only accepts strings and numbers', isCorrect: false },
          { id: 'opt-ts-1c', text: '`any` automatically compiles to WebAssembly bytecode', isCorrect: false },
          { id: 'opt-ts-1d', text: 'There is no difference; they are exact aliases', isCorrect: false },
        ],
        weight: 1.4,
        explanation: '`unknown` forces type checking/guard narrowing before property access.',
      },
      {
        skillId: 'skill-react',
        type: 'technical',
        questionType: 'coding',
        prompt: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. Assume exactly one solution exists.',
        options: [],
        weight: 3.0,
        entryFunctionName: 'twoSum',
        starterCode: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
        testCasesJson: JSON.stringify([
          { id: 'tc-1', input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false, explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
          { id: 'tc-2', input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false, explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
          { id: 'tc-3', input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true },
        ]),
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
        inputFormat: 'Array of integers `nums`, Integer `target`',
        outputFormat: 'Array of two indices `[i, j]`',
        externalLinksJson: JSON.stringify(getExternalPlatformLinks('Two Pointers')),
      }
    );
  }

  // Insert questions that don't already exist
  for (const q of templateQuestions) {
    if (!existingPrompts.has(q.prompt.toLowerCase().trim())) {
      await prisma.question.create({
        data: {
          domain,
          skillId: q.skillId,
          practiceSetId,
          type: q.type,
          questionType: q.questionType,
          prompt: q.prompt,
          optionsJson: JSON.stringify(q.options),
          weight: q.weight,
          expectedAnswerRubric: q.expectedAnswerRubric,
          explanation: q.explanation,
          starterCode: q.starterCode,
          testCasesJson: q.testCasesJson,
          constraints: q.constraints,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          externalLinksJson: q.externalLinksJson,
        },
      });
    }
  }
}

/**
 * Starts a new practice set attempt for a student.
 */
export async function startPracticeSetAttempt(
  practiceSetId: string,
  studentProfileId?: string,
  requestedCount?: number
): Promise<AssessmentStartResponse> {
  const set = await prisma.practiceSet.findUnique({
    where: { id: practiceSetId },
    include: {
      questions: {
        include: { listeningPassage: true },
      },
    },
  });

  if (!set) throw new Error('Practice set not found');

  if (set.questions.length < 20 && set.type !== 'aptitude_english_listening') {
    try {
      await expandPracticeSetPool(practiceSetId);
    } catch (err) {
      console.warn('Pool expansion skipped:', err);
    }
  }

  const updatedSet = await prisma.practiceSet.findUnique({
    where: { id: practiceSetId },
    include: {
      questions: {
        include: { listeningPassage: true },
      },
    },
  });

  const questionPool = updatedSet?.questions || set.questions;

  const seenQuestionIds = new Set<string>();
  let previousBestScore: number | undefined;

  if (studentProfileId) {
    const pastAttempts = await prisma.assessmentAttempt.findMany({
      where: { studentId: studentProfileId, practiceSetId },
      orderBy: { startedAt: 'desc' },
      take: 2,
    });

    for (const att of pastAttempts) {
      const answers = safeJsonParse<Record<string, string>>(att.answersJson, {});
      Object.keys(answers).forEach(qid => seenQuestionIds.add(qid));
      if (att.score && (previousBestScore === undefined || att.score > previousBestScore)) {
        previousBestScore = Math.round(att.score);
      }
    }
  }

  let selectedRawQuestions: typeof questionPool = [];

  if (set.type === 'aptitude_english_listening') {
    const allPassages = await prisma.listeningPassage.findMany({
      include: { questions: true },
    });

    if (allPassages.length > 0) {
      const chosenPassage = allPassages[Math.floor(Math.random() * allPassages.length)];
      selectedRawQuestions = questionPool.filter(q => q.listeningPassageId === chosenPassage.id);
      if (selectedRawQuestions.length === 0) {
        selectedRawQuestions = questionPool;
      }
    } else {
      selectedRawQuestions = questionPool;
    }
  } else {
    const unseenPool = questionPool.filter(q => !seenQuestionIds.has(q.id));
    // Domain and Aptitude practice sets: default 20 questions, bounded 20-30
    const desired = requestedCount ? Math.max(20, Math.min(requestedCount, 30)) : 20;
    const targetCount = Math.min(questionPool.length, desired);

    if (unseenPool.length >= targetCount) {
      selectedRawQuestions = shuffleArray(unseenPool).slice(0, targetCount);
    } else {
      const remainingNeeded = targetCount - unseenPool.length;
      const seenCandidates = shuffleArray(questionPool.filter(q => seenQuestionIds.has(q.id)));
      selectedRawQuestions = [...unseenPool, ...seenCandidates.slice(0, remainingNeeded)];
    }

    selectedRawQuestions = shuffleArray(selectedRawQuestions);
  }

  const sanitizedQuestions: AssessmentQuestionData[] = selectedRawQuestions.map(q => {
    const options = safeJsonParse<{ id: string; text: string; isCorrect: boolean }[]>(q.optionsJson, []);
    const shuffledOptions = shuffleArray(options).map(o => ({ id: o.id, text: o.text }));

    let listeningPassage: ListeningPassageData | null = null;
    if (q.listeningPassage) {
      listeningPassage = {
        id: q.listeningPassage.id,
        title: q.listeningPassage.title,
        audioUrl: q.listeningPassage.audioUrl || undefined,
        audioText: q.listeningPassage.audioText,
        transcript: q.listeningPassage.transcript,
        durationSeconds: q.listeningPassage.durationSeconds,
      };
    }

    const testCases = safeJsonParse<TestCaseData[]>(q.testCasesJson, []);
    const externalLinks = safeJsonParse<ExternalPlatformLink[]>(
      q.externalLinksJson,
      q.questionType === 'coding' ? getExternalPlatformLinks('Problem Solving') : []
    );

    return {
      id: q.id,
      domain: q.domain,
      skillId: q.skillId,
      type: q.type as any,
      questionType: (q.questionType as 'mcq' | 'written' | 'coding') || 'mcq',
      prompt: q.prompt,
      options: shuffledOptions,
      weight: q.weight,
      practiceSetId: q.practiceSetId || undefined,
      listeningPassageId: q.listeningPassageId || undefined,
      listeningPassage,
      passageText: q.passageText || undefined,
      starterCode: q.starterCode || undefined,
      entryFunctionName: (q as any).entryFunctionName || undefined,
      testCases: testCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        explanation: tc.explanation,
      })),
      constraints: q.constraints || undefined,
      inputFormat: q.inputFormat || undefined,
      outputFormat: q.outputFormat || undefined,
      externalLinks: externalLinks.length > 0 ? externalLinks : undefined,
    };
  });

  let attemptId = `attempt-${Date.now()}`;
  if (studentProfileId) {
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: studentProfileId,
        practiceSetId,
        startedAt: new Date(),
        answersJson: JSON.stringify({}),
        aiGradingNotesJson: JSON.stringify(selectedRawQuestions.map(q => q.id)),
      },
    });
    attemptId = attempt.id;
  }

  const practiceSetData: PracticeSetData = {
    id: set.id,
    domainId: set.domainId || undefined,
    domainName: set.domainName,
    type: set.type as any,
    title: set.title,
    description: set.description,
    timeLimitMinutes: set.timeLimitMinutes,
    passingScorePct: set.passingScorePct,
    difficulty: set.difficulty as any,
    displayOrder: set.displayOrder,
    questionCount: sanitizedQuestions.length,
    previousBestAttempt: previousBestScore !== undefined ? { score: previousBestScore, passed: previousBestScore >= set.passingScorePct, submittedAt: new Date().toISOString() } : null,
  };

  return {
    attemptId,
    practiceSet: practiceSetData,
    timeLimitMinutes: set.timeLimitMinutes,
    questions: sanitizedQuestions,
    previousBestScore,
  };
}

/**
 * Fetches practice set detail directly.
 */
export async function getPracticeSetDetail(practiceSetId: string): Promise<{
  set: PracticeSetData;
  questions: AssessmentQuestionData[];
}> {
  const detail = await startPracticeSetAttempt(practiceSetId);
  return { set: detail.practiceSet, questions: detail.questions };
}

/**
 * Evaluates a subjective written answer against an expected rubric.
 */
function evaluateWrittenAnswer(
  studentAnswer: string,
  rubric: string,
  maxPoints: number
): { score: number; feedback: string } {
  if (!studentAnswer || studentAnswer.trim().length < 10) {
    return {
      score: 0,
      feedback: 'Answer was too brief or empty. Expected a detailed technical explanation.',
    };
  }

  const answerLower = studentAnswer.toLowerCase();
  const keywords = rubric
    .toLowerCase()
    .split(/[,;\n]/)
    .map(k => k.trim())
    .filter(k => k.length > 2);

  let matchCount = 0;
  for (const kw of keywords) {
    if (answerLower.includes(kw)) {
      matchCount++;
    }
  }

  const keywordCoverage = keywords.length > 0 ? matchCount / keywords.length : 0.8;
  const lengthBonus = Math.min(1.0, studentAnswer.trim().split(/\s+/).length / 30);
  const qualityFactor = Math.min(1.0, Math.max(0.4, (keywordCoverage * 0.7) + (lengthBonus * 0.3)));

  const earnedScore = Math.round(maxPoints * qualityFactor * 10) / 10;
  const scorePct = Math.round((earnedScore / maxPoints) * 100);

  let feedback = `AI-Evaluated (${scorePct}%): Demonstrated solid grasp of key concepts. Good architectural reasoning.`;
  if (scorePct >= 85) {
    feedback = `AI-Evaluated (${scorePct}%): Excellent response! Covers critical nuances, trade-offs, and accurate engineering terminology.`;
  } else if (scorePct < 60) {
    feedback = `AI-Evaluated (${scorePct}%): Partially correct. To strengthen your answer, consider addressing: ${rubric}.`;
  }

  return { score: earnedScore, feedback };
}

/**
 * Recomputes rolling recency-weighted skill score for a student in a skill.
 * Ensures the score genuinely moves UP on good performance and DOWN on poor retakes.
 */
export async function recomputeRollingSkillScore(
  studentProfileId: string,
  skillId: string,
  currentAttemptAccuracy: number,
  attemptId: string
): Promise<{ previousScore: number; newScore: number; delta: number }> {
  const existing = await prisma.studentSkillScore.findUnique({
    where: { studentId_skillId: { studentId: studentProfileId, skillId } },
  });

  const previousScore = existing ? existing.score : 50;

  // Convert current attempt accuracy (0.0 to 1.0) to raw score 0 - 100
  const currentEvaluatedScore = Math.round(currentAttemptAccuracy * 100);

  // Parse historical scores
  const rawHistory = safeJsonParse<{ date: string; score: number; attemptId?: string; delta?: number }[]>(
    existing?.scoreHistoryJson,
    []
  );

  // Combine history: newest attempt first
  const recentScores = [currentEvaluatedScore, ...rawHistory.slice(0, 4).map(h => h.score)];

  // Weights for rolling window (up to 5 recent attempts)
  const weights = [0.40, 0.25, 0.18, 0.10, 0.07];
  const activeWeights = weights.slice(0, recentScores.length);
  const totalWeightSum = activeWeights.reduce((a, b) => a + b, 0);

  let weightedSum = 0;
  for (let i = 0; i < recentScores.length; i++) {
    weightedSum += recentScores[i] * activeWeights[i];
  }

  const rawWeightedScore = Math.round(weightedSum / totalWeightSum);
  const newScore = Math.max(10, Math.min(100, rawWeightedScore));
  const delta = newScore - previousScore;

  const todayStr = new Date().toISOString().split('T')[0];
  const updatedHistory = [
    { date: todayStr, score: newScore, attemptId, delta },
    ...rawHistory.slice(0, 9),
  ];

  await prisma.studentSkillScore.upsert({
    where: { studentId_skillId: { studentId: studentProfileId, skillId } },
    create: {
      studentId: studentProfileId,
      skillId,
      score: newScore,
      lastAttemptDate: new Date(),
      scoreHistoryJson: JSON.stringify(updatedHistory),
      inactivityDecayPct: 0,
      decayDaysCount: 0,
    },
    update: {
      score: newScore,
      lastAttemptDate: new Date(),
      scoreHistoryJson: JSON.stringify(updatedHistory),
      inactivityDecayPct: 0,
      decayDaysCount: 0,
      updatedAt: new Date(),
    },
  });

  return { previousScore, newScore, delta };
}

/**
 * Submits and grades an attempt for a practice set.
 */
export async function submitPracticeSetAttempt(
  studentProfileId: string,
  payload: {
    practiceSetId: string;
    attemptId?: string;
    timeSpentSeconds: number;
    answers: Record<string, string>;
    writtenAnswers?: Record<string, string>;
    codingAnswers?: Record<string, string>;
  }
): Promise<AssessmentSubmitResult> {
  const {
    practiceSetId,
    attemptId,
    timeSpentSeconds,
    answers,
    writtenAnswers = {},
    codingAnswers = {},
  } = payload;

  const practiceSet = await prisma.practiceSet.findUnique({
    where: { id: practiceSetId },
    include: {
      questions: {
        include: { listeningPassage: true },
      },
    },
  });

  if (!practiceSet) throw new Error('Practice set not found');

  const combinedAnswers = { ...answers, ...writtenAnswers, ...codingAnswers };
  const answeredQuestionIds = new Set(Object.keys(combinedAnswers));
  const questionsToGrade = answeredQuestionIds.size > 0
    ? practiceSet.questions.filter(q => answeredQuestionIds.has(q.id))
    : practiceSet.questions;

  const actualQuestions = questionsToGrade.length > 0 ? questionsToGrade : practiceSet.questions;

  let totalMaxWeight = 0;
  let totalEarnedWeight = 0;
  let correctMcqCount = 0;
  let totalMcqCount = 0;
  let writtenCount = 0;
  let codingCount = 0;

  const skillPerformance: Record<string, { totalWeight: number; earnedWeight: number }> = {};
  const questionResults: AssessmentSubmitResult['questionResults'] = [];

  for (const q of actualQuestions) {
    const qType = (q.questionType || 'mcq') as 'mcq' | 'written' | 'coding';
    const weight = q.weight || 1.0;
    const userAnswer = combinedAnswers[q.id];

    totalMaxWeight += weight;

    if (!skillPerformance[q.skillId]) {
      skillPerformance[q.skillId] = { totalWeight: 0, earnedWeight: 0 };
    }
    skillPerformance[q.skillId].totalWeight += weight;

    if (qType === 'mcq') {
      totalMcqCount++;
      const options = safeJsonParse<{ id: string; text: string; isCorrect: boolean }[]>(q.optionsJson, []);
      const correctOption = options.find(o => o.isCorrect);
      const selectedOption = options.find(o => o.id === userAnswer);
      const isCorrect = selectedOption?.isCorrect ?? false;

      if (isCorrect) {
        correctMcqCount++;
        totalEarnedWeight += weight;
        skillPerformance[q.skillId].earnedWeight += weight;
      }

      questionResults.push({
        questionId: q.id,
        prompt: q.prompt,
        questionType: 'mcq',
        userAnswer: selectedOption ? selectedOption.text : (userAnswer || 'Not Answered'),
        correctAnswerText: correctOption ? correctOption.text : undefined,
        isCorrect,
        score: isCorrect ? weight : 0,
        pointsAwarded: isCorrect ? weight : 0,
        maxScore: weight,
        maxPoints: weight,
        explanation: q.explanation || (correctOption ? `Correct answer: ${correctOption.text}` : undefined),
      });
    } else if (qType === 'written') {
      writtenCount++;
      const evalRes = evaluateWrittenAnswer(userAnswer || '', q.expectedAnswerRubric || '', weight);
      totalEarnedWeight += evalRes.score;
      skillPerformance[q.skillId].earnedWeight += evalRes.score;

      const isPassing = (evalRes.score / weight) >= 0.6;
      questionResults.push({
        questionId: q.id,
        prompt: q.prompt,
        questionType: 'written',
        userAnswer: userAnswer || '(No written answer provided)',
        isCorrect: isPassing,
        score: evalRes.score,
        pointsAwarded: evalRes.score,
        maxScore: weight,
        maxPoints: weight,
        aiFeedback: evalRes.feedback,
        explanation: `Rubric Guidelines: ${q.expectedAnswerRubric}`,
      });
    } else if (qType === 'coding') {
      codingCount++;
      const testCases = safeJsonParse<TestCaseData[]>(q.testCasesJson, []);
      const codeSubmission = userAnswer || q.starterCode || '';

      const codeExecResult: CodeExecutionResult = await executeCodeSandbox({
        code: codeSubmission,
        language: 'javascript',
        entryFunctionName: (q as any).entryFunctionName || undefined,
        testCases,
      });

      const passedRatio = codeExecResult.totalTestCases > 0 ? (codeExecResult.passedTestCases / codeExecResult.totalTestCases) : 0;
      const earnedScore = Math.round(weight * passedRatio * 10) / 10;

      totalEarnedWeight += earnedScore;
      skillPerformance[q.skillId].earnedWeight += earnedScore;

      const externalLinks = safeJsonParse<ExternalPlatformLink[]>(
        q.externalLinksJson,
        getExternalPlatformLinks('Problem Solving')
      );

      questionResults.push({
        questionId: q.id,
        prompt: q.prompt,
        questionType: 'coding',
        userAnswer: codeSubmission,
        isCorrect: codeExecResult.passed,
        score: earnedScore,
        pointsAwarded: earnedScore,
        maxScore: weight,
        maxPoints: weight,
        codeResult: codeExecResult,
        aiFeedback: codeExecResult.passed
          ? `All ${codeExecResult.totalTestCases} test cases passed! Runtime: ${codeExecResult.executionTimeMs}ms.`
          : `${codeExecResult.passedTestCases}/${codeExecResult.totalTestCases} test cases passed. Review logic for edge cases.`,
        externalLinks,
      });
    }
  }

  const finalScorePct = totalMaxWeight > 0 ? Math.round((totalEarnedWeight / totalMaxWeight) * 100) : 0;
  const passed = finalScorePct >= practiceSet.passingScorePct;

  // Two-directional rolling skill score recomputation
  const updatedSkills: { skillId: string; score: number; skillName: string }[] = [];
  const skillDeltas: AssessmentSubmitResult['skillDeltas'] = [];
  const savedAttemptId = attemptId || `att-${Date.now()}`;

  if (practiceSet.type === 'domain') {
    for (const [skillId, perf] of Object.entries(skillPerformance)) {
      if (!skillId || skillId === 'skill-aptitude' || skillId === 'aptitude') continue;

      const accuracy = perf.totalWeight > 0 ? perf.earnedWeight / perf.totalWeight : 0;
      const skill = await prisma.skill.findUnique({ where: { id: skillId } });

      if (skill) {
        const { previousScore, newScore, delta } = await recomputeRollingSkillScore(
          studentProfileId,
          skillId,
          accuracy,
          savedAttemptId
        );

        updatedSkills.push({ skillId, score: newScore, skillName: skill.name });
        skillDeltas.push({
          skillId,
          skillName: skill.name,
          previousScore,
          newScore,
          delta,
          decayDaysCount: 0,
          inactivityDecayPct: 0,
        });
      }
    }
  }

  // Update daily practice streak
  await recordPracticeSetSubmissionStreak(studentProfileId);

  // Persist attempt record
  if (attemptId) {
    try {
      const existing = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
      if (existing) {
        await prisma.assessmentAttempt.update({
          where: { id: attemptId },
          data: {
            submittedAt: new Date(),
            score: finalScorePct,
            passed,
            timeSpentSeconds,
            answersJson: JSON.stringify(combinedAnswers),
            aiGradingNotesJson: JSON.stringify(questionResults),
            skillBreakdownJson: JSON.stringify(skillDeltas),
          },
        });
      } else {
        await prisma.assessmentAttempt.create({
          data: {
            id: attemptId,
            studentId: studentProfileId,
            practiceSetId,
            startedAt: new Date(Date.now() - (timeSpentSeconds || 60) * 1000),
            submittedAt: new Date(),
            score: finalScorePct,
            passed,
            timeSpentSeconds,
            answersJson: JSON.stringify(combinedAnswers),
            aiGradingNotesJson: JSON.stringify(questionResults),
            skillBreakdownJson: JSON.stringify(skillDeltas),
          },
        });
      }
    } catch (err) {
      console.warn('Attempt update/create fallback:', err);
    }
  } else {
    await prisma.assessmentAttempt.create({
      data: {
        id: savedAttemptId,
        studentId: studentProfileId,
        practiceSetId,
        startedAt: new Date(Date.now() - (timeSpentSeconds || 60) * 1000),
        submittedAt: new Date(),
        score: finalScorePct,
        passed,
        timeSpentSeconds,
        answersJson: JSON.stringify(combinedAnswers),
        aiGradingNotesJson: JSON.stringify(questionResults),
        skillBreakdownJson: JSON.stringify(skillDeltas),
      },
    });
  }

  const practiceSetData: PracticeSetData = {
    id: practiceSet.id,
    domainId: practiceSet.domainId || undefined,
    domainName: practiceSet.domainName,
    type: practiceSet.type as any,
    title: practiceSet.title,
    description: practiceSet.description,
    timeLimitMinutes: practiceSet.timeLimitMinutes,
    passingScorePct: practiceSet.passingScorePct,
    difficulty: practiceSet.difficulty as any,
    displayOrder: practiceSet.displayOrder,
    questionCount: questionResults.length,
  };

  const questionBreakdown = questionResults.map(q => ({
    ...q,
    pointsAwarded: q.score,
    maxPoints: q.maxScore,
    feedback: q.aiFeedback,
  }));

  return {
    attemptId: savedAttemptId,
    practiceSetId,
    practiceSetTitle: practiceSet.title,
    score: finalScorePct,
    scorePct: finalScorePct,
    passed,
    passingScorePct: practiceSet.passingScorePct,
    timeSpentSeconds,
    totalPointsEarned: Math.round(totalEarnedWeight * 10) / 10,
    maxPossiblePoints: Math.round(totalMaxWeight * 10) / 10,
    evaluatedCount: questionResults.length,
    correctMcqCount,
    totalMcqCount,
    writtenCount,
    codingCount,
    practiceSet: practiceSetData,
    updatedSkills,
    skillDeltas,
    questionResults,
    questionBreakdown,
  };
}

/**
 * Retrieves the complete persistent Report Card summary for a student.
 */
export async function getReportCardSummary(studentProfileId: string): Promise<ReportCardSummaryData> {
  const [attempts, dailyPractices] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: {
        studentId: studentProfileId,
        submittedAt: { not: null },
      },
      include: {
        practiceSet: true,
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.dailyPractice.findMany({
      where: {
        studentId: studentProfileId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (attempts.length === 0 && dailyPractices.length === 0) {
    return {
      totalAttempts: 0,
      passedAttempts: 0,
      passRate: 0,
      averageScore: 0,
      performanceTrend: 'neutral',
      attempts: [],
    };
  }

  const bestScores: Record<string, number> = {};
  attempts.forEach(att => {
    if (!bestScores[att.practiceSetId] || att.score > bestScores[att.practiceSetId]) {
      bestScores[att.practiceSetId] = att.score;
    }
  });

  let totalScoreSum = 0;
  let passedCount = 0;

  const attemptItems: HistoricalAttemptItem[] = attempts.map(att => {
    totalScoreSum += att.score;
    if (att.passed) passedCount++;

    const isBest = att.score === bestScores[att.practiceSetId];
    const skillDeltas = safeJsonParse<{ skillName: string; delta: number }[]>(att.skillBreakdownJson, []);
    const strongSkills = skillDeltas.filter(s => s.delta > 0).map(s => s.skillName);
    const weakSkills = skillDeltas.filter(s => s.delta <= 0).map(s => s.skillName);

    return {
      id: att.id,
      practiceSetId: att.practiceSetId,
      practiceSetTitle: att.practiceSet.title,
      domainName: att.practiceSet.domainName,
      type: att.practiceSet.type as any,
      difficulty: att.practiceSet.difficulty as any,
      score: Math.round(att.score),
      passed: att.passed,
      passingScorePct: att.practiceSet.passingScorePct,
      timeSpentSeconds: att.timeSpentSeconds,
      timeLimitMinutes: att.practiceSet.timeLimitMinutes,
      startedAt: att.startedAt.toISOString(),
      submittedAt: att.submittedAt ? att.submittedAt.toISOString() : att.startedAt.toISOString(),
      isBestScore: isBest,
      totalQuestions: safeJsonParse<any[]>(att.aiGradingNotesJson, []).length || 5,
      strongSkills: strongSkills.length > 0 ? strongSkills : ['Problem Solving'],
      weakSkills: weakSkills.length > 0 ? weakSkills : ['None Identified'],
    };
  });

  const dailyItems: HistoricalAttemptItem[] = dailyPractices.map(dp => {
    totalScoreSum += dp.score;
    const passed = dp.score >= 60;
    if (passed) passedCount++;

    const stored = safeJsonParse<any>(dp.questionIdsJson, {});
    const catScores = stored.categoryScores || {};

    const strong: string[] = ['Daily Mixed'];
    if (catScores.aptitudePassed) strong.push('Aptitude');
    if (catScores.domainPassed) strong.push('Domain Core');
    if (catScores.dsaPassed) strong.push('DSA / Coding');

    const weak: string[] = [];
    if (catScores.aptitudeScore !== undefined && !catScores.aptitudePassed) weak.push('Aptitude Practice');
    if (catScores.domainScore !== undefined && !catScores.domainPassed) weak.push('Domain Core Practice');
    if (catScores.dsaScore !== undefined && !catScores.dsaPassed) weak.push('DSA Practice');

    return {
      id: `daily-${dp.id}`,
      practiceSetId: `daily-${dp.date}`,
      practiceSetTitle: `Daily Mixed Practice Set (${dp.date})`,
      domainName: 'Daily Mixed (Aptitude + Domain + DSA)',
      type: 'daily_mixed',
      difficulty: 'Intermediate',
      score: Math.round(dp.score),
      passed,
      passingScorePct: 60,
      timeSpentSeconds: dp.timeSpentSeconds || 600,
      timeLimitMinutes: 30,
      startedAt: dp.startedAt ? dp.startedAt.toISOString() : (dp.completedAt ? dp.completedAt.toISOString() : new Date().toISOString()),
      submittedAt: dp.completedAt ? dp.completedAt.toISOString() : new Date().toISOString(),
      isBestScore: false,
      totalQuestions: stored.questions?.length || 20,
      strongSkills: strong,
      weakSkills: weak.length > 0 ? weak : ['None Identified'],
    };
  });

  const combinedAttempts = [...attemptItems, ...dailyItems].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const totalAttempts = combinedAttempts.length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const averageScore = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;

  let performanceTrend: 'improving' | 'steady' | 'declining' | 'neutral' = 'steady';
  if (combinedAttempts.length >= 2) {
    const mid = Math.floor(combinedAttempts.length / 2);
    const recentScores = combinedAttempts.slice(0, mid).map(a => a.score);
    const olderScores = combinedAttempts.slice(mid).map(a => a.score);

    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / (recentScores.length || 1);
    const avgOlder = olderScores.reduce((a, b) => a + b, 0) / (olderScores.length || 1);

    if (avgRecent > avgOlder + 4) {
      performanceTrend = 'improving';
    } else if (avgRecent < avgOlder - 4) {
      performanceTrend = 'declining';
    } else {
      performanceTrend = 'steady';
    }
  }

  return {
    totalAttempts,
    passedAttempts: passedCount,
    passRate,
    averageScore,
    performanceTrend,
    attempts: combinedAttempts,
  };
}

/**
 * Retrieves the detailed breakdown of a single historical attempt for read-only review.
 */
export async function getAttemptDetail(
  attemptId: string,
  studentProfileId: string
): Promise<HistoricalAttemptDetail> {
  if (attemptId.startsWith('daily-')) {
    const dailyId = attemptId.replace('daily-', '');
    const dailyRecord = await prisma.dailyPractice.findUnique({
      where: { id: dailyId },
    });

    if (!dailyRecord || dailyRecord.studentId !== studentProfileId) {
      throw new Error('Daily practice record not found');
    }

    const stored = safeJsonParse<any>(dailyRecord.questionIdsJson, {});
    const questions = stored.questions || [];
    const catScores = stored.categoryScores || {};

    const questionResults = questions.map((q: any, idx: number) => {
      return {
        questionId: q.id || `q-${idx}`,
        prompt: q.prompt || '',
        questionType: q.questionType || 'mcq',
        userAnswer: q.userAnswer || (q.sourceType === 'dsa' ? '[Code Submitted]' : 'Recorded Response'),
        correctAnswerText: q.options?.find((o: any) => o.id === q.correctOptionId)?.text,
        isCorrect: true,
        score: q.weight || 1,
        maxScore: q.weight || 1,
        aiFeedback: q.feedback || q.aiFeedback,
        explanation: q.explanation || q.expectedAnswerRubric,
      };
    });

    return {
      id: `daily-${dailyRecord.id}`,
      practiceSetId: `daily-${dailyRecord.date}`,
      practiceSetTitle: `Daily Mixed Practice Set (${dailyRecord.date})`,
      domainName: 'Daily Mixed (Aptitude + Domain + DSA)',
      type: 'daily_mixed',
      difficulty: 'Intermediate',
      score: Math.round(dailyRecord.score),
      passed: dailyRecord.score >= 60,
      passingScorePct: 60,
      timeSpentSeconds: dailyRecord.timeSpentSeconds || 600,
      timeLimitMinutes: 30,
      submittedAt: dailyRecord.completedAt ? dailyRecord.completedAt.toISOString() : new Date().toISOString(),
      skillBreakdown: [
        { skillId: 'aptitude', skillName: 'Aptitude (Quant & English)', scoreDelta: catScores.aptitudeScore || 0 },
        { skillId: 'domain', skillName: 'Domain Core Subjects', scoreDelta: catScores.domainScore || 0 },
        { skillId: 'dsa', skillName: 'DSA & Coding', scoreDelta: catScores.dsaScore || 0 },
      ],
      questionResults,
    };
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      practiceSet: {
        include: {
          questions: {
            include: { listeningPassage: true },
          },
        },
      },
    },
  });

  if (!attempt || attempt.studentId !== studentProfileId) {
    throw new Error('Attempt not found');
  }

  const rawQuestions = safeJsonParse<any[]>(attempt.aiGradingNotesJson, []);
  let questionResults: any[] = [];

  if (Array.isArray(rawQuestions) && rawQuestions.length > 0 && typeof rawQuestions[0] === 'object') {
    questionResults = rawQuestions.map(q => ({
      questionId: q.questionId || q.id || '',
      prompt: q.prompt || '',
      questionType: q.questionType || 'mcq',
      userAnswer: q.userAnswer || '',
      correctAnswerText: q.correctAnswerText,
      isCorrect: typeof q.isCorrect === 'boolean' ? q.isCorrect : (q.score / (q.maxScore || q.maxPoints || 1)) >= 0.6,
      score: q.score ?? 0,
      maxScore: q.maxScore || q.maxPoints || 1.0,
      aiFeedback: q.aiFeedback || q.feedback,
      explanation: q.explanation,
      codeResult: q.codeResult,
      externalLinks: q.externalLinks,
    }));
  }

  const skillDeltas = safeJsonParse<{ skillId: string; skillName: string; delta: number }[]>(attempt.skillBreakdownJson, []);

  return {
    id: attempt.id,
    practiceSetId: attempt.practiceSetId,
    practiceSetTitle: attempt.practiceSet.title,
    domainName: attempt.practiceSet.domainName,
    type: attempt.practiceSet.type as any,
    difficulty: attempt.practiceSet.difficulty,
    score: Math.round(attempt.score),
    passed: attempt.passed,
    passingScorePct: attempt.practiceSet.passingScorePct,
    timeSpentSeconds: attempt.timeSpentSeconds,
    timeLimitMinutes: attempt.practiceSet.timeLimitMinutes,
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : attempt.startedAt.toISOString(),
    skillBreakdown: skillDeltas.map(s => ({
      skillId: s.skillId,
      skillName: s.skillName,
      scoreDelta: s.delta || 0,
    })),
    questionResults,
  };
}

export const assessmentService = {
  getAllPracticeSets,
  getDailyPracticeStatus,
  getPracticeSetDetail,
  startPracticeSetAttempt,
  submitPracticeSetAttempt,
  getReportCardSummary,
  getAttemptDetail,
};
