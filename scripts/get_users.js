const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const progressCount = await prisma.progress.count();
  console.log(`Total Progress entries: ${progressCount}`);

  const sampleProgress = await prisma.progress.findMany({
    take: 5,
    include: {
      user: true,
      episode: {
        include: { course: true }
      }
    }
  });

  sampleProgress.forEach(p => {
    console.log(`User: ${p.user.email} | Course: ${p.episode.course.title} | Ep: ${p.episode.title} | Completed: ${p.completed}`);
  });
}

main().finally(() => prisma.$disconnect());
