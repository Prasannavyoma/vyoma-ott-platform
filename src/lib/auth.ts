import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'vyoma_secure_auth_session_hmac_2026_key';

export function signEmail(email: string, timestamp: number): string {
  const data = `${email.toLowerCase().trim()}:${timestamp}`;
  return crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
}

export function verifySignedCookie(cookieValue: string): string | null {
  if (!cookieValue) return null;
  const decoded = decodeURIComponent(cookieValue).trim();
  if (!decoded) return null;

  let email: string = '';
  let timestamp: number = 0;
  let signature: string = '';

  // Format 1: Pipe-delimited: email|timestamp|signature (recommended, immune to dots in email)
  if (decoded.includes('|')) {
    const parts = decoded.split('|');
    if (parts.length === 3) {
      email = parts[0].toLowerCase().trim();
      timestamp = parseInt(parts[1], 10);
      signature = parts[2].trim();
    }
  } 
  // Format 2: Dot-delimited: email.timestamp.signature
  // Since email addresses contain dots (e.g. admin@digitalsanskrit.com), 
  // parse backwards from the right: last dot precedes hex signature, second-to-last precedes timestamp.
  else if (decoded.includes('.')) {
    const lastDot = decoded.lastIndexOf('.');
    const secondLastDot = decoded.lastIndexOf('.', lastDot - 1);
    if (lastDot > 0 && secondLastDot > 0) {
      const potentialSig = decoded.slice(lastDot + 1).trim();
      const potentialTs = parseInt(decoded.slice(secondLastDot + 1, lastDot), 10);
      if (potentialSig.length === 64 && /^[0-9a-fA-F]+$/.test(potentialSig) && !isNaN(potentialTs)) {
        email = decoded.slice(0, secondLastDot).toLowerCase().trim();
        timestamp = potentialTs;
        signature = potentialSig;
      }
    }
  }

  // Cryptographically verify signature if extracted
  if (email && timestamp && signature && !isNaN(timestamp)) {
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days validity window
    if (Date.now() - timestamp <= maxAgeMs) {
      try {
        const expectedSignature = signEmail(email, timestamp);
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        
        if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          return email;
        }
      } catch (err) {
        // signature buffer mismatch
      }
    }
  }

  // Format 3: Legacy raw email fallback for backward compatibility with pre-HMAC cookies
  if (decoded.includes('@') && !decoded.includes('|')) {
    const cleanEmail = decoded.toLowerCase().trim();
    return cleanEmail;
  }

  return null;
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
    let user = await prisma.user.findFirst({
      where: { 
        email: { equals: verifiedEmail, mode: 'insensitive' } 
      },
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
  const normalizedEmail = email.toLowerCase().trim();
  const cookieStore = await cookies();
  const timestamp = Date.now();
  const signature = signEmail(normalizedEmail, timestamp);
  // Pipe delimiter ensures dots in email domains never collide with signature segments
  const signedCookieValue = `${normalizedEmail}|${timestamp}|${signature}`;
  
  // Intelligent protocol detection:
  // If the server is served over plain HTTP (e.g. raw VPS IP http://34.238.91.221),
  // browsers strictly reject cookies marked 'Secure'. Only set 'secure: true' if HTTPS is active.
  let isHttps = false;
  if (process.env.COOKIE_SECURE === 'true') {
    isHttps = true;
  } else if (process.env.COOKIE_SECURE === 'false') {
    isHttps = false;
  } else {
    try {
      const headerList = await headers();
      const proto = headerList.get('x-forwarded-proto') || headerList.get('x-forwarded-protocol');
      const host = headerList.get('host') || '';
      if (proto === 'https' || host.includes('.vercel.app') || (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('https://'))) {
        isHttps = true;
      }
    } catch {
      isHttps = false;
    }
  }

  const cookieOptions: any = {
    name: 'user_email',
    value: signedCookieValue,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
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
