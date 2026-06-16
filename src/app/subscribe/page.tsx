import prisma from '@/lib/prisma';
import SubscribeClientPage from './SubscribeClientPage';

export default async function SubscribePage() {
  // Fetch real dynamic pricing from DB
  const rawPlans = await prisma.plan.findMany();
  
  // Standardized fallback in case DB empty, but usually loaded
  const plans = rawPlans.length ? rawPlans : [
    { name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 5 },
    { name: 'GOLD', interval: 'YEARLY', priceINR: 399, priceUSD: 50 },
    { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 10 },
    { name: 'PLATINUM', interval: 'YEARLY', priceINR: 499, priceUSD: 100 },
  ];

  // Fetch authentic logged in user for precise live calculation (no fake data)
  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();

  // Fallback minimal user structure if entirely logged out, forcing active calculations
  const activeUser = user || {
    plan: 'FREE',
    planInterval: 'YEARLY',
    planStartedAt: new Date(),
    email: 'guest@vyoma.com'
  };

  // Fetch individual PAID courses
  const paidCourses = await prisma.course.findMany({
    where: { accessLevel: 'PAID' }
  });

  return <SubscribeClientPage initialPlans={plans as any} currentUser={activeUser as any} paidCourses={paidCourses} />;
}
