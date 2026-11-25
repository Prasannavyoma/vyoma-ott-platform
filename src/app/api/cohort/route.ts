import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    if (!episodeId) {
      return NextResponse.json({ success: false, count: 0, users: [] });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Count distinct active learners in last 5 minutes
    const count = await prisma.progress.count({
      where: {
        episodeId,
        updatedAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    // Fetch names and avatars of the actual online learners
    const activeProgress = await prisma.progress.findMany({
      where: {
        episodeId,
        updatedAt: {
          gte: fiveMinutesAgo
        }
      },
      take: 4,
      select: {
        user: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Mask user full names to protect viewer privacy (Bug #63 fix)
    const users = activeProgress.map(ap => {
      const rawName = (ap.user.name || '').trim();
      let displayName = 'Fellow Scholar';
      if (rawName) {
        const parts = rawName.split(' ');
        displayName = parts[0] + (parts.length > 1 && parts[1] ? ` ${parts[1][0]}.` : '');
      }
      return {
        name: displayName,
        avatarUrl: ap.user.avatarUrl || ''
      };
    });

    return NextResponse.json({
      success: true,
      count: Math.max(1, count), // Always at least 1 (the current user)
      users
    });
  } catch (e) {
    console.error("Error fetching cohort telemetry:", e);
    return NextResponse.json({ success: false, count: 1, users: [] });
  }
}
