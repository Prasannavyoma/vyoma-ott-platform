import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Wiping existing header menus...");
  // Delete all existing header menus
  await prisma.navigationMenu.deleteMany({
    where: { isFooter: false }
  });

  console.log("Seeding authentic WordPress menus...");
  
  // 1. Genre Menu
  const genreMenu = await prisma.navigationMenu.create({
    data: {
      label: 'Genre',
      url: '#',
      order: 10,
      isFooter: false
    }
  });

  const genres = [
    { label: 'World of Chants', url: '/genre/World-of-Chants' },
    { label: 'Bhakti Bhava Lahari', url: '/genre/Bhakti-Bhava-Lahari' },
    { label: 'Language Learning', url: '/genre/Language-Learning' },
    { label: 'Grammar Simplified', url: '/genre/Grammar-Simplified' },
    { label: 'Stories & Subhashitas', url: '/genre/Stories-Subhashitas' },
    { label: 'Literature', url: '/genre/Literature' },
    { label: 'Evergreen Epics & Puranas', url: '/genre/Evergreen-Epics-Puranas' },
    { label: 'Roots of Dharma', url: '/genre/Roots-of-Dharma' },
    { label: 'IKS', url: '/genre/IKS' },
    { label: 'Games & Activities', url: '/genre/Games-Activities' },
    { label: 'Kids', url: '/genre/Kids' },
    { label: 'Gita', url: '/genre/Gita' },
    { label: 'Vedanta', url: '/genre/Vedanta' },
    { label: 'Shaastra Studies', url: '/genre/Shaastra-Studies' }
  ];

  for (let i = 0; i < genres.length; i++) {
    await prisma.navigationMenu.create({
      data: {
        label: genres[i].label,
        url: genres[i].url,
        order: (i + 1) * 10,
        parentId: genreMenu.id,
        isFooter: false
      }
    });
  }

  // 2. Media Menu
  const mediaMenu = await prisma.navigationMenu.create({
    data: {
      label: 'Media',
      url: '#',
      order: 20,
      isFooter: false
    }
  });

  const media = [
    { label: 'Audiobooks', url: '/genre/Audiobook' },
    { label: 'Podcasts', url: '/genre/Podcast' },
    { label: 'Videos', url: '/genre/video' },
    { label: 'Game-based Learning', url: '/genre/Game' },
    { label: 'Learning Programs', url: '/genre/learning-program' },
    { label: 'E-books', url: '/genre/E-books' },
    { label: 'Games', url: '/genre/Games' }
  ];

  for (let i = 0; i < media.length; i++) {
    await prisma.navigationMenu.create({
      data: {
        label: media[i].label,
        url: media[i].url,
        order: (i + 1) * 10,
        parentId: mediaMenu.id,
        isFooter: false
      }
    });
  }

  // 3. About Us
  await prisma.navigationMenu.create({
    data: {
      label: 'About Us',
      url: '/about-us',
      order: 30,
      isFooter: false
    }
  });

  console.log("Menu seeding complete!");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
