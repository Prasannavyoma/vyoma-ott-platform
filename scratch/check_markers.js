const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const markers = await prisma.videoMarker.findMany({
    where: { type: 'CHAPTER' },
    take: 10
  });
  console.log(JSON.stringify(markers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
