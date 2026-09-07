import { prisma } from '../config/prisma.js';
import { getTodayDateString } from './streakService.js';

export interface DsaContextDetection {
  isDsaContext: boolean;
  problemTitle?: string;
  problemId?: string;
  topic?: string;
}

export interface DailyMandatoryStatus {
  isDailyMandatory: boolean;
  hasAttempted: boolean;
  questionTitle?: string;
  questionId?: string;
}

// Known common algorithmic problem patterns for high-precision Socratic tutoring
interface ProblemPattern {
  name: string;
  family: string;
  tier1Hint: string;
  tier2Outline: string[];
  tier3Code: {
    language: string;
    code: string;
    explanation: string;
  };
}

const COMMON_DSA_PATTERNS: Record<string, ProblemPattern> = {
  'two_sum': {
    name: 'Two Sum',
    family: 'Hash Map Lookup (Complement Invariant)',
    tier1Hint: `This is fundamentally an **Unordered Map / Hash Table lookup** problem.
• **Core Invariant**: For every element \`x\` at index \`i\`, the complement required to reach the target is strictly \`complement = target - x\`.
• **Key Intuition**: Instead of using a nested loop that re-scans the array in $O(N^2)$, think about how a hash table lets you check if you have already seen the complement in instantaneous $O(1)$ time while doing a single linear pass.

*Think about what key and value you should store in your map as you iterate through the array.*`,
    tier2Outline: [
      'Initialize an empty hash map `seen` to store mapping from `number -> index`.',
      'Iterate through the array with index `i` and value `num`.',
      'At each iteration, compute `complement = target - num`.',
      'Check if `complement` exists as a key in `seen`. If it does, return `[seen[complement], i]`.',
      'Otherwise, record the current number: `seen[num] = i` and proceed.',
      'Edge Cases: Array length exactly 2, negative numbers, zeros.',
    ],
    tier3Code: {
      language: 'typescript',
      code: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`,
      explanation: 'Time Complexity: O(N) single pass. Space Complexity: O(N) hash map storage. The map invariant guarantees we find the pair in the earliest valid index combination.',
    },
  },

  'binary_search': {
    name: 'Binary Search',
    family: 'Binary Search (Monotonic Invariant)',
    tier1Hint: `This is a classic **Binary Search on Sorted Space** problem.
• **Core Invariant**: Because the input array is strictly sorted, examining the midpoint \`mid\` divides the search space into two halves where one half is guaranteed to not contain the target.
• **Key Intuition**: If \`nums[mid] < target\`, the target must lie strictly to the right (\`left = mid + 1\`). If \`nums[mid] > target\`, it must lie strictly to the left (\`right = mid - 1\`).

*Focus on maintaining the invariant \`left <= right\` and avoiding integer overflow when calculating mid.*`,
    tier2Outline: [
      'Initialize two pointers: `left = 0` and `right = nums.length - 1`.',
      'Run a while loop with the condition `while (left <= right)`.',
      'Compute midpoint: `mid = Math.floor(left + (right - left) / 2)` to prevent overflow.',
      'Branch 1: If `nums[mid] === target`, return `mid`.',
      'Branch 2: If `nums[mid] < target`, shrink space to right: `left = mid + 1`.',
      'Branch 3: If `nums[mid] > target`, shrink space to left: `right = mid - 1`.',
      'If loop finishes without returning, target does not exist; return `-1`.',
    ],
    tier3Code: {
      language: 'typescript',
      code: `function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
      explanation: 'Time Complexity: O(log N) halving at every step. Space Complexity: O(1) constant auxiliary memory.',
    },
  },

  'reverse_linked_list': {
    name: 'Reverse Linked List',
    family: 'Iterative Pointer Reversal (Three-Pointer Invariant)',
    tier1Hint: `This is a classic **Pointer Manipulation** problem.
• **Core Invariant**: At any node, you need to redirect its \`next\` pointer to point backwards to the preceding node.
• **Key Intuition**: To do this without losing the remainder of the list, you must temporarily store the reference to the original next node before reassigning \`curr.next\`.

*Think about keeping three pointers: \`prev\`, \`curr\`, and \`nextTemp\`.*`,
    tier2Outline: [
      'Initialize `prev = null` and `curr = head`.',
      'While `curr !== null`, perform the four-step pointer slide:',
      '  a. Save forward reference: `nextTemp = curr.next`.',
      '  b. Reverse current pointer: `curr.next = prev`.',
      '  c. Advance previous: `prev = curr`.',
      '  d. Advance current: `curr = nextTemp`.',
      'When loop terminates, `curr` is null and `prev` points to the new head. Return `prev`.',
      'Edge Cases: Empty list (`head === null`), single-node list.',
    ],
    tier3Code: {
      language: 'typescript',
      code: `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }

  return prev;
}`,
      explanation: 'Time Complexity: O(N) single traversal. Space Complexity: O(1) in-place reversal.',
    },
  },

  'merge_intervals': {
    name: 'Merge Intervals',
    family: 'Sorting & Greedy Interval Overlap',
    tier1Hint: `This is an **Interval Merging** problem relying on sorting by starting coordinates.
• **Core Invariant**: If intervals are sorted by start time, any new interval can only overlap with the most recently merged interval.
• **Key Intuition**: Sort by \`start\` first. Then compare the current interval's \`start\` with the previous interval's \`end\`.

*What condition determines whether you expand the current interval or push a new one?*`,
    tier2Outline: [
      'Sort the intervals array by starting point: `intervals.sort((a, b) => a[0] - b[0])`.',
      'Initialize `merged` array with the first interval.',
      'Iterate through the remaining intervals.',
      'Compare `current[0]` with `lastMerged[1]`.',
      'If `current[0] <= lastMerged[1]`, they overlap: set `lastMerged[1] = Math.max(lastMerged[1], current[1])`.',
      'Otherwise, no overlap: push `current` into `merged`.',
      'Return `merged`.',
    ],
    tier3Code: {
      language: 'typescript',
      code: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);

  const merged: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}`,
      explanation: 'Time Complexity: O(N log N) for sorting, O(N) for linear scan. Space Complexity: O(N) for result array.',
    },
  },
};

/**
 * Detects if a message or page context indicates DSA / coding question help.
 */
export function detectDsaContext(
  prompt: string,
  pageContext?: { path?: string; problemId?: string; problemTitle?: string }
): DsaContextDetection {
  const lowerPrompt = prompt.toLowerCase();
  const path = (pageContext?.path || '').toLowerCase();

  const isDsaRoute =
    path.includes('/dsa') ||
    path.includes('/problem') ||
    path.includes('/practice') ||
    path.includes('/coding');

  // Check for specific problem title mentions
  for (const [key, pattern] of Object.entries(COMMON_DSA_PATTERNS)) {
    if (
      lowerPrompt.includes(pattern.name.toLowerCase()) ||
      lowerPrompt.includes(key.replace(/_/g, ' ')) ||
      lowerPrompt.includes(key.replace(/_/g, ''))
    ) {
      return {
        isDsaContext: true,
        problemTitle: pattern.name,
        topic: pattern.family,
      };
    }
  }

  // Keywords indicating a DSA help request
  const dsaKeywords = [
    'how to solve',
    'how do i solve',
    'solve this problem',
    'approach for',
    'hint for',
    'give me code',
    'show me code',
    'write code',
    'time complexity',
    'space complexity',
    'algorithm for',
    'sliding window',
    'two pointers',
    'binary search',
    'dynamic programming',
    'depth first search',
    'breadth first search',
    'leetcode',
    'dsa',
    'coding problem',
    'test cases failing',
    'recursion',
  ];

  const hasDsaKeyword = dsaKeywords.some((kw) => lowerPrompt.includes(kw));

  if (isDsaRoute || hasDsaKeyword || pageContext?.problemTitle || pageContext?.problemId) {
    return {
      isDsaContext: true,
      problemTitle: pageContext?.problemTitle || 'this coding problem',
      problemId: pageContext?.problemId,
    };
  }

  return { isDsaContext: false };
}

/**
 * Evaluates whether a code submission represents a genuine, substantive attempt
 * rather than empty code, comments, or trivial stub templates (e.g. `function solve() {}`).
 */
export function isSubstantiveCodeSubmission(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;

  // 1. Strip multi-line comments (/* ... */) and single-line comments (// and #)
  const withoutComments = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .trim();

  // 2. Strip whitespace
  const stripped = withoutComments.replace(/\s+/g, '');

  // 3. Reject if non-comment, non-whitespace code is shorter than 30 characters
  if (stripped.length < 30) {
    return false;
  }

  // 4. Reject trivial boilerplate templates that merely define empty function stubs
  const trivialPatterns = [
    /^function\s*\w*\s*\([^)]*\)\s*\{\s*(return\s*(\[\]|null|0|false|true|undefined|""|'')?;?)?\s*\}$/i,
    /^const\s*\w*\s*=\s*\([^)]*\)\s*=>\s*\{\s*(return\s*(\[\]|null|0|false|true|undefined|""|'')?;?)?\s*\}$/i,
    /^def\s*\w*\s*\([^)]*\)\s*:\s*(pass|return\s*(None|\[\]|0|False|True|""|''))?$/i,
    /^class\s*\w*\s*:\s*(pass)?$/i,
    /^(console\.log\([^)]*\);?)+$/i,
    /^(print\([^)]*\);?)+$/i,
  ];

  if (trivialPatterns.some((p) => p.test(withoutComments))) {
    return false;
  }

  // 5. Must contain programming logic, operators, or data structure usage
  const hasLogicTokens =
    /\b(for|while|if|switch|map|set|push|pop|length|let|const|var|dict|vector|int|float|return)\b/i.test(
      withoutComments
    ) && (withoutComments.includes('=') || withoutComments.includes(';') || withoutComments.includes(':') || withoutComments.includes('+') || withoutComments.includes('-'));

  return hasLogicTokens;
}

/**
 * Checks whether a given problem is part of today's Daily Mandatory practice set,
 * and whether the student has already submitted an attempt on it.
 */
export async function checkDailyMandatoryUnattempted(
  studentProfileId: string,
  problemIdentifier?: string
): Promise<DailyMandatoryStatus> {
  if (!studentProfileId || !problemIdentifier) {
    return { isDailyMandatory: false, hasAttempted: false };
  }

  const todayDate = getTodayDateString();

  try {
    const dailyRecord = await prisma.dailyPractice.findUnique({
      where: {
        studentId_date: {
          studentId: studentProfileId,
          date: todayDate,
        },
      },
    });

    if (!dailyRecord) {
      return { isDailyMandatory: false, hasAttempted: false };
    }

    let dailyQuestions: any[] = [];
    try {
      const parsed = JSON.parse(dailyRecord.questionIdsJson || '{}');
      if (parsed.questions && Array.isArray(parsed.questions)) {
        dailyQuestions = parsed.questions;
      } else if (Array.isArray(parsed)) {
        dailyQuestions = parsed.map((id: string) => ({ id }));
      }
    } catch {}

    const lowerId = problemIdentifier.toLowerCase().trim();

    // Check if question exists in today's daily set
    const matchedQ = dailyQuestions.find((q: any) => {
      const qId = (q.id || '').toLowerCase();
      const qTitle = (q.title || q.categoryLabel || '').toLowerCase();
      const qPrompt = (q.prompt || '').toLowerCase();
      return (
        qId === lowerId ||
        qTitle.includes(lowerId) ||
        lowerId.includes(qTitle) ||
        (lowerId.length > 5 && qPrompt.includes(lowerId))
      );
    });

    if (!matchedQ) {
      return { isDailyMandatory: false, hasAttempted: false };
    }

    // Question IS in today's daily set! Check if student has attempted it with substantive code execution.
    let hasAttempted = false;

    if (matchedQ.id) {
      // Find attempt record in DSAAttempt
      const dsaAttempt = await prisma.dSAAttempt.findFirst({
        where: {
          studentId: studentProfileId,
          questionId: matchedQ.id,
        },
      });

      if (dsaAttempt) {
        // Must have been executed against test cases (status not 'VIEWED')
        const hasExecutedAgainstTests = ['ATTEMPTED', 'SOLVED', 'FAILED'].includes(dsaAttempt.status);
        // Must have substantive, non-trivial code submitted
        const hasSubstantiveCode = isSubstantiveCodeSubmission(dsaAttempt.codeSubmitted);

        if (hasExecutedAgainstTests && hasSubstantiveCode) {
          hasAttempted = true;
        }
      }
    }

    // If still not verified via dsaAttempt, check completedQuestionIdsJson
    if (!hasAttempted) {
      try {
        const completedIds: string[] = JSON.parse(dailyRecord.completedQuestionIdsJson || '[]');
        if (completedIds.includes(matchedQ.id)) {
          // If marked in completed IDs, confirm no trivial attempt exists
          const existingAttempt = matchedQ.id
            ? await prisma.dSAAttempt.findFirst({
                where: { studentId: studentProfileId, questionId: matchedQ.id },
              })
            : null;

          if (!existingAttempt || isSubstantiveCodeSubmission(existingAttempt.codeSubmitted)) {
            hasAttempted = true;
          }
        }
      } catch {}
    }

    return {
      isDailyMandatory: true,
      hasAttempted,
      questionTitle: matchedQ.title || matchedQ.categoryLabel || problemIdentifier,
      questionId: matchedQ.id,
    };
  } catch (err) {
    console.warn('⚠️ [DSA Tutor] Error checking daily mandatory status:', err);
    return { isDailyMandatory: false, hasAttempted: false };
  }
}

/**
 * Determines the Socratic hint escalation tier based on conversation history and current prompt:
 * - Tier 1: Conceptual hint & pattern family (Strictly NO code)
 * - Tier 2: Step-by-step approach outline (Still NO full code)
 * - Tier 3: Actual code implementation (Only after Tier 2 was already given)
 */
export function determineDsaHintTier(
  history: { role: string; content: string }[] = [],
  currentPrompt: string
): 1 | 2 | 3 {
  const lowerPrompt = currentPrompt.toLowerCase();

  // Explicit user signals
  const isAskingForCode =
    lowerPrompt.includes('show me the code') ||
    lowerPrompt.includes('give me the code') ||
    lowerPrompt.includes('write the code') ||
    lowerPrompt.includes('actual code') ||
    lowerPrompt.includes('implementation') ||
    lowerPrompt.includes('show code');

  const isAskingForMore =
    lowerPrompt.includes('still stuck') ||
    lowerPrompt.includes('more detail') ||
    lowerPrompt.includes('step by step') ||
    lowerPrompt.includes('next step') ||
    lowerPrompt.includes('what are the steps') ||
    lowerPrompt.includes('approach outline') ||
    lowerPrompt.includes('give me more');

  // Check recent assistant responses in history to assess prior escalation
  const recentAssistantMessages = history
    .filter((m) => m.role === 'assistant')
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  const hasGivenTier2 = recentAssistantMessages.some(
    (m) =>
      m.includes('step-by-step') ||
      m.includes('step 1:') ||
      m.includes('step 1.') ||
      m.includes('approach outline')
  );

  const hasGivenTier1 = recentAssistantMessages.some(
    (m) =>
      m.includes('algorithmic pattern') ||
      m.includes('core invariant') ||
      m.includes('key intuition') ||
      m.includes('hint')
  );

  // If already gave Tier 2 and user is asking for code or still stuck -> Tier 3
  if (hasGivenTier2 && (isAskingForCode || isAskingForMore)) {
    return 3;
  }

  // If already gave Tier 1 and user asks for more or step-by-step -> Tier 2
  if ((hasGivenTier1 && isAskingForMore) || isAskingForMore) {
    return 2;
  }

  // If user immediately asks for code on first turn without prior hints,
  // hold the line as a good TA: give Tier 1 conceptual hint first!
  return 1;
}

/**
 * Builds deterministic DSA guidance for offline/fallback mode.
 */
export function generateDeterministicDsaGuidance(
  tier: 1 | 2 | 3,
  problemTitle: string,
  isDailyMandatoryUnattempted = false
): string {
  // 1. If this is today's Daily Mandatory question and student hasn't attempted it yet -> REFUSAL GUARD
  if (isDailyMandatoryUnattempted) {
    const key = Object.keys(COMMON_DSA_PATTERNS).find(
      (k) =>
        problemTitle.toLowerCase().includes(k.replace(/_/g, ' ')) ||
        k.includes(problemTitle.toLowerCase().replace(/\s+/g, '_'))
    );
    const pattern = key ? COMMON_DSA_PATTERNS[key] : null;
    const conceptualHint = pattern
      ? pattern.tier1Hint
      : `• **Pattern Family**: Focus on identifying the underlying state transitions and whether a hash map, two pointers, or greedy scan eliminates redundant iterations.\n• **Invariant**: Consider what property stays true as you process elements sequentially.`;

    return `🔒 **Daily Mandatory Challenge Integrity Guard**

Because **${problemTitle}** is part of today's **Daily Mandatory Practice Set**, I cannot reveal the direct solution or code until you have submitted an initial attempt in the editor. This protects the integrity of your daily challenge, score calibration, and streak!

Here is a **conceptual hint** to nudge your thought process without giving away the answer:

${conceptualHint}

⚡ *Write and submit your initial attempt in the code editor, and once submitted, ask me again—I will gladly review your solution and break down edge cases with you!*`;
  }

  // 2. Standard Progressive Socratic Tutoring
  const key = Object.keys(COMMON_DSA_PATTERNS).find(
    (k) =>
      problemTitle.toLowerCase().includes(k.replace(/_/g, ' ')) ||
      k.includes(problemTitle.toLowerCase().replace(/\s+/g, '_'))
  );

  const pattern = key ? COMMON_DSA_PATTERNS[key] : null;

  if (tier === 1) {
    if (pattern) {
      return `### 💡 Conceptual Hint: ${pattern.name}

**Algorithmic Pattern**: ${pattern.family}

${pattern.tier1Hint}

*Try implementing this intuition in the editor! If you're still stuck, ask me: **"I'm still stuck, show me the approach step by step"** and I will break down the exact logical steps.*`;
    }

    return `### 💡 Conceptual Guidance for ${problemTitle}

**Algorithmic Pattern**: Problem Decomposition & State Invariant

• **Core Invariant**: Before writing code, identify the monotonic property, recurrence relation, or lookup invariant that allows you to avoid an $O(N^2)$ brute-force traversal.
• **Key Intuition**: Consider whether sorting, hashing pre-computed values, or maintaining two pointers shrinks the search space efficiently.

*Think about what state needs to be carried forward as you iterate. If you're still stuck, ask me for a step-by-step approach outline!*`;
  }

  if (tier === 2) {
    if (pattern) {
      const steps = pattern.tier2Outline.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
      return `### 📋 Step-by-Step Approach Outline: ${pattern.name}

Here is the algorithmic blueprint to translate your intuition into code:

${steps}

*Take these steps and translate them into code in your editor. If you still run into compilation or runtime edge cases, let me know!*`;
    }

    return `### 📋 Step-by-Step Approach Outline: ${problemTitle}

1. **Initialize State**: Set up your data structures (pointers, hash map, or DP table) and handle initial boundary conditions.
2. **Main Traversal**: Loop through the input elements sequentially while updating your invariant.
3. **Condition Check**: Evaluate the decision branch (e.g. match found, invariant violated, or window contracted).
4. **Result Assembly**: Return the accumulated result or optimal value.
5. **Edge Cases**: Empty input, length 1, duplicate values, and negative numbers.

*Try coding this outline in the editor! If you still cannot get it to pass, ask me for the implementation walkthrough.*`;
  }

  // Tier 3: Actual Code Implementation
  if (pattern) {
    return `### 💻 Implementation Walkthrough: ${pattern.name}

Here is the complete, production-grade implementation:

\`\`\`${pattern.tier3Code.language}
${pattern.tier3Code.code}
\`\`\`

**Complexity & Trade-offs**:
${pattern.tier3Code.explanation}

*Make sure you test edge cases like empty inputs, boundary bounds, and single-element lists!*`;
  }

  return `### 💻 Implementation Guidance for ${problemTitle}

\`\`\`typescript
// General production template for ${problemTitle}
function solve(input: any): any {
  if (!input) return null;
  // Implement state transitions identified in Tier 2 steps
  return input;
}
\`\`\`

**Complexity**: Aim for optimal time and auxiliary space constraints.`;
}
