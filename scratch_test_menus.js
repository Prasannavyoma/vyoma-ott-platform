require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.navigationMenu.findMany({
    where: { parentId: null, isFooter: false },
    include: { children: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' }
  });
  console.log("Top-level menus count:", items.length);
  for (const item of items) {
    console.log(`- ${item.label} (${item.url}) [${item.children.length} children]`);
    for (const c of item.children) {
      console.log(`    * ${c.label} -> ${c.url}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
