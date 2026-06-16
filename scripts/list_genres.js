const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const distinctCats = await prisma.course.groupBy({
    by: ['category'],
    _count: { id: true }
  });
  
  console.log('📚 DISTINCT CATALOG CATEGORIES:');
  distinctCats.forEach(c => {
    console.log(`   🏷️  "${c.category || 'Uncategorized'}" -> Count: ${c._count.id}`);
  });
}

main().finally(() => prisma.$disconnect());
