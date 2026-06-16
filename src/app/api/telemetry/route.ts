import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seconds } = body;
    
    if (!seconds || typeof seconds !== 'number') {
      return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
    }

    // Fetch dynamic active user context securely
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalWatchSeconds: { increment: seconds }
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Telemetry failure' }, { status: 500 });
  }
}
