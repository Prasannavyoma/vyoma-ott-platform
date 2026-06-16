const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const episodes = await prisma.episode.findMany({
    where: {
      OR: [
        { videoUrl: { contains: 'html' } },
        { videoUrl: { contains: 'iframe' } }
      ]
    }
  });
  
  console.log(`Found ${episodes.length} HTML/iframe episodes.`);
  
  for (const ep of episodes) {
    const markersCount = await prisma.videoMarker.count({
      where: { episodeId: ep.id }
    });
    console.log(`Episode: ${ep.title} (${ep.id}) - videoUrl: ${ep.videoUrl.substring(0, 60)}... - Markers Count: ${markersCount} - subtitleUrl: ${ep.subtitleUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
