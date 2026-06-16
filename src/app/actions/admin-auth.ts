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

  // Secure verification vectors. In production, leverage environment variables
  const SECURE_PASS = process.env.ADMIN_MASTER_KEY || "vyoma-secure-123";
  
  // Accept absolute Admin credentials
  if (email.toLowerCase() === "admin@digitalsanskrit.com" && password === SECURE_PASS) {
    
    try {
      // 1. Look up or Auto-Hydrate Admin Profile
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Primary Administrator",
            role: "ADMIN", // Lock administrative capacity
            plan: "PLATINUM"
          }
        });
      } else if (user.role !== "ADMIN") {
        // Elevate to Admin if existing user used standard registration first
        user = await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" }
        });
      }

      // 2. Establish Secure, Encrypted Session Cookie
      await setSessionUser(email);

      return { success: true };
    } catch (e) {
      console.error("Admin authentication internal failure:", e);
      return { success: false, message: "Critical identity error." };
    }
  }

  // General Administrator user lookup (if other admins exist in DB)
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.role !== "USER" && password === SECURE_PASS) {
      await setSessionUser(email);
      return { success: true };
    }
  } catch (e) {}

  return { success: false, message: "Access Refused. Invalid authorizations." };
}

export async function logoutAdmin() {
  const { clearSession } = await import('@/lib/auth');
  await clearSession();
  return { success: true };
}
