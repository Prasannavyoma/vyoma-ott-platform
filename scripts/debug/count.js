const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const published = await prisma.course.count({ where: { published: true } });
  const draft = await prisma.course.count({ where: { published: false } });
  console.log(`Published: ${published}, Draft: ${draft}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
