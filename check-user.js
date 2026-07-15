const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser() {
  const email = 'vandana.bellur@gmail.com';
  
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      plan: 'PLATINUM',
      planInterval: 'YEARLY',
      planStartedAt: new Date(),
      planExpiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  console.log(`Successfully upgraded ${updatedUser.email} to ${updatedUser.plan}`);
}

fixUser()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
