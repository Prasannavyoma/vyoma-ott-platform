import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { episodeId, position, completed } = await request.json();

    if (!episodeId) return NextResponse.json({ ok: false }, { status: 400 });

    // Identify dynamic actively logged in user session
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false });

    // Fetch current progress state before updating to check if newly completed
    const existing = await prisma.progress.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId: episodeId,
        }
      }
    });

    const isNewlyCompleted = (completed || false) && (!existing || !existing.completed);

    let coinsEarned = 0;
    if (isNewlyCompleted) {
      let coinsVideoReward = 2;
      let coinsCourseReward = 2;
      try {
        const vSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_VIDEO_REWARD' } });
        if (vSetting) coinsVideoReward = parseInt(vSetting.value) || 0;
        
        const cSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_COURSE_REWARD' } });
        if (cSetting) coinsCourseReward = parseInt(cSetting.value) || 0;
      } catch (e) {}

      coinsEarned += coinsVideoReward;

      // Check course completion
      const episode = await prisma.episode.findUnique({
        where: { id: episodeId },
        select: { courseId: true }
      });

      if (episode?.courseId) {
        const allEpisodes = await prisma.episode.findMany({
          where: { courseId: episode.courseId },
          select: { id: true }
        });

        const completedEpisodes = await prisma.progress.findMany({
          where: {
            userId: user.id,
            episodeId: { in: allEpisodes.map(e => e.id) },
            completed: true
          }
        });

        const completedSet = new Set(completedEpisodes.map(ce => ce.episodeId));
        const wasCourseCompletedBefore = allEpisodes.length > 0 && allEpisodes.every(e => e.id === episodeId ? false : completedSet.has(e.id));
        const isCourseCompletedNow = allEpisodes.length > 0 && allEpisodes.every(e => e.id === episodeId ? true : completedSet.has(e.id));

        if (isCourseCompletedNow && !wasCourseCompletedBefore) {
          coinsEarned += coinsCourseReward;

          // 🎓 AUTO-GENERATE COMPLETION CERTIFICATE
          try {
            const existingCert = await prisma.$queryRawUnsafe<any[]>(
              `SELECT id FROM Certificate WHERE userId=? AND courseId=?`,
              user.id, episode.courseId
            );
            if (!Array.isArray(existingCert) || existingCert.length === 0) {
              const certCode = 'VYOMA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
              const certId = 'cert_' + Math.random().toString(36).substring(2, 12);
              const now = new Date().toISOString();
              await prisma.$executeRawUnsafe(
                `INSERT INTO Certificate (id, userId, courseId, code, issuedAt) VALUES (?,?,?,?,?)`,
                certId, user.id, episode.courseId, certCode, now
              );

              // 🔔 Create notification for certificate
              const notifId = 'notif_' + Math.random().toString(36).substring(2, 12);
              const course = await prisma.course.findUnique({ where: { id: episode.courseId }, select: { title: true } });
              await prisma.$executeRawUnsafe(
                `INSERT INTO Notification (id, userId, type, title, message, link, read, createdAt) VALUES (?,?,?,?,?,?,0,?)`,
                notifId, user.id, 'CERTIFICATE_ISSUED',
                '🎓 Certificate Earned!',
                `Congratulations! You completed "${course?.title || 'a course'}" — your certificate is ready.`,
                `/certificate/${certCode}`, now
              );
            }
          } catch (certErr) {
            console.error("Auto-cert generation failed:", certErr);
          }
        }
      }
    }

    await prisma.$transaction([
      prisma.progress.upsert({
        where: {
          userId_episodeId: {
            userId: user.id,
            episodeId: episodeId,
          }
        },
        update: {
          position: position,
          completed: completed || false,
        },
        create: {
          userId: user.id,
          episodeId: episodeId,
          position: position,
          completed: completed || false,
        }
      }),
      ...(coinsEarned > 0 ? [
        prisma.user.update({
          where: { id: user.id },
          data: { coins: { increment: coinsEarned } }
        })
      ] : [])
    ]);

    return NextResponse.json({ success: true, coinsEarned });
  } catch (e) {
    console.error("Progress save failed:", e);
    return NextResponse.json({ success: false });
  }
}
