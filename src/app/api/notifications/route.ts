import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.$queryRawUnsafe(
      'SELECT * FROM Notification WHERE userId=? ORDER BY createdAt DESC LIMIT 20',
      user.id
    );

    const countResult: any[] = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as count FROM Notification WHERE userId=? AND `read`=0',
      user.id
    );

    const unreadCount = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({ notifications, unreadCount });
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
      await prisma.$executeRawUnsafe(
        'UPDATE Notification SET `read`=1 WHERE userId=? AND `read`=0',
        user.id
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
