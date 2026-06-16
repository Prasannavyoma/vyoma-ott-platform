const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const episodes = await prisma.episode.findMany({
    select: { videoUrl: true }
  });
  
  const formats = new Set();
  const rawIframeSrcs = new Set();
  
  for (const ep of episodes) {
    if (!ep.videoUrl) continue;
    const url = ep.videoUrl.trim();
    if (url.toLowerCase().startsWith('<iframe')) {
      const match = url.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        const src = match[1];
        rawIframeSrcs.add(src);
        formats.add(`IFRAME: ${src.substring(src.lastIndexOf('.'))}`);
      } else {
        formats.add(`IFRAME MATCH FAILED: ${url.substring(0, 100)}`);
      }
    } else {
      const lastDot = url.lastIndexOf('.');
      if (lastDot !== -1) {
        formats.add(`DIRECT: ${url.substring(lastDot)}`);
      } else {
        formats.add(`DIRECT NO DOT: ${url}`);
      }
    }
  }
  
  console.log("Formats in database:");
  console.log(Array.from(formats));
  console.log("\nSome iframe src examples:");
  console.log(Array.from(rawIframeSrcs).slice(0, 15));
}

main().catch(console.error).finally(() => prisma.$disconnect());
