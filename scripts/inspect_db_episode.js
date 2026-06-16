const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const ep = await prisma.episode.findUnique({
    where: { id: 'svara_s' }
  });
  console.log('📋 LOCAL DB EPISODE STATE:');
  console.log(JSON.stringify(ep, null, 2));
}

main().finally(() => prisma.$disconnect());
