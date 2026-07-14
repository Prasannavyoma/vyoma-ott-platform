import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.homepageSection.update({ where: { id: 'row1' }, data: { category: 'E-books' } });
  await prisma.homepageSection.update({ where: { id: 'row2' }, data: { category: 'Evergreen Epics & Puranas' } });
  await prisma.homepageSection.update({ where: { id: 'row5' }, data: { category: 'Games & Activities' } });
  console.log('Updated sections!');
}
run();
