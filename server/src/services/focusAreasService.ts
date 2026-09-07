import { prisma } from '../config/prisma.js';
import { FocusAreaItem } from '../../../shared/types.js';
import { isLlmConfigured, generateLlmText } from './llmService.js';

interface FocusAreaCacheEntry {
  cachedAt: number;
  data: FocusAreaItem[];
}

// In-memory TTL cache: key -> { cachedAt, data }
const focusAreasCache = new Map<string, FocusAreaCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

/**
 * Clears the focus areas cache (useful for tests or after submitting an assessment)
 */
export function clearFocusAreasCache(studentProfileId?: string) {
  if (studentProfileId) {
    for (const key of focusAreasCache.keys()) {
      if (key.startsWith(studentProfileId)) {
        focusAreasCache.delete(key);
      }
    }
  } else {
    focusAreasCache.clear();
  }
}

/**
 * Curated topic heuristics for offline generation or LLM fallback
 */
const TOPIC_HEURISTICS: Record<string, { explanation: (stats: any) => string; tips: string[] }> = {
  'Dynamic Programming': {
    explanation: (s) =>
      `You've struggled on ${s.failedCount || 'multiple'} Dynamic Programming attempts (${s.accuracy}% accuracy) — specifically with state transition formulation and identifying overlapping subproblems.`,
    tips: [
      'Define your DP state in plain English (e.g., dp[i] = max profit up to day i) before writing loops.',
      'Explicitly write out base cases (e.g. n = 0, n = 1) to avoid off-by-one errors and array index out of bounds.',
      'Check if only the previous state is needed to reduce space complexity from O(N) to O(1) rolling variables.',
    ],
  },
  'Graphs': {
    explanation: (s) =>
      `You've missed ${s.failedCount || 'several'} Graph problem attempts (${s.accuracy}% accuracy) — primarily around cycle detection and choosing between BFS and DFS traversal.`,
    tips: [
      'Use BFS for unweighted shortest path problems; use DFS for topological sorting, cycle detection, and connectivity.',
      'Always maintain a visited set or color array (0=unvisited, 1=visiting, 2=visited) to prevent infinite loops in directed graphs.',
      'Model the problem as an adjacency list rather than an adjacency matrix to preserve O(V + E) efficiency.',
    ],
  },
  'Trees': {
    explanation: (s) =>
      `You have ${s.failedCount || 'multiple'} failed attempts on Tree questions (${s.accuracy}% accuracy) — usually caused by boundary conditions on null nodes or complex recursion stack unwinding.`,
    tips: [
      'Handle null/leaf node base cases at the very beginning of the recursive function before accessing node.left or node.right.',
      'For level-order traversals, capture the queue length at the start of each iteration: const size = queue.length.',
      'Leverage post-order traversal when the parent node requires aggregated metrics from both children (e.g., tree diameter).',
    ],
  },
  'Arrays': {
    explanation: (s) =>
      `Your performance on Array & String questions showed repeated misses (${s.accuracy}% accuracy) — often due to edge cases with duplicate elements and non-optimal O(N²) nested loops.`,
    tips: [
      'Sort the input array if relative order does not matter; it unlocks two-pointer and binary search patterns.',
      'Use a hash map or frequency array to achieve O(N) single-pass lookups instead of nested comparisons.',
      'Watch out for integer overflow or boundary indexing when computing mid = left + Math.floor((right - left) / 2).',
    ],
  },
  'Two Pointers': {
    explanation: (s) =>
      `You've encountered friction with Two Pointers / Sliding Window questions (${s.accuracy}% accuracy) — especially managing window contraction conditions and duplicate pointers.`,
    tips: [
      'Clearly specify which pointer advances under what invariant (e.g. right expands window, left shrinks when constraint violated).',
      'For sorted arrays, place pointers at opposite ends (left = 0, right = n - 1) to converge toward target sums.',
      'Avoid off-by-one errors on window size: the number of elements between indices left and right is right - left + 1.',
    ],
  },
  'Binary Search': {
    explanation: (s) =>
      `You've missed ${s.failedCount || 'key'} Binary Search questions (${s.accuracy}% accuracy) — typically from termination condition pitfalls (while left < right vs left <= right).`,
    tips: [
      'Stick to one standard template: while (left <= right) with mid = left + Math.floor((right - left) / 2).',
      'Always update pointers strictly beyond mid: left = mid + 1 and right = mid - 1 to guarantee termination.',
      'Apply binary search not just on sorted arrays, but on monotonic answer spaces (binary search on answer).',
    ],
  },
  'Quantitative Aptitude': {
    explanation: (s) =>
      `You've scored below passing on Quantitative Maths (${s.accuracy}% accuracy) — particularly on Time & Work, Speed-Distance, and Probability calculations under timed pressure.`,
    tips: [
      'Use the LCM / Unitary method for Time & Work problems instead of cumbersome fractions (1/a + 1/b).',
      'Memorize percentage-fraction equivalents (1/6 = 16.66%, 1/8 = 12.5%, 1/12 = 8.33%) for rapid mental arithmetic.',
      'Use reverse-option elimination: substitute middle choice options directly into the equation to save time.',
    ],
  },
  'English Reading': {
    explanation: (s) =>
      `You've had lower accuracy in English Reading Comprehension (${s.accuracy}% accuracy) — specifically on tone inference, passage assumption, and vocabulary in context.`,
    tips: [
      'Read the questions first before skimming the passage so your brain reads with targeted purpose.',
      'Beware of extreme answer choices using words like "always", "never", "only", and "completely" — they are usually false.',
      'Look for pivot transition words ("however", "nonetheless", "conversely") as they reveal the author’s true thesis.',
    ],
  },
  'English Listening': {
    explanation: (s) =>
      `Your English Listening Comprehension accuracy was ${s.accuracy}% — struggling with fast audio segments and technical vocabulary recall.`,
    tips: [
      'Take shorthand notes of dates, names, and contrast words during the first playback.',
      'Anticipate speaker direction from audio inflection and discourse markers.',
      'Focus on the overall paragraph intent rather than trying to transcribe every single spoken word.',
    ],
  },
  'Full-Stack Web': {
    explanation: (s) =>
      `Your Full-Stack Web assessments show gaps in React state lifecycle, asynchronous API handling, and architectural boundaries.`,
    tips: [
      'Ensure useEffect dependency arrays contain all referenced primitives to avoid stale closures.',
      'Use functional state updates (setCount(prev => prev + 1)) when the new state depends on the previous state.',
      'Properly catch and propagate async errors with standard try/catch or React Error Boundaries.',
    ],
  },
};

/**
 * Generates actionable Focus Areas for a student based on their complete attempt history.
 */
export async function generateFocusAreas(studentProfileId: string): Promise<FocusAreaItem[]> {
  if (!studentProfileId) return [];

  // 1. Check in-memory cache first before doing any database network round-trips
  const cached = focusAreasCache.get(studentProfileId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Gather all attempts
  const [dsaAttempts, assessmentAttempts, skillScores] = await Promise.all([
    prisma.dSAAttempt.findMany({
      where: { studentId: studentProfileId },
      include: { question: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.assessmentAttempt.findMany({
      where: { studentId: studentProfileId },
      include: { practiceSet: true },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    }),
    prisma.studentSkillScore.findMany({
      where: { studentId: studentProfileId },
      include: { skill: true },
      orderBy: { score: 'asc' },
    }),
  ]);

  // 2. Identify weak candidate topics across modalities
  interface Candidate {
    topic: string;
    category: 'dsa' | 'domain' | 'aptitude';
    attemptsCount: number;
    failedCount: number;
    accuracyPct: number;
    weaknessScore: number;
    lastAttemptDate?: string | null;
    inactivityDecayPct?: number;
    decayDaysCount?: number;
  }

  const candidateMap = new Map<string, Candidate>();

  // A. Analyze DSA attempts by topic
  const dsaTopicGroups: Record<string, typeof dsaAttempts> = {};
  for (const att of dsaAttempts) {
    const topic = att.question.topic;
    if (!dsaTopicGroups[topic]) dsaTopicGroups[topic] = [];
    dsaTopicGroups[topic].push(att);
  }

  for (const [topic, attempts] of Object.entries(dsaTopicGroups)) {
    const total = attempts.length;
    const failed = attempts.filter((a) => a.status === 'FAILED').length;
    const solved = attempts.filter((a) => a.status === 'SOLVED').length;
    const accuracy = total > 0 ? Math.round((solved / total) * 100) : 0;
    const latest = attempts[0]?.updatedAt?.toISOString() || null;

    // Weakness formula: 35 pts per fail + up to 50 pts for low accuracy + attempt volume
    const weakness = failed * 35 + (100 - accuracy) * 0.5 + Math.min(total * 5, 20);

    // Consider it a candidate if failed >= 1 or accuracy < 60%
    if (failed >= 1 || accuracy < 60 || (total >= 1 && solved === 0)) {
      candidateMap.set(topic, {
        topic,
        category: 'dsa',
        attemptsCount: total,
        failedCount: failed,
        accuracyPct: accuracy,
        weaknessScore: weakness,
        lastAttemptDate: latest,
      });
    }
  }

  // B. Analyze Assessment attempts (Domain & Aptitude)
  for (const att of assessmentAttempts) {
    const pSet = att.practiceSet;
    const isAptitude = pSet.type.startsWith('aptitude_');
    const category: 'aptitude' | 'domain' = isAptitude ? 'aptitude' : 'domain';
    const topicName = isAptitude
      ? pSet.type === 'aptitude_quant'
        ? 'Quantitative Aptitude'
        : pSet.type === 'aptitude_english_reading'
        ? 'English Reading'
        : 'English Listening'
      : pSet.domainName;

    const existing = candidateMap.get(topicName) || {
      topic: topicName,
      category,
      attemptsCount: 0,
      failedCount: 0,
      accuracyPct: 0,
      weaknessScore: 0,
      lastAttemptDate: att.submittedAt?.toISOString() || null,
    };

    existing.attemptsCount += 1;
    if (!att.passed || att.score < pSet.passingScorePct) {
      existing.failedCount += 1;
    }
    // Update score
    const currentScore = att.score;
    existing.accuracyPct = Math.round(
      (existing.accuracyPct * (existing.attemptsCount - 1) + currentScore) / existing.attemptsCount
    );
    existing.weaknessScore =
      existing.failedCount * 30 + (100 - existing.accuracyPct) * 0.4 + existing.attemptsCount * 4;

    if (existing.failedCount >= 1 || existing.accuracyPct < 65) {
      candidateMap.set(topicName, existing);
    }
  }

  // C. Analyze Skill Scores for decay & low proficiency
  for (const sk of skillScores) {
    const isLowScore = sk.score < 60;
    const isDecayed = sk.inactivityDecayPct > 0 || sk.decayDaysCount >= 7;

    if (isLowScore || isDecayed) {
      const topicName = sk.skill.name;
      if (!candidateMap.has(topicName)) {
        const weakness = (100 - sk.score) * 0.6 + sk.decayDaysCount * 2;
        candidateMap.set(topicName, {
          topic: topicName,
          category: sk.skill.category === 'soft' || sk.skill.category === 'core' ? 'aptitude' : 'domain',
          attemptsCount: 1,
          failedCount: isLowScore ? 1 : 0,
          accuracyPct: Math.round(sk.score),
          weaknessScore: weakness,
          lastAttemptDate: sk.lastAttemptDate?.toISOString() || null,
          inactivityDecayPct: sk.inactivityDecayPct,
          decayDaysCount: sk.decayDaysCount,
        });
      }
    }
  }

  // 3. Select top 2–3 weakest topics
  let candidates = Array.from(candidateMap.values()).sort((a, b) => b.weaknessScore - a.weaknessScore);

  // If candidate count is less than 2 (e.g. brand new user with no attempts), supplement with foundational topics
  if (candidates.length < 2) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { targetDomain: true },
    });
    const targetDomain = student?.targetDomain || 'Full-Stack Web';

    const fallbackTopics = [
      { topic: 'Dynamic Programming', category: 'dsa' as const, weaknessScore: 50 },
      { topic: 'Quantitative Aptitude', category: 'aptitude' as const, weaknessScore: 45 },
      { topic: targetDomain, category: 'domain' as const, weaknessScore: 40 },
    ];

    for (const fb of fallbackTopics) {
      if (!candidateMap.has(fb.topic) && candidates.length < 3) {
        candidates.push({
          topic: fb.topic,
          category: fb.category,
          attemptsCount: 0,
          failedCount: 0,
          accuracyPct: 50,
          weaknessScore: fb.weaknessScore,
        });
      }
    }
  }

  const selectedCandidates = candidates.slice(0, 3);

  // 4. Resolve Practice Sets & AI explanations for each candidate
  const focusAreas: FocusAreaItem[] = [];

  for (const cand of selectedCandidates) {
    // A. Link to real Practice Set or DSA Question
    let practiceSetLink: FocusAreaItem['practiceSet'] = {
      id: `ps-${cand.topic.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${cand.topic} Practice Set`,
      url: `/assessment`,
      type: cand.category,
      estimatedMinutes: 25,
      difficulty: 'Intermediate',
    };

    if (cand.category === 'dsa') {
      const dsaQuestion = await prisma.dSAQuestion.findFirst({
        where: {
          OR: [
            { topic: { contains: cand.topic } },
            { tagsJson: { contains: cand.topic } },
          ],
        },
      });

      if (dsaQuestion) {
        practiceSetLink = {
          id: dsaQuestion.id,
          title: `Mastery Challenge: ${dsaQuestion.title} (${dsaQuestion.topic})`,
          url: `/dsa/practice/${dsaQuestion.slug}`,
          type: 'dsa',
          estimatedMinutes: dsaQuestion.estimatedMinutes || 20,
          difficulty: dsaQuestion.difficulty,
        };
      } else {
        practiceSetLink = {
          id: `dsa-${cand.topic.toLowerCase().replace(/\s+/g, '-')}`,
          title: `${cand.topic} Targeted DSA Set`,
          url: `/dsa/practice?topic=${encodeURIComponent(cand.topic)}`,
          type: 'dsa',
          estimatedMinutes: 20,
          difficulty: 'Intermediate',
        };
      }
    } else if (cand.category === 'aptitude') {
      let pSetType = 'aptitude_quant';
      if (cand.topic.includes('Reading')) pSetType = 'aptitude_english_reading';
      if (cand.topic.includes('Listening')) pSetType = 'aptitude_english_listening';

      const pSet = await prisma.practiceSet.findFirst({
        where: { type: pSetType },
      });

      if (pSet) {
        practiceSetLink = {
          id: pSet.id,
          title: pSet.title,
          url: `/assessment/runner/${pSet.id}`,
          type: pSet.type,
          estimatedMinutes: pSet.timeLimitMinutes,
          difficulty: pSet.difficulty,
        };
      }
    } else {
      // Domain
      const pSet = await prisma.practiceSet.findFirst({
        where: {
          OR: [
            { domainName: { contains: cand.topic } },
            { title: { contains: cand.topic } },
          ],
        },
      });

      if (pSet) {
        practiceSetLink = {
          id: pSet.id,
          title: pSet.title,
          url: `/assessment/runner/${pSet.id}`,
          type: pSet.type,
          estimatedMinutes: pSet.timeLimitMinutes,
          difficulty: pSet.difficulty,
        };
      }
    }

    // B. Build Failure Summary
    let failureSummary = '';
    if (cand.attemptsCount > 0) {
      if (cand.failedCount > 0) {
        failureSummary = `Missed ${cand.failedCount} of ${cand.attemptsCount} attempts (${cand.accuracyPct}% accuracy)`;
      } else {
        failureSummary = `${cand.attemptsCount} attempts completed • Current score: ${cand.accuracyPct}%`;
      }
    } else if (cand.decayDaysCount && cand.decayDaysCount > 0) {
      failureSummary = `Score decayed by ${cand.inactivityDecayPct || 0}% • Inactive for ${cand.decayDaysCount} days`;
    } else {
      failureSummary = `Foundational gap identified • Recommended next milestone`;
    }

    // C. Generate AI Explanation & Tips
    let explanation = '';
    let tips: string[] = [];

    // Check curated heuristic first
    const heuristic =
      TOPIC_HEURISTICS[cand.topic] ||
      Object.entries(TOPIC_HEURISTICS).find(([k]) => cand.topic.includes(k))?.[1];

    if (heuristic) {
      explanation = heuristic.explanation({
        failedCount: cand.failedCount,
        accuracy: cand.accuracyPct,
      });
      tips = heuristic.tips;
    }

    // If real LLM is configured, enrich with LLM-generated explanation & tips
    if (isLlmConfigured()) {
      try {
        const systemPrompt = `You are an expert technical mentor and computer science professor.
Analyze the student's actual performance history in a specific topic where they are struggling.
Provide:
1. explanation: A concise, highly-tailored 1-2 sentence pattern explanation addressing their specific failure pattern (e.g. "You've missed 3 of the last 4 Dynamic Programming questions — mostly on optimal substructure identification and state memoization.").
2. tips: Exactly 2 to 3 practical, actionable, highly-specific technical tips & tricks bullets (NOT generic platitudes like "practice more"). Focus on concrete patterns, invariants, or problem-solving strategies for that topic.
Output strict JSON format:
{
  "explanation": "...",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

        const prompt = `Student Topic: "${cand.topic}"
Category: "${cand.category}"
Attempts: ${cand.attemptsCount}
Failures: ${cand.failedCount}
Accuracy: ${cand.accuracyPct}%
Summary: "${failureSummary}"

Generate concise JSON:`;

        const llmResult = await generateLlmText({ systemPrompt, prompt, temperature: 0.2 });
        if (llmResult) {
          const cleaned = llmResult.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.explanation && typeof parsed.explanation === 'string') {
            explanation = parsed.explanation.trim();
          }
          if (Array.isArray(parsed.tips) && parsed.tips.length >= 2) {
            tips = parsed.tips.map((t: any) => String(t).trim()).slice(0, 3);
          }
        }
      } catch (err) {
        console.warn(`⚠️ [Focus Areas] LLM generation skipped for ${cand.topic}:`, err);
      }
    }

    // Final fallback if no explanation or tips yet
    if (!explanation) {
      explanation = `Your recent attempts in ${cand.topic} reflect repeated friction points (${cand.accuracyPct}% accuracy) that are holding back your match calibrations.`;
    }
    if (tips.length === 0) {
      tips = [
        `Break down ${cand.topic} problems into fundamental sub-problems before implementing solutions.`,
        `Focus on understanding the underlying patterns and time complexity constraints.`,
        `Review solved reference implementations to identify common idiomatic patterns.`,
      ];
    }

    focusAreas.push({
      topic: cand.topic,
      category: cand.category,
      failureSummary,
      explanation,
      practiceSet: practiceSetLink,
      tips,
      metrics: {
        accuracyPct: cand.accuracyPct,
        attemptsCount: cand.attemptsCount,
        failedCount: cand.failedCount,
        lastAttemptDate: cand.lastAttemptDate,
      },
    });
  }

  // Cache results
  focusAreasCache.set(studentProfileId, {
    cachedAt: Date.now(),
    data: focusAreas,
  });

  return focusAreas;
}
