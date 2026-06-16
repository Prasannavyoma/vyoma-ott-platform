const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      coins: true,
      plan: true
    }
  });
  console.log("=== DB USERS ===");
  console.log(JSON.stringify(users, null, 2));
  
  const referrals = await prisma.referral.findMany();
  console.log("=== DB REFERRALS ===");
  console.log(JSON.stringify(referrals, null, 2));

  const rewards = await prisma.referralReward.findMany();
  console.log("=== DB MILESTONES ===");
  console.log(JSON.stringify(rewards, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
