const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Beginning injection of REAL production asset data...');

  const courses = [
    {
      title: "Srimad-Valmiki-Ramayanam Balakandah",
      description: "Embark on the sacred journey of the Rama incarnation. From the birth of Rama to his marriage with Sita, explore the detailed narrative structure of the epic's very first book.",
      thumbnailUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg",
      category: "Evergreen Epics & Puranas",
      accessLevel: "PLATINUM",
      featuredInSlider: true,
      views: 145
    },
    {
      title: "Srimad-Valmiki-Ramayanam Ayodhyakandah",
      description: "Experience the intense drama of Ayodhya, from preparations for the coronation to the heart-wrenching exile. Understand pure dharma and detachment.",
      thumbnailUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/04/May-Images-2.jpg",
      category: "Evergreen Epics & Puranas",
      accessLevel: "GOLD",
      featuredInSlider: false,
      views: 98
    },
    {
      title: "Raghuveera Gadyam Chanting",
      description: "Listen and learn the rhythmic cadence and spiritual power of the famous Raghuveera Gadyam. Master the precise pronunciation of these divine syllables.",
      thumbnailUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/04/May-Images-49.jpg",
      category: "World of Chants",
      accessLevel: "FREE",
      featuredInSlider: false,
      views: 230
    },
    {
      title: "Samskrita Bhasha Pravesha",
      description: "The perfect starting line for Absolute Beginners. Introduce yourself to basic Sanskrit conversations, grammatical anchors, and everyday vocabulary flawlessly.",
      thumbnailUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/04/May-Images-48.jpg",
      category: "Language Learning",
      accessLevel: "GOLD",
      featuredInSlider: false,
      views: 77
    }
  ];

  for (const c of courses) {
    // Use upsert so we don't duplicate on rerun
    await prisma.course.upsert({
      where: { id: c.title.replace(/\s+/g, '-').toLowerCase() }, // Temporary unique mapping
      create: {
        id: c.title.replace(/\s+/g, '-').toLowerCase(),
        ...c
      },
      update: c
    });
    console.log(`Synchronized: ${c.title}`);
  }
  
  console.log('✅ Data synchronization complete! Verify homepage now.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
