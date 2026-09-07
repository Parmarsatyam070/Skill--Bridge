import { prisma } from '../config/prisma.js';
import { isLlmConfigured, generateLlmText } from './llmService.js';

export interface MemoryItem {
  id?: string;
  category: 'goal' | 'struggle' | 'preference' | 'fact' | 'summary';
  key: string;
  value: string;
  sourceMessage?: string;
  updatedAt?: Date;
}

export interface BoundedMemoryContext {
  summary: string | null;
  facts: MemoryItem[];
  formattedText: string;
}

const MAX_NON_SUMMARY_MEMORIES = 25;
const CONSOLIDATION_THRESHOLD = 25;

/**
 * Normalizes a memory key into a stable identifier (e.g. "target_company", "struggles_with_dp")
 */
export function normalizeMemoryKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .slice(0, 50);
}

/**
 * Retrieves bounded memory for a student:
 * Running summary + up to maxFacts most recent non-summary facts.
 * Formatted cleanly for LLM system prompt context injection.
 */
export async function getStudentBoundedMemory(
  studentProfileId: string,
  maxFacts = 8
): Promise<BoundedMemoryContext> {
  // 1. Fetch running conversation summary
  const summaryRecord = await prisma.sashMemory.findFirst({
    where: {
      studentProfileId,
      category: 'summary',
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 2. Fetch up to maxFacts most recent non-summary memories
  const factRecords = await prisma.sashMemory.findMany({
    where: {
      studentProfileId,
      category: { in: ['goal', 'struggle', 'preference', 'fact'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: maxFacts,
  });

  const facts: MemoryItem[] = factRecords.map((r) => ({
    id: r.id,
    category: r.category as MemoryItem['category'],
    key: r.key,
    value: r.value,
    sourceMessage: r.sourceMessage || undefined,
    updatedAt: r.updatedAt,
  }));

  // 3. Format into a concise, token-efficient context block
  const lines: string[] = [];
  if (summaryRecord && summaryRecord.value.trim().length > 0) {
    lines.push(`- Prior Conversation Summary: ${summaryRecord.value.trim()}`);
  }

  if (facts.length > 0) {
    facts.forEach((f) => {
      const label = f.category.toUpperCase();
      lines.push(`- [${label}] ${f.value}`);
    });
  }

  const formattedText = lines.length > 0 ? lines.join('\n') : 'No prior conversation memories stored yet.';

  return {
    summary: summaryRecord ? summaryRecord.value : null,
    facts,
    formattedText,
  };
}

/**
 * Upserts a single student memory by (studentProfileId, category, key),
 * ensuring changed goals or preferences overwrite old values rather than accumulating duplicates.
 */
export async function upsertStudentMemory(
  studentProfileId: string,
  item: {
    category: 'goal' | 'struggle' | 'preference' | 'fact' | 'summary';
    key: string;
    value: string;
    sourceMessage?: string;
  }
) {
  const normKey = normalizeMemoryKey(item.key || item.category);

  return prisma.sashMemory.upsert({
    where: {
      studentProfileId_category_key: {
        studentProfileId,
        category: item.category,
        key: normKey,
      },
    },
    update: {
      value: item.value.trim(),
      sourceMessage: item.sourceMessage || null,
      updatedAt: new Date(),
    },
    create: {
      studentProfileId,
      category: item.category,
      key: normKey,
      value: item.value.trim(),
      sourceMessage: item.sourceMessage || null,
    },
  });
}

/**
 * Deterministic offline extractor for offline dev & unit testing
 */
function extractMemoriesOffline(userPrompt: string): Array<{ category: MemoryItem['category']; key: string; value: string }> {
  const extracted: Array<{ category: MemoryItem['category']; key: string; value: string }> = [];

  // Goal extraction
  const goalRegex = /(?:my goal is|i want to become|i want to work at|i aim to|hoping to become|dream company is|dream job is|targeting (?:a|an)?)\s+([^.,;!?\n]+)/i;
  const goalMatch = userPrompt.match(goalRegex);
  if (goalMatch && goalMatch[1]) {
    const rawVal = goalMatch[1].trim();
    extracted.push({
      category: 'goal',
      key: 'career_target',
      value: `Goal: ${rawVal}`,
    });
  }

  // Struggle extraction
  const struggleRegex = /(?:i struggle with|i find\s+([^.,;!?\n]+)\s+(?:difficult|hard|tough)|having trouble with|confused about|weak at)\s*([^.,;!?\n]*)/i;
  const struggleMatch = userPrompt.match(struggleRegex);
  if (struggleMatch) {
    const topic = (struggleMatch[1] || struggleMatch[2] || '').trim();
    if (topic.length > 2) {
      extracted.push({
        category: 'struggle',
        key: 'technical_struggle',
        value: `Struggles with: ${topic}`,
      });
    }
  }

  // Preference extraction
  const prefRegex = /(?:i prefer|i like to work with|i enjoy|interested in|code mainly in)\s+([^.,;!?\n]+)/i;
  const prefMatch = userPrompt.match(prefRegex);
  if (prefMatch && prefMatch[1]) {
    extracted.push({
      category: 'preference',
      key: 'work_preference',
      value: `Preference: ${prefMatch[1].trim()}`,
    });
  }

  return extracted;
}

/**
 * Periodically consolidates older memories into the running summary when exceeding threshold.
 */
export async function consolidateStudentMemoriesIfNeeded(studentProfileId: string) {
  const count = await prisma.sashMemory.count({
    where: {
      studentProfileId,
      category: { in: ['goal', 'struggle', 'preference', 'fact'] },
    },
  });

  if (count <= CONSOLIDATION_THRESHOLD) return;

  // Retrieve memories beyond top 20
  const allFacts = await prisma.sashMemory.findMany({
    where: {
      studentProfileId,
      category: { in: ['goal', 'struggle', 'preference', 'fact'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const keepList = allFacts.slice(0, 20);
  const consolidateList = allFacts.slice(20);

  if (consolidateList.length === 0) return;

  // Append consolidated text to summary record
  const existingSummary = await prisma.sashMemory.findFirst({
    where: { studentProfileId, category: 'summary' },
  });

  const newSummaryEntries = consolidateList.map((c) => `[Archived ${c.category}] ${c.value}`).join('; ');
  const combinedSummary = existingSummary
    ? `${existingSummary.value} | ${newSummaryEntries}`.slice(0, 1200)
    : newSummaryEntries.slice(0, 1200);

  await upsertStudentMemory(studentProfileId, {
    category: 'summary',
    key: 'running_summary',
    value: combinedSummary,
  });

  // Delete consolidated individual facts
  await prisma.sashMemory.deleteMany({
    where: {
      id: { in: consolidateList.map((c) => c.id) },
    },
  });
}

/**
 * Runs structured LLM extraction after each exchange to identify newly declared
 * personal goals, struggles, or preferences, then upserts them into SashMemory.
 */
export async function extractAndSaveMemoriesWithLlm(
  studentProfileId: string,
  userPrompt: string,
  assistantResponse: string
) {
  if (!studentProfileId) return;

  try {
    let memoriesToSave: Array<{ category: MemoryItem['category']; key: string; value: string }> = [];

    // 1. If LLM is configured, ask for structured JSON extraction
    if (isLlmConfigured()) {
      try {
        const systemPrompt = `You are a memory extraction component for Sash, an AI career assistant.
Analyze the student's message and extract any NEW personal goals, technical struggles, learning preferences, or background facts they explicitly stated about themselves.
RULES:
1. ONLY extract information the student explicitly declared about their own desires, struggles, preferences, or background.
2. If the student asked a general conceptual question or did not state any personal facts, output {"memories": []}.
3. Format as a strict JSON object:
{
  "memories": [
    {
      "category": "goal" | "struggle" | "preference" | "fact",
      "key": "short_unique_key_e.g_target_role_or_struggle_topic",
      "value": "clear_narrative_statement_of_the_fact"
    }
  ]
}`;

        const prompt = `Student Message: "${userPrompt}"\nSash Response: "${assistantResponse.slice(0, 300)}"\n\nOutput JSON:`;
        const llmJson = await generateLlmText({ systemPrompt, prompt, temperature: 0.1 });

        if (llmJson) {
          const cleaned = llmJson.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed.memories)) {
            memoriesToSave = parsed.memories.filter(
              (m: any) => m && m.category && m.key && m.value && typeof m.value === 'string' && m.value.trim().length > 0
            );
          }
        }
      } catch (err) {
        console.warn('⚠️ [Sash Memory] Structured LLM extraction fell back to deterministic extractor:', err);
      }
    }

    // 2. Fallback to deterministic offline extraction if LLM didn't extract or is offline
    if (memoriesToSave.length === 0) {
      memoriesToSave = extractMemoriesOffline(userPrompt);
    }

    // 3. Upsert extracted memories
    for (const mem of memoriesToSave) {
      await upsertStudentMemory(studentProfileId, {
        category: mem.category,
        key: mem.key,
        value: mem.value,
        sourceMessage: userPrompt.slice(0, 300),
      });
    }

    // 4. Enforce memory retention cap and consolidation
    await consolidateStudentMemoriesIfNeeded(studentProfileId);
  } catch (err: any) {
    console.warn('⚠️ [Sash Memory] Uncaught error in background extraction/saving:', err.message);
  }
}

/**
 * Retrieves all stored memories for a student profile
 */
export async function getStudentMemories(studentProfileId: string) {
  return prisma.sashMemory.findMany({
    where: { studentProfileId },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Deletes a specific memory item or clears all memories for a student
 */
export async function deleteStudentMemory(studentProfileId: string, memoryId?: string) {
  if (memoryId) {
    return prisma.sashMemory.deleteMany({
      where: { id: memoryId, studentProfileId },
    });
  }
  return prisma.sashMemory.deleteMany({
    where: { studentProfileId },
  });
}
