const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const markers = await prisma.videoMarker.findMany({
    where: {
      payload: { contains: 'page' }
    }
  });
  console.log(`Found ${markers.length} markers containing 'page' in payload.`);
  if (markers.length > 0) {
    console.log(JSON.stringify(markers, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
