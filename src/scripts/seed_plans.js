const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding plans...");
  await prisma.plan.createMany({
    data: [
      { name: 'GOLD', interval: 'MONTHLY', priceINR: 499, priceUSD: 9 },
      { name: 'GOLD', interval: 'YEARLY', priceINR: 4999, priceUSD: 99 },
      { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 999, priceUSD: 19 },
      { name: 'PLATINUM', interval: 'YEARLY', priceINR: 9999, priceUSD: 199 }
    ]
  });
  console.log("Success!");
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
