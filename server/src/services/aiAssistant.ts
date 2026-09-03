import { prisma } from '../config/prisma.js';
import { calculateStudentMatches } from './matchingEngine.js';
import { SkillCovered } from '../../../shared/types.js';

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

/**
 * Executes a specific Bridge Bot tool directly against authoritative database records,
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
 * Generates an authoritative, domain-context-aware response for Bridge Bot.
 */
export async function processChat(
  prompt: string,
  user: { id: string; name: string; role: string; studentProfileId?: string },
  history: Message[] = [],
  activeDomain?: string
): Promise<AssistantResponse> {
  const lowerPrompt = prompt.toLowerCase();
  const toolCalls: ToolCallResult[] = [];
  const currentDomain = activeDomain || 'Full-Stack Web';

  // 1. Skill Gaps intent
  if (lowerPrompt.includes('gap') || lowerPrompt.includes('weak') || lowerPrompt.includes('improve') || lowerPrompt.includes('skills')) {
    if (user.studentProfileId) {
      const toolRes = await executeTool('get_skill_gaps', {}, user.studentProfileId, currentDomain);
      toolCalls.push(toolRes);

      const { domain, hasAssessed, gaps } = toolRes.data;

      if (!hasAssessed) {
        return {
          message: `Hello ${user.name}! You haven't completed the skill assessment or self-rating for **${domain}** yet.\n\nTaking the standardized assessment or setting your initial self-ratings will calibrate your verified skill radar in real time. Would you like to start the assessment for **${domain}**?`,
          toolCalls,
          suggestedPrompts: [
            `Take ${domain} assessment`,
            `Rate skills for ${domain}`,
            'Recommend courses',
          ],
        };
      }

      if (gaps && gaps.length > 0) {
        const topGaps = gaps.slice(0, 3).map((g: any) => `• **${g.skillName}**: Current **${g.currentScore}%** vs Industry Standard **${g.benchmarkScore}%** (Gap: -${g.gap}%)`).join('\n');
        return {
          message: `Hello ${user.name}! I analyzed your verified skills against the industry benchmark for **${domain}**.\n\nHere are your top high-priority skill gaps to address:\n\n${topGaps}\n\nWould you like me to recommend accredited partner courses to close these gaps?`,
          toolCalls,
          suggestedPrompts: [
            `Recommend courses for ${domain}`,
            `Take ${domain} skill assessment`,
            'Open AI Resume Builder',
          ],
        };
      } else {
        return {
          message: `Impressive work, ${user.name}! You have met all verified industry benchmarks for **${domain}**. All competency vectors are in the strength tier (>= standard).\n\nWould you like to explore matching high-tier internships or build your verified resume?`,
          toolCalls,
          suggestedPrompts: [
            'Show my top matched internships',
            'Open AI Resume Builder',
            'Check my applications status',
          ],
        };
      }
    }
  }

  // 2. Learning Resources & Practice Recommendation intent
  if (
    lowerPrompt.includes('resource') ||
    lowerPrompt.includes('youtube') ||
    lowerPrompt.includes('tutorial') ||
    lowerPrompt.includes('dsa') ||
    lowerPrompt.includes('dynamic programming') ||
    lowerPrompt.includes('where can i learn') ||
    lowerPrompt.includes('how do i improve') ||
    lowerPrompt.includes('practice')
  ) {
    let topic = 'DSA';
    if (lowerPrompt.includes('react')) topic = 'React';
    else if (lowerPrompt.includes('type') || lowerPrompt.includes('ts')) topic = 'TypeScript';
    else if (lowerPrompt.includes('node') || lowerPrompt.includes('backend')) topic = 'Node.js';
    else if (lowerPrompt.includes('dynamic programming') || lowerPrompt.includes('dp')) topic = 'Dynamic Programming';
    else if (lowerPrompt.includes('ai') || lowerPrompt.includes('machine learning') || lowerPrompt.includes('ml')) topic = 'Machine Learning';
    else if (lowerPrompt.includes('cloud') || lowerPrompt.includes('devops') || lowerPrompt.includes('docker')) topic = 'DevOps';
    else if (lowerPrompt.includes('ui') || lowerPrompt.includes('ux') || lowerPrompt.includes('design')) topic = 'UI/UX';

    const toolRes = await executeTool('recommend_learning_resources', { skillTag: topic }, user.studentProfileId, currentDomain);
    toolCalls.push(toolRes);

    const resources = toolRes.data || [];
    const resourceList = resources.map((r: any) => `• [${r.title}](${r.url}) — *${r.provider} (${r.type.replace('_', ' ')})*`).join('\n');

    return {
      message: `Here are top-tier, curated learning resources for **${topic}**:\n\n${resourceList}\n\nYou can also explore the full resource library anytime at **/learn**!`,
      toolCalls,
      suggestedPrompts: [
        'Explore /learn resource library',
        `Check my ${currentDomain} skill gaps`,
        'Take practice set',
      ],
    };
  }

  // 3. Course Recommendations intent
  if (lowerPrompt.includes('course') || lowerPrompt.includes('recommend') || lowerPrompt.includes('learn') || lowerPrompt.includes('class')) {
    const toolRes = await executeTool('recommend_courses', {}, user.studentProfileId, currentDomain);
    toolCalls.push(toolRes);

    const courses = toolRes.data || [];
    const courseList = courses.map((c: any) => `• **${c.title}** (${c.provider}) — *${c.duration} [${c.level}]*`).join('\n');

    return {
      message: `Here are curated, verified partner courses directly mapped to high-demand skills in **${currentDomain}**:\n\n${courseList}\n\nEnrolling and completing these courses will automatically bump your skill radar vectors and boost your match percentage!`,
      toolCalls,
      suggestedPrompts: [
        'Navigate to Courses catalog',
        `Check my ${currentDomain} skill gaps`,
        'Build my AI resume',
      ],
    };
  }

  // 3. Match Score / Internship intent
  if (lowerPrompt.includes('match') || lowerPrompt.includes('score') || lowerPrompt.includes('why') || lowerPrompt.includes('internship') || lowerPrompt.includes('job')) {
    if (user.studentProfileId) {
      const toolRes = await executeTool('explain_match_score', {}, user.studentProfileId, currentDomain);
      toolCalls.push(toolRes);

      if (toolRes.data.error) {
        return {
          message: `There are currently no active internship postings or match scores for **${currentDomain}** yet. Completing your domain assessment will calibrate your match vectors as new postings go live!`,
          toolCalls,
          suggestedPrompts: [
            `Take ${currentDomain} assessment`,
            'Browse all internships',
          ],
        };
      }

      const match = toolRes.data;
      return {
        message: `Your top opening for **${currentDomain}** is **${match.internshipTitle}** at **${match.companyName}** with a **${match.overallScore}%** match score (${match.tier.toUpperCase()} match tier)!\n\n**Your Strengths:** ${match.strengths.join(', ') || 'Solid foundational baseline'}\n**Pending Requirements:** ${match.missingSkills.map((m: any) => `${m.skillName} (Gap: ${m.gap}%)`).join(', ') || 'None — fully qualified!'}\n\nWould you like to prepare an application with your AI-generated resume?`,
        toolCalls,
        suggestedPrompts: [
          'Draft application cover note',
          'Go to Internships list',
          `Explain my ${currentDomain} skill radar`,
        ],
      };
    }
  }

  // 4. Cover note draft intent
  if (lowerPrompt.includes('cover note') || lowerPrompt.includes('draft') || lowerPrompt.includes('apply note') || lowerPrompt.includes('cover letter')) {
    const toolRes = await executeTool('draft_application_note', {}, user.studentProfileId, currentDomain);
    toolCalls.push(toolRes);

    return {
      message: `I've prepared a customized cover note draft highlighting your verified credentials in **${currentDomain}**:\n\n\`\`\`\n${toolRes.data.draftNote}\n\`\`\`\n\nYou can attach this or edit it directly in the internship application modal!`,
      toolCalls,
      suggestedPrompts: [
        'Navigate to Internships',
        'Open AI Resume Builder',
        'Check my applications status',
      ],
    };
  }

  // 5. Assessment portal navigation
  if (lowerPrompt.includes('assessment') || lowerPrompt.includes('test') || lowerPrompt.includes('quiz')) {
    const toolRes = await executeTool('navigate_to', { page: `/assessment?domain=${encodeURIComponent(currentDomain)}` });
    toolCalls.push(toolRes);

    return {
      message: `Taking the standardized **${currentDomain}** assessment evaluates your competency vectors against industry standards. Taking you to the assessment portal now!`,
      toolCalls,
      suggestedPrompts: ['Go to Skill Profile', 'Browse Internships'],
    };
  }

  // 6. Resume Builder navigation
  if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv') || lowerPrompt.includes('pdf')) {
    const toolRes = await executeTool('navigate_to', { page: '/resume-builder' });
    toolCalls.push(toolRes);

    return {
      message: `The AI Resume Builder pulls your verified scores, completed courses, and projects directly from your profile to format professional, ATS-optimized PDF resumes for **${currentDomain}** roles. Opening Resume Builder!`,
      toolCalls,
      suggestedPrompts: ['Generate PDF Resume', 'View Public Portfolio'],
    };
  }

  // Default helpful overview
  return {
    message: `Hello ${user.name}! I am **Bridge Bot**, your AI career navigator on SkillBridge. I am currently aligned to your active domain: **${currentDomain}**.\n\nHere is what I can do for you right now:\n1. 📊 **Explain Skill Gaps**: Compare your skills against **${currentDomain}** industry benchmarks\n2. 🎓 **Recommend Courses**: Find accredited courses from NPTEL, HCL, and SWAYAM\n3. 🎯 **Analyze Match Scores**: Explain why you scored high/medium on specific internships\n4. 📝 **Draft Cover Notes**: Generate tailored application notes\n5. 📄 **AI Resume Builder**: Help export verified PDF resumes\n\nHow can I help you today?`,
    toolCalls,
    suggestedPrompts: [
      `What are my biggest ${currentDomain} skill gaps?`,
      `Show my top matched internships in ${currentDomain}`,
      `Recommend courses for ${currentDomain}`,
      'Open AI Resume Builder',
    ],
  };
}
