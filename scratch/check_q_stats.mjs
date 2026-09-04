import { prisma } from '../server/src/config/prisma.js';

async function checkQuestionStats() {
  const qCount = await prisma.question.count();
  const dsaCount = await prisma.dSAQuestion.count();
  console.log(`Total Question count: ${qCount}, DSA count: ${dsaCount}`);

  const byDomain = await prisma.question.groupBy({
    by: ['domain', 'type', 'questionType'],
    _count: { id: true },
  });
  console.log('Question breakdown by domain & type:', byDomain);
}

checkQuestionStats().catch(console.error);
