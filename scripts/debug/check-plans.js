const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const courses = await prisma.course.findMany({ 
    where: { title: { contains: 'Gold' } }, 
    select: { id: true, title: true, contentType: true, category: true } 
  });
  console.log('GOLD:', courses);
  const plat = await prisma.course.findMany({ 
    where: { title: { contains: 'Platinum' } }, 
    select: { id: true, title: true, contentType: true, category: true } 
  });
  console.log('PLAT:', plat);
}
run().finally(() => prisma.$disconnect());
