const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying specific mandatory pricing overrides...');
  
  // Clear old ones and force rebuild accurate ones
  await prisma.plan.deleteMany();

  await prisma.plan.createMany({
    data: [
      { name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 5 },
      { name: 'GOLD', interval: 'YEARLY', priceINR: 399, priceUSD: 50 },
      { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 10 },
      { name: 'PLATINUM', interval: 'YEARLY', priceINR: 499, priceUSD: 100 }
    ]
  });

  console.log('✅ Pricing matrix successfully fully aligned to final spec!');
}

main().finally(() => prisma.$disconnect());
