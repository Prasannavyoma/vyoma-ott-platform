import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const logFile = path.join(process.cwd(), 'scratch_note_log.txt');
  let logMsg = `\n--- [${new Date().toISOString()}] NOTE ATTEMPT ---\n`;

  try {
    const { courseId, content } = await req.json();
    logMsg += `Payload: CourseID=${courseId}, ContentLen=${content?.length || 0}\n`;
    
    // Fetch authentic dynamic active user
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    
    if(!user) {
      logMsg += `AUTH_FAIL: No cookie session found. User is NULL.\n`;
      fs.appendFileSync(logFile, logMsg);
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    logMsg += `AuthSuccess: UserID=${user.id}, Email=${user.email}\n`;

    const saved = await prisma.userNote.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { content },
      create: { userId: user.id, courseId, content }
    });

    logMsg += `UPSERT_SUCCESS: SavedRecordID=${saved.id}\n`;
    
    // FORCE NEXT.JS TO PURGE CACHE FOR THIS SPECIFIC CURRICULUM VIEW
    try {
      revalidatePath(`/watch/${courseId}`);
      logMsg += `REVALIDATE_TRIGGERED: /watch/${courseId}\n`;
    } catch (e: any) {
      logMsg += `REVALIDATE_WARNING: ${e.message}\n`;
    }

    fs.appendFileSync(logFile, logMsg);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logMsg += `CRITICAL_EXCEPTION: ${e.message || e}\n`;
    try { fs.appendFileSync(logFile, logMsg); } catch(err){}
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
