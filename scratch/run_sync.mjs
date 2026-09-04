import { syncDSAQuestionsDatabase } from '../dist/server/src/services/questionSelectionService.js';
import { prisma } from '../dist/server/src/config/prisma.js';

async function main() {
  console.log('--- Starting DSA Database Sync ---');
  const count = await syncDSAQuestionsDatabase();
  console.log('Total questions in DB after sync:', count);

  const all = await prisma.dSAQuestion.findMany();
  const sampleCount = all.filter(
    (q) =>
      q.testCasesJson &&
      (q.testCasesJson.includes('sample') ||
        q.testCasesJson.includes('output_1') ||
        q.testCasesJson.includes('sample_output'))
  ).length;

  console.log('Placeholder questions remaining in DB:', sampleCount);
  console.log('Authentic questions in DB:', all.length - sampleCount);

  // Print 5 questions to inspect metadata
  for (const q of all.slice(0, 5)) {
    console.log(`- [${q.slug}] ${q.title} (fn: ${q.entryFunctionName})`);
    console.log('  testCases:', q.testCasesJson);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
