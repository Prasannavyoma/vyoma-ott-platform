import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'vyoma_secure_auth_session_hmac_2026_key';

export function signEmail(email: string, timestamp: number): string {
  const data = `${email}:${timestamp}`;
  return crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
}

export function verifySignedCookie(cookieValue: string): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;
  
  const [email, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;
  
  // Check session expiration (30 days maximum validity)
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return null;
  }
  
  try {
    const expectedSignature = signEmail(email, timestamp);
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
    
    return email;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('user_email')?.value;

  if (!rawCookie) {
    return null;
  }

  // Cryptographically verify the signed cookie
  const verifiedEmail = verifySignedCookie(rawCookie);
  if (!verifiedEmail) {
    return null;
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: verifiedEmail },
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
  const timestamp = Date.now();
  const signature = signEmail(email, timestamp);
  const signedCookieValue = `${email}.${timestamp}.${signature}`;
  
  const cookieOptions: any = {
    name: 'user_email',
    value: signedCookieValue,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
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

/**
 * Enforces ADMIN or SUPER_ADMIN access on server actions and API handlers
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Forbidden: Administrative access required.');
  }
  return user;
}

/**
 * Enforces strict SUPER_ADMIN access on sensitive server actions
 */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Administrative access required.');
  }
  return user;
}
