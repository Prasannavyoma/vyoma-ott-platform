import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import GiftClientPage from './GiftClientPage';

export default async function GiftPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/gift');
  }

  // 1. Fetch Authentic, Authoritative Dynamic Pricing from SQLite
  const rawPlans = await prisma.plan.findMany();
  
  // 2. Establish Resilient Fallback Arrays Matching Main Platform
  const plans = rawPlans.length ? rawPlans : [
    { name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 5 },
    { name: 'GOLD', interval: 'YEARLY', priceINR: 399, priceUSD: 50 },
    { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 10 },
    { name: 'PLATINUM', interval: 'YEARLY', priceINR: 499, priceUSD: 100 },
  ];

  const currentUser = {
    id: user.id,
    name: user.name || '',
    email: user.email,
  };

  // 3. Pass real dynamic plan payloads & verified buyer identity to the localized client wrapper
  return <GiftClientPage initialPlans={plans as any} currentUser={currentUser} />;
}
