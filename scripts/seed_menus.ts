import { PrismaClient } from '../generated/client';
const prisma = new PrismaClient();

async function run() {
  await prisma.navigationMenu.deleteMany();

  const home = await prisma.navigationMenu.create({ data: { label: 'Home', url: '/', order: 1 } });
  
  const genre = await prisma.navigationMenu.create({ data: { label: 'Genre', url: '#', order: 2 } });
  const sub1 = await prisma.navigationMenu.create({ data: { label: 'World of Chants', url: '/genre/world-of-chants', order: 1, parentId: genre.id } });
  const sub2 = await prisma.navigationMenu.create({ data: { label: 'Bhakti Bhava Lahari', url: '/genre/bhakti-bhava-lahari', order: 2, parentId: genre.id } });

  const media = await prisma.navigationMenu.create({ data: { label: 'Media', url: '#', order: 3 } });
  await prisma.navigationMenu.create({ data: { label: 'Audiobooks', url: '/media/audiobooks', order: 1, parentId: media.id } });
  await prisma.navigationMenu.create({ data: { label: 'Podcasts', url: '/media/podcasts', order: 2, parentId: media.id } });

  await prisma.navigationMenu.create({ data: { label: 'E-books', url: '/e-books', order: 4 } });
  await prisma.navigationMenu.create({ data: { label: 'Subscribe', url: '/subscribe', order: 5 } });

  console.log("Navigation seeds successfully planted.");
}

run().catch(console.error);
