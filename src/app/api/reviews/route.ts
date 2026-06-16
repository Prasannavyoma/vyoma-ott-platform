import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSpamText } from '@/lib/spam-guard';

export async function POST(req: NextRequest) {
  try {
    const { courseId, comment, rating } = await req.json();
    
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (comment && isSpamText(comment)) {
      return NextResponse.json({ success: false, error: 'Review content flagged as spam.' }, { status: 400 });
    }

    await prisma.review.create({
      data: { userId: user.id, courseId, comment, rating, approved: false }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

