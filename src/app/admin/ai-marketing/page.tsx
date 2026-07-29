import { prisma } from '@/lib/prisma';
import AiMarketingClient from './AiMarketingClient';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Marketing & Auto-Blog | Vyoma Admin',
};

export default async function AiMarketingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/admin?error=UnauthorizedMarketingAccess');
  }

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, description: true }
  });

  return <AiMarketingClient courses={courses} />;
}
