import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    const mappedNotifications = notifications.map(n => ({
      ...n,
      link: n.linkUrl || (n as any).link || '/profile#certificates'
    }));

    return NextResponse.json({ notifications: mappedNotifications, unreadCount });
  } catch (e: any) {
    return NextResponse.json(
      { notifications: [], unreadCount: 0, error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
