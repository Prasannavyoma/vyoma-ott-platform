const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const b = await prisma.course.findMany({ where: { OR: [{contentType: 'AUDIOBOOK'}, {contentType: 'AUDIO'}] }, select: { id: true, title: true, accessLevel: true, contentType: true } });
  console.log('Audiobooks:', b);
}
run().finally(() => prisma.$disconnect());
