import prisma from '@/lib/prisma';
import GiftClientPage from './GiftClientPage';

export default async function GiftPage() {
  // 1. Fetch Authentic, Authoritative Dynamic Pricing from SQLite
  const rawPlans = await prisma.plan.findMany();
  
  // 2. Establish Resilient Fallback Arrays Matching Main Platform
  const plans = rawPlans.length ? rawPlans : [
    { name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 5 },
    { name: 'GOLD', interval: 'YEARLY', priceINR: 399, priceUSD: 50 },
    { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 10 },
    { name: 'PLATINUM', interval: 'YEARLY', priceINR: 499, priceUSD: 100 },
  ];

  // 3. Pass real dynamic plan payloads to the localized client wrapper
  return <GiftClientPage initialPlans={plans as any} />;
}
