import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSpamText } from '@/lib/spam-guard';

export async function POST(req: NextRequest) {
  try {
    const { courseId, comment, rating } = await req.json();
    
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'Course ID is required.' }, { status: 400 });
    }

    // Rating validation: Must be an integer between 1 and 5 (Bug #59 fix)
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid rating. Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    const sanitizedComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : '';

    if (sanitizedComment && isSpamText(sanitizedComment)) {
      return NextResponse.json({ success: false, error: 'Review content flagged as spam.' }, { status: 400 });
    }

    // Prevent duplicate reviews by updating existing review per user per course
    const existing = await prisma.review.findFirst({
      where: { userId: user.id, courseId }
    });

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          comment: sanitizedComment,
          rating: numRating,
          approved: false
        }
      });
      return NextResponse.json({ success: true, updated: true });
    }

    await prisma.review.create({
      data: { 
        userId: user.id, 
        courseId, 
        comment: sanitizedComment, 
        rating: numRating, 
        approved: false 
      }
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

