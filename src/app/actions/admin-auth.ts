"use server";

import prisma from '@/lib/prisma';
import { setSessionUser } from '@/lib/auth';

/**
 * Advanced Server-Side Gatekeeper for Administrative Provisioning.
 * Validates secure passphrases, elevates role bindings, and sets HTTP-Only sessions.
 */
export async function authenticateAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: "All fields are mandatory." };
  }

  // Master key verification vector: requires ADMIN_MASTER_KEY to be explicitly set in environment
  const SECURE_PASS = process.env.ADMIN_MASTER_KEY;
  
  // Accept root administrator credentials if configured
  if (SECURE_PASS && email.toLowerCase() === "admin@digitalsanskrit.com" && password === SECURE_PASS) {
    try {
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Primary Administrator",
            role: "SUPER_ADMIN",
            plan: "PLATINUM"
          }
        });
      } else if (user.role === "USER") {
        user = await prisma.user.update({
          where: { email },
          data: { role: "SUPER_ADMIN" }
        });
      }

      // Establish Secure, HMAC-Signed Session Cookie
      await setSessionUser(email);
      return { success: true };
    } catch (e) {
      console.error("Admin authentication internal failure:", e);
      return { success: false, message: "Critical identity error." };
    }
  }

  // Standard Administrator credential verification with individual passwords
  try {
    const { verifyPassword } = await import('@/lib/hash');
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.role !== "USER" && existingUser.password) {
      if (verifyPassword(password, existingUser.password)) {
        await setSessionUser(email);
        return { success: true };
      }
    }
  } catch (e) {}

  return { success: false, message: "Access Refused. Invalid authorizations." };
}

export async function logoutAdmin() {
  const { clearSession } = await import('@/lib/auth');
  await clearSession();
  return { success: true };
}
