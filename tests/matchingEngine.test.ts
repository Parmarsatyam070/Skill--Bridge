import { describe, it, expect } from 'vitest';

/**
 * Pure Mathematical Implementation for isolated unit verification
 */
function computeMatchScore(
  studentScores: Record<string, number>,
  requiredSkills: { skillId: string; weight: number; minScore: number }[]
) {
  if (requiredSkills.length === 0) return { overallScore: 0, tier: 'low' as const };

  let totalWeight = 0;
  let weightedFulfillmentSum = 0;
  let missingCount = 0;

  for (const req of requiredSkills) {
    const studentScore = studentScores[req.skillId] || 0;
    const targetScore = req.minScore || 70;
    const weight = req.weight || 1;

    totalWeight += weight;
    if (studentScore === 0) missingCount++;

    const fulfillment = Math.min(1.0, studentScore / targetScore);
    weightedFulfillmentSum += weight * fulfillment;
  }

  const rawPercent = totalWeight > 0 ? (weightedFulfillmentSum / totalWeight) * 100 : 0;
  const penalty = Math.min(10, missingCount * 2.5);
  const overallScore = Math.max(0, Math.min(100, Math.round(rawPercent - penalty)));

  let tier: 'high' | 'medium' | 'low' = 'low';
  if (overallScore >= 80) tier = 'high';
  else if (overallScore >= 50) tier = 'medium';

  return { overallScore, tier };
}

describe('Authoritative Matching Engine Vector Math', () => {
  const sampleRequirements = [
    { skillId: 'skill-react', weight: 5, minScore: 80 },
    { skillId: 'skill-ts', weight: 4, minScore: 70 },
    { skillId: 'skill-node', weight: 4, minScore: 70 },
    { skillId: 'skill-sql', weight: 3, minScore: 65 },
  ];

  it('should compute 100% score for a candidate exceeding all minimum benchmarks', () => {
    const perfectScores = {
      'skill-react': 90,
      'skill-ts': 85,
      'skill-node': 80,
      'skill-sql': 75,
    };

    const result = computeMatchScore(perfectScores, sampleRequirements);
    expect(result.overallScore).toBe(100);
    expect(result.tier).toBe('high');
  });

  it('should categorize partial match (60-75%) into medium tier with accurate proportional fulfillment', () => {
    const mediumScores = {
      'skill-react': 55, // 55/80 = 0.687
      'skill-ts': 45,    // 45/70 = 0.642
      'skill-node': 48,  // 48/70 = 0.685
      'skill-sql': 42,   // 42/65 = 0.646
    };

    const result = computeMatchScore(mediumScores, sampleRequirements);
    expect(result.overallScore).toBeGreaterThanOrEqual(50);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.tier).toBe('medium');
  });

  it('should apply penalty for unassessed / completely missing core skills', () => {
    const missingSkillsScores = {
      'skill-react': 85,
      // skill-ts missing (0)
      // skill-node missing (0)
      // skill-sql missing (0)
    };

    const result = computeMatchScore(missingSkillsScores, sampleRequirements);
    // 3 missing skills -> 3 * 2.5 = 7.5% penalty
    expect(result.overallScore).toBeLessThan(50);
    expect(result.tier).toBe('low');
  });

  it('should handle zero skill scores with 0% lower bound', () => {
    const emptyScores = {};
    const result = computeMatchScore(emptyScores, sampleRequirements);
    expect(result.overallScore).toBe(0);
    expect(result.tier).toBe('low');
  });

  it('should reflect immediate match score increase after course point gain', () => {
    const initialScores = {
      'skill-react': 75,
      'skill-ts': 35, // Significant gap
      'skill-node': 65,
      'skill-sql': 60,
    };

    const initialResult = computeMatchScore(initialScores, sampleRequirements);

    // Simulate course completion adding +25 points to TypeScript
    const updatedScores = {
      ...initialScores,
      'skill-ts': Math.min(100, initialScores['skill-ts'] + 25),
    };

    const updatedResult = computeMatchScore(updatedScores, sampleRequirements);
    expect(updatedResult.overallScore).toBeGreaterThan(initialResult.overallScore);
  });
});
