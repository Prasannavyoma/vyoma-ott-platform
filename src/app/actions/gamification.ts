"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

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
    // Use Indian Standard Time (Asia/Kolkata) as base timezone for streak calculations to prevent UTC day-shift bugs
    const getISTDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayStr = getISTDate(now);

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
      const lastActiveStr = getISTDate(new Date(lastActive));
      if (lastActiveStr !== todayStr) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = getISTDate(yesterday);

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

/**
 * Validated XP grant with single-call cap and daily accumulation cap to prevent inflation
 */
export async function awardUserXp(xpAmount: number, reason?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "User not logged in." };

    // Enforce reasonable single-call limit (max 50 XP per invocation)
    const sanitizedAmount = Math.max(1, Math.min(Math.floor(xpAmount), 50));

    // Cap daily awarded XP to 250 XP
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayXpEvents = await prisma.telemetryEvent.findMany({
      where: {
        userId: user.id,
        eventType: 'XP_AWARDED',
        createdAt: { gte: startOfDay }
      }
    });

    const totalToday = todayXpEvents.reduce((acc, ev) => {
      try {
        const parsed = JSON.parse(ev.metadata || '{}');
        return acc + (parsed.amount || 0);
      } catch {
        return acc;
      }
    }, 0);

    if (totalToday >= 250) {
      return { success: false, error: "Daily XP earning limit reached. Return tomorrow for more!" };
    }

    const actualToGrant = Math.min(sanitizedAmount, 250 - totalToday);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { xpPoints: { increment: actualToGrant } }
    });

    await prisma.telemetryEvent.create({
      data: {
        eventType: 'XP_AWARDED',
        userId: user.id,
        sourceId: reason || 'PRACTICE_HUB',
        metadata: JSON.stringify({ amount: actualToGrant, reason })
      }
    }).catch(() => {});

    return { success: true, newXp: updatedUser.xpPoints };
  } catch (err: any) {
    console.error("Error awarding XP:", err);
    return { success: false, error: err.message };
  }
}

const REQUIRED_XP_PER_VOUCHER = 500;

export async function redeemXpForGiftVoucher(xpAmount?: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Please log in to redeem XP points." };
    }

    // Fixed server-side redemption cost
    const cost = REQUIRED_XP_PER_VOUCHER;

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userRecord) {
      return { success: false, error: "User profile not found." };
    }

    const currentXp = userRecord.xpPoints ?? 100;
    if (currentXp < cost) {
      return {
        success: false,
        error: `Insufficient XP points. You have ${currentXp} XP, but ${cost} XP is required for a 1-month Platinum voucher.`
      };
    }

    // Cryptographically secure gift code generation (Bug #62 fix)
    const randomCode = "VYOMA-XP-" + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Deduct XP atomically ensuring user still has >= cost
    const updateResult = await prisma.user.updateMany({
      where: { id: user.id, xpPoints: { gte: cost } },
      data: { xpPoints: { decrement: cost } }
    });

    if (updateResult.count === 0) {
      return { success: false, error: "Insufficient XP balance or concurrent redemption detected." };
    }

    await prisma.subscriptionVoucher.create({
      data: {
        code: randomCode,
        plan: "PLATINUM",
        months: 1,
        sponsoredBy: `Daily Sanskrit Gamification XP Reward`,
        isUsed: false
      }
    });

    return {
      success: true,
      code: randomCode,
      message: `Successfully redeemed ${cost} XP! Your gift voucher code is: ${randomCode}`
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
