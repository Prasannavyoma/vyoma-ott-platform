const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMeiliConfig() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'MEILISEARCH' } }
  });
  console.log(settings);
}

checkMeiliConfig().then(() => prisma.$disconnect());
