import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get('user_email')?.value;

  if (!emailCookie) {
    return null;
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: emailCookie },
      include: {
        certificates: { include: { course: true } },
        purchases: { include: { course: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) return null;

    // ACTIVE SUBSCRIPTION ENFORCEMENT
    if (user.plan !== 'FREE') {
      let end: Date;
      if (user.planExpiresAt) {
        end = new Date(user.planExpiresAt);
      } else {
        const referenceDate = user.planStartedAt || user.createdAt;
        const start = new Date(referenceDate);
        const totalDays = user.planInterval === 'YEARLY' ? 365 : 30;
        end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
      }

      if (Date.now() > end.getTime()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            plan: 'FREE',
            planInterval: null,
            planStartedAt: null,
            planExpiresAt: null
          }
        });
        user.plan = 'FREE';
        user.planInterval = null;
        user.planStartedAt = null;
        user.planExpiresAt = null;
      }
    }

    return user;
  } catch (e) {
    return null;
  }
}

export async function setSessionUser(email: string, rememberMe: boolean = false) {
  const cookieStore = await cookies();
  
  const cookieOptions: any = {
    name: 'user_email',
    value: email,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  };

  if (rememberMe) {
    cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 Days if Remember Me
  }

  cookieStore.set(cookieOptions);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('user_email');
}
