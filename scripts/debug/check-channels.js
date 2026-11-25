const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const channels = await prisma.homepageChannel.findMany();
  console.log(channels);
}
run().finally(() => prisma.$disconnect());
