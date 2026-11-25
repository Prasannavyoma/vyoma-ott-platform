import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { episodeId, position, completed } = await request.json();

    if (!episodeId) return NextResponse.json({ ok: false }, { status: 400 });

    // Identify dynamic actively logged in user session
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false });

    // Fetch episode duration for server-side watch time validation (Bug #7 fix)
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      select: { courseId: true, duration: true }
    });

    // Fetch current progress state before updating to check if newly completed
    const existing = await prisma.progress.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId: episodeId,
        }
      }
    });

    // Validate completion server-side: require at least 80% watch time or 30 seconds
    const minRequiredPos = episode?.duration ? Math.min(episode.duration * 0.8, Math.max(0, episode.duration - 10)) : 30;
    const meetsCompletionCriteria = typeof position === 'number' && position >= minRequiredPos;
    
    // Bug #41 fix: Never un-complete an already completed episode upon re-opening
    const isCompletedNow = Boolean(existing?.completed || (completed && meetsCompletionCriteria));
    const isNewlyCompleted = isCompletedNow && (!existing || !existing.completed);

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
            const existingCert = await prisma.certificate.findFirst({
              where: { userId: user.id, courseId: episode.courseId }
            });
            let certCode = existingCert?.code || existingCert?.id;
            if (!existingCert) {
              // Cryptographically secure collision-resistant code (Bug #62 fix)
              certCode = 'VYOMA-CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
              await prisma.certificate.create({
                data: {
                  userId: user.id,
                  courseId: episode.courseId,
                  code: certCode
                }
              });
            }

            // 🔔 Create notification for certificate
            const course = await prisma.course.findUnique({ where: { id: episode.courseId }, select: { title: true } });
            const validLink = certCode ? `/certificate/${certCode}` : '/profile#certificates';
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: 'CERTIFICATE_ISSUED',
                title: '🎓 Certificate Earned!',
                message: `Congratulations! You completed "${course?.title || 'a course'}" — your certificate is ready.`,
                linkUrl: validLink
              }
            });
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
          completed: isCompletedNow,
        },
        create: {
          userId: user.id,
          episodeId: episodeId,
          position: position,
          completed: isCompletedNow,
        }
      }),
      ...(coinsEarned > 0 ? [
        prisma.user.update({
          where: { id: user.id },
          data: {
            coins: { increment: coinsEarned },
            xpPoints: { increment: coinsEarned * 15 }
          }
        })
      ] : [])
    ]);

    return NextResponse.json({ success: true, coinsEarned, isCompleted: isCompletedNow });
  } catch (e) {
    console.error("Progress save failed:", e);
    return NextResponse.json({ success: false });
  }
}
