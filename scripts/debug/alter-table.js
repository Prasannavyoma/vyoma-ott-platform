const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe('ALTER TABLE "HomepageChannel" ADD COLUMN active BOOLEAN DEFAULT true;');
  console.log('Added active column');
}
run().finally(() => prisma.$disconnect());
