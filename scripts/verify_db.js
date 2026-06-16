const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const courseCount = await prisma.course.count();
  const episodeCount = await prisma.episode.count();
  const userCount = await prisma.user.count();

  console.log(`📊 DB STATS REPORT:`);
  console.log(`   Courses: ${courseCount}`);
  console.log(`   Episodes: ${episodeCount}`);
  console.log(`   Users: ${userCount}`);

  const coursesWithEps = await prisma.course.findMany({
    include: {
      _count: {
        select: { episodes: true }
      }
    }
  });

  console.log('\n📺 COURSE DETAIL SAMPLING:');
  let withEps = 0;
  coursesWithEps.forEach(c => {
    if (c._count.episodes > 0) {
      withEps++;
      console.log(`   ✅ "${c.title}" (ID: ${c.id}) -> ${c._count.episodes} episodes`);
    } else {
      console.log(`   ❌ "${c.title}" (ID: ${c.id}) -> 0 episodes`);
    }
  });

  console.log(`\n📈 Conclusion: Out of ${courseCount} courses, ${withEps} have active episodes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
