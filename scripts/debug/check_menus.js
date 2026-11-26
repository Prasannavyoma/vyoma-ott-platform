const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.navigationMenu.findMany();
  console.log('Navigation menus:', menus);
}

main().catch(console.error).finally(() => prisma.$disconnect());
