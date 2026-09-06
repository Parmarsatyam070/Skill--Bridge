import { PrismaClient } from '@prisma/client';
import { seedCatalog, seedDemoUsers, seedInstitutions } from '../server/src/services/seedService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [SkillBridge Seed] Starting complete database initialization...');
  await seedCatalog(prisma);
  await seedInstitutions(prisma);
  await seedDemoUsers(prisma);
  console.log('✅ [SkillBridge Seed] Finished complete database seed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ [SkillBridge Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
