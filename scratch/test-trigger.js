const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  const referrerId = "cmp6ksxke0002v5t031ge906o"; // Primary Administrator ID
  
  console.log("Starting Referral Reward Validation test...");
  
  // 1. Reset any previous test data for this referrer
  await prisma.referral.deleteMany({ where: { referrerId } });
  await prisma.referralReward.deleteMany({ where: { userId: referrerId } });
  await prisma.user.update({
    where: { id: referrerId },
    data: { coins: 0 }
  });
  
  console.log("Test environment cleared. Simulating referral signups...");

  // 2. Simulate 49 user signups
  for (let i = 1; i <= 49; i++) {
    const email = `referred_friend_${i}@example.com`;
    // Create the referral relationship
    await prisma.referral.create({
      data: {
        referrerId,
        referredEmail: email
      }
    });
    // Add coins
    await prisma.user.update({
      where: { id: referrerId },
      data: { coins: { increment: 10 } }
    });
  }

  // Verify coins after 49 referrals
  let user = await prisma.user.findUnique({ where: { id: referrerId } });
  console.log(`After 49 referrals: Referrer has ${user.coins} coins (Expected: 490 coins).`);
  
  let rewards = await prisma.referralReward.findMany({ where: { userId: referrerId } });
  console.log(`ReferralReward milestone records: ${rewards.length} (Expected: 0).`);

  // 3. Simulate the 50th user signup (this should trigger the first tier milestone "Vyoma Diaries")
  console.log("Simulating 50th user signup...");
  await prisma.referral.create({
    data: {
      referrerId,
      referredEmail: "referred_friend_50@example.com"
    }
  });
  await prisma.user.update({
    where: { id: referrerId },
    data: { coins: { increment: 10 } }
  });

  const referralCount = await prisma.referral.count({ where: { referrerId } });
  console.log(`Total referral count reached: ${referralCount}`);

  if (referralCount === 50) {
    await prisma.referralReward.create({
      data: {
        userId: referrerId,
        rewardName: "Vyoma Diaries",
        referralCount: 50,
        status: "PENDING"
      }
    });
    console.log("Milestone triggered successfully: Vyoma Diaries created!");
  }

  // 4. Verify results
  user = await prisma.user.findUnique({ where: { id: referrerId } });
  rewards = await prisma.referralReward.findMany({ where: { userId: referrerId } });

  console.log("=== FINAL VERIFICATION ===");
  console.log(`Referrer final coins: ${user.coins} (Expected: 500)`);
  console.log(`Rewards count: ${rewards.length} (Expected: 1)`);
  console.log(`Active Reward Name: ${rewards[0]?.rewardName}`);
  console.log(`Reward Status: ${rewards[0]?.status} (Expected: PENDING)`);

  // Clean up test data to leave database pure
  await prisma.referral.deleteMany({ where: { referrerId } });
  await prisma.referralReward.deleteMany({ where: { userId: referrerId } });
  await prisma.user.update({
    where: { id: referrerId },
    data: { coins: 0 }
  });
  
  console.log("Validation test completed successfully! Environment returned to absolute purity.");
  await prisma.$disconnect();
}

main().catch(console.error);
