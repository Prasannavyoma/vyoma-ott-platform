const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  const free = users.filter(u => u.plan === 'FREE').length;
  console.log('Free users:', free);
  const others = users.filter(u => u.plan !== 'FREE');
  console.log('Other users:', others.map(u => u.email + ' - ' + u.plan));
}
run().finally(() => prisma.$disconnect());
