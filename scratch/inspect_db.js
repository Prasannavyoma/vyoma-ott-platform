const { PrismaClient } = require('c:/Users/Prasanna-Vyoma/.gemini/antigravity/scratch/vyoma-ott/generated/client');
const prisma = new PrismaClient();

async function main() {
  const episodes = await prisma.episode.findMany({
    select: {
      id: true,
      title: true,
      courseId: true,
      videoUrl: true
    }
  });
  console.log('📋 ALL EPISODES IN DB:');
  episodes.forEach(ep => {
    console.log(`- Course: ${ep.courseId} | ID: ${ep.id}`);
    console.log(`  Title: ${ep.title}`);
    console.log(`  URL: ${ep.videoUrl}`);
  });
}

main().finally(() => prisma.$disconnect());
