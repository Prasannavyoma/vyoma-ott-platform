import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getWhatsAppSettings, sendWhatsAppMessage } from '@/lib/whatsapp';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  // Authorize: require either valid CRON_SECRET or an authenticated admin session
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorizedCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  
  const user = await getCurrentUser();
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  if (!isAuthorizedCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret or admin credentials required.' }, { status: 401 });
  }

  try {
    const settings = await getWhatsAppSettings();
    if (!settings.enabled) {
      return NextResponse.json({ status: 'disabled', message: 'WhatsApp integration is off' });
    }

    let messagesSent = 0;

    // 1. Course Resume Reminders (Users who started a course but haven't finished, last updated > 7 days ago)
    if (settings.templates.resume) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const staleProgress = await prisma.progress.findMany({
        where: {
          completed: false,
          updatedAt: {
            lt: sevenDaysAgo
          }
        },
        include: {
          user: true,
          episode: { include: { course: true } }
        },
        take: 50 // process in batches
      });

      for (const prog of staleProgress) {
        if (prog.user.phone) {
          const sent = await sendWhatsAppMessage(prog.user.phone, settings.templates.resume, 'en_US', [
            { type: "text", text: prog.user.name || 'Student' },
            { type: "text", text: prog.episode.course.title }
          ]);
          if (sent) messagesSent++;
          
          // Touch the progress so we don't spam them tomorrow again
          await prisma.progress.update({
            where: { id: prog.id },
            data: { updatedAt: new Date() } // bump timestamp
          });
        }
      }
    }

    // 2. Subscription Renewal Reminders (Plan expires in exactly 3 days)
    if (settings.templates.subscription) { // Using subscription template or we could use a dedicated renewal template
      const threeDaysFromNowStart = new Date();
      threeDaysFromNowStart.setDate(threeDaysFromNowStart.getDate() + 3);
      threeDaysFromNowStart.setHours(0,0,0,0);
      
      const threeDaysFromNowEnd = new Date(threeDaysFromNowStart);
      threeDaysFromNowEnd.setHours(23,59,59,999);

      const expiringUsers = await prisma.user.findMany({
        where: {
          planExpiresAt: {
            gte: threeDaysFromNowStart,
            lte: threeDaysFromNowEnd
          },
          phone: { not: null }
        }
      });

      for (const u of expiringUsers) {
        if (u.phone) {
           const sent = await sendWhatsAppMessage(u.phone, settings.templates.subscription, 'en_US', [
             { type: "text", text: u.name || 'Member' },
             { type: "text", text: 'Your subscription is expiring in 3 days! Renew now to keep access.' }
           ]);
           if (sent) messagesSent++;
        }
      }
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
