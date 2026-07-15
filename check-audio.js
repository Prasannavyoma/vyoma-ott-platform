const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAudioCourses() {
  const amarakosha = await prisma.course.findMany({
    where: { title: { contains: 'Amarakosha', mode: 'insensitive' } },
    include: {
      episodes: true
    }
  });
  
  console.log("Amarakosha Courses Found:", amarakosha.length);
  for (const course of amarakosha) {
    console.log(`Course: ${course.title} (ID: ${course.id}) - Category: ${course.category} - Total Episodes: ${course.episodes.length}`);
    if (course.episodes.length > 0) {
      console.log(`  First 2 episodes:`, course.episodes.slice(0, 2).map(e => ({ id: e.id, title: e.title, audioUrl: e.audioUrl, videoUrl: e.videoUrl })));
    }
  }

  // Check all courses with "audio" in the title or category
  const audioCourses = await prisma.course.findMany({
    where: { 
      OR: [
        { category: { contains: 'Audio', mode: 'insensitive' } },
        { title: { contains: 'Audio', mode: 'insensitive' } }
      ]
    },
    include: { episodes: true }
  });

  console.log(`\nTotal Audio-related Courses: ${audioCourses.length}`);
  let missingEpisodes = 0;
  for (const c of audioCourses) {
    if (c.episodes.length === 0) {
      missingEpisodes++;
      console.log(`  Missing episodes in: ${c.title} (ID: ${c.id})`);
    }
  }
  console.log(`Courses missing episodes: ${missingEpisodes}`);
}

checkAudioCourses().then(() => prisma.$disconnect());
