const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('================================================');
  console.log('🍿 POPULATING PREMIUM HOMEPAGE SECTIONS');
  console.log('================================================\n');

  // 1. Clear current sections
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM HomepageSection`);
    console.log('🧹 Dropped existing homepage row configuration.');
  } catch (e) {
    console.log('⚠️  No existing HomepageSection to clear.');
  }

  // 2. Insert the user's exact desired WordPress landing shelves
  const now = new Date().toISOString();
  const shelves = [
    ['row1', '📖 Must Read E-Books', 'EBOOK', 10, 1, now],
    ['row2', '🌟 Evergreen Epics & Puranas', 'Evergreen Epics &amp; Puranas', 20, 1, now],
    ['row3', '🎙️ Featured Podcasts', 'Devotional', 30, 1, now],
    ['row4', '📽️ Popular Videos', 'Bhakti Bhava Lahari', 40, 1, now],
    ['row5', '🎮 Interactive Games', 'Games &amp; Activities', 50, 1, now],
    ['row6', '👶 Sanskrit Kids Academy', 'Kids', 60, 1, now]
  ];

  for (const row of shelves) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO HomepageSection (id, title, category, "order", active, createdAt) VALUES (?,?,?,?,?,?)`,
      row[0], row[1], row[2], row[3], row[4], row[5]
    );
    console.log(`👉 Injected Tier Row: "${row[1]}" (Targeting: ${row[2]})`);
  }

  console.log('\n================================================');
  console.log('🎉 HOMEPAGE ROW POPULATION COMPLETED SUCCESSFULLY!');
  console.log('💻 All WordPress rows now enabled in local streaming matrix!');
  console.log('================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
