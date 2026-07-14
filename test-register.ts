import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test_register@test.com',
        name: 'Test',
        plan: 'FREE',
        planInterval: 'YEARLY',
        password: 'test',
        forcePasswordChange: false
      }
    });
    console.log("Success:", user);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
