const { PrismaClient } = require('c:/Users/Prasanna-Vyoma/.gemini/antigravity/scratch/vyoma-ott/generated/client');
const prisma = new PrismaClient();

async function main() {
  const episodeId = '%e0%a5%a7-%e0%a4%a8%e0%a4%ae%e0%a4%b8%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%ae%e0%a5%8b-%e0%a4%a6%e0%a5%87%e0%a4%b5%e0%a4%be%e0%a4%a8%e0%a5%8d-%e0%a4%a8%e0%a4%a8%e0%a5%81-%e0%a5%a4-1-namasyamo-devan-nanu';

  // Double check if the episode exists
  const ep = await prisma.episode.findUnique({
    where: { id: episodeId }
  });

  if (!ep) {
    console.error('❌ Target episode does not exist in the database! Please make sure the database is populated.');
    return;
  }

  console.log(`💡 Seeding interactive markers for episode: "${ep.title}"`);

  // Clear existing markers for this episode
  await prisma.videoMarker.deleteMany({
    where: { episodeId }
  });

  // 1. CHAPTER marker at 5 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 5,
      type: 'CHAPTER',
      payload: JSON.stringify({ title: 'Introduction to Shloka' })
    }
  });

  // 2. XRAY_GLOSSARY marker at 10 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 10,
      type: 'XRAY_GLOSSARY',
      payload: JSON.stringify({
        title: 'नमस्यामः (Namasyāmah)',
        description: 'First person plural present tense verb meaning "We bow down" or "We pay homage to". Derived from root "nam" (to bow).',
        link: 'https://en.wiktionary.org/wiki/%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%AF%E0%A4%A4%E0%A4%BF'
      })
    }
  });

  // 3. CHANT_PROMPT marker at 15 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 15,
      type: 'CHANT_PROMPT',
      payload: JSON.stringify({
        text: 'नमस्यामो देवान्',
        transliteration: 'namasyamo devan',
        translation: 'We pay homage to the devas (gods).'
      })
    }
  });

  // 4. QUIZ_PROMPT marker at 25 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 25,
      type: 'QUIZ_PROMPT',
      payload: JSON.stringify({
        question: 'What is the grammatical root (dhatu) of the word "Namasyamah"?',
        options: ['nam', 'bhu', 'kr', 'as'],
        correctAnswer: 'nam'
      })
    }
  });

  // 5. BRANCH_PROMPT marker at 35 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 35,
      type: 'BRANCH_PROMPT',
      payload: JSON.stringify({
        question: 'Choose a learning path for the next section:',
        choices: [
          { text: 'Analyze Grammar Breakdown (Jump to 40s)', timestamp: 40 },
          { text: 'Skip to Recitation Drill (Jump to 50s)', timestamp: 50 }
        ]
      })
    }
  });

  // 6. CHAPTER marker at 40 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 40,
      type: 'CHAPTER',
      payload: JSON.stringify({ title: 'Grammar & Sandhi Breakdown' })
    }
  });

  // 7. CHAPTER marker at 50 seconds
  await prisma.videoMarker.create({
    data: {
      episodeId,
      timestamp: 50,
      type: 'CHAPTER',
      payload: JSON.stringify({ title: 'Recitation & Practical Exercises' })
    }
  });

  console.log('✅ Interactive markers successfully seeded in the database!');
}

main().finally(() => prisma.$disconnect());
