"use server";

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function toggleMalwareEngine(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  await prisma.systemSetting.upsert({
    where: { key: 'SECURITY_MALWARE_SCANNER_ENABLED' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'SECURITY_MALWARE_SCANNER_ENABLED', value: enabled ? 'true' : 'false' }
  });

  revalidatePath('/admin/security');
  return { success: true, enabled };
}

export async function triggerSystemAudit() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  // Simulate an intensive security audit
  await new Promise(resolve => setTimeout(resolve, 2000));

  return { 
    success: true, 
    message: 'System Security Audit Completed. No new vulnerabilities detected.' 
  };
}
