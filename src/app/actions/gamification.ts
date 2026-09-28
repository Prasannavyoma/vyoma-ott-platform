"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function getUserGamificationStats() {
  try {
    const user = await getCurrentUser();
    
    // Default guest stats if not logged in
    if (!user) {
      return {
        streakDays: 1,
        xpPoints: 100,
        scholarRank: "Sanskrit Seeker",
        badgeIcon: "🌱",
        lastActiveDate: new Date().toISOString()
      };
    }

    // Read real user record from Database
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userRecord) {
      return {
        streakDays: 1,
        xpPoints: 100,
        scholarRank: "Sanskrit Seeker",
        badgeIcon: "🌱",
        lastActiveDate: new Date().toISOString()
      };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let streakDays = userRecord.streakDays ?? 1;
    let xpPoints = userRecord.xpPoints ?? 100;
    const lastActive = userRecord.lastActiveDate;

    let updateNeeded = false;
    let updatedStreakDays = streakDays;
    let updatedXpPoints = xpPoints;

    if (!lastActive) {
      // First active visit recorded
      updatedStreakDays = 1;
      updatedXpPoints += 20; // Initial welcome bonus
      updateNeeded = true;
    } else {
      const lastActiveStr = new Date(lastActive).toISOString().split('T')[0];
      if (lastActiveStr !== todayStr) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActiveStr === yesterdayStr) {
          // Consecutive active day!
          updatedStreakDays += 1;
          updatedXpPoints += 10; // Daily visit streak bonus
        } else {
          // Missed one or more days -> reset streak
          updatedStreakDays = 1;
        }
        updateNeeded = true;
      }
    }

    if (updateNeeded) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            streakDays: updatedStreakDays,
            xpPoints: updatedXpPoints,
            lastActiveDate: now
          }
        });
        streakDays = updatedStreakDays;
        xpPoints = updatedXpPoints;
      } catch (err) {
        console.error("Failed to persist user streak updates:", err);
      }
    }

    return {
      streakDays,
      xpPoints,
      scholarRank: getScholarRank(xpPoints),
      badgeIcon: getBadgeIcon(xpPoints),
      lastActiveDate: now.toISOString()
    };
  } catch (e) {
    console.error("Error fetching user gamification stats:", e);
    return {
      streakDays: 1,
      xpPoints: 100,
      scholarRank: "Sanskrit Seeker",
      badgeIcon: "🌱",
      lastActiveDate: new Date().toISOString()
    };
  }
}

export async function awardUserXp(xpAmount: number, reason?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "User not logged in." };

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userRecord) return { success: false, error: "User not found." };

    const newXp = (userRecord.xpPoints ?? 100) + xpAmount;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { xpPoints: newXp }
    });

    return { success: true, newXp };
  } catch (err: any) {
    console.error("Error awarding XP:", err);
    return { success: false, error: err.message };
  }
}

export async function redeemXpForGiftVoucher(xpAmount: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Please log in to redeem XP points." };
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userRecord) {
      return { success: false, error: "User profile not found." };
    }

    const currentXp = userRecord.xpPoints ?? 100;
    if (currentXp < xpAmount) {
      return {
        success: false,
        error: `Insufficient XP points. You have ${currentXp} XP, but ${xpAmount} XP is required.`
      };
    }

    // Generate unique gift code
    const randomCode = "VYOMA-XP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Deduct XP and save voucher in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { xpPoints: currentXp - xpAmount }
      }),
      prisma.subscriptionVoucher.create({
        data: {
          code: randomCode,
          plan: "PLATINUM",
          months: 1,
          sponsoredBy: `Daily Sanskrit Gamification XP Reward`,
          isUsed: false
        }
      })
    ]);

    return {
      success: true,
      code: randomCode,
      message: `Successfully redeemed ${xpAmount} XP! Your gift voucher code is: ${randomCode}`
    };
  } catch (e: any) {
    console.error("Redeem XP error:", e);
    return { success: false, error: e.message || "Redemption failed." };
  }
}

function getScholarRank(xp: number): string {
  if (xp >= 1000) return "Veda Vyasa Scholar";
  if (xp >= 500) return "Sanskrit Virtuoso";
  if (xp >= 250) return "Kavya Rasika";
  return "Sanskrit Seeker";
}

function getBadgeIcon(xp: number): string {
  if (xp >= 1000) return "👑";
  if (xp >= 500) return "🥇";
  if (xp >= 250) return "🔥";
  return "🌱";
}
