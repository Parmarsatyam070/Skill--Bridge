import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';

export interface CsvValidationResult {
  totalRows: number;
  imported: number;
  skipped: number;
  invalid: number;
  duplicates: number;
  errors: string[];
}

export interface ParsedSkillRecord {
  studentName: string;
  externalStudentId: string;
  domain: string;
  branch: string;
  skill: string;
  skillCategory: string;
  overallSkillScore: number;
}

/**
 * Parses and validates CSV rows
 */
export function parseAndValidateCsv(csvContent: string): {
  validRecords: ParsedSkillRecord[];
  invalidRows: { rowNumber: number; reason: string; raw: string }[];
  totalRows: number;
} {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    return { validRecords: [], invalidRows: [], totalRows: 0 };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const expectedHeaders = [
    'Student Name',
    'Student ID',
    'Domain',
    'Branch',
    'Skill',
    'Skill Category',
    'Overall Skill Score',
  ];

  const headerValid = expectedHeaders.every((eh, i) => headers[i] && headers[i].toLowerCase() === eh.toLowerCase());
  if (!headerValid) {
    throw new Error(`Invalid CSV headers. Expected: ${expectedHeaders.join(', ')}`);
  }

  const validRecords: ParsedSkillRecord[] = [];
  const invalidRows: { rowNumber: number; reason: string; raw: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const rowNumber = i + 1;

    // Split considering simple CSV format without quoted commas
    const cols = raw.split(',').map(c => c.trim());
    if (cols.length < 7) {
      invalidRows.push({ rowNumber, reason: 'Insufficient columns (expected 7)', raw });
      continue;
    }

    const [studentName, externalStudentId, domain, branch, skill, skillCategory, scoreStr] = cols;

    if (!studentName || !externalStudentId || !domain || !branch || !skill || !skillCategory) {
      invalidRows.push({ rowNumber, reason: 'Missing required text field', raw });
      continue;
    }

    const overallSkillScore = parseFloat(scoreStr);
    if (isNaN(overallSkillScore) || overallSkillScore < 0 || overallSkillScore > 100) {
      invalidRows.push({ rowNumber, reason: `Invalid score value '${scoreStr}' (must be 0-100)`, raw });
      continue;
    }

    validRecords.push({
      studentName,
      externalStudentId,
      domain,
      branch,
      skill,
      skillCategory,
      overallSkillScore: Math.round(overallSkillScore * 10) / 10,
    });
  }

  return {
    validRecords,
    invalidRows,
    totalRows: lines.length - 1,
  };
}

/**
 * Main seeding execution function
 */
export async function seedAcademicDataset(csvPath?: string): Promise<CsvValidationResult> {
  const filePath = csvPath || path.join(process.cwd(), 'server', 'data', 'academic-skill-dataset.csv');

  console.log(`\n========================================`);
  console.log(`  SkillBridge Academic Dataset Seeder   `);
  console.log(`========================================`);
  console.log(`Loading dataset from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found at path: ${filePath}`);
  }

  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const { validRecords, invalidRows, totalRows } = parseAndValidateCsv(csvContent);

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const inv of invalidRows) {
    errors.push(`Row ${inv.rowNumber}: ${inv.reason}`);
  }

  // Idempotent upsert in database using concurrent batches
  const batchSize = 10;
  for (let i = 0; i < validRecords.length; i += batchSize) {
    const batch = validRecords.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (rec) => {
        try {
          const res = await prisma.academicSkillDataset.upsert({
            where: {
              externalStudentId_skill: {
                externalStudentId: rec.externalStudentId,
                skill: rec.skill,
              },
            },
            create: {
              studentName: rec.studentName,
              externalStudentId: rec.externalStudentId,
              domain: rec.domain,
              branch: rec.branch,
              skill: rec.skill,
              skillCategory: rec.skillCategory,
              overallSkillScore: rec.overallSkillScore,
              source: 'DEMO_DATASET',
            },
            update: {
              studentName: rec.studentName,
              domain: rec.domain,
              branch: rec.branch,
              skillCategory: rec.skillCategory,
              overallSkillScore: rec.overallSkillScore,
              source: 'DEMO_DATASET',
            },
          });
          imported++;
        } catch (err: any) {
          skipped++;
          errors.push(`Failed to import ${rec.studentName} - ${rec.skill}: ${err.message}`);
        }
      })
    );
  }

  console.log(`\n----------------------------------------`);
  console.log(`Academic Dataset Import Summary`);
  console.log(`----------------------------------------`);
  console.log(`Total rows processed: ${totalRows}`);
  console.log(`Successfully upserted: ${imported}`);
  console.log(`Skipped / Errors:    ${skipped}`);
  console.log(`Invalid format rows: ${invalidRows.length}`);
  console.log(`Source Tag:          DEMO_DATASET`);
  console.log(`----------------------------------------\n`);

  return {
    totalRows,
    imported,
    skipped,
    invalid: invalidRows.length,
    duplicates,
    errors,
  };
}

// Direct CLI execution
if (process.argv[1]?.endsWith('seedAcademicDataset.ts') || process.argv[1]?.endsWith('seedAcademicDataset.js')) {
  seedAcademicDataset()
    .then(() => {
      console.log('✅ Academic Dataset seeding finished successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Academic Dataset seeding failed:', err);
      process.exit(1);
    });
}
