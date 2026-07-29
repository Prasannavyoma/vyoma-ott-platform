import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTemplatedEmail } from '@/lib/mail';
import { sendWebPush } from '@/lib/push';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceAll = searchParams.get('forceAll') === 'true'; // Allow bypassing date filters for testing
    const now = new Date();
    const platformUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    let winbackCount = 0;
    let renewalCount = 0;
    let upgradeCount = 0;

    if (forceAll) {
      // Manual trigger from dashboard - send to all matching users who fit the general profile
      // 1. Winback targets: Users inactive for > 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const inactiveUsers = await prisma.user.findMany({
        where: { updatedAt: { lte: sevenDaysAgo } }
      });
      for (const u of inactiveUsers) {
        await sendTemplatedEmail(u.email, 'WINBACK', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        await sendWebPush(u.id, 'We miss you!', 'Come back and continue your learning journey.').catch(console.error);
        winbackCount++;
      }

      // 2. Renewal targets: Premium users whose plans expire in the next 3 days OR are already expired
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const renewalTargets = await prisma.user.findMany({
        where: {
          plan: { not: 'FREE' },
          OR: [
            { planExpiresAt: { lte: threeDaysFromNow } },
            { planExpiresAt: null }
          ]
        }
      });
      for (const u of renewalTargets) {
        await sendTemplatedEmail(u.email, 'RENEWAL', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        await sendWebPush(u.id, 'Subscription Expiring', 'Your Vyoma OTT plan expires soon! Tap to renew now.').catch(console.error);
        renewalCount++;
      }

      // 3. Upgrade targets: Free users
      const upgradeTargets = await prisma.user.findMany({
        where: { plan: 'FREE' }
      });
      for (const u of upgradeTargets) {
        await sendTemplatedEmail(u.email, 'UPGRADE', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        upgradeCount++;
      }
    } else {
      // Automated Daily Scheduler (Sliding Windows)
      
      // 1. Winback: Inactive for exactly 7 to 8 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const inactiveUsers = await prisma.user.findMany({
        where: { updatedAt: { gte: eightDaysAgo, lte: sevenDaysAgo } }
      });
      for (const u of inactiveUsers) {
        await sendTemplatedEmail(u.email, 'WINBACK', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        await sendWebPush(u.id, 'We miss you!', 'Come back and continue your learning journey.').catch(console.error);
        winbackCount++;
      }

      // 2. Renewal: Expires in exactly 2 to 3 days OR expired in the last 24 hours
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const renewalTargets = await prisma.user.findMany({
        where: {
          plan: { not: 'FREE' },
          OR: [
            { planExpiresAt: { gte: twoDaysFromNow, lte: threeDaysFromNow } },
            { planExpiresAt: { gte: oneDayAgo, lte: now } }
          ]
        }
      });
      for (const u of renewalTargets) {
        await sendTemplatedEmail(u.email, 'RENEWAL', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        await sendWebPush(u.id, 'Subscription Expiring', 'Your Vyoma OTT plan expires soon! Tap to renew now.').catch(console.error);
        renewalCount++;
      }

      // 3. Upgrade: Free plan registered exactly 3 to 4 days ago
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const upgradeTargets = await prisma.user.findMany({
        where: {
          plan: 'FREE',
          createdAt: { gte: fourDaysAgo, lte: threeDaysAgo }
        }
      });
      for (const u of upgradeTargets) {
        await sendTemplatedEmail(u.email, 'UPGRADE', { name: u.name || 'Seeker', platform_url: platformUrl }).catch(console.error);
        upgradeCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      mode: forceAll ? 'FORCE_MANUAL' : 'AUTO_SCHEDULER',
      winbackSent: winbackCount,
      renewalWarningSent: renewalCount,
      upgradeUpsellSent: upgradeCount
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
