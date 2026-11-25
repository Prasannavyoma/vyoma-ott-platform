import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { courseId, content } = await req.json();
    
    // Fetch authentic dynamic active user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    await prisma.userNote.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { content },
      create: { userId: user.id, courseId, content }
    });

    try {
      revalidatePath(`/watch/${courseId}`);
    } catch (e: any) {
      console.warn("Revalidate error:", e.message);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Notes error:", e);
    return NextResponse.json({ success: false, error: e.message || "Failed to save note" }, { status: 500 });
  }
}
