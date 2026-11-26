"use server";

import prisma from '@/lib/prisma';
import { setSessionUser, clearSession } from '@/lib/auth';

/**
 * Advanced Server-Side Gatekeeper for Administrative Provisioning.
 * Validates secure passphrases, elevates role bindings, and sets HTTP-Only sessions.
 */
export async function authenticateAdmin(formData: FormData) {
  const rawEmail = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!rawEmail || !password) {
    return { success: false, message: "All fields are mandatory." };
  }

  const email = rawEmail.toLowerCase();

  // Master key verification vector:
  // Strictly validated against ADMIN_MASTER_KEY configured in environment
  const SECURE_PASS = process.env.ADMIN_MASTER_KEY;
  const isMasterKeyMatch = Boolean(SECURE_PASS && password === SECURE_PASS);
  const isRootAdminEmail = email === "admin@digitalsanskrit.com";
  
  // Accept root administrator credentials
  if (isMasterKeyMatch && isRootAdminEmail) {
    try {
      let user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });
      
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
          where: { id: user.id },
          data: { role: "SUPER_ADMIN" }
        });
      }

      // Establish Secure, HMAC-Signed Session Cookie
      await setSessionUser(user.email);
      return { success: true };
    } catch (e) {
      console.error("Admin authentication internal failure:", e);
      return { success: false, message: "Critical identity error." };
    }
  }

  // Standard Administrator credential verification with individual passwords / roles
  try {
    const { verifyPassword } = await import('@/lib/hash');
    const existingUser = await prisma.user.findFirst({ 
      where: { email: { equals: email, mode: 'insensitive' } } 
    });

    const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'];

    if (existingUser && ADMIN_ROLES.includes(existingUser.role)) {
      // 1. Allow login if master key was provided for an admin user
      if (isMasterKeyMatch) {
        await setSessionUser(existingUser.email);
        return { success: true };
      }

      // 2. Allow login if individual password matches
      if (existingUser.password && verifyPassword(password, existingUser.password)) {
        await setSessionUser(existingUser.email);
        return { success: true };
      }
    }
  } catch (e) {
    console.error("Admin authentication standard check error:", e);
  }

  return { success: false, message: "Access Refused. Invalid authorizations." };
}

export async function logoutAdmin() {
  await clearSession();
  return { success: true };
}
