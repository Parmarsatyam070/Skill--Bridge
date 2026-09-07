import { prisma } from '../config/prisma.js';
import { DailyTargetData } from '../../../shared/types.js';
import { generateLlmText } from './llmService.js';
import { getReportCardSummary } from './assessmentService.js';
import { generateFocusAreas } from './focusAreasService.js';

let isTableInitialized = false;

/**
 * Ensures the PostgreSQL DailyTarget table exists
 */
export async function ensureDailyTargetTable(): Promise<void> {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyTarget" (
        "id" TEXT PRIMARY KEY,
        "studentId" TEXT NOT NULL REFERENCES "StudentProfile"("id") ON DELETE CASCADE,
        "date" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "targetGoal" TEXT NOT NULL,
        "actionLabel" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetUrl" TEXT NOT NULL,
        "targetRefId" TEXT,
        "roadmapPhase" TEXT NOT NULL,
        "focusTopic" TEXT NOT NULL,
        "rationale" TEXT NOT NULL,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP(3),
        "metadataJson" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "DailyTarget_studentId_date_key" ON "DailyTarget"("studentId", "date");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DailyTarget_studentId_date_idx" ON "DailyTarget"("studentId", "date");
    `);
    isTableInitialized = true;
  } catch (err: any) {
    console.warn('⚠️ [DAILY_TARGET] Error ensuring table:', err.message);
  }
}

/**
 * Retrieves or generates the daily target for a student on a specific calendar date.
 * Once-per-calendar-day regeneration guarantee.
 */
export async function getOrCreateDailyTarget(
  studentProfileId: string,
  dateQuery?: string
): Promise<DailyTargetData> {
  await ensureDailyTargetTable();

  const targetDate = dateQuery || new Date().toISOString().split('T')[0];

  // 1. Check if DailyTarget already exists for this calendar date
  const existingRows: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "DailyTarget" WHERE "studentId" = $1 AND "date" = $2 LIMIT 1`,
    studentProfileId,
    targetDate
  );

  if (existingRows && existingRows.length > 0) {
    const row = existingRows[0];
    let isCompleted = row.completed;
    let completedAt = row.completedAt ? new Date(row.completedAt).toISOString() : undefined;

    // If not completed yet, reconcile dynamically against today's actual attempts
    if (!isCompleted) {
      const reconciled = await checkTargetActivityCompletion(studentProfileId, row, targetDate);
      if (reconciled) {
        isCompleted = true;
        completedAt = new Date().toISOString();
        await prisma.$executeRawUnsafe(
          `UPDATE "DailyTarget" SET "completed" = true, "completedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
          row.id
        );
      }
    }

    return {
      id: row.id,
      studentId: row.studentId,
      date: row.date,
      title: row.title,
      targetGoal: row.targetGoal,
      actionLabel: row.actionLabel,
      targetType: row.targetType as any,
      targetUrl: row.targetUrl,
      targetRefId: row.targetRefId || undefined,
      roadmapPhase: row.roadmapPhase,
      focusTopic: row.focusTopic,
      rationale: row.rationale,
      completed: Boolean(isCompleted),
      completedAt,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  // 2. Collect rich student context for generation
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      skillScores: { include: { skill: true } },
    },
  });

  const targetDomain = student?.targetDomain || 'Full-Stack Web';

  // Fetch report card history for covered topics
  let coveredTopics: string[] = [];
  try {
    const report = await getReportCardSummary(studentProfileId);
    const passedSets = report.attempts.filter(a => a.passed).map(a => a.practiceSetTitle);
    coveredTopics = Array.from(new Set(passedSets)).slice(0, 5);
  } catch {}

  // Fetch weak topics from Focus Areas triage
  let weakTopics: string[] = [];
  try {
    const focusAreas = await generateFocusAreas(studentProfileId);
    weakTopics = focusAreas.map(f => f.topic);
  } catch {}

  // Fetch skill gaps
  const skillGaps = (student?.skillScores || [])
    .filter(s => s.score < 70)
    .sort((a, b) => a.score - b.score)
    .map(s => s.skill.name);

  // Active roadmap phase
  const currentPhase = skillGaps.length > 0 || weakTopics.length > 0
    ? 'Phase 02: Targeted Remediation (Month 3–6)'
    : 'Phase 03: Capstone & Verified Artifacts (Month 7–12)';

  // Primary topic to address
  const primaryTopic = weakTopics[0] || skillGaps[0] || (targetDomain === 'Full-Stack Web' ? 'Dynamic Programming' : targetDomain);

  // 3. Generate Daily Target via LLM with rich student context
  const systemPrompt = `You are Sash, the AI mentor at SkillBridge. Generate a specific, concrete daily goal for a student targeting ${targetDomain}.
The target must be clear, actionable, and reference real topics from the student's actual current roadmap phase and remaining gaps. Never use vague or generic placeholder text.`;

  const userPrompt = `Student Context:
- Target Domain: ${targetDomain}
- Current Roadmap Phase: ${currentPhase}
- Topics Already Covered: ${coveredTopics.length > 0 ? coveredTopics.join(', ') : 'Prerequisite assessments'}
- Remaining Gaps: ${skillGaps.length > 0 ? skillGaps.join(', ') : 'None'}
- Recent Weak Areas: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified'}
- Focus Topic for Today: ${primaryTopic}

Generate a concrete daily target in valid JSON format:
{
  "title": "A short, motivating target title (e.g. Master Dynamic Programming Subproblems)",
  "targetGoal": "Today: Complete 2 ${primaryTopic} questions + review the ${primaryTopic} section of your roadmap.",
  "actionLabel": "Clear button label (e.g. Practice ${primaryTopic} Challenge)",
  "focusTopic": "${primaryTopic}",
  "targetType": "dsa" | "practice_set" | "resource",
  "estimatedMinutes": 25,
  "rationale": "1 concise sentence connecting this target to their current roadmap phase and identified gap."
}`;

  let parsedLlm: any = null;
  try {
    const llmResponse = await generateLlmText({
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    if (llmResponse) {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedLlm = JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [DAILY_TARGET] LLM generation error, using deterministic engine:', err.message);
  }

  // 4. Fallback / normalization with deterministic guarantee
  const isDsaTopic = ['dynamic programming', 'dp', 'graph', 'graphs', 'array', 'arrays', 'tree', 'trees', 'dsa', 'recursion', 'binary search'].some(
    k => primaryTopic.toLowerCase().includes(k)
  );

  const defaultTargetType: 'dsa' | 'practice_set' | 'resource' = isDsaTopic ? 'dsa' : 'practice_set';

  const title = parsedLlm?.title || `Master ${primaryTopic} Foundations & Practice`;
  const targetGoal = parsedLlm?.targetGoal || `Today: Complete 2 ${primaryTopic} questions + review the ${primaryTopic} section of your roadmap.`;
  const actionLabel = parsedLlm?.actionLabel || (isDsaTopic ? `Practice ${primaryTopic} Challenge` : `Take ${primaryTopic} Assessment`);
  const focusTopic = parsedLlm?.focusTopic || primaryTopic;
  const targetType: 'dsa' | 'practice_set' | 'resource' = parsedLlm?.targetType || defaultTargetType;
  const rationale = parsedLlm?.rationale || `Prioritized to eliminate your verified gap in ${focusTopic} during ${currentPhase}.`;

  // 5. Resolve authentic URL & reference ID
  let targetUrl = `/assessment?domain=${encodeURIComponent(targetDomain)}`;
  let targetRefId: string | undefined = undefined;

  if (targetType === 'dsa') {
    const q = await prisma.dSAQuestion.findFirst({
      where: {
        OR: [
          { topic: { contains: focusTopic, mode: 'insensitive' } },
          { title: { contains: focusTopic, mode: 'insensitive' } },
        ],
      },
    });

    if (q) {
      targetUrl = `/dsa/practice?q=${q.slug}`;
      targetRefId = q.id;
    } else {
      targetUrl = `/dsa/practice?topic=${encodeURIComponent(focusTopic)}`;
    }
  } else if (targetType === 'practice_set') {
    const pSet = await prisma.practiceSet.findFirst({
      where: {
        OR: [
          { title: { contains: focusTopic, mode: 'insensitive' } },
          { domainName: { contains: focusTopic, mode: 'insensitive' } },
          { domainName: { contains: targetDomain, mode: 'insensitive' } },
        ],
      },
    });

    if (pSet) {
      targetUrl = `/assessment?setId=${pSet.id}`;
      targetRefId = pSet.id;
    } else {
      targetUrl = `/assessment?domain=${encodeURIComponent(targetDomain)}`;
    }
  } else {
    targetUrl = `/learning-resources?q=${encodeURIComponent(focusTopic)}`;
  }

  const newId = `target-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  // 6. Persist in database
  await prisma.$executeRawUnsafe(
    `INSERT INTO "DailyTarget" (
      "id", "studentId", "date", "title", "targetGoal", "actionLabel",
      "targetType", "targetUrl", "targetRefId", "roadmapPhase", "focusTopic",
      "rationale", "completed", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    newId,
    studentProfileId,
    targetDate,
    title,
    targetGoal,
    actionLabel,
    targetType,
    targetUrl,
    targetRefId || null,
    currentPhase,
    focusTopic,
    rationale,
    false,
    now,
    now
  );

  return {
    id: newId,
    studentId: studentProfileId,
    date: targetDate,
    title,
    targetGoal,
    actionLabel,
    targetType,
    targetUrl,
    targetRefId,
    roadmapPhase: currentPhase,
    focusTopic,
    rationale,
    completed: false,
    createdAt: now.toISOString(),
  };
}

/**
 * Manually marks a student's daily target as completed
 */
export async function markDailyTargetComplete(
  studentProfileId: string,
  dateQuery?: string
): Promise<DailyTargetData | null> {
  await ensureDailyTargetTable();
  const targetDate = dateQuery || new Date().toISOString().split('T')[0];

  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE "DailyTarget" SET "completed" = true, "completedAt" = $1 WHERE "studentId" = $2 AND "date" = $3`,
    now,
    studentProfileId,
    targetDate
  );

  return await getOrCreateDailyTarget(studentProfileId, targetDate);
}

/**
 * Automatically reconciles and marks target complete when qualifying activity occurs
 */
export async function syncTargetCompletionFromActivity(
  studentProfileId: string,
  activity: {
    type: 'dsa' | 'practice_set' | 'resource';
    refId?: string;
    topic?: string;
  }
): Promise<boolean> {
  try {
    await ensureDailyTargetTable();
    const today = new Date().toISOString().split('T')[0];

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "DailyTarget" WHERE "studentId" = $1 AND "date" = $2 LIMIT 1`,
      studentProfileId,
      today
    );

    if (!rows || rows.length === 0) return false;
    const target = rows[0];
    if (target.completed) return true;

    const matchesRef = activity.refId && target.targetRefId && activity.refId === target.targetRefId;
    const matchesType = activity.type === target.targetType;
    const matchesTopic = activity.topic && target.focusTopic && (
      activity.topic.toLowerCase().includes(target.focusTopic.toLowerCase()) ||
      target.focusTopic.toLowerCase().includes(activity.topic.toLowerCase())
    );

    if (matchesRef || (matchesType && matchesTopic)) {
      await prisma.$executeRawUnsafe(
        `UPDATE "DailyTarget" SET "completed" = true, "completedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
        target.id
      );
      return true;
    }
  } catch (err: any) {
    console.warn('⚠️ [DAILY_TARGET] Error syncing activity completion:', err.message);
  }

  return false;
}

/**
 * Helper to check whether qualifying activity was completed today for this target
 */
async function checkTargetActivityCompletion(
  studentProfileId: string,
  target: any,
  targetDate: string
): Promise<boolean> {
  const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

  if (target.targetType === 'dsa') {
    // Check if student solved the referenced question or a question in the focusTopic today
    if (target.targetRefId) {
      const attempt = await prisma.dSAAttempt.findFirst({
        where: {
          studentId: studentProfileId,
          questionId: target.targetRefId,
          status: 'SOLVED',
          updatedAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (attempt) return true;
    }

    if (target.focusTopic) {
      const attemptInTopic = await prisma.dSAAttempt.findFirst({
        where: {
          studentId: studentProfileId,
          status: 'SOLVED',
          question: {
            topic: { contains: target.focusTopic, mode: 'insensitive' },
          },
          updatedAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (attemptInTopic) return true;
    }
  } else if (target.targetType === 'practice_set') {
    if (target.targetRefId) {
      const attempt = await prisma.assessmentAttempt.findFirst({
        where: {
          studentId: studentProfileId,
          practiceSetId: target.targetRefId,
          submittedAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (attempt) return true;
    }
  }

  return false;
}
