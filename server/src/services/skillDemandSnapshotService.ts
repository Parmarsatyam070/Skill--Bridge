/**
 * Skill Demand Snapshot Service
 *
 * Provides deterministic calculation and storage of skill demand snapshots
 * based strictly on authentic SkillBridge opportunity requirements.
 *
 * CRITICAL SAFETY RULES:
 * - Deterministic calculation from actual Opportunity and OpportunitySkill tables.
 * - NO fake historical data generation.
 * - Idempotent upserts based on unique [skillName, snapshotDate].
 */

import { prisma } from '../config/prisma.js';

export interface SnapshotGenerationResult {
  snapshotDate: string;
  totalOpportunities: number;
  totalSkillsProcessed: number;
  snapshotsCreatedOrUpdated: number;
}

/**
 * Returns the current date in YYYY-MM format.
 */
export function getCurrentSnapshotDate(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Returns the previous month date in YYYY-MM format.
 */
export function getPreviousSnapshotDate(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Generates or updates the skill demand snapshot for the specified month (defaults to current month).
 * Aggregates all OPEN opportunities and their required skills.
 */
export async function generateCurrentSkillDemandSnapshot(
  targetDate: Date = new Date()
): Promise<SnapshotGenerationResult> {
  const snapshotDate = getCurrentSnapshotDate(targetDate);
  const prevSnapshotDate = getPreviousSnapshotDate(targetDate);

  // 1. Fetch total open opportunities
  const totalOpportunities = await prisma.opportunity.count({
    where: { status: 'OPEN' },
  });

  // 2. Fetch all opportunity skills linked to OPEN opportunities
  const oppSkills = await prisma.opportunitySkill.findMany({
    where: {
      opportunity: { status: 'OPEN' },
    },
    include: {
      skill: {
        select: { id: true, name: true, category: true },
      },
    },
  });

  // 3. Aggregate demand by skill name
  const skillMap = new Map<string, {
    skillName: string;
    category: string;
    demandCount: number;
    difficultyTotal: number;
  }>();

  for (const os of oppSkills) {
    const rawName = os.skill?.name || os.skillName || 'Unknown';
    const name = rawName.trim();
    if (!name) continue;

    const existing = skillMap.get(name);
    const weightScore = os.minScore || 70.0;

    if (existing) {
      existing.demandCount += 1;
      existing.difficultyTotal += weightScore;
    } else {
      skillMap.set(name, {
        skillName: name,
        category: os.skill?.category || 'technical',
        demandCount: 1,
        difficultyTotal: weightScore,
      });
    }
  }

  // 4. Fetch previous month snapshots to evaluate true historical trend directions
  const previousSnapshots = await prisma.skillDemandSnapshot.findMany({
    where: { snapshotDate: prevSnapshotDate },
  });
  const prevMap = new Map<string, number>();
  previousSnapshots.forEach(ps => prevMap.set(ps.skillName.toLowerCase(), ps.demandCount));

  let processedCount = 0;

  // 5. Upsert snapshot records
  for (const item of Array.from(skillMap.values())) {
    const demandPct = totalOpportunities > 0
      ? Math.round((item.demandCount / totalOpportunities) * 1000) / 10
      : 0;

    const avgDifficulty = item.demandCount > 0
      ? Math.round((item.difficultyTotal / item.demandCount) * 10) / 10
      : 50.0;

    const prevCount = prevMap.get(item.skillName.toLowerCase());
    let trendDirection: 'GROWING' | 'STABLE' | 'DECLINING' | 'EMERGING' = 'STABLE';

    if (prevCount !== undefined) {
      if (item.demandCount > prevCount * 1.1) {
        trendDirection = 'GROWING';
      } else if (item.demandCount < prevCount * 0.9) {
        trendDirection = 'DECLINING';
      } else {
        trendDirection = 'STABLE';
      }
    } else if (item.demandCount > 0 && previousSnapshots.length > 0) {
      trendDirection = 'EMERGING';
    } else {
      trendDirection = 'STABLE';
    }

    await prisma.skillDemandSnapshot.upsert({
      where: {
        skillName_snapshotDate: {
          skillName: item.skillName,
          snapshotDate,
        },
      },
      update: {
        category: item.category,
        demandCount: item.demandCount,
        demandPct,
        trendDirection,
        difficultyRating: avgDifficulty,
        source: 'SkillBridge Internal Demand',
      },
      create: {
        skillName: item.skillName,
        category: item.category,
        demandCount: item.demandCount,
        demandPct,
        trendDirection,
        difficultyRating: avgDifficulty,
        source: 'SkillBridge Internal Demand',
        snapshotDate,
      },
    });

    processedCount++;
  }

  return {
    snapshotDate,
    totalOpportunities,
    totalSkillsProcessed: skillMap.size,
    snapshotsCreatedOrUpdated: processedCount,
  };
}
