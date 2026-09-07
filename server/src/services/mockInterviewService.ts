import { prisma } from '../config/prisma.js';
import {
  MockInterviewQuestionItem,
  MockInterviewAnswerItem,
  MockInterviewEvaluation,
  QuestionFeedbackItem,
} from '../../../shared/types.js';
import { isLlmConfigured, generateLlmText } from './llmService.js';
import { RequiredSkill } from '../../../shared/types.js';

interface RoleContext {
  internshipId?: string;
  roleTitle: string;
  companyName: string;
  requiredSkills: { skillId: string; skillName: string; minScore: number; weight: number }[];
  studentSkills: Map<string, number>;
  topGaps: { skillId: string; skillName: string; gap: number }[];
}

/**
 * Question templates for offline deterministic fallback,
 * organized by skill category and behavioral competencies.
 */
const TECHNICAL_QUESTION_LIBRARY: Record<string, string[]> = {
  react: [
    'How does React’s reconciliation algorithm work with the virtual DOM, and when would you use useMemo versus useCallback to prevent unnecessary re-renders?',
    'Can you explain the difference between controlled and uncontrolled components in React, and how you manage complex form state in production?',
    'Walk me through how you architect error boundaries and asynchronous data fetching using hooks or React Query.',
  ],
  typescript: [
    'How do TypeScript conditional types and template literal types help build type-safe API boundaries and design systems?',
    'Explain the difference between type aliases and interfaces in TypeScript, and how declaration merging works.',
    'How would you enforce strict runtime input validation in TypeScript using libraries like Zod or custom type guards?',
  ],
  nodejs: [
    'Explain the Node.js event loop phases (timers, I/O callbacks, poll, check, close) and how process.nextTick differs from setImmediate.',
    'How do you handle memory leaks and unhandled promise rejections in a high-concurrency Node.js microservice?',
    'How do you design RESTful middleware chains in Express for authentication, input sanitization, and rate-limiting?',
  ],
  python: [
    'Explain Python generators and the yield keyword, and how they optimize memory usage when processing large telemetry datasets.',
    'How does Python’s Global Interpreter Lock (GIL) impact multithreading, and when should you use multiprocessing or asyncio instead?',
    'Describe how you structure clean dependency injection and database session lifecycle in a FastAPI or Flask service.',
  ],
  sql: [
    'Explain the difference between clustered and non-clustered indexes in SQL, and how you analyze a query execution plan for bottlenecked table scans.',
    'What are ACID transaction isolation levels (Read Committed, Repeatable Read, Serializable), and how do you prevent phantom reads?',
    'Write or describe a SQL query using window functions (e.g. ROW_NUMBER(), RANK()) to retrieve the top 3 transactions per customer category.',
  ],
  system_design: [
    'How would you design a distributed URL shortening service with 10,000 writes/sec and 100,000 reads/sec, addressing caching, partitioning, and collision avoidance?',
    'Walk me through how you would architect a resilient background job queue with retry mechanisms and dead-letter queues.',
  ],
  cloud: [
    'How do container orchestration engines like Kubernetes handle horizontal pod autoscaling and rolling deployments with zero downtime?',
    'Explain the shared responsibility model in cloud computing, and how you manage secret rotation securely in CI/CD.',
  ],
  default: [
    'What is your architectural approach to modularity, code reusability, and automated testing in a production codebase?',
    'How do you monitor and debug latency bottlenecks across front-end rendering and back-end API responses?',
    'Explain how you ensure data consistency and clean error handling across asynchronous services.',
  ],
};

const BEHAVIORAL_QUESTION_LIBRARY: string[] = [
  'Tell me about a time when you encountered a severe production bug or technical roadblock with an approaching deadline. How did you diagnose and resolve it? (Please structure your answer using Situation, Task, Action, and Result).',
  'Describe a situation where you had a fundamental technical disagreement with a teammate or lead regarding architecture or code quality. How did you navigate the conversation and what was the outcome?',
  'Give me an example of a project where you had to quickly learn an unfamiliar technology or framework. What strategy did you take to deliver on time, and what measurable impact did it have?',
  'Walk me through a time when a project requirement changed unexpectedly mid-sprint. How did you adapt your priorities and communicate with stakeholders?',
];

/**
 * Normalizes skill names for template lookup.
 */
function normalizeSkillKey(skillName: string): string {
  const s = skillName.toLowerCase();
  if (s.includes('react')) return 'react';
  if (s.includes('typescript') || s.includes('type script')) return 'typescript';
  if (s.includes('node') || s.includes('express')) return 'nodejs';
  if (s.includes('python') || s.includes('django') || s.includes('flask')) return 'python';
  if (s.includes('sql') || s.includes('postgres') || s.includes('database')) return 'sql';
  if (s.includes('cloud') || s.includes('aws') || s.includes('docker') || s.includes('devops')) return 'cloud';
  if (s.includes('system') || s.includes('architecture') || s.includes('dsa')) return 'system_design';
  return 'default';
}

/**
 * Builds role context by inspecting target internship requirements and student skill profile.
 */
export async function getRoleContext(internshipId: string, studentProfileId: string): Promise<RoleContext> {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { industry: true },
  });

  if (!internship) {
    throw new Error(`Internship not found: ${internshipId}`);
  }

  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map(allSkills.map(s => [s.id, s.name]));

  let requiredSkills: RequiredSkill[] = [];
  try {
    requiredSkills = JSON.parse(internship.requiredSkillsJson || '[]');
  } catch {}

  const enrichedReqs = requiredSkills.map(rs => ({
    skillId: rs.skillId,
    skillName: skillMap.get(rs.skillId) || 'Technical Skill',
    minScore: rs.minScore || 70,
    weight: rs.weight || 1,
  }));

  const studentScores = await prisma.studentSkillScore.findMany({
    where: { studentId: studentProfileId },
  });
  const studentScoreMap = new Map(studentScores.map(ss => [ss.skillId, ss.score]));

  const topGaps = enrichedReqs
    .map(r => {
      const current = studentScoreMap.get(r.skillId) || 0;
      const gap = Math.max(0, r.minScore - current);
      return { skillId: r.skillId, skillName: r.skillName, gap };
    })
    .sort((a, b) => b.gap - a.gap);

  return {
    internshipId: internship.id,
    roleTitle: internship.title,
    companyName: internship.industry.companyName,
    requiredSkills: enrichedReqs,
    studentSkills: studentScoreMap,
    topGaps,
  };
}

/**
 * Generates 5 role-relevant interview questions (3 Technical + 2 Behavioral),
 * applying anti-duplicate rotation from recent 1-2 sessions.
 */
export async function generateMockInterviewQuestions(
  internshipId: string,
  studentProfileId: string
): Promise<MockInterviewQuestionItem[]> {
  const ctx = await getRoleContext(internshipId, studentProfileId);

  // 1. Anti-duplicate rotation: gather recently asked questions from last 2 sessions
  const recentSessions = await prisma.mockInterviewSession.findMany({
    where: {
      studentId: studentProfileId,
      internshipId,
    },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: { questionsJson: true },
  });

  const excludedPrompts = new Set<string>();
  for (const s of recentSessions) {
    try {
      const qList: MockInterviewQuestionItem[] = JSON.parse(s.questionsJson || '[]');
      qList.forEach(q => excludedPrompts.add(q.questionText.trim().toLowerCase()));
    } catch {}
  }

  // 2. Try LLM Generation if configured
  if (isLlmConfigured()) {
    try {
      const targetSkillNames = ctx.topGaps.slice(0, 3).map(g => g.skillName).join(', ') ||
        ctx.requiredSkills.slice(0, 3).map(r => r.skillName).join(', ');

      const systemPrompt = `You are Sash, an elite technical recruiter and AI interviewer at SkillBridge conducting a 30-minute structured job interview for the position of "${ctx.roleTitle}" at "${ctx.companyName}".
Generate exactly 5 interview questions:
- Questions 1, 2, 3: Core TECHNICAL questions targeting: ${targetSkillNames}. They must test real-world architectural thinking and trade-offs.
- Questions 4, 5: BEHAVIORAL questions evaluated on the STAR method (Situation, Task, Action, Result), emphasizing engineering ownership, conflict resolution, or rapid learning.

Exclude these recently asked questions:
${Array.from(excludedPrompts).slice(0, 5).map(p => `- ${p}`).join('\n')}

Output MUST be a valid JSON array of objects with keys:
"category" ("technical" | "behavioral"), "skillTag" (string), "questionText" (string), "tips" (string).`;

      const prompt = `Generate the 5 role-specific questions for ${ctx.roleTitle} at ${ctx.companyName}. Output JSON only.`;

      const responseText = await generateLlmText({ systemPrompt, prompt, temperature: 0.6 });
      if (responseText) {
        // Strip markdown fences if present
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed.slice(0, 5).map((q, idx) => ({
            id: `q_${idx + 1}`,
            questionIndex: idx + 1,
            category: q.category === 'behavioral' ? 'behavioral' : 'technical',
            skillTag: q.skillTag || (idx < 3 ? 'Technical Competency' : 'Behavioral & STAR'),
            questionText: q.questionText,
            tips: q.tips || (q.category === 'behavioral' ? 'Use the STAR method: Situation, Task, Action, Result with measurable impact.' : 'Lead with your conclusion, then explain architectural trade-offs.'),
          }));
        }
      }
    } catch (llmErr) {
      console.warn('⚠️ [Sash Mock Interview] LLM generation fell back to library generator:', llmErr);
    }
  }

  // 3. High-Quality Deterministic Library Generator with Anti-Duplicate Rotation
  const questions: MockInterviewQuestionItem[] = [];

  // Pick 3 technical questions based on top gap skills
  const skillsToAsk = ctx.topGaps.length >= 3
    ? ctx.topGaps.slice(0, 3)
    : [...ctx.topGaps, ...ctx.requiredSkills].slice(0, 3);

  skillsToAsk.forEach((sk, idx) => {
    const key = normalizeSkillKey(sk.skillName);
    const pool = TECHNICAL_QUESTION_LIBRARY[key] || TECHNICAL_QUESTION_LIBRARY.default;

    // Filter out recently asked questions if possible
    let candidate = pool.find(p => !excludedPrompts.has(p.trim().toLowerCase()));
    if (!candidate) {
      candidate = pool[idx % pool.length];
    }

    questions.push({
      id: `q_${idx + 1}`,
      questionIndex: idx + 1,
      category: 'technical',
      skillTag: sk.skillName,
      questionText: candidate,
      tips: `Be specific about ${sk.skillName} trade-offs and edge cases. Mention how you handle testing or performance.`,
    });
  });

  // Pick 2 behavioral questions with rotation
  const behavioralCandidates = BEHAVIORAL_QUESTION_LIBRARY.filter(
    b => !excludedPrompts.has(b.trim().toLowerCase())
  );
  const behavioralSelected = behavioralCandidates.length >= 2
    ? behavioralCandidates.slice(0, 2)
    : BEHAVIORAL_QUESTION_LIBRARY.slice(0, 2);

  behavioralSelected.forEach((bText, bIdx) => {
    const qNum = questions.length + 1;
    questions.push({
      id: `q_${qNum}`,
      questionIndex: qNum,
      category: 'behavioral',
      skillTag: bIdx === 0 ? 'Engineering Ownership & Debugging' : 'Team Collaboration & Agility',
      questionText: bText,
      tips: 'Structure your response clearly with STAR: Situation, Task, Action, and quantifiable Result.',
    });
  });

  return questions;
}

/**
 * Intelligent Rubric-Based Offline Evaluator for Transcripts.
 * Produces realistic numeric scores and specific quoted snippets.
 */
function evaluateTranscriptOffline(
  answers: MockInterviewAnswerItem[],
  roleTitle: string,
  companyName: string
): MockInterviewEvaluation {
  const questionFeedback: QuestionFeedbackItem[] = [];
  const identifiedWeakAreas: string[] = [];
  const strengths: string[] = [];

  let totalScore = 0;
  let technicalScoreSum = 0;
  let technicalCount = 0;
  let communicationScoreSum = 0;
  let structureScoreSum = 0;

  answers.forEach(a => {
    const text = (a.studentAnswer || '').trim();
    const isSkipped = a.isSkipped || text.length === 0 || text.includes('[Time Expired - Unanswered]');

    if (isSkipped) {
      questionFeedback.push({
        questionIndex: a.questionIndex,
        score: 0,
        maxScore: 20,
        relevanceScore: 0,
        clarityScore: 0,
        grammarScore: 0,
        structureScore: 0,
        feedback: `Question was skipped or timed out before completion. In the live interview for ${roleTitle}, always attempt to state your high-level thought process even if time is constrained.`,
        quotedSnippet: '[Unanswered]',
        improvements: 'Practice pacing your responses so you leave at least 3 minutes per question.',
      });
      identifiedWeakAreas.push(`${a.skillTag} (Pacing & Completion)`);
      return;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let relevance = 14;
    let clarity = 14;
    let grammar = 16;
    let structure = 14;

    // Word count / length check
    if (wordCount < 25) {
      relevance -= 5;
      clarity -= 4;
      structure -= 4;
    } else if (wordCount > 60) {
      relevance = Math.min(20, relevance + 3);
      clarity = Math.min(20, clarity + 2);
    }

    // Behavioral STAR evaluation
    if (a.category === 'behavioral') {
      const lower = text.toLowerCase();
      const hasSituation = lower.includes('situation') || lower.includes('when i') || lower.includes('at my') || lower.includes('in our project');
      const hasAction = lower.includes('action') || lower.includes('i decided') || lower.includes('i implemented') || lower.includes('i led') || lower.includes('we resolved');
      const hasResult = lower.includes('result') || lower.includes('outcome') || lower.includes('improved') || lower.includes('reduced') || lower.includes('%') || lower.includes('metric');

      if (hasSituation && hasAction && hasResult) {
        structure = 18;
        strengths.push(`Effective STAR storytelling on Q${a.questionIndex}`);
      } else if (!hasResult) {
        structure = 11;
        identifiedWeakAreas.push('Quantifying Results in Behavioral Scenarios');
      }
    } else {
      technicalCount++;
      technicalScoreSum += (relevance * 5); // 0-100 scale for technical
    }

    // Grammar & tone heuristic
    if (text.length > 0 && text[0] === text[0].toUpperCase() && (text.endsWith('.') || text.endsWith('!'))) {
      grammar = 18;
    }

    const qScore = Math.round((relevance * 0.4) + (clarity * 0.25) + (grammar * 0.15) + (structure * 0.2));
    const normalizedScore = Math.max(2, Math.min(20, qScore));
    totalScore += normalizedScore;

    communicationScoreSum += (clarity * 2.5 + grammar * 2.5);
    structureScoreSum += (structure * 5);

    // Extract genuine quoted snippet from student's answer
    const words = text.split(/\s+/);
    const snippetWords = words.slice(0, Math.min(words.length, 12)).join(' ');
    const quotedSnippet = `"${snippetWords}${words.length > 12 ? '...' : ''}"`;

    let feedbackText = '';
    let improvementTip = '';

    if (a.category === 'behavioral') {
      feedbackText = `Your answer provided good context (${quotedSnippet}), but could be elevated by leading with the measurable outcome first before detailing the technical roadblocks.`;
      improvementTip = 'Apply the "Executive Summary" approach: state the final impact (e.g. 30% latency reduction) in your opening sentence.';
    } else {
      feedbackText = `Strong articulation on ${a.skillTag}. You noted ${quotedSnippet}, which shows sound engineering intuition. Deepen your explanation by discussing memory vs CPU trade-offs under heavy traffic.`;
      improvementTip = 'Mention production edge-cases like connection timeouts or thread contention.';
    }

    if (normalizedScore >= 16) {
      strengths.push(`Clear domain grounding on ${a.skillTag}`);
    } else {
      identifiedWeakAreas.push(`Depth of technical explanation in ${a.skillTag}`);
    }

    questionFeedback.push({
      questionIndex: a.questionIndex,
      score: normalizedScore,
      maxScore: 20,
      relevanceScore: Math.round(relevance),
      clarityScore: Math.round(clarity),
      grammarScore: Math.round(grammar),
      structureScore: Math.round(structure),
      feedback: feedbackText,
      quotedSnippet,
      improvements: improvementTip,
    });
  });

  const overallScore = Math.max(0, Math.min(100, totalScore));
  const technicalScore = technicalCount > 0
    ? Math.round(technicalScoreSum / technicalCount)
    : overallScore;
  const communicationScore = answers.length > 0
    ? Math.round(communicationScoreSum / answers.length)
    : 0;
  const structureScore = answers.length > 0
    ? Math.round(structureScoreSum / answers.length)
    : 0;

  let readinessTier: MockInterviewEvaluation['readinessTier'] = 'Needs Work';
  if (overallScore >= 80) readinessTier = 'High Readiness';
  else if (overallScore >= 65) readinessTier = 'Interview Ready';
  else if (overallScore >= 50) readinessTier = 'Developing';

  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 3);
  const uniqueWeakAreas = Array.from(new Set(identifiedWeakAreas)).slice(0, 3);

  const overallSummary = `Completed structured mock interview for ${roleTitle} at ${companyName}. Overall interview readiness is rated as ${readinessTier} (${overallScore}%). Communication was rated at ${communicationScore}%, with technical depth scoring ${technicalScore}%. Key areas for targeted practice include ${uniqueWeakAreas.join(', ') || 'further technical precision'}.`;

  return {
    overallScore,
    communicationScore,
    technicalScore,
    structureScore,
    readinessTier,
    overallSummary,
    strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ['Structured communication under time pressure', 'Constructive problem solving mindset'],
    weakAreas: uniqueWeakAreas.length > 0 ? uniqueWeakAreas : ['Quantifying results with metrics', 'Deeper discussion of system trade-offs'],
    questionFeedback,
  };
}

/**
 * Runs full transcript evaluation pass with LLM or fallback,
 * persisting scored results in MockInterviewSession and feeding gaps into student profile.
 */
export async function evaluateMockInterviewTranscript(
  sessionId: string,
  studentAnswers: MockInterviewAnswerItem[],
  durationSeconds: number,
  isTimedOut = false
): Promise<MockInterviewEvaluation> {
  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  let questions: MockInterviewQuestionItem[] = [];
  try {
    questions = JSON.parse(session.questionsJson || '[]');
  } catch {}

  // 1. Merge student answers with full question set to handle timeout/skipped answers
  const completeTranscript: MockInterviewAnswerItem[] = questions.map(q => {
    const existing = studentAnswers.find(a => a.questionIndex === q.questionIndex);
    if (existing && existing.studentAnswer.trim().length > 0) {
      return existing;
    }
    return {
      questionIndex: q.questionIndex,
      questionText: q.questionText,
      category: q.category,
      skillTag: q.skillTag,
      studentAnswer: isTimedOut ? '[Time Expired - Unanswered]' : '[Skipped by Candidate]',
      timeTakenSeconds: 0,
      isSkipped: true,
    };
  });

  let evaluation: MockInterviewEvaluation | null = null;

  // 2. Try LLM Evaluation Pass if configured
  if (isLlmConfigured()) {
    try {
      const transcriptForPrompt = completeTranscript.map(a => `
Q${a.questionIndex} [${a.category.toUpperCase()} - ${a.skillTag}]: ${a.questionText}
Candidate Answer: ${a.studentAnswer}
Time Taken: ${a.timeTakenSeconds}s | Skipped: ${a.isSkipped ? 'Yes' : 'No'}
`).join('\n---\n');

      const systemPrompt = `You are Sash, an elite technical interviewer evaluating a completed interview transcript for "${session.targetRole}" at "${session.companyName || 'Company'}".
Evaluate the transcript strictly against:
1. Content relevance and correctness against each question
2. Communication clarity, conciseness, and tone
3. Grammar quality and professionalism
4. Structure (STAR method adherence for behavioral questions: Situation, Task, Action, Result)

CRITICAL REQUIREMENT: For each answered question, provide SPECIFIC, QUOTED FEEDBACK citing exact snippets from the candidate's answer (e.g. "When you stated '...'"). If unanswered or timed out, award 0 points and provide constructive pacing feedback.

Output MUST be a single valid JSON object with:
{
  "overallScore": number (0-100),
  "communicationScore": number (0-100),
  "technicalScore": number (0-100),
  "structureScore": number (0-100),
  "readinessTier": "High Readiness" | "Interview Ready" | "Developing" | "Needs Work",
  "overallSummary": string,
  "strengths": string[],
  "weakAreas": string[],
  "questionFeedback": [
    {
      "questionIndex": number,
      "score": number (0-20),
      "maxScore": 20,
      "relevanceScore": number,
      "clarityScore": number,
      "grammarScore": number,
      "structureScore": number,
      "feedback": string (must quote candidate),
      "quotedSnippet": string,
      "improvements": string
    }
  ]
}`;

      const prompt = `Analyze this interview transcript:\n${transcriptForPrompt}\n\nOutput JSON only:`;
      const responseText = await generateLlmText({ systemPrompt, prompt, temperature: 0.3 });

      if (responseText) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.overallScore !== undefined && Array.isArray(parsed.questionFeedback)) {
          evaluation = parsed;
        }
      }
    } catch (err) {
      console.warn('⚠️ [Sash Evaluation] LLM evaluation pass fell back to rubric evaluator:', err);
    }
  }

  // 3. Use deterministic offline evaluator if LLM evaluation was unavailable
  if (!evaluation) {
    evaluation = evaluateTranscriptOffline(completeTranscript, session.targetRole, session.companyName || 'Target Company');
  }

  // 4. Persist evaluated session in DB
  await prisma.mockInterviewSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      durationSeconds,
      overallScore: evaluation.overallScore,
      communicationScore: evaluation.communicationScore,
      technicalScore: evaluation.technicalScore,
      structureScore: evaluation.structureScore,
      readinessTier: evaluation.readinessTier,
      transcriptJson: JSON.stringify(completeTranscript),
      feedbackJson: JSON.stringify(evaluation),
      identifiedGapsJson: JSON.stringify(evaluation.weakAreas),
      isTimedOut,
      completedAt: new Date(),
    },
  });

  return evaluation;
}
