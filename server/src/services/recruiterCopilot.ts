/**
 * Recruiter Copilot Service
 *
 * AI-powered recruiter assistant for SkillBridge.
 * CRITICAL SAFETY RULE: All AI outputs are strictly ADVISORY.
 * This service NEVER writes to the database directly.
 * All returned data is for display and recruiter decision-making ONLY.
 */

import { prisma } from '../config/prisma.js';
import { generateLlmText } from './llmService.js';
import { toSafeRecruiterCandidateDto } from '../utils/safeCandidateDto.js';

// ------------- Types -------------

export interface CopilotCandidateRanking {
  candidateId: string;
  candidateName: string;
  advisoryScore: number;  // 0-100 — ADVISORY ONLY, must not be stored
  advisoryReason: string; // Human-readable rationale
}

export interface CopilotComparisonResult {
  advisoryRanking: CopilotCandidateRanking[];
  advisorySummary: string;
  topStrengths: Record<string, string[]>;
  topGaps: Record<string, string[]>;
  disclaimer: string;
}

export interface CopilotQueryResult {
  intent: 'CANDIDATE_SEARCH' | 'SKILL_QUERY' | 'MARKET_INSIGHT' | 'GENERAL';
  answer: string;
  supportingData?: any;
  disclaimer: string;
}

const ADVISORY_DISCLAIMER = 
  'This is an AI-generated advisory analysis. All hiring decisions must be made by humans based on verified data. ' +
  'AI outputs may contain errors and should not be used as the sole basis for any employment decision.';

// ------------- Public Service Functions -------------

/**
 * Handles a natural language recruiter query about candidates, skills, or market data.
 * Returns AI analysis with supporting data from the database.
 * NEVER modifies any database records.
 */
export async function handleCopilotQuery(
  query: string,
  recruiterProfileId: string,
  opportunityId?: string
): Promise<CopilotQueryResult> {
  // Enforce max query length (handled by middleware too, but double-checked here)
  if (query.length > 3000) {
    return {
      intent: 'GENERAL',
      answer: 'Query too long. Please keep your question under 3,000 characters.',
      disclaimer: ADVISORY_DISCLAIMER,
    };
  }

  // Classify intent from the query to determine what supporting data to fetch
  const intent = classifyQueryIntent(query);

  let supportingData: any = undefined;
  let contextBlock = '';

  if (intent === 'CANDIDATE_SEARCH' && opportunityId) {
    // Fetch top 10 matches for context
    const matches = await prisma.candidateMatch.findMany({
      where: { opportunityId },
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        candidate: {
          include: {
            user: { select: { name: true } },
            skillScores: { include: { skill: { select: { name: true } } } },
          },
        },
      },
    });

    const safeCandidates = matches.map(m =>
      toSafeRecruiterCandidateDto(m.candidate, {
        matchScore: m.score,
      })
    );

    supportingData = safeCandidates;
    contextBlock = `
Top matched candidates for this opportunity:
${safeCandidates.map((c, i) =>
  `${i + 1}. ${c.fullName} — Match Score: ${c.matchScore}%, Skills: ${c.skills.slice(0, 5).map(s => s.name).join(', ')}`
).join('\n')}
`;
  } else if (intent === 'SKILL_QUERY') {
    // Provide market skill demand context
    const demandData = await prisma.skillDemandSnapshot.findMany({
      orderBy: { demandCount: 'desc' },
      take: 10,
    });
    supportingData = demandData;
    contextBlock = `
Current top in-demand skills on SkillBridge:
${demandData.map(d => `- ${d.skillName}: ${d.demandCount} opportunities (${d.trendDirection})`).join('\n')}
`;
  }

  const systemPrompt = `You are the SkillBridge Recruiter Copilot — an intelligent assistant for recruiters.
Your role is to help recruiters make informed hiring decisions using factual platform data.

CRITICAL RULES:
1. You are advisory only. Never claim to make final hiring decisions.
2. Do not hallucinate candidate names, scores, or qualifications not provided to you.
3. Do not reveal raw personal data (emails, phone numbers, home addresses).
4. Keep responses concise, professional, and actionable (under 400 words).
5. Always acknowledge that human judgment is the final authority.`;

  const userPrompt = query + (contextBlock ? `\n\nAvailable context from SkillBridge platform:\n${contextBlock}` : '');

  const aiText = await generateLlmText({ systemPrompt, prompt: userPrompt });

  return {
    intent,
    answer: aiText || 'I am unable to generate a response at this time. Please try again shortly.',
    supportingData,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}

/**
 * AI-powered comparison of 2-5 candidates for a specific opportunity.
 * Returns advisory rankings with rationale. Does NOT write to the database.
 */
export async function compareCandidates(
  candidateIds: string[],
  opportunityId: string
): Promise<CopilotComparisonResult> {
  if (candidateIds.length < 2 || candidateIds.length > 5) {
    throw new Error('Please provide between 2 and 5 candidate IDs for comparison.');
  }

  // Fetch opportunity details
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
    },
  });

  if (!opportunity) {
    throw new Error('Opportunity not found.');
  }

  // Fetch candidates from DB with their match scores
  const matchRecords = await prisma.candidateMatch.findMany({
    where: {
      opportunityId,
      candidateId: { in: candidateIds },
    },
    include: {
      candidate: {
        include: {
          user: { select: { name: true } },
          skillScores: {
            include: { skill: { select: { name: true } } },
            orderBy: { score: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  // Build safe candidate summaries for AI context
  const candidateSummaries = matchRecords.map(m => {
    const safe = toSafeRecruiterCandidateDto(m.candidate, { matchScore: m.score });
    const topSkills = safe.skills.slice(0, 8).map(s => `${s.name} (${s.score}%, ${s.verificationLevel})`);
    return {
      id: m.candidateId,
      name: safe.fullName,
      score: m.score,
      eligibility: m.eligibility,
      ineligibilityReason: m.ineligibilityReason,
      topSkills,
      institution: safe.institutionName,
      degree: safe.degree,
      graduation: safe.graduationYear,
    };
  });

  const requiredSkills = (opportunity.skills as any[]).map((rs: any) =>
    `${rs.skill?.name || rs.skillName} (mandatory: ${rs.isMandatory}, min score: ${rs.minScore}%)`
  ).join(', ');

  const systemPrompt = `You are the SkillBridge Recruiter Copilot. You are comparing candidates for a job/internship opening.
  
CRITICAL RULES:
1. Your comparison is ADVISORY ONLY. Human recruiters make all final decisions.
2. Only reference information explicitly provided to you. Do not invent qualifications.
3. Be fair, balanced, and focus on job-relevant skills.
4. Use clear professional language. Be concise.
5. Recommend candidates by their provided name, not by rank number.`;

  const userPrompt = `Compare these ${candidateSummaries.length} candidates for the role: "${opportunity.title}".

Required Skills: ${requiredSkills}

Candidates:
${candidateSummaries.map((c, i) =>
  `Candidate ${i + 1}: ${c.name}
  - Match Score: ${c.score.toFixed(1)}%
  - Eligibility: ${c.eligibility ? 'Eligible' : `Ineligible (${c.ineligibilityReason})`}
  - Education: ${c.degree || 'N/A'} from ${c.institution || 'N/A'} (${c.graduation || 'N/A'})
  - Top Skills: ${c.topSkills.join(', ')}`
).join('\n\n')}

Please provide:
1. A clear advisory ranking from strongest to weakest fit for this role.
2. A brief rationale for each ranking (2-3 sentences each).
3. Key strengths of the top candidate.
4. Notable gaps or concerns for each candidate.
5. A brief overall recommendation.`;

  const aiText = await generateLlmText({ systemPrompt, prompt: userPrompt });

  // Build structured advisory ranking based on deterministic match scores (not AI-generated scores)
  const sortedByScore = [...candidateSummaries].sort((a, b) => b.score - a.score);

  const advisoryRanking: CopilotCandidateRanking[] = sortedByScore.map((c, i) => ({
    candidateId: c.id,
    candidateName: c.name,
    advisoryScore: c.score, // Use deterministic algorithmic score, not AI-generated
    advisoryReason: `Ranked #${i + 1} by algorithmic match score (${c.score.toFixed(1)}%). ${c.eligibility ? 'Meets mandatory requirements.' : `Does not meet mandatory requirements: ${c.ineligibilityReason}`}`,
  }));

  const topStrengths: Record<string, string[]> = {};
  const topGaps: Record<string, string[]> = {};

  for (const c of candidateSummaries) {
    topStrengths[c.id] = c.topSkills.slice(0, 3);
    topGaps[c.id] = c.eligibility ? [] : [c.ineligibilityReason || 'Missing mandatory requirements'];
  }

  return {
    advisoryRanking,
    advisorySummary: aiText || 'Unable to generate AI summary at this time. Please review the deterministic scores above.',
    topStrengths,
    topGaps,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}

// ------------- Private Helpers -------------

function classifyQueryIntent(
  query: string
): 'CANDIDATE_SEARCH' | 'SKILL_QUERY' | 'MARKET_INSIGHT' | 'GENERAL' {
  const lower = query.toLowerCase();

  if (
    lower.includes('candidate') || lower.includes('applicant') ||
    lower.includes('who is best') || lower.includes('find me') ||
    lower.includes('compare') || lower.includes('rank')
  ) {
    return 'CANDIDATE_SEARCH';
  }

  if (
    lower.includes('skill') || lower.includes('technology') ||
    lower.includes('programming') || lower.includes('framework')
  ) {
    return 'SKILL_QUERY';
  }

  if (
    lower.includes('market') || lower.includes('trend') ||
    lower.includes('demand') || lower.includes('industry')
  ) {
    return 'MARKET_INSIGHT';
  }

  return 'GENERAL';
}
