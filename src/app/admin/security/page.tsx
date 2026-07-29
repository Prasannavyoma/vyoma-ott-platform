import { prisma } from '@/lib/prisma';
import SecurityClient from './SecurityClient';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Security Center | Vyoma Admin',
};

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    redirect('/admin?error=UnauthorizedSecurityAccess');
  }

  // Fetch initial malware engine state
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'SECURITY_MALWARE_SCANNER_ENABLED' }
  });
  const engineEnabled = setting?.value === 'true';

  // Fetch privileged access users
  const adminUsers = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN'] }
    },
    select: {
      id: true,
      email: true,
      role: true,
      updatedAt: true,
    },
    orderBy: { role: 'desc' }
  });

  return (
    <SecurityClient 
      initialEngineEnabled={engineEnabled} 
      adminUsers={adminUsers} 
    />
  );
}
