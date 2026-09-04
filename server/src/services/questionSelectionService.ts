import { prisma } from '../config/prisma.js';
import { generateCompleteDSADatabase } from './dsaSeedData.js';
import { DSAPlatform, DSADifficulty, DSAQuestionData, DSAProgressSummary, DailyPracticeData } from '../../../shared/types.js';

// Valid set sizes
export const VALID_SET_SIZES = [15, 20, 25, 30] as const;
export type ValidSetSize = typeof VALID_SET_SIZES[number];

/**
 * Normalizes question count strictly to allowed sizes (15, 20, 25, 30).
 */
export function normalizeSetSize(count?: number): ValidSetSize {
  if (!count) return 15;
  if (count <= 15) return 15;
  if (count <= 20) return 20;
  if (count <= 25) return 25;
  return 30;
}

/**
 * Authoritative Synchronization: Ensures 100% of DSA questions in the database are authentic
 * with valid multi-language starter code and authentic test cases.
 */
export async function syncDSAQuestionsDatabase(): Promise<number> {
  const allQuestions = generateCompleteDSADatabase();
  console.log(`🌱 Synchronizing ${allQuestions.length} authentic DSA questions...`);

  for (const q of allQuestions) {
    await prisma.dSAQuestion.upsert({
      where: { slug: q.slug },
      update: {
        title: q.title,
        platform: q.platform,
        difficulty: q.difficulty,
        topic: q.topic,
        tagsJson: JSON.stringify(q.tags),
        canonicalUrl: q.canonicalUrl,
        estimatedMinutes: q.estimatedMinutes,
        description: q.description,
        starterCodeJson: JSON.stringify(q.starterCode),
        testCasesJson: JSON.stringify(q.testCases),
        entryFunctionName: q.entryFunctionName,
        companyTagsJson: JSON.stringify(q.companyTags || []),
      },
      create: {
        title: q.title,
        slug: q.slug,
        platform: q.platform,
        difficulty: q.difficulty,
        topic: q.topic,
        tagsJson: JSON.stringify(q.tags),
        canonicalUrl: q.canonicalUrl,
        estimatedMinutes: q.estimatedMinutes,
        description: q.description,
        starterCodeJson: JSON.stringify(q.starterCode),
        testCasesJson: JSON.stringify(q.testCases),
        entryFunctionName: q.entryFunctionName,
        companyTagsJson: JSON.stringify(q.companyTags || []),
      },
    });
  }

  // Authoritative cleanup: Delete any questions that are non-canonical, placeholder, or missing 4 languages
  const validSlugs = new Set(allQuestions.map((q) => q.slug));
  const allDbQuestions = await prisma.dSAQuestion.findMany({
    select: { id: true, slug: true, starterCodeJson: true, testCasesJson: true },
  });

  const staleIds: string[] = [];
  for (const dbQ of allDbQuestions) {
    if (!validSlugs.has(dbQ.slug)) {
      staleIds.push(dbQ.id);
      continue;
    }
    if (
      dbQ.testCasesJson?.includes('sample') ||
      dbQ.testCasesJson?.includes('sample_output') ||
      dbQ.testCasesJson?.includes('output_1')
    ) {
      staleIds.push(dbQ.id);
      continue;
    }
    try {
      const sc = JSON.parse(dbQ.starterCodeJson || '{}');
      if (!sc.javascript || !sc.python || !sc.java || !sc.cpp) {
        staleIds.push(dbQ.id);
      }
    } catch {
      staleIds.push(dbQ.id);
    }
  }

  if (staleIds.length > 0) {
    console.log(`🧹 Removing ${staleIds.length} legacy / incomplete DSA questions...`);
    await prisma.dSAQuestion.deleteMany({
      where: { id: { in: staleIds } },
    });
  }

  const finalCount = await prisma.dSAQuestion.count();
  console.log(`✅ DSA question database synchronized: ${finalCount} authentic problems ready.`);
  return finalCount;
}

/**
 * Ensures all authentic DSA questions are seeded in the database.
 */
export async function seedDSAQuestionsIfEmpty(): Promise<number> {
  return syncDSAQuestionsDatabase();
}

export function normalizePlatform(raw: string): DSAPlatform {
  const upper = (raw || '').toUpperCase();
  if (upper.includes('LEETCODE')) return 'LeetCode';
  if (upper.includes('GEEKS') || upper.includes('GFG')) return 'GeeksforGeeks';
  if (upper.includes('CSES')) return 'CSES';
  if (upper.includes('CODEFORCES')) return 'Codeforces';
  return 'LeetCode';
}

/**
 * Formats a Prisma DSAQuestion entity into standard shared DSAQuestionData.
 */
export function formatDSAQuestion(q: any, attempt?: any): DSAQuestionData {
  let tags: string[] = [];
  try { tags = q.tagsJson ? JSON.parse(q.tagsJson) : []; } catch { tags = []; }

  let starterCode: any = undefined;
  try { starterCode = q.starterCodeJson ? JSON.parse(q.starterCodeJson) : undefined; } catch {}

  let testCases: any = undefined;
  try { testCases = q.testCasesJson ? JSON.parse(q.testCasesJson) : undefined; } catch {}

  let companyTags: string[] = [];
  try { companyTags = q.companyTagsJson ? JSON.parse(q.companyTagsJson) : []; } catch {}

  if (starterCode && typeof starterCode === 'object' && !starterCode.c) {
    starterCode.c = starterCode.cpp || '';
  }

  const normPlatform = normalizePlatform(q.platform);

  return {
    id: q.id,
    title: q.title,
    slug: q.slug,
    platform: normPlatform,
    difficulty: q.difficulty as DSADifficulty,
    topic: q.topic,
    tags,
    canonicalUrl: q.canonicalUrl,
    estimatedMinutes: q.estimatedMinutes,
    description: q.description || undefined,
    starterCode,
    testCases,
    entryFunctionName: q.entryFunctionName || undefined,
    companyTags,
    styleTag: q.styleTag || `${normPlatform}-style (${q.difficulty})`,
    outboundUrl: q.outboundUrl || q.canonicalUrl,
    userAttemptStatus: attempt ? (attempt.status as any) : 'UNSEEN',
    userLastCode: attempt?.codeSubmitted || undefined,
  };
}

/**
 * Randomization and Rotation Engine for DSA Practice Sets
 * - Guarantees strictly 15, 20, 25, or 30 questions
 * - Prioritizes unseen questions
 * - Avoids recently served / solved questions
 * - Balances difficulty (e.g. 35% Easy, 50% Medium, 15% Hard)
 * - Balances platforms & topics
 * - Prioritizes user's weak topics
 * - Never returns duplicates in the same set
 */
export async function selectRotatedQuestions(
  studentId: string,
  options: {
    count?: number;
    questionCount?: number;
    difficulty?: string;
    platform?: string;
    topic?: string;
    includeWeakTopics?: boolean;
    filterUnseenOnly?: boolean;
  }
): Promise<DSAQuestionData[]> {
  await seedDSAQuestionsIfEmpty();

  const countParam = options.count ?? options.questionCount;
  const targetCount = normalizeSetSize(countParam);

  // 1. Fetch user's historical attempts to know seen / solved / failed topics
  const userAttempts = await prisma.dSAAttempt.findMany({
    where: { studentId },
    include: { question: true },
  });

  const seenQuestionIds = new Set(userAttempts.map(a => a.questionId));
  const solvedQuestionIds = new Set(userAttempts.filter(a => a.status === 'SOLVED').map(a => a.questionId));
  const failedQuestionIds = new Set(userAttempts.filter(a => a.status === 'FAILED').map(a => a.questionId));

  // Determine weak topics
  const topicStats: Record<string, { total: number; solved: number }> = {};
  for (const att of userAttempts) {
    const t = att.question.topic;
    if (!topicStats[t]) topicStats[t] = { total: 0, solved: 0 };
    topicStats[t].total++;
    if (att.status === 'SOLVED') topicStats[t].solved++;
  }
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 2 && stats.solved / stats.total < 0.5)
    .map(([t]) => t);

  // 2. Build Prisma WHERE clause according to options
  const baseWhere: any = {};

  if (options.difficulty && options.difficulty !== 'All') {
    baseWhere.difficulty = options.difficulty;
  }
  if (options.platform && options.platform !== 'All') {
    const p = options.platform.toUpperCase();
    if (p.includes('LEETCODE')) baseWhere.platform = { in: ['LeetCode', 'LEETCODE', 'leetcode'] };
    else if (p.includes('GEEKS') || p.includes('GFG')) baseWhere.platform = { in: ['GeeksforGeeks', 'GEEKSFORGEEKS', 'gfg'] };
    else if (p.includes('CSES')) baseWhere.platform = { in: ['CSES', 'cses'] };
    else if (p.includes('CODEFORCES')) baseWhere.platform = { in: ['Codeforces', 'CODEFORCES', 'codeforces'] };
    else baseWhere.platform = options.platform;
  }
  if (options.topic && options.topic !== 'All') {
    const t = options.topic.toLowerCase();
    if (t.includes('dynamic') || t === 'dp') {
      baseWhere.topic = { in: ['Dynamic Programming', '1D DP', '2D DP', 'Knapsack', 'DP'] };
    } else if (t.includes('heap') || t.includes('priority')) {
      baseWhere.topic = { in: ['Heap / Priority Queue', 'Heap', 'Priority Queue'] };
    } else {
      baseWhere.topic = options.topic;
    }
  }

  // Fetch all candidate questions matching basic criteria
  const candidates = await prisma.dSAQuestion.findMany({
    where: baseWhere,
  });

  if (candidates.length === 0) {
    // Fallback if filters were too restrictive
    const fallbackAll = await prisma.dSAQuestion.findMany({ take: targetCount });
    return fallbackAll.map(q => formatDSAQuestion(q));
  }

  // 3. Score and prioritize questions
  const scored = candidates.map(q => {
    let score = Math.random() * 20; // Base random jitter for non-deterministic variety

    // High priority for unseen questions
    if (!seenQuestionIds.has(q.id)) {
      score += 100;
    } else if (failedQuestionIds.has(q.id)) {
      // Medium-high priority for previously failed questions to practice
      score += 60;
    } else if (solvedQuestionIds.has(q.id)) {
      // Lower priority for already solved questions
      score -= 40;
    }

    // Boost if in weak topics
    if (weakTopics.includes(q.topic) || (options.includeWeakTopics && weakTopics.includes(q.topic))) {
      score += 30;
    }

    return { question: q, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // 4. Select questions ensuring diversity & difficulty balance
  const selectedMap = new Map<string, any>();
  const topicCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};

  const addQuestion = (q: any) => {
    if (selectedMap.has(q.id)) return false;
    selectedMap.set(q.id, q);
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    platformCounts[q.platform] = (platformCounts[q.platform] || 0) + 1;
    return true;
  };

  // Platform diversity check: if platform is 'All' and targetCount >= 10, ensure at least 2 different platforms
  if (!options.platform || options.platform === 'All') {
    const platforms = ['LEETCODE', 'GEEKSFORGEEKS', 'CSES', 'CODEFORCES'];
    for (const plat of platforms) {
      const pCandidate = scored.find(s => !selectedMap.has(s.question.id) && s.question.platform.toUpperCase().includes(plat.substring(0, 4)));
      if (pCandidate) {
        addQuestion(pCandidate.question);
      }
    }
  }

  // Difficulty balancing: if difficulty is 'All', ensure at least 25% Easy, 40% Medium, 15% Hard
  if (!options.difficulty || options.difficulty === 'All') {
    const easyCandidates = scored.filter(s => s.question.difficulty === 'Easy');
    const medCandidates = scored.filter(s => s.question.difficulty === 'Medium');
    const hardCandidates = scored.filter(s => s.question.difficulty === 'Hard');

    const targetEasy = Math.max(1, Math.floor(targetCount * 0.3));
    const targetMed = Math.max(1, Math.floor(targetCount * 0.45));
    const targetHard = Math.max(1, Math.floor(targetCount * 0.15));

    for (const item of easyCandidates) {
      if (selectedMap.size >= targetCount) break;
      if (easyCandidates.filter(c => selectedMap.has(c.question.id)).length >= targetEasy) break;
      addQuestion(item.question);
    }
    for (const item of medCandidates) {
      if (selectedMap.size >= targetCount) break;
      if (medCandidates.filter(c => selectedMap.has(c.question.id)).length >= targetMed) break;
      addQuestion(item.question);
    }
    for (const item of hardCandidates) {
      if (selectedMap.size >= targetCount) break;
      if (hardCandidates.filter(c => selectedMap.has(c.question.id)).length >= targetHard) break;
      addQuestion(item.question);
    }
  }

  // Pass 1: pick high-scoring diverse questions
  for (const item of scored) {
    if (selectedMap.size >= targetCount) break;
    const q = item.question;
    if (selectedMap.has(q.id)) continue;

    const tCount = topicCounts[q.topic] || 0;

    // Avoid over-saturating a single topic unless filter was specific
    if (!options.topic && tCount >= Math.ceil(targetCount / 4)) continue;

    addQuestion(q);
  }

  // Pass 2: fill remaining slots if diversity constraint was too strict
  if (selectedMap.size < targetCount) {
    for (const item of scored) {
      if (selectedMap.size >= targetCount) break;
      addQuestion(item.question);
    }
  }

  // Pass 3: if still under targetCount (e.g. small filtered database), pull any remaining matching
  if (selectedMap.size < targetCount) {
    const allRemaining = await prisma.dSAQuestion.findMany({
      where: {
        AND: [
          baseWhere,
          { id: { notIn: Array.from(selectedMap.keys()) } }
        ]
      },
      take: targetCount - selectedMap.size,
    });
    for (const q of allRemaining) {
      selectedMap.set(q.id, q);
    }
  }

  // Pass 4: Fallback to any questions to fulfill exact targetCount
  if (selectedMap.size < targetCount) {
    const anyRemaining = await prisma.dSAQuestion.findMany({
      where: { id: { notIn: Array.from(selectedMap.keys()) } },
      take: targetCount - selectedMap.size,
    });
    for (const q of anyRemaining) {
      selectedMap.set(q.id, q);
    }
  }

  const selectedList = Array.from(selectedMap.values()).slice(0, targetCount);

  // Attach user attempt status
  const attemptMap = new Map(userAttempts.map(a => [a.questionId, a]));
  return selectedList.map(q => formatDSAQuestion(q, attemptMap.get(q.id)));
}

/**
 * Daily Mandatory Practice Handler
 * - Generates exactly ONE daily set per user per calendar day (YYYY-MM-DD).
 * - Refreshing the page returns the EXACT SAME questions.
 * - Tracks completion, score, and streaks.
 */
export async function getOrCreateDailyPractice(
  studentId: string,
  userTodayDate?: string
): Promise<DailyPracticeData> {
  await seedDSAQuestionsIfEmpty();

  const todayStr = userTodayDate || new Date().toISOString().split('T')[0];

  // 1. Check if DailyPractice record already exists for today
  let daily = await prisma.dailyPractice.findUnique({
    where: {
      studentId_date: {
        studentId,
        date: todayStr,
      },
    },
  });

  if (!daily) {
    // Generate new daily balanced set (default 15 questions)
    const questions = await selectRotatedQuestions(studentId, {
      count: 15,
      difficulty: 'All',
      platform: 'All',
      includeWeakTopics: true,
    });

    const questionIds = questions.map(q => q.id);

    daily = await prisma.dailyPractice.create({
      data: {
        studentId,
        date: todayStr,
        questionCount: questionIds.length,
        questionIdsJson: JSON.stringify(questionIds),
        completedQuestionIdsJson: JSON.stringify([]),
        score: 0.0,
        status: 'PENDING',
        timeSpentSeconds: 0,
      },
    });
  }

  // 2. Load the exact questions in the saved daily set
  let savedQuestionIds: string[] = JSON.parse(daily.questionIdsJson || '[]');
  const completedIds: string[] = JSON.parse(daily.completedQuestionIdsJson || '[]');

  let questionsFromDb = await prisma.dSAQuestion.findMany({
    where: { id: { in: savedQuestionIds } },
  });

  // Self-healing backfill if older record had fewer than 15 questions or deleted IDs
  if (questionsFromDb.length < 15) {
    const freshQuestions = await selectRotatedQuestions(studentId, {
      count: 15,
      difficulty: 'All',
      platform: 'All',
      includeWeakTopics: true,
    });
    savedQuestionIds = freshQuestions.map(q => q.id);
    await prisma.dailyPractice.update({
      where: { id: daily.id },
      data: {
        questionCount: savedQuestionIds.length,
        questionIdsJson: JSON.stringify(savedQuestionIds),
      },
    });
    questionsFromDb = await prisma.dSAQuestion.findMany({
      where: { id: { in: savedQuestionIds } },
    });
  }

  // Maintain saved question order
  const qMap = new Map(questionsFromDb.map(q => [q.id, q]));
  const orderedQuestions = savedQuestionIds
    .map(id => qMap.get(id))
    .filter(Boolean);

  // Fetch attempts for these questions
  const attempts = await prisma.dSAAttempt.findMany({
    where: {
      studentId,
      questionId: { in: savedQuestionIds },
    },
  });
  const attemptMap = new Map(attempts.map(a => [a.questionId, a]));

  const formattedQuestions = orderedQuestions.map(q =>
    formatDSAQuestion(q, attemptMap.get(q!.id))
  );

  // 3. Compute streak data
  const streak = await calculateDSAStreak(studentId);

  return {
    id: daily.id,
    date: daily.date,
    questionCount: daily.questionCount,
    questions: formattedQuestions,
    completedQuestionIds: completedIds,
    score: daily.score,
    status: daily.status as any,
    timeSpentSeconds: daily.timeSpentSeconds,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    startedAt: daily.startedAt?.toISOString(),
    completedAt: daily.completedAt?.toISOString(),
  };
}

/**
 * Submits a question attempt inside daily practice or custom practice.
 */
export async function submitDSAQuestionAttempt(
  studentId: string,
  params: {
    questionId: string;
    status: 'VIEWED' | 'ATTEMPTED' | 'SOLVED' | 'FAILED';
    timeSpentSeconds?: number;
    codeSubmitted?: string;
    language?: string;
    isDailyPractice?: boolean;
    date?: string;
  }
) {
  const { questionId, status: requestedStatus, timeSpentSeconds = 0, codeSubmitted, language = 'javascript', isDailyPractice } = params;

  let finalStatus: 'VIEWED' | 'ATTEMPTED' | 'SOLVED' | 'FAILED' = requestedStatus;
  let executionResult: any = undefined;

  // 0. Authoritative Backend Validation:
  // If the client submitted code and claims SOLVED (or submits for evaluation), verify with the execution sandbox
  if (codeSubmitted && codeSubmitted.trim().length > 0) {
    const question = await prisma.dSAQuestion.findUnique({
      where: { id: questionId },
    });

    if (question) {
      let testCases: any[] = [];
      try {
        testCases = JSON.parse(question.testCasesJson || '[]');
      } catch {}

      const { executeCodeSandbox } = await import('./codeRunnerService.js');
      executionResult = await executeCodeSandbox({
        code: codeSubmitted,
        language,
        entryFunctionName: question.entryFunctionName || undefined,
        testCases,
      });

      const isAccepted =
        executionResult.compilationSuccess === true &&
        executionResult.executionCompleted === true &&
        executionResult.allTestsPassed === true &&
        executionResult.status === 'ACCEPTED' &&
        !executionResult.error;

      if (isAccepted) {
        finalStatus = 'SOLVED';
      } else {
        // If compilation failed or tests failed, strictly reject SOLVED status
        finalStatus = requestedStatus === 'VIEWED' ? 'VIEWED' : 'FAILED';
      }
    }
  } else if (requestedStatus === 'SOLVED') {
    // Cannot claim SOLVED without code
    finalStatus = 'FAILED';
  }

  // 1. Upsert DSAAttempt
  const existingAttempt = await prisma.dSAAttempt.findUnique({
    where: {
      studentId_questionId: {
        studentId,
        questionId,
      },
    },
  });

  const recordStatus = existingAttempt?.status === 'SOLVED' ? 'SOLVED' : finalStatus;

  const attempt = await prisma.dSAAttempt.upsert({
    where: {
      studentId_questionId: {
        studentId,
        questionId,
      },
    },
    update: {
      status: recordStatus,
      timeSpentSeconds: { increment: timeSpentSeconds },
      codeSubmitted: codeSubmitted !== undefined ? codeSubmitted : existingAttempt?.codeSubmitted,
      language: language || existingAttempt?.language,
      attemptCount: { increment: 1 },
      isDailyPractice: isDailyPractice ?? existingAttempt?.isDailyPractice ?? false,
    },
    create: {
      studentId,
      questionId,
      status: finalStatus,
      timeSpentSeconds,
      codeSubmitted,
      language,
      attemptCount: 1,
      isDailyPractice: isDailyPractice ?? false,
    },
  });

  // 2. If it's part of today's DailyPractice, update DailyPractice record
  const todayStr = params.date || new Date().toISOString().split('T')[0];
  const daily = await prisma.dailyPractice.findUnique({
    where: {
      studentId_date: {
        studentId,
        date: todayStr,
      },
    },
  });

  if (daily) {
    const questionIds: string[] = JSON.parse(daily.questionIdsJson || '[]');
    if (questionIds.includes(questionId)) {
      const completedSet = new Set<string>(JSON.parse(daily.completedQuestionIdsJson || '[]'));
      if (finalStatus === 'SOLVED') {
        completedSet.add(questionId);
      }

      const completedCount = completedSet.size;
      const isComplete = completedCount >= daily.questionCount;
      const score = Math.round((completedCount / daily.questionCount) * 100);

      await prisma.dailyPractice.update({
        where: { id: daily.id },
        data: {
          completedQuestionIdsJson: JSON.stringify(Array.from(completedSet)),
          score,
          status: isComplete ? 'COMPLETED' : (daily.status === 'PENDING' ? 'IN_PROGRESS' : daily.status),
          startedAt: daily.startedAt || new Date(),
          completedAt: isComplete ? (daily.completedAt || new Date()) : daily.completedAt,
          timeSpentSeconds: { increment: timeSpentSeconds },
        },
      });

      // Update student user streak if completed
      if (isComplete) {
        await updateStudentStreakAfterDailyComplete(studentId, todayStr);
      }
    }
  }

  // 3. Dynamically calibrate Skill Radar problem-solving score based on DSA performance
  await calibrateDSASkillScore(studentId);

  return {
    ...attempt,
    isAccepted: finalStatus === 'SOLVED',
    executionResult,
  };
}

/**
 * Calculates current and longest consecutive daily DSA streaks for a student.
 */
export async function calculateDSAStreak(studentId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const completedPractices = await prisma.dailyPractice.findMany({
    where: {
      studentId,
      status: 'COMPLETED',
    },
    orderBy: { date: 'asc' },
  });

  if (completedPractices.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completedDates = Array.from(new Set(completedPractices.map(p => p.date))).sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  // Verify if streak is still active today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastCompleted = completedDates[completedDates.length - 1];

  let activeStreak = 0;
  if (lastCompleted === today || lastCompleted === yesterday) {
    activeStreak = current;
  }

  return { currentStreak: activeStreak, longestStreak: Math.max(longest, activeStreak) };
}

/**
 * Updates streak on User profile after completing today's daily practice.
 */
async function updateStudentStreakAfterDailyComplete(studentId: string, todayDate: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!profile || !profile.user) return;

  const streak = await calculateDSAStreak(studentId);

  await prisma.user.update({
    where: { id: profile.userId },
    data: {
      currentStreak: streak.currentStreak,
      longestStreak: Math.max(profile.user.longestStreak, streak.longestStreak),
      lastActiveDate: todayDate,
    },
  });
}

/**
 * Recalibrates the Problem Solving / DSA Skill Score for Skill Radar based on authentic DSA metrics.
 */
export async function calibrateDSASkillScore(studentId: string) {
  const attempts = await prisma.dSAAttempt.findMany({
    where: { studentId },
    include: { question: true },
  });

  if (attempts.length === 0) return;

  const solved = attempts.filter(a => a.status === 'SOLVED');
  const easySolved = solved.filter(a => a.question.difficulty === 'Easy').length;
  const medSolved = solved.filter(a => a.question.difficulty === 'Medium').length;
  const hardSolved = solved.filter(a => a.question.difficulty === 'Hard').length;

  // Weighted raw calculation (Easy = 2 pts, Med = 5 pts, Hard = 10 pts, capped at 100)
  const weightedPoints = (easySolved * 2) + (medSolved * 5) + (hardSolved * 10);
  const accuracy = solved.length / attempts.length;
  const calculatedScore = Math.min(100, Math.max(20, Math.round((weightedPoints * 0.7) + (accuracy * 30))));

  const skill = await prisma.skill.findFirst({
    where: {
      OR: [
        { id: 'skill-problem-solving' },
        { name: { contains: 'Problem Solving' } },
        { name: { contains: 'DSA' } },
      ],
    },
  });

  if (skill) {
    await prisma.studentSkillScore.upsert({
      where: {
        studentId_skillId: {
          studentId,
          skillId: skill.id,
        },
      },
      update: {
        score: calculatedScore,
        lastAttemptDate: new Date(),
      },
      create: {
        studentId,
        skillId: skill.id,
        score: calculatedScore,
        lastAttemptDate: new Date(),
      },
    });
  }
}

/**
 * Returns comprehensive DSA progress analytics for a student.
 */
export async function getDSAProgressSummary(studentId: string): Promise<DSAProgressSummary> {
  await seedDSAQuestionsIfEmpty();

  const totalQuestionsInDb = await prisma.dSAQuestion.count();
  const easyTotal = await prisma.dSAQuestion.count({ where: { difficulty: 'Easy' } });
  const mediumTotal = await prisma.dSAQuestion.count({ where: { difficulty: 'Medium' } });
  const hardTotal = await prisma.dSAQuestion.count({ where: { difficulty: 'Hard' } });

  const attempts = await prisma.dSAAttempt.findMany({
    where: { studentId },
    include: { question: true },
  });

  const solved = attempts.filter(a => a.status === 'SOLVED');
  const attempted = attempts.filter(a => a.status === 'ATTEMPTED' || a.status === 'SOLVED' || a.status === 'FAILED');

  const easySolved = solved.filter(a => a.question.difficulty === 'Easy').length;
  const mediumSolved = solved.filter(a => a.question.difficulty === 'Medium').length;
  const hardSolved = solved.filter(a => a.question.difficulty === 'Hard').length;

  // Platform breakdown
  const platforms: DSAPlatform[] = ['LEETCODE', 'GEEKSFORGEEKS', 'CSES', 'CODEFORCES'];
  const platformBreakdown = await Promise.all(
    platforms.map(async p => {
      const total = await prisma.dSAQuestion.count({ where: { platform: p } });
      const pSolved = solved.filter(a => a.question.platform === p).length;
      return { platform: p, solved: pSolved, total };
    })
  );

  // Topic breakdown
  const topicMap: Record<string, { solved: number; total: number }> = {};
  const allQuestions = await prisma.dSAQuestion.findMany({ select: { topic: true } });
  for (const q of allQuestions) {
    if (!topicMap[q.topic]) topicMap[q.topic] = { solved: 0, total: 0 };
    topicMap[q.topic].total++;
  }
  for (const s of solved) {
    if (topicMap[s.question.topic]) {
      topicMap[s.question.topic].solved++;
    }
  }

  const topicBreakdown = Object.entries(topicMap).map(([topic, stats]) => ({
    topic,
    solved: stats.solved,
    total: stats.total,
    accuracy: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
  })).sort((a, b) => b.solved - a.solved);

  // Weak & strong topics
  const strongTopics = topicBreakdown.filter(t => t.solved >= 2 && t.accuracy >= 50).map(t => t.topic);
  const weakTopics = topicBreakdown.filter(t => (t.total >= 1 && t.accuracy < 50) || attempts.some(a => a.question.topic === t.topic && a.status === 'FAILED')).map(t => t.topic);

  // Streak
  const streak = await calculateDSAStreak(studentId);

  // Recent activity (last 7 days)
  const recentActivity: { date: string; solvedCount: number; attemptCount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayAttempts = attempts.filter(a => a.updatedAt.toISOString().split('T')[0] === d);
    const daySolved = dayAttempts.filter(a => a.status === 'SOLVED').length;
    recentActivity.push({
      date: d,
      solvedCount: daySolved,
      attemptCount: dayAttempts.length,
    });
  }

  return {
    totalSolved: solved.length,
    totalAttempted: attempted.length,
    easySolved,
    easyTotal,
    mediumSolved,
    mediumTotal,
    hardSolved,
    hardTotal,
    platformBreakdown,
    topicBreakdown,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    weakTopics: weakTopics.slice(0, 5),
    strongTopics: strongTopics.slice(0, 5),
    recentActivity,
  };
}

/**
 * Returns all distinct DSA topics available in the question database.
 */
export async function getAllTopics(): Promise<string[]> {
  await seedDSAQuestionsIfEmpty();
  const topics = await prisma.dSAQuestion.findMany({
    select: { topic: true },
    distinct: ['topic'],
    orderBy: { topic: 'asc' },
  });
  return topics.map((t) => t.topic);
}

/**
 * Returns filtered DSA questions for problem explorer.
 */
export async function getQuestions(params: {
  platform?: string;
  difficulty?: string;
  topic?: string;
  status?: string;
  search?: string;
  studentId?: string;
  limit?: number;
}): Promise<{ questions: DSAQuestionData[]; total: number }> {
  await seedDSAQuestionsIfEmpty();

  const where: any = {};
  if (params.platform && params.platform !== 'All') where.platform = params.platform;
  if (params.difficulty && params.difficulty !== 'All') where.difficulty = params.difficulty;
  if (params.topic && params.topic !== 'All') where.topic = params.topic;
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { title: { contains: q } },
      { topic: { contains: q } },
      { tagsJson: { contains: q } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.dSAQuestion.findMany({
      where,
      take: params.limit || 400,
      orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
    }),
    prisma.dSAQuestion.count({ where }),
  ]);

  let attemptMap = new Map<string, any>();
  if (params.studentId) {
    const attempts = await prisma.dSAAttempt.findMany({
      where: { studentId: params.studentId },
    });
    attemptMap = new Map(attempts.map((a) => [a.questionId, a]));
  }

  let formatted = questions.map((q) => formatDSAQuestion(q, attemptMap.get(q.id)));

  if (params.status && params.status !== 'All') {
    if (params.status === 'SOLVED') {
      formatted = formatted.filter((q) => q.userAttemptStatus === 'SOLVED');
    } else if (params.status === 'ATTEMPTED') {
      formatted = formatted.filter((q) => q.userAttemptStatus === 'ATTEMPTED' || q.userAttemptStatus === 'FAILED');
    } else if (params.status === 'UNSEEN') {
      formatted = formatted.filter((q) => !q.userAttemptStatus || q.userAttemptStatus === 'UNSEEN');
    }
  }

  return { questions: formatted, total: formatted.length };
}

/**
 * Returns a single DSA question by ID or slug.
 */
export async function getQuestionById(idOrSlug: string, studentId?: string): Promise<DSAQuestionData | null> {
  const q = await prisma.dSAQuestion.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  if (!q) return null;

  let attempt = null;
  if (studentId) {
    attempt = await prisma.dSAAttempt.findUnique({
      where: { studentId_questionId: { studentId, questionId: q.id } },
    });
  }

  return formatDSAQuestion(q, attempt);
}

export const generateCustomPracticeSet = selectRotatedQuestions;

export async function submitDailyQuestion(
  studentId: string,
  params: { questionId: string; status: 'SOLVED' | 'ATTEMPTED'; code?: string; timeSpentSeconds?: number }
) {
  const attempt = await submitDSAQuestionAttempt(studentId, {
    questionId: params.questionId,
    status: params.status,
    codeSubmitted: params.code,
    timeSpentSeconds: params.timeSpentSeconds || 60,
    isDailyPractice: true,
  });

  const daily = await getOrCreateDailyPractice(studentId);
  return { dailyPractice: daily, attempt, streak: daily.currentStreak };
}

export async function recordAttempt(
  studentId: string,
  questionId: string,
  params: { status: 'VIEWED' | 'ATTEMPTED' | 'SOLVED' | 'FAILED'; timeSpentSeconds?: number; codeSubmitted?: string; language?: string }
) {
  return submitDSAQuestionAttempt(studentId, {
    questionId,
    status: params.status,
    timeSpentSeconds: params.timeSpentSeconds,
    codeSubmitted: params.codeSubmitted,
    language: params.language,
  });
}

export const getStreakInfo = calculateDSAStreak;
export const getProgressSummary = getDSAProgressSummary;

export const questionSelectionService = {
  normalizeSetSize,
  seedDSAQuestionsIfEmpty,
  syncDSAQuestionsDatabase,
  getAllTopics,
  getQuestions,
  getQuestionById,
  selectRotatedQuestions,
  generateCustomPracticeSet,
  getOrCreateDailyPractice,
  submitDSAQuestionAttempt,
  submitDailyQuestion,
  recordAttempt,
  calculateDSAStreak,
  getStreakInfo,
  calibrateDSASkillScore,
  getDSAProgressSummary,
  getProgressSummary,
};

export default questionSelectionService;

