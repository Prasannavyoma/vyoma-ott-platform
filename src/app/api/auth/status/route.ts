import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isLoggedIn: false, user: null });
    }

    let expiresAt: string | null = null;
    let daysRemaining: number | null = null;

    if (user.plan && user.plan !== 'FREE') {
      let end: Date;
      if (user.planExpiresAt) {
        end = new Date(user.planExpiresAt);
      } else {
        const referenceDate = user.planStartedAt || user.createdAt;
        const start = new Date(referenceDate);
        const totalDays = user.planInterval === 'YEARLY' ? 365 : 30;
        end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
      }
      expiresAt = end.toISOString();
      const diffMs = end.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan || 'FREE',
        planInterval: user.planInterval || 'MONTHLY',
        planStartedAt: user.planStartedAt ? new Date(user.planStartedAt).toISOString() : null,
        planExpiresAt: expiresAt,
        daysRemaining: daysRemaining,
        coins: user.coins || 0
      }
    });
  } catch (e) {
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
}
