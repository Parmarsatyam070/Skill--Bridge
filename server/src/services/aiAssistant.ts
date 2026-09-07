import { prisma } from '../config/prisma.js';
import { calculateStudentMatches } from './matchingEngine.js';
import { SkillCovered } from '../../../shared/types.js';
import { isLlmConfigured, callLlmChat, ToolDefinition } from './llmService.js';
import { getStudentBoundedMemory, extractAndSaveMemoriesWithLlm } from './sashMemoryService.js';
import {
  detectDsaContext,
  checkDailyMandatoryUnattempted,
  determineDsaHintTier,
  generateDeterministicDsaGuidance,
  DailyMandatoryStatus,
} from './dsaTutorService.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolCallResult {
  toolName: string;
  data: any;
  action?: {
    type: 'NAVIGATE';
    path: string;
  };
}

export interface AssistantResponse {
  message: string;
  toolCalls?: ToolCallResult[];
  suggestedPrompts?: string[];
}

const SASH_TOOLS: ToolDefinition[] = [
  {
    name: 'get_skill_gaps',
    description: 'Compares the student verified skill scores against industry benchmarks for their target domain and identifies top gaps.',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain name (e.g. Full-Stack Web, AI/Data Science, Cloud/DevOps)' },
      },
    },
  },
  {
    name: 'recommend_learning_resources',
    description: 'Recommends curated learning materials, tutorials, and YouTube courses for a specific skill topic or tag.',
    parameters: {
      type: 'object',
      properties: {
        skillTag: { type: 'string', description: 'Skill topic or tag like React, TypeScript, DSA, Node.js, Python' },
      },
      required: ['skillTag'],
    },
  },
  {
    name: 'recommend_courses',
    description: 'Finds accredited partner courses (NPTEL, SWAYAM, HCL) mapped to the student domain or target skill.',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain name to filter courses' },
        skillName: { type: 'string', description: 'Specific skill name to filter courses' },
      },
    },
  },
  {
    name: 'explain_match_score',
    description: 'Explains the mathematical skill match breakdown and strength/gap analysis for an internship posting.',
    parameters: {
      type: 'object',
      properties: {
        internshipId: { type: 'string', description: 'Specific internship ID or title keyword' },
        domain: { type: 'string', description: 'Domain context' },
      },
    },
  },
  {
    name: 'draft_application_note',
    description: 'Generates a customized application cover note highlighting verified credentials and projects.',
    parameters: {
      type: 'object',
      properties: {
        internshipTitle: { type: 'string', description: 'Title of the internship' },
        companyName: { type: 'string', description: 'Name of the hiring company' },
        keySkills: { type: 'string', description: 'Key skills to highlight' },
      },
    },
  },
  {
    name: 'navigate_to',
    description: 'Navigates the user to a relevant page in the SkillBridge application.',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          description: 'Destination route (e.g. /assessment, /courses, /internships, /resume-builder, /learn, /dashboard)',
        },
      },
      required: ['page'],
    },
  },
];

/**
 * Executes a specific Sash tool directly against authoritative database records,
 * strictly scoped to the user's active domain context.
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  studentProfileId?: string,
  activeDomain?: string
): Promise<ToolCallResult> {
  switch (toolName) {
    case 'get_skill_gaps': {
      if (!studentProfileId) {
        return { toolName, data: { error: 'Student context required' } };
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: {
          skillScores: { include: { skill: true } },
          domains: { include: { domain: true } },
        },
      });

      if (!student) return { toolName, data: { error: 'Student not found' } };

      const domainName = activeDomain || args.domain || student.targetDomain || 'Full-Stack Web';

      // Find requirements for this specific domain
      const domainRecord = await prisma.domain.findFirst({
        where: {
          OR: [{ name: domainName }, { slug: domainName }, { id: domainName }],
        },
        include: {
          requirements: {
            include: { skill: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      let requirements: { skillId: string; skillName: string; benchmarkScore: number }[] = [];
      if (domainRecord && domainRecord.requirements.length > 0) {
        requirements = domainRecord.requirements.map(r => ({
          skillId: r.skillId,
          skillName: r.skill.name,
          benchmarkScore: r.benchmarkScore,
        }));
      } else {
        const legacyBenchmarks = await prisma.skillBenchmark.findMany({
          where: { domain: domainName },
          include: { skill: true },
        });
        requirements = legacyBenchmarks.map(b => ({
          skillId: b.skillId,
          skillName: b.skill.name,
          benchmarkScore: b.benchmarkScore,
        }));
      }

      const scoreMap = new Map(student.skillScores.map(ss => [ss.skillId, ss.score]));
      const assessedSkills = requirements.filter(r => scoreMap.has(r.skillId));
      const hasAssessed = assessedSkills.length > 0;

      const gaps = requirements.map(b => {
        const currentScore = scoreMap.get(b.skillId) || 0;
        const gap = Math.max(0, b.benchmarkScore - currentScore);
        return {
          skillId: b.skillId,
          skillName: b.skillName,
          currentScore: Math.round(currentScore),
          benchmarkScore: Math.round(b.benchmarkScore),
          gap: Math.round(gap),
          status: currentScore >= b.benchmarkScore ? 'STRENGTH' : currentScore > 0 ? 'NEEDS_UPSKILLING' : 'NOT_ASSESSED',
        };
      }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);

      return {
        toolName,
        data: {
          domain: domainRecord ? domainRecord.name : domainName,
          hasAssessed,
          assessedSkillsCount: assessedSkills.length,
          totalRequirementsCount: requirements.length,
          totalGapsIdentified: gaps.length,
          gaps,
        },
      };
    }

    case 'recommend_learning_resources': {
      const { getRecommendedResourcesForSkill } = await import('./learningResourceService.js');
      const skillTag = args.skillTag || args.topic || activeDomain || 'DSA';
      const resources = await getRecommendedResourcesForSkill(skillTag, 4);
      return {
        toolName,
        data: resources.map(r => ({
          id: r.id,
          title: r.title,
          provider: r.provider,
          type: r.type,
          url: r.url,
          description: r.description,
          isFree: r.isFree,
        })),
      };
    }

    case 'recommend_courses': {
      const domainName = activeDomain || args.domain || '';
      const skillName = args.skillName || '';
      const allCourses = await prisma.course.findMany({
        include: { provider: true },
      });

      let domainSkills: string[] = [];
      if (domainName) {
        const domainRecord = await prisma.domain.findFirst({
          where: { OR: [{ name: domainName }, { slug: domainName }, { id: domainName }] },
          include: { requirements: { include: { skill: true } } },
        });
        if (domainRecord) {
          domainSkills = domainRecord.requirements.map(r => r.skillId);
        }
      }

      const allSkills = await prisma.skill.findMany();
      const targetSkill = skillName ? allSkills.find(s => s.name.toLowerCase().includes(skillName.toLowerCase())) : null;

      let recommendations = allCourses.filter(c => {
        try {
          const skillsCovered: SkillCovered[] = JSON.parse(c.skillsCoveredJson);
          if (targetSkill) {
            return skillsCovered.some(sc => sc.skillId === targetSkill.id);
          }
          if (domainSkills.length > 0) {
            return skillsCovered.some(sc => domainSkills.includes(sc.skillId));
          }
          return true;
        } catch {
          return false;
        }
      });

      if (recommendations.length === 0) {
        recommendations = allCourses;
      }

      return {
        toolName,
        data: recommendations.slice(0, 3).map(c => ({
          id: c.id,
          title: c.title,
          provider: c.provider.name,
          duration: c.duration,
          level: c.level,
          externalUrl: c.externalUrl,
        })),
      };
    }

    case 'explain_match_score': {
      if (!studentProfileId) return { toolName, data: { error: 'Student context required' } };
      const domainName = activeDomain || args.domain;
      const internshipId = args.internshipId;
      const matches = await calculateStudentMatches(studentProfileId);

      let match = null;
      if (internshipId) {
        match = matches.find(m => m.internshipId === internshipId || m.internshipTitle.toLowerCase().includes(internshipId.toLowerCase()));
      } else if (domainName) {
        match = matches.find(m => m.internshipTitle.toLowerCase().includes(domainName.toLowerCase().split(' ')[0]));
      }

      if (!match) {
        match = matches[0];
      }

      if (!match) {
        return { toolName, data: { error: 'No active internship matches found for this domain yet' } };
      }

      return {
        toolName,
        data: {
          internshipTitle: match.internshipTitle,
          companyName: match.companyName,
          overallScore: match.overallScore,
          tier: match.tier,
          strengths: match.breakdown.strengths,
          matchedSkills: match.breakdown.matchedSkills,
          missingSkills: match.breakdown.missingSkills,
        },
      };
    }

    case 'draft_application_note': {
      const domainName = activeDomain || 'Software Engineering';
      const internshipTitle = args.internshipTitle || `${domainName} Intern`;
      const companyName = args.companyName || 'the engineering team';
      const keySkills = args.keySkills || 'verified competencies and problem solving';

      const draft = `Dear ${companyName} Hiring Team,\n\nI am writing to express my enthusiastic interest in the ${internshipTitle} position. Through verified course completions and rigorous hands-on assessments on SkillBridge, I have established strong foundations in ${keySkills}.\n\nMy portfolio demonstrates production-ready code with type safety, clean component architecture, and responsive UX. I am eager to bring this diligence to ${companyName} and contribute meaningfully from day one.\n\nThank you for considering my application.\n\nBest regards,\nCandidate`;

      return {
        toolName,
        data: { draftNote: draft },
      };
    }

    case 'navigate_to': {
      const page = args.page || '/dashboard';
      return {
        toolName,
        data: { destination: page },
        action: {
          type: 'NAVIGATE',
          path: page,
        },
      };
    }

    default:
      return { toolName, data: { error: `Unknown tool ${toolName}` } };
  }
}

/**
 * Generates an authoritative, domain-context-aware response for Sash.
 * Grounded in real student report cards, verified assessments, and persistent memory.
 */
export async function processChat(
  prompt: string,
  user: { id: string; name: string; role: string; studentProfileId?: string },
  history: Message[] = [],
  activeDomain?: string,
  pageContext?: { path?: string; problemId?: string; problemTitle?: string }
): Promise<AssistantResponse> {
  const lowerPrompt = prompt.toLowerCase();
  const toolCalls: ToolCallResult[] = [];
  const currentDomain = activeDomain || 'Full-Stack Web';

  // 0. Detect DSA / Coding Question Help Context & Daily Mandatory Guard
  const dsaDetection = detectDsaContext(prompt, pageContext);
  let isDailyUnattempted = false;
  let dailyStatus: DailyMandatoryStatus | null = null;

  if (dsaDetection.isDsaContext && user.studentProfileId && (dsaDetection.problemTitle || dsaDetection.problemId)) {
    dailyStatus = await checkDailyMandatoryUnattempted(
      user.studentProfileId,
      dsaDetection.problemId || dsaDetection.problemTitle
    );
    isDailyUnattempted = dailyStatus.isDailyMandatory && !dailyStatus.hasAttempted;
  }

  const hintTier = determineDsaHintTier(history, prompt);

  // 1. Fetch Authoritative Grounding Data for this student from DB
  let verifiedScoresText = 'No assessments completed yet';
  let targetInternshipText = 'None selected';
  let mockInterviewText = 'No mock interviews completed yet';
  let verifiedSkillScores: Array<{ skill: string; score: number }> = [];

  if (user.studentProfileId) {
    try {
      const profile = await prisma.studentProfile.findUnique({
        where: { id: user.studentProfileId },
        include: {
          skillScores: { include: { skill: true } },
          targetInternship: { include: { industry: true } },
          mockInterviewSessions: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 2,
          },
        },
      });

      if (profile) {
        verifiedSkillScores = profile.skillScores.map((ss) => ({
          skill: ss.skill.name,
          score: Math.round(ss.score),
        }));

        if (verifiedSkillScores.length > 0) {
          verifiedScoresText = verifiedSkillScores.map((s) => `${s.skill}: ${s.score}%`).join(', ');
        }

        if (profile.targetInternship) {
          const comp = profile.targetInternship.industry?.companyName || 'Target Company';
          targetInternshipText = `${profile.targetInternship.title} @ ${comp}`;
        }

        if (profile.mockInterviewSessions && profile.mockInterviewSessions.length > 0) {
          const latest = profile.mockInterviewSessions[0];
          mockInterviewText = `Latest Score: ${latest.overallScore}%, Readiness: ${latest.readinessTier}, Gaps: ${latest.identifiedGapsJson || 'None'}`;
        }
      }
    } catch (err) {
      console.warn('⚠️ [Sash Context] Error loading student profile records:', err);
    }
  }

  // 2. Fetch Bounded Memory (Summary + top facts) from SashMemory table
  const boundedMemory = user.studentProfileId
    ? await getStudentBoundedMemory(user.studentProfileId, 8)
    : { summary: null, facts: [], formattedText: 'No prior memories stored.' };

  // 3. Live LLM Integration (Gemini / OpenAI) with tool execution
  if (isLlmConfigured()) {
    try {
      let dsaDirective = '';
      if (dsaDetection.isDsaContext) {
        const problemName = dsaDetection.problemTitle || 'this coding problem';
        if (isDailyUnattempted) {
          dsaDirective = `\n\n6. CRITICAL INTEGRITY GUARD FOR TODAY'S DAILY MANDATORY CHALLENGE:
The student is asking about "${problemName}", which is part of today's DAILY MANDATORY PRACTICE SET and has NOT been attempted yet in the editor.
- STRICT RULE: You MUST REFUSE to provide the direct solution, step-by-step algorithm, or code.
- Explain warmly that because "${problemName}" is part of today's Daily Mandatory challenge, direct answers cannot be given before an initial attempt is submitted in the code editor, to preserve challenge integrity, streak calibration, and genuine skill growth.
- Provide ONLY a conceptual hint (invariant/intuition/pattern family) to nudge their thought process.
- Invite them to submit an initial attempt in the code editor first, and offer to review and refine it once submitted.`;
        } else if (hintTier === 1) {
          dsaDirective = `\n\n6. SOCRATIC DSA TA MODE (TIER 1 - CONCEPTUAL HINT ONLY):
The student is asking about coding problem "${problemName}".
- STRICT RULE: DO NOT GIVE CODE! DO NOT provide full functions, code blocks, or step-by-step pseudo-algorithms.
- Explain the underlying pattern family (e.g. hash map lookup, monotonic binary search, two pointers, sliding window) and the core invariant.
- Ask a reflective question to guide their intuition so they can formulate the solution themselves.
- Inform them that if they remain stuck, they can ask: "I'm still stuck, show me the approach step by step."`;
        } else if (hintTier === 2) {
          dsaDirective = `\n\n6. SOCRATIC DSA TA MODE (TIER 2 - STEP-BY-STEP ALGORITHMIC OUTLINE):
The student is stuck and has asked for more detail or step-by-step guidance on "${problemName}".
- Provide a clear, numbered algorithmic outline (e.g. Step 1: Initialize state, Step 2: Loop condition, Step 3: Branching condition, Step 4: Edge cases).
- STILL DO NOT PROVIDE FULL CODE IMPLEMENTATION. Keep it at the step-by-step logic level so they write the code in the editor.
- Remind them to code this outline in their editor.`;
        } else {
          dsaDirective = `\n\n6. SOCRATIC DSA TA MODE (TIER 3 - CODE IMPLEMENTATION & COMPLEXITY WALKTHROUGH):
The student has already received conceptual hints and step-by-step outlines, and is now requesting the implementation for "${problemName}".
- You may now provide clean, robust, commented code.
- Provide a thorough complexity breakdown (Time & Auxiliary Space) and detail edge cases (e.g. empty lists, single elements, negative numbers).`;
        }
      }

      const systemPrompt = `You are Sash, an elite, empathetic, and authoritative AI career navigator on SkillBridge.

STUDENT PROFILE & VERIFIED PLATFORM DATA:
- Name: ${user.name}
- Role: ${user.role}
- Active Target Domain: ${currentDomain}
- Verified Skill Radar Scores: ${verifiedScoresText}
- Target Internship Goal: ${targetInternshipText}
- Recent Mock Interview Status: ${mockInterviewText}

PERSISTENT STUDENT MEMORY (LEARNED FROM PRIOR CONVERSATIONS):
${boundedMemory.formattedText}

STRICT BEHAVIORAL DIRECTIVES:
1. Open-Ended Conversation: Hold natural, insightful conversations on software engineering, career development, study habits, interview prep, or technical concepts. Answer general questions thoroughly with clarity and code snippets where appropriate.
2. ZERO-HALLUCINATION RULE: When discussing the student's actual scores, match percentages, or gaps, NEVER invent or hallucinate numbers. Strictly use the verified scores above or call the appropriate tool.
3. Memory Recall: If the student asks what you remember about them (their goals, struggles, preferences), reference the stored memory accurately and warmly.
4. Tool Calling: When asked for specific skill gaps, courses, match explanations, cover letters, or navigation, call the appropriate tool.
5. Markdown: Use clean markdown, bolding, bullet points, and concise structure.${dsaDirective}`;

      const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: prompt },
      ];

      const llmResult = await callLlmChat({
        systemPrompt,
        messages,
        tools: SASH_TOOLS,
      });

      if (llmResult.provider !== 'none' && (llmResult.text || (llmResult.toolCalls && llmResult.toolCalls.length > 0))) {
        const executedToolCalls: ToolCallResult[] = [];
        if (llmResult.toolCalls) {
          for (const tc of llmResult.toolCalls) {
            const res = await executeTool(tc.name, tc.args, user.studentProfileId, currentDomain);
            executedToolCalls.push(res);
          }
        }

        let finalMessage = llmResult.text || '';
        if (!finalMessage && executedToolCalls.length > 0) {
          const firstCall = executedToolCalls[0];
          if (firstCall.toolName === 'get_skill_gaps' && firstCall.data.gaps) {
            const gapsList = firstCall.data.gaps.slice(0, 3).map((g: any) => `• **${g.skillName}**: Current **${g.currentScore}%** vs Standard **${g.benchmarkScore}%** (Gap: -${g.gap}%)`).join('\n');
            finalMessage = `I've analyzed your verified skills against the benchmark for **${currentDomain}**:\n\n${gapsList}`;
          } else if (firstCall.toolName === 'explain_match_score' && firstCall.data.overallScore !== undefined) {
            finalMessage = `Your top matched internship for **${currentDomain}** is **${firstCall.data.internshipTitle}** at **${firstCall.data.companyName}** with a verified match score of **${firstCall.data.overallScore}%** (${firstCall.data.tier.toUpperCase()} match tier).`;
          } else if (firstCall.toolName === 'recommend_courses' && Array.isArray(firstCall.data)) {
            const cList = firstCall.data.map((c: any) => `• **${c.title}** (${c.provider}) — *${c.duration}*`).join('\n');
            finalMessage = `Here are accredited partner courses recommended for **${currentDomain}**:\n\n${cList}`;
          } else {
            finalMessage = `I've retrieved the latest verified records for **${currentDomain}** and executed your request.`;
          }
        }

        const problemName = dsaDetection.problemTitle || 'this problem';
        let suggestedPrompts = [
          `What are my biggest ${currentDomain} skill gaps?`,
          `Show my top matched internships in ${currentDomain}`,
          'What do you remember about my goals?',
        ];
        if (dsaDetection.isDsaContext) {
          if (isDailyUnattempted) {
            suggestedPrompts = [
              'Open code editor',
              `Give me another hint on ${problemName}`,
              "Take today's practice set",
            ];
          } else if (hintTier === 1) {
            suggestedPrompts = [
              "I'm still stuck, show me the approach step by step",
              `What is the time complexity of ${problemName}?`,
              'Open code editor',
            ];
          } else if (hintTier === 2) {
            suggestedPrompts = [
              'Show me the code implementation',
              `What edge cases should I consider for ${problemName}?`,
              'Open code editor',
            ];
          } else {
            suggestedPrompts = [
              `What are the edge cases for ${problemName}?`,
              'Give me another practice problem',
              `Check my ${currentDomain} skill gaps`,
            ];
          }
        }

        const assistantResponse: AssistantResponse = {
          message: finalMessage,
          toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
          suggestedPrompts,
        };

        // Asynchronously extract and save any newly stated facts into SashMemory
        if (user.studentProfileId) {
          extractAndSaveMemoriesWithLlm(user.studentProfileId, prompt, finalMessage).catch((e) =>
            console.warn('⚠️ [Sash Memory] Background extraction failed:', e)
          );
        }

        return assistantResponse;
      }
    } catch (err: any) {
      console.warn('⚠️ [SASH LLM EXECUTION ERROR]:', err.message, '— falling back to offline grounded engine.');
    }
  }

  // 4. Intelligent Offline Grounded & Conversational Engine (when LLM is offline/unconfigured)
  let finalResponse: AssistantResponse;

  // A0. Socratic DSA / Coding Question Help & Daily Mandatory Guard
  if (dsaDetection.isDsaContext) {
    const problemName = dsaDetection.problemTitle || 'this coding problem';
    const message = generateDeterministicDsaGuidance(hintTier, problemName, isDailyUnattempted);

    let suggestedPrompts: string[] = [];
    if (isDailyUnattempted) {
      suggestedPrompts = [
        'Open code editor',
        `Give me another hint on ${problemName}`,
        "Take today's practice set",
      ];
    } else if (hintTier === 1) {
      suggestedPrompts = [
        "I'm still stuck, show me the approach step by step",
        `What is the time complexity of ${problemName}?`,
        'Open code editor',
      ];
    } else if (hintTier === 2) {
      suggestedPrompts = [
        'Show me the code implementation',
        `What edge cases should I consider for ${problemName}?`,
        'Open code editor',
      ];
    } else {
      suggestedPrompts = [
        `What are the edge cases for ${problemName}?`,
        'Give me another practice problem',
        `Check my ${currentDomain} skill gaps`,
      ];
    }

    finalResponse = {
      message,
      suggestedPrompts,
    };
  }
  // A. Memory Recall Query (e.g. "what do you remember", "what did I tell you", "what is my goal", "what do I struggle with")
  else if (
    lowerPrompt.includes('remember') ||
    lowerPrompt.includes('what did i tell you') ||
    lowerPrompt.includes('what are my goals') ||
    lowerPrompt.includes('what is my goal') ||
    lowerPrompt.includes('my struggle') ||
    lowerPrompt.includes('what do i struggle with') ||
    lowerPrompt.includes('my preference')
  ) {
    if (boundedMemory.facts.length > 0) {
      const memoryLines = boundedMemory.facts
        .map((f) => `• **${f.category.toUpperCase()}**: ${f.value}`)
        .join('\n');
      finalResponse = {
        message: `Here is what I remember from our conversations, ${user.name}:\n\n${memoryLines}\n\nI keep these in mind across all our sessions so our prep stays focused on your targets.`,
        suggestedPrompts: [
          `What are my biggest ${currentDomain} skill gaps?`,
          `Recommend courses for ${currentDomain}`,
          'Take practice set',
        ],
      };
    } else {
      finalResponse = {
        message: `I don't have any specific goals, struggles, or preferences saved in my memory yet, ${user.name}. Share your dream companies, target roles, or topics you find tough, and I'll remember them across your sessions!`,
        suggestedPrompts: [
          'My goal is to crack a full-stack engineer role',
          'I struggle with dynamic programming and trees',
          `Check my ${currentDomain} skill gaps`,
        ],
      };
    }
  }
  // B. Skill Gaps intent (authoritative data from DB)
  else if (lowerPrompt.includes('gap') || lowerPrompt.includes('weak') || lowerPrompt.includes('improve') || lowerPrompt.includes('skills')) {
    if (user.studentProfileId) {
      const toolRes = await executeTool('get_skill_gaps', {}, user.studentProfileId, currentDomain);
      toolCalls.push(toolRes);

      const { domain, hasAssessed, gaps } = toolRes.data;

      if (!hasAssessed) {
        finalResponse = {
          message: `Hello ${user.name}! You haven't completed the skill assessment or self-rating for **${domain}** yet.\n\nTaking the standardized assessment or setting your initial self-ratings will calibrate your verified skill radar in real time. Would you like to start the assessment for **${domain}**?`,
          toolCalls,
          suggestedPrompts: [
            `Take ${domain} assessment`,
            `Rate skills for ${domain}`,
            'Recommend courses',
          ],
        };
      } else if (gaps && gaps.length > 0) {
        const topGaps = gaps
          .slice(0, 3)
          .map((g: any) => `• **${g.skillName}**: Current **${g.currentScore}%** vs Industry Standard **${g.benchmarkScore}%** (Gap: -${g.gap}%)`)
          .join('\n');
        finalResponse = {
          message: `Hello ${user.name}! I analyzed your verified skills against the industry benchmark for **${domain}**.\n\nHere are your top high-priority skill gaps to address:\n\n${topGaps}\n\nWould you like me to recommend accredited partner courses to close these gaps?`,
          toolCalls,
          suggestedPrompts: [
            `Recommend courses for ${domain}`,
            `Take ${domain} skill assessment`,
            'Open AI Resume Builder',
          ],
        };
      } else {
        finalResponse = {
          message: `Impressive work, ${user.name}! You have met all verified industry benchmarks for **${domain}**. All competency vectors are in the strength tier (>= standard).\n\nWould you like to explore matching high-tier internships or build your verified resume?`,
          toolCalls,
          suggestedPrompts: [
            'Show my top matched internships',
            'Open AI Resume Builder',
            'Check my applications status',
          ],
        };
      }
    } else {
      finalResponse = {
        message: `Please log in to view your verified skill gaps.`,
      };
    }
  }
  // C. Match Score / Internship intent (authoritative data from DB)
  else if (lowerPrompt.includes('match') || lowerPrompt.includes('score') || lowerPrompt.includes('internship') || lowerPrompt.includes('job')) {
    if (user.studentProfileId) {
      const toolRes = await executeTool('explain_match_score', {}, user.studentProfileId, currentDomain);
      toolCalls.push(toolRes);

      if (toolRes.data.error) {
        finalResponse = {
          message: `There are currently no active internship postings or match scores for **${currentDomain}** yet. Completing your domain assessment will calibrate your match vectors as new postings go live!`,
          toolCalls,
          suggestedPrompts: [
            `Take ${currentDomain} assessment`,
            'Browse all internships',
          ],
        };
      } else {
        const match = toolRes.data;
        finalResponse = {
          message: `Your top opening for **${currentDomain}** is **${match.internshipTitle}** at **${match.companyName}** with a verified **${match.overallScore}%** match score (${match.tier.toUpperCase()} match tier)!\n\n**Your Strengths:** ${match.strengths.join(', ') || 'Solid foundational baseline'}\n**Pending Requirements:** ${match.missingSkills.map((m: any) => `${m.skillName} (Gap: ${m.gap}%)`).join(', ') || 'None — fully qualified!'}\n\nWould you like to prepare an application with your AI-generated resume?`,
          toolCalls,
          suggestedPrompts: [
            'Draft application cover note',
            'Go to Internships list',
            `Explain my ${currentDomain} skill radar`,
          ],
        };
      }
    } else {
      finalResponse = { message: 'Student profile required to compute match scores.' };
    }
  }
  // D. Course Recommendations intent
  else if (lowerPrompt.includes('course') || lowerPrompt.includes('recommend') || lowerPrompt.includes('learn') || lowerPrompt.includes('class')) {
    const toolRes = await executeTool('recommend_courses', {}, user.studentProfileId, currentDomain);
    toolCalls.push(toolRes);

    const courses = toolRes.data || [];
    const courseList = courses.map((c: any) => `• **${c.title}** (${c.provider}) — *${c.duration} [${c.level}]*`).join('\n');

    finalResponse = {
      message: `Here are curated, verified partner courses directly mapped to high-demand skills in **${currentDomain}**:\n\n${courseList}\n\nEnrolling and completing these courses will automatically bump your skill radar vectors and boost your match percentage!`,
      toolCalls,
      suggestedPrompts: [
        'Navigate to Courses catalog',
        `Check my ${currentDomain} skill gaps`,
        'Build my AI resume',
      ],
    };
  }
  // E. Cover note draft intent
  else if (lowerPrompt.includes('cover note') || lowerPrompt.includes('draft') || lowerPrompt.includes('apply note') || lowerPrompt.includes('cover letter')) {
    const toolRes = await executeTool('draft_application_note', {}, user.studentProfileId, currentDomain);
    toolCalls.push(toolRes);

    finalResponse = {
      message: `I've prepared a customized cover note draft highlighting your verified credentials in **${currentDomain}**:\n\n\`\`\`\n${toolRes.data.draftNote}\n\`\`\`\n\nYou can attach this or edit it directly in the internship application modal!`,
      toolCalls,
      suggestedPrompts: [
        'Navigate to Internships',
        'Open AI Resume Builder',
        'Check my applications status',
      ],
    };
  }
  // F. Assessment portal navigation
  else if (lowerPrompt.includes('assessment') || lowerPrompt.includes('test') || lowerPrompt.includes('quiz')) {
    const toolRes = await executeTool('navigate_to', { page: `/assessment?domain=${encodeURIComponent(currentDomain)}` });
    toolCalls.push(toolRes);

    finalResponse = {
      message: `Taking the standardized **${currentDomain}** assessment evaluates your competency vectors against industry standards. Taking you to the assessment portal now!`,
      toolCalls,
      suggestedPrompts: ['Go to Skill Profile', 'Browse Internships'],
    };
  }
  // G. Resume Builder navigation
  else if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv') || lowerPrompt.includes('pdf')) {
    const toolRes = await executeTool('navigate_to', { page: '/resume-builder' });
    toolCalls.push(toolRes);

    finalResponse = {
      message: `The AI Resume Builder pulls your verified scores, completed courses, and projects directly from your profile to format professional, ATS-optimized PDF resumes for **${currentDomain}** roles. Opening Resume Builder!`,
      toolCalls,
      suggestedPrompts: ['Generate PDF Resume', 'View Public Portfolio'],
    };
  }
  // H. Stating a Goal, Struggle, or Preference explicitly
  else if (
    lowerPrompt.includes('my goal is') ||
    lowerPrompt.includes('i want to work at') ||
    lowerPrompt.includes('i want to become') ||
    lowerPrompt.includes('dream company') ||
    lowerPrompt.includes('i struggle with') ||
    lowerPrompt.includes('having trouble with') ||
    lowerPrompt.includes('i prefer')
  ) {
    finalResponse = {
      message: `Noted, ${user.name}! I've stored this in my memory. I'll make sure our roadmap suggestions, mock interview questions, and practice sets actively target this as you progress.`,
      suggestedPrompts: [
        'What do you remember about my goals?',
        `What are my biggest ${currentDomain} skill gaps?`,
        'Start 30-min AI Mock Interview',
      ],
    };
  }
  // I. Open-Ended General Questions (e.g. TCP vs UDP, how to study, explain concept)
  else if (
    lowerPrompt.includes('tcp') ||
    lowerPrompt.includes('udp') ||
    lowerPrompt.includes('http') ||
    lowerPrompt.includes('rest') ||
    lowerPrompt.includes('how to prepare') ||
    lowerPrompt.includes('study schedule') ||
    lowerPrompt.includes('difference between') ||
    lowerPrompt.includes('explain') ||
    lowerPrompt.includes('what is') ||
    lowerPrompt.includes('how does')
  ) {
    if (lowerPrompt.includes('tcp') || lowerPrompt.includes('udp')) {
      finalResponse = {
        message: `Here is a clear architectural comparison between **TCP** and **UDP**:\n\n1. **Connection**: TCP is **connection-oriented** (requires a 3-way SYN/SYN-ACK handshake), whereas UDP is **connectionless** (packets sent directly without handshaking).\n2. **Reliability & Ordering**: TCP guarantees packet delivery, error-checking, and sequential order with acknowledgments and retransmissions. UDP does not guarantee delivery or packet ordering.\n3. **Overhead & Speed**: TCP has higher header overhead (20–60 bytes) and flow/congestion control latency. UDP has minimal overhead (8 bytes) and operates at near real-time speeds.\n4. **Use Cases**:\n   • **TCP**: HTTP/HTTPS web traffic, database connections, secure file transfers (SSH, FTP).\n   • **UDP**: Real-time video streaming, VoIP audio calls, DNS lookups, and multiplayer gaming.\n\nWould you like to review how this relates to system design interview questions?`,
        suggestedPrompts: [
          'Explain REST vs GraphQL',
          `What are my biggest ${currentDomain} skill gaps?`,
          'Start 30-min AI Mock Interview',
        ],
      };
    } else {
      finalResponse = {
        message: `Great question, ${user.name}! In modern software engineering, clear mental models and structured fundamentals are what separate strong candidates from average applicants.\n\nKey takeaways to keep in mind:\n• **Core Principle**: Focus on understanding the trade-offs rather than memorizing syntax.\n• **System Impact**: Consider how latency, scalability, and maintainability are affected.\n• **Practical Application**: Validate concepts by building small working prototypes or tackling targeted practice problems.\n\nHow can I connect this concept directly to your **${currentDomain}** preparation today?`,
        suggestedPrompts: [
          `What are my biggest ${currentDomain} skill gaps?`,
          `Recommend courses for ${currentDomain}`,
          'What do you remember about my goals?',
        ],
      };
    }
  }
  // J. Default Overview
  else {
    finalResponse = {
      message: `Hello ${user.name}! I am **Sash**, your AI career navigator on SkillBridge. I am currently aligned to your active domain: **${currentDomain}**.\n\nHere is what I can do for you right now:\n1. 📊 **Explain Skill Gaps**: Compare your skills against **${currentDomain}** industry benchmarks\n2. 🎓 **Recommend Courses**: Find accredited courses from NPTEL, HCL, and SWAYAM\n3. 🎯 **Analyze Match Scores**: Explain why you scored high/medium on specific internships\n4. 📝 **Draft Cover Notes**: Generate tailored application notes\n5. 📄 **AI Resume Builder**: Help export verified PDF resumes\n6. 🧠 **Career Memory**: Tell me your goals or struggles and I will remember them!\n\nHow can I help you today?`,
      toolCalls,
      suggestedPrompts: [
        `What are my biggest ${currentDomain} skill gaps?`,
        `Show my top matched internships in ${currentDomain}`,
        `Recommend courses for ${currentDomain}`,
        'Open AI Resume Builder',
      ],
    };
  }

  // Asynchronously extract and save any newly stated facts into SashMemory
  if (user.studentProfileId) {
    extractAndSaveMemoriesWithLlm(user.studentProfileId, prompt, finalResponse.message).catch((e) =>
      console.warn('⚠️ [Sash Memory] Background extraction failed:', e)
    );
  }

  return finalResponse;
}
