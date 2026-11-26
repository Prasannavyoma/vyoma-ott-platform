const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.course.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Gold Annual' } },
        { title: { contains: 'Gold Monthly' } },
        { title: { contains: 'Platinum Annual' } },
        { title: { contains: 'Platinum Monthly' } },
        { category: 'WooCommerce' }
      ]
    }
  });
  console.log('Deleted subscription mock courses:', result);
}
run().finally(() => prisma.$disconnect());
