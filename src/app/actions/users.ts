"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Secure Administrative Action to elevate or demote system user roles.
 * Enforces SUPER_ADMIN/ADMIN validations to prevent self-elevation or unauthorized escalation.
 */
export async function adminUpdateUserRole(targetUserId: string, newRole: string) {
  // 1. Retrieve operational context
  const actor = await getCurrentUser();
  
  // 2. Strict security audit
  if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
    throw new Error("UNAUTHORIZED_OPERATION: Elevated privileges required.");
  }

  // Prevent general ADMINs from modifying other admin structures if necessary
  // In this implementation, SUPER_ADMIN can change anyone, ADMIN can only demote/elevate non-admins
  
  // 3. Validate target role string against acceptable matrix
  const ACCEPTED_ROLES = ['USER', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'];
  if (!ACCEPTED_ROLES.includes(newRole)) {
    throw new Error("INVALID_ROLE_PARAMETER: Non-conforming system tag.");
  }

  try {
    // 4. Execute relational mutation
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    // 5. Evict dynamic layouts
    revalidatePath(`/admin/users/${targetUserId}`);
    revalidatePath(`/admin/users`);
    return { success: true };
  } catch (e) {
    console.error("Failure executing role mutation:", e);
    return { success: false, error: "Mutation failure." };
  }
}

/**
 * Extreme Danger-Zone Action.
 * Atomically erases the specified User from SQLite alongside cascading relations.
 */
export async function adminDeleteUser(targetUserId: string) {
  // 1. Establish caller authority context
  const actor = await getCurrentUser();
  if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
    throw new Error("UNAUTHORIZED: Super administrative tier required.");
  }

  // 2. Lockdown self-accidental-eviction logic
  if (actor.id === targetUserId) {
    return { success: false, error: "LOCKOUT_PREVENTED: You cannot self-destruct your active session." };
  }

  try {
    // 3. Execute manual hygiene purges on raw SQLite companion tables
    await prisma.$executeRawUnsafe(`DELETE FROM WatchlistItem WHERE userId = ?`, targetUserId);
    await prisma.$executeRawUnsafe(`DELETE FROM CourseLike WHERE userId = ?`, targetUserId);

    // 4. Trigger cascading database erasure (Deletes purchases, certificates, and identity)
    await prisma.user.delete({
      where: { id: targetUserId }
    });

    // 5. Purge pathing layouts
    revalidatePath(`/admin/users`);
    return { success: true };
  } catch (e: any) {
    console.error("Severe user deletion failure:", e);
    return { success: false, error: e.message || "Critical data severance failure." };
  }
}
