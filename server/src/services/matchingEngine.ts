import { prisma } from '../config/prisma.js';
import { MatchBreakdown, RequiredSkill, SkillCovered } from '../../../shared/types.js';

export interface ComputedMatch {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  workMode: string;
  stipend: string;
  status: string;
  overallScore: number;
  tier: 'high' | 'medium' | 'low';
  breakdown: MatchBreakdown;
}

/**
 * Authoritative Server-Side Matching Engine
 * 
 * Mathematical Formulation:
 * -------------------------
 * Given an Internship J with required skill vector R = { (k_i, w_i, m_i) } where:
 *   - k_i = Skill ID
 *   - w_i = Weight in [1, 5] (relative importance)
 *   - m_i = Minimum target threshold score in [0, 100]
 * 
 * And Student S with current skill vector V = { (k_j, s_j) } where:
 *   - s_j = Current assessed skill score in [0, 100]
 * 
 * For each required skill k_i:
 *   1. Student Score s_i is retrieved from DB (0 if unassessed).
 *   2. Fulfillment Ratio: f_i = min(1.0, s_i / m_i)
 *   3. Weighted Contribution: C_i = (w_i * f_i) / sum(w_k)
 *   4. Gap: g_i = max(0, m_i - s_i)
 * 
 * Raw Match Percentage:
 *   RawMatch(S, J) = ( sum_{i=1}^N (w_i * min(1.0, s_i / m_i)) / sum_{i=1}^N w_i ) * 100
 * 
 * Missing Skill Penalty:
 *   MissingPenalty = (count(s_i == 0) * 2.5)  [capped at 10%]
 * 
 * Final Authoritative Score:
 *   Score = round( clamp(RawMatch - MissingPenalty, 0, 100) )
 * 
 * Match Tier:
 *   - "high"   : Score >= 80% (Ready for Direct Fast-Track)
 *   - "medium" : 50% <= Score < 80% (Up-skilling Needed)
 *   - "low"    : Score < 50% (Fundamental Prerequisites Missing)
 */
export async function calculateStudentMatches(studentProfileId: string): Promise<ComputedMatch[]> {
  // 1. Fetch Student Scores
  const studentScores = await prisma.studentSkillScore.findMany({
    where: { studentId: studentProfileId },
    include: { skill: true }
  });

  const scoreMap = new Map<string, number>();
  studentScores.forEach(ss => scoreMap.set(ss.skillId, ss.score));

  // 2. Fetch all open internships
  const internships = await prisma.internship.findMany({
    where: { status: 'OPEN' },
    include: {
      industry: true,
    },
    orderBy: { postedAt: 'desc' }
  });

  // 3. Fetch all skills for name lookups
  const allSkills = await prisma.skill.findMany();
  const skillMap = new Map<string, { name: string; category: string }>();
  allSkills.forEach(s => skillMap.set(s.id, { name: s.name, category: s.category }));

  // 4. Fetch all courses for recommendation lookups
  const allCourses = await prisma.course.findMany({
    include: { provider: true }
  });

  const matches: ComputedMatch[] = [];

  for (const internship of internships) {
    let requiredSkills: RequiredSkill[] = [];
    try {
      requiredSkills = JSON.parse(internship.requiredSkillsJson);
    } catch {
      requiredSkills = [];
    }

    if (requiredSkills.length === 0) continue;

    let totalWeight = 0;
    let weightedFulfillmentSum = 0;
    let missingCount = 0;

    const matchedSkillsBreakdown: MatchBreakdown['matchedSkills'] = [];
    const strengths: string[] = [];
    const missingSkills: MatchBreakdown['missingSkills'] = [];

    for (const req of requiredSkills) {
      const skillInfo = skillMap.get(req.skillId) || { name: 'Unknown Skill', category: 'technical' };
      const studentScore = scoreMap.get(req.skillId) || 0;
      const targetScore = req.minScore || 70;
      const weight = req.weight || 1;

      totalWeight += weight;

      if (studentScore === 0) {
        missingCount++;
      }

      // Fulfillment ratio capped at 1.0
      const fulfillment = Math.min(1.0, studentScore / targetScore);
      weightedFulfillmentSum += weight * fulfillment;

      const isMet = studentScore >= targetScore;
      if (isMet) {
        strengths.push(skillInfo.name);
      }

      // Find recommended courses that cover this skill if there is a gap
      const gap = Math.max(0, targetScore - studentScore);
      let recommendedCourses: MatchBreakdown['missingSkills'][0]['recommendedCourses'] = [];

      if (gap > 0) {
        const matchingCourses = allCourses.filter(c => {
          try {
            const skillsCovered: SkillCovered[] = JSON.parse(c.skillsCoveredJson);
            return skillsCovered.some(sc => sc.skillId === req.skillId);
          } catch {
            return false;
          }
        });

        recommendedCourses = matchingCourses.slice(0, 2).map(c => {
          let pointsGain = 15;
          try {
            const covered: SkillCovered[] = JSON.parse(c.skillsCoveredJson);
            const found = covered.find(sc => sc.skillId === req.skillId);
            if (found) pointsGain = found.pointsGain;
          } catch {}

          return {
            courseId: c.id,
            title: c.title,
            providerName: c.provider.name,
            externalUrl: c.externalUrl,
            pointsGain,
          };
        });

        missingSkills.push({
          skillId: req.skillId,
          skillName: skillInfo.name,
          gap: Math.round(gap),
          recommendedCourses,
        });
      }

      matchedSkillsBreakdown.push({
        skillId: req.skillId,
        skillName: skillInfo.name,
        studentScore: Math.round(studentScore),
        requiredScore: Math.round(targetScore),
        weight,
        contribution: Math.round(((weight * fulfillment) / (totalWeight || 1)) * 100),
        isMet,
      });
    }

    const rawMatchPercent = totalWeight > 0 ? (weightedFulfillmentSum / totalWeight) * 100 : 0;
    const penalty = Math.min(10, missingCount * 2.5);
    const overallScore = Math.max(0, Math.min(100, Math.round(rawMatchPercent - penalty)));

    let tier: 'high' | 'medium' | 'low' = 'low';
    if (overallScore >= 80) tier = 'high';
    else if (overallScore >= 50) tier = 'medium';

    const breakdown: MatchBreakdown = {
      internshipId: internship.id,
      internshipTitle: internship.title,
      companyName: internship.industry.companyName,
      overallScore,
      tier,
      matchedSkills: matchedSkillsBreakdown,
      strengths,
      missingSkills,
    };

    matches.push({
      internshipId: internship.id,
      internshipTitle: internship.title,
      companyName: internship.industry.companyName,
      location: internship.location,
      workMode: internship.workMode,
      stipend: internship.stipend,
      status: internship.status,
      overallScore,
      tier,
      breakdown,
    });
  }

  // Sort descending by overall match score
  return matches.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Calculates match score for a single student against a single internship.
 * Used for applicant ranking in Industry view and snapshotting during application.
 */
export async function calculateSingleMatch(studentProfileId: string, internshipId: string): Promise<MatchBreakdown | null> {
  const matches = await calculateStudentMatches(studentProfileId);
  const match = matches.find(m => m.internshipId === internshipId);
  return match ? match.breakdown : null;
}
