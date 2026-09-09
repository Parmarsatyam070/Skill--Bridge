/**
 * SkillBridge Industry Demo Multi-Dataset Seeder
 *
 * Imports 5 candidate datasets (410 records total):
 * 1. 4763fc85-ae28-42d6-b2b6-97a0f900159b.csv -> SkillBridge Benchmark (150 rows)
 * 2. sharda_university_dataset.csv -> Sharda University (80 rows)
 * 3. galgotias_university_dataset.csv -> Galgotias University (50 rows)
 * 4. bennett_university_dataset.csv -> Bennett University (60 rows)
 * 5. gautam_buddha_university_dataset.csv -> Gautam Buddha University (70 rows)
 *
 * Rules:
 * - 410 unique candidates, exactly 1 skill record per candidate in current dataset.
 * - Idempotent upserts.
 * - Seeds demo opportunities and deterministic demo applications.
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';

export interface RawCsvRecord {
  studentName: string;
  externalStudentId: string;
  university: string;
  branch: string;
  sourceDomain: string | null;
  derivedDomain: string;
  skill: string;
  skillCategory: string;
  overallSkillScore: number;
  sourceDataset: string;
}

export const DATASET_CONFIGS = [
  {
    filename: '4763fc85-ae28-42d6-b2b6-97a0f900159b.csv',
    university: 'SkillBridge Benchmark',
    hasDomainCol: true,
  },
  {
    filename: 'sharda_university_dataset.csv',
    university: 'Sharda University',
    hasDomainCol: false,
  },
  {
    filename: 'galgotias_university_dataset.csv',
    university: 'Galgotias University',
    hasDomainCol: false,
  },
  {
    filename: 'bennett_university_dataset.csv',
    university: 'Bennett University',
    hasDomainCol: false,
  },
  {
    filename: 'gautam_buddha_university_dataset.csv',
    university: 'Gautam Buddha University',
    hasDomainCol: false,
  },
];

export const DEMO_OPPORTUNITIES = [
  {
    title: 'Software Engineer',
    department: 'Engineering',
    roleType: 'Full-time',
    location: 'Bangalore / Hybrid',
    requiredSkills: ['TypeScript', 'React.js', 'Express.js', 'PostgreSQL'],
    description: 'Build robust, scalable full-stack web applications and microservices using TypeScript, modern React frontend architecture, Express APIs, and PostgreSQL database optimization.',
    minScoreThreshold: 65,
  },
  {
    title: 'Full Stack Developer',
    department: 'Product Development',
    roleType: 'Full-time',
    location: 'Remote',
    requiredSkills: ['React.js', 'Express.js', 'PostgreSQL', 'TypeScript'],
    description: 'Design dynamic user interfaces and resilient backend systems. Deliver end-to-end features with high test coverage and clean architectural separation.',
    minScoreThreshold: 65,
  },
  {
    title: 'Frontend Engineer',
    department: 'UI/UX Engineering',
    roleType: 'Full-time',
    location: 'Hyderabad / Hybrid',
    requiredSkills: ['React.js', 'TypeScript', 'Technical Communication'],
    description: 'Craft responsive, accessible web interfaces and component design systems with state management, clean TypeScript typing, and strong cross-team collaboration.',
    minScoreThreshold: 60,
  },
  {
    title: 'Backend Systems Engineer',
    department: 'Infrastructure & Core',
    roleType: 'Full-time',
    location: 'Pune / Hybrid',
    requiredSkills: ['Express.js', 'PostgreSQL', 'System Design & Architecture'],
    description: 'Develop high-throughput RESTful services, database query plans, connection pooling, and distributed microservices with architectural excellence.',
    minScoreThreshold: 65,
  },
  {
    title: 'Cloud & Systems Architect',
    department: 'Platform Engineering',
    roleType: 'Full-time',
    location: 'Gurugram / On-site',
    requiredSkills: ['System Design & Architecture', 'Express.js', 'PostgreSQL'],
    description: 'Lead distributed system design, high-availability architecture, caching strategies, and robust data persistence models.',
    minScoreThreshold: 70,
  },
  {
    title: 'Technical Associate / Analyst',
    department: 'Technology Operations',
    roleType: 'Full-time',
    location: 'Noida / Hybrid',
    requiredSkills: ['Technical Communication', 'PostgreSQL', 'React.js'],
    description: 'Bridge technology and business execution with SQL data analysis, workflow automation, and cross-functional technical communication.',
    minScoreThreshold: 60,
  },
];

export function deriveDomain(branch: string, skill: string): string {
  const b = branch.toLowerCase();
  const s = skill.toLowerCase();
  if (b.includes('ai') || b.includes('ml') || s.includes('machine learning') || s.includes('data')) {
    return 'Technical';
  }
  if (b.includes('cloud') || b.includes('cyber') || b.includes('network')) {
    return 'Technical';
  }
  return 'Technical';
}

/**
 * Parses and validates one dataset file
 */
export function parseDatasetFile(filePath: string, university: string, hasDomainCol: boolean, filename: string): RawCsvRecord[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Seeder] File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const records: RawCsvRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 5) continue;

    let studentName = '';
    let externalStudentId = '';
    let branch = '';
    let skill = '';
    let skillCategory = '';
    let scoreStr = '';
    let sourceDomain: string | null = null;

    if (hasDomainCol) {
      // Student Name,Student ID,Domain,Branch,Skill,Skill Category,Overall Skill Score
      studentName = cols[0] || 'Anonymous Candidate';
      externalStudentId = cols[1] || `DEMO_${i}`;
      sourceDomain = cols[2] || 'Technical';
      branch = cols[3] || 'Computer Science';
      skill = cols[4] || 'Technical';
      skillCategory = cols[5] || 'Technical';
      scoreStr = cols[6] || '70';
    } else {
      // Student Name,Student ID,Branch,Skill,Skill Category,Overall Skill Score
      studentName = cols[0] || 'Anonymous Candidate';
      externalStudentId = cols[1] || `DEMO_${i}`;
      sourceDomain = null;
      branch = cols[2] || 'Computer Science';
      skill = cols[3] || 'Technical';
      skillCategory = cols[4] || 'Technical';
      scoreStr = cols[5] || '70';
    }

    const overallSkillScore = parseFloat(scoreStr);
    if (isNaN(overallSkillScore) || overallSkillScore < 0 || overallSkillScore > 100) {
      continue;
    }

    records.push({
      studentName,
      externalStudentId,
      university,
      branch,
      sourceDomain,
      derivedDomain: deriveDomain(branch, skill),
      skill,
      skillCategory,
      overallSkillScore: Math.round(overallSkillScore * 10) / 10,
      sourceDataset: filename,
    });
  }

  return records;
}

/**
 * Main seeding execution function
 */
export async function seedIndustryDemoDataset(baseDir?: string) {
  const dataDir = baseDir || path.join(process.cwd(), 'server', 'data', 'industry');

  console.log(`\n==============================================`);
  console.log(`  SkillBridge Industry Demo Multi-Seeder      `);
  console.log(`==============================================`);
  console.log(`Loading datasets from: ${dataDir}`);

  const allRecords: RawCsvRecord[] = [];
  const perFileSummary: Record<string, number> = {};

  for (const cfg of DATASET_CONFIGS) {
    const filePath = path.join(dataDir, cfg.filename);
    const parsed = parseDatasetFile(filePath, cfg.university, cfg.hasDomainCol, cfg.filename);
    perFileSummary[cfg.university] = parsed.length;
    allRecords.push(...parsed);
  }

  console.log(`\nFound ${allRecords.length} total records across ${DATASET_CONFIGS.length} datasets:`);
  for (const [source, count] of Object.entries(perFileSummary)) {
    console.log(`  - ${source}: ${count} records`);
  }

  // 1. Group records by unique candidate (externalStudentId)
  const candidateMap = new Map<string, {
    candidate: RawCsvRecord;
    skills: Array<{ skill: string; skillCategory: string; skillScore: number }>;
  }>();

  for (const r of allRecords) {
    if (!candidateMap.has(r.externalStudentId)) {
      candidateMap.set(r.externalStudentId, {
        candidate: r,
        skills: [],
      });
    }
    const entry = candidateMap.get(r.externalStudentId)!;
    if (!entry.skills.some(s => s.skill === r.skill)) {
      entry.skills.push({
        skill: r.skill,
        skillCategory: r.skillCategory,
        skillScore: r.overallSkillScore,
      });
    }
  }

  console.log(`\nUnique candidate identities: ${candidateMap.size}`);

  // 2. Batch upsert candidates and skills
  let candidatesUpserted = 0;
  const candidateEntries = Array.from(candidateMap.values());
  const batchSize = 25;

  for (let i = 0; i < candidateEntries.length; i += batchSize) {
    const batch = candidateEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ({ candidate, skills }) => {
        const avg = skills.reduce((sum, s) => sum + s.skillScore, 0) / skills.length;
        const candidateRecord = await (prisma as any).industryDemoCandidate.upsert({
          where: { externalStudentId: candidate.externalStudentId },
          create: {
            externalStudentId: candidate.externalStudentId,
            studentName: candidate.studentName,
            university: candidate.university,
            branch: candidate.branch,
            sourceDomain: candidate.sourceDomain,
            derivedDomain: candidate.derivedDomain,
            averageScore: Math.round(avg * 10) / 10,
            sourceDataset: candidate.sourceDataset,
            source: 'DEMO_DATASET',
          },
          update: {
            studentName: candidate.studentName,
            university: candidate.university,
            branch: candidate.branch,
            sourceDomain: candidate.sourceDomain,
            derivedDomain: candidate.derivedDomain,
            averageScore: Math.round(avg * 10) / 10,
            sourceDataset: candidate.sourceDataset,
            source: 'DEMO_DATASET',
          },
        });

        // Upsert candidate skill records
        for (const sk of skills) {
          await (prisma as any).industryDemoCandidateSkill.upsert({
            where: {
              candidateId_skill: {
                candidateId: candidateRecord.id,
                skill: sk.skill,
              },
            },
            create: {
              candidateId: candidateRecord.id,
              skill: sk.skill,
              skillCategory: sk.skillCategory,
              skillScore: sk.skillScore,
            },
            update: {
              skillCategory: sk.skillCategory,
              skillScore: sk.skillScore,
            },
          });
        }
        candidatesUpserted++;
      })
    );
  }

  // 3. Seed Demo Opportunities
  console.log(`\nSeeding ${DEMO_OPPORTUNITIES.length} demo opportunities...`);
  const seededOpportunities: any[] = [];

  for (const opp of DEMO_OPPORTUNITIES) {
    const existing = await (prisma as any).industryDemoOpportunity.findFirst({
      where: { title: opp.title, source: 'DEMO_DATASET' },
    });

    let savedOpp: any;
    if (existing) {
      savedOpp = await (prisma as any).industryDemoOpportunity.update({
        where: { id: existing.id },
        data: {
          department: opp.department,
          roleType: opp.roleType,
          location: opp.location,
          requiredSkillsJson: JSON.stringify(opp.requiredSkills),
          description: opp.description,
          minScoreThreshold: opp.minScoreThreshold,
        },
      });
    } else {
      savedOpp = await (prisma as any).industryDemoOpportunity.create({
        data: {
          title: opp.title,
          department: opp.department,
          roleType: opp.roleType,
          location: opp.location,
          requiredSkillsJson: JSON.stringify(opp.requiredSkills),
          description: opp.description,
          minScoreThreshold: opp.minScoreThreshold,
          source: 'DEMO_DATASET',
        },
      });
    }
    seededOpportunities.push(savedOpp);
  }

  // 4. Create deterministic applications for demo opportunities
  console.log(`Generating deterministic candidate applications for demo opportunities...`);
  const allDbCandidates = await (prisma as any).industryDemoCandidate.findMany({
    where: { source: 'DEMO_DATASET' },
    include: { skills: true },
  });

  let applicationsCreated = 0;
  const appOps: any[] = [];

  for (const opp of seededOpportunities) {
    const requiredSkills: string[] = JSON.parse(opp.requiredSkillsJson);

    for (const cand of allDbCandidates) {
      const candSkills: Array<{ skill: string; skillScore: number }> = cand.skills;
      const matched = candSkills.filter(cs =>
        requiredSkills.some(rs => rs.toLowerCase() === cs.skill.toLowerCase())
      );

      // Only apply if candidate has at least 1 relevant skill
      if (matched.length === 0) continue;

      const coverageRatio = `${matched.length}/${requiredSkills.length}`;
      const matchedScoresAvg = matched.reduce((sum, s) => sum + s.skillScore, 0) / matched.length;

      // Coverage weight (40%) + Skill score weight (60%)
      const matchScore = Math.round(
        ((matched.length / requiredSkills.length) * 40 + (matchedScoresAvg * 0.6)) * 10
      ) / 10;

      const missing = requiredSkills.filter(rs =>
        !candSkills.some(cs => cs.skill.toLowerCase() === rs.toLowerCase())
      );

      // Deterministic pipeline stage based on matchScore and ID hash
      let stage = 'APPLIED';
      const idNum = parseInt(cand.externalStudentId.replace(/\D/g, '') || '0', 10);
      if (matchScore >= 62 && idNum % 7 === 0) {
        stage = 'HIRED';
      } else if (matchScore >= 56 && idNum % 5 === 0) {
        stage = 'INTERVIEW_SCHEDULED';
      } else if (matchScore >= 50 && idNum % 3 === 0) {
        stage = 'ASSESSMENT_COMPLETED';
      } else if (matchScore >= 44) {
        stage = 'SHORTLISTED';
      }

      appOps.push({
        opportunityId: opp.id,
        candidateId: cand.id,
        matchScore,
        coverageRatio,
        matched,
        missing,
        stage,
      });
    }
  }

  // Batch upsert applications in chunks of 25
  for (let i = 0; i < appOps.length; i += 25) {
    const batch = appOps.slice(i, i + 25);
    await Promise.all(
      batch.map(async (op) => {
        await (prisma as any).industryDemoApplication.upsert({
          where: {
            opportunityId_candidateId: {
              opportunityId: op.opportunityId,
              candidateId: op.candidateId,
            },
          },
          create: {
            opportunityId: op.opportunityId,
            candidateId: op.candidateId,
            matchScore: op.matchScore,
            skillCoverageRatio: op.coverageRatio,
            knownSkillsJson: JSON.stringify(op.matched),
            missingSkillsJson: JSON.stringify(op.missing),
            stage: op.stage,
            source: 'DEMO_DATASET',
          },
          update: {
            matchScore: op.matchScore,
            skillCoverageRatio: op.coverageRatio,
            knownSkillsJson: JSON.stringify(op.matched),
            missingSkillsJson: JSON.stringify(op.missing),
            stage: op.stage,
            source: 'DEMO_DATASET',
          },
        });
        applicationsCreated++;
      })
    );
  }

  // 5. Compute dynamic statistics
  const distinctSkills = new Set(allRecords.map(r => r.skill));
  const distinctCategories = new Set(allRecords.map(r => r.skillCategory));
  const distinctBranches = new Set(allRecords.map(r => r.branch));
  const distinctUniversities = new Set(allRecords.map(r => r.university));
  const allScores = allRecords.map(r => r.overallSkillScore);
  const avgOverall = Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100;

  console.log(`\n----------------------------------------------`);
  console.log(`  Industry Demo Seeding Summary               `);
  console.log(`----------------------------------------------`);
  console.log(`Total Records Processed:     ${allRecords.length}`);
  console.log(`Unique Candidates Upserted:  ${candidatesUpserted}`);
  console.log(`Universities (Sources):      ${distinctUniversities.size} (4 Universities + Benchmark)`);
  console.log(`Distinct Branches:           ${distinctBranches.size}`);
  console.log(`Distinct Skills:             ${distinctSkills.size}`);
  console.log(`Skill Categories:            ${distinctCategories.size}`);
  console.log(`Average Benchmark Score:     ${avgOverall}%`);
  console.log(`Demo Opportunities Created:  ${seededOpportunities.length}`);
  console.log(`Demo Applications Mapped:    ${applicationsCreated}`);
  console.log(`Source Tag:                  DEMO_DATASET`);
  console.log(`----------------------------------------------\n`);

  return {
    totalRecords: allRecords.length,
    uniqueCandidates: candidatesUpserted,
    universitiesCount: distinctUniversities.size,
    branchesCount: distinctBranches.size,
    skillsCount: distinctSkills.size,
    categoriesCount: distinctCategories.size,
    averageScore: avgOverall,
    opportunitiesCount: seededOpportunities.length,
    applicationsCount: applicationsCreated,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith('seedIndustryDemo.ts') || process.argv[1]?.endsWith('seedIndustryDemo.js')) {
  seedIndustryDemoDataset()
    .then(() => {
      console.log('✅ Industry Demo seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Industry Demo seeding failed:', err);
      process.exit(1);
    });
}
