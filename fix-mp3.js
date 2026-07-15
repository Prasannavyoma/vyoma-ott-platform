const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAudioInVideoUrl() {
  const episodes = await prisma.episode.findMany({
    where: {
      videoUrl: { endsWith: '.mp3' },
      audioUrl: null
    }
  });

  console.log(`Found ${episodes.length} episodes where an MP3 is stuck in the videoUrl field!`);
  
  if (episodes.length > 0) {
    let updated = 0;
    for (const ep of episodes) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: {
          audioUrl: ep.videoUrl,
          videoUrl: null
        }
      });
      updated++;
    }
    console.log(`Successfully migrated ${updated} mp3 urls from videoUrl to audioUrl!`);
  }
}

checkAudioInVideoUrl().then(() => prisma.$disconnect());
