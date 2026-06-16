import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get('user_email')?.value;

  if (!emailCookie) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailCookie },
      include: {
        certificates: { include: { course: true } },
        purchases: { include: { course: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    return user;
  } catch (e) {
    return null;
  }
}

export async function setSessionUser(email: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'user_email',
    value: email,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 7 Days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('user_email');
}
