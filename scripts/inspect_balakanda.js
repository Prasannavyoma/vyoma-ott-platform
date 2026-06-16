const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const balakanda = await prisma.course.findUnique({
    where: { id: 'english-discourse-on-balakanda-of-srimad-valmiki-ramayana' },
    include: { episodes: true }
  });
  
  if (balakanda) {
    console.log(`📚 Balakanda Course: "${balakanda.title}"`);
    balakanda.episodes.forEach(ep => {
      console.log(`   👉 Ep: "${ep.title}" (Slug: ${ep.id})`);
    });
  }
}

main().finally(() => prisma.$disconnect());
