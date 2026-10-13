import prisma from '@/lib/prisma';
import AnalyticsClientPage from './AnalyticsClientPage';

export default async function AnalyticsDashboardPage(props: { searchParams: Promise<{ type?: string }> }) {
  const searchParams = await props.searchParams;
  const contentType = searchParams.type || 'ALL';

  // 1. Fetch Basic Totals
  const totalUsersCount = await prisma.user.count();
  const totalReferrals = await prisma.referral.count();
  
  const totalQuizAttempts = await prisma.quizResult.count({
    where: contentType !== 'ALL' ? { quiz: { course: { contentType } } } : undefined
  });
  
  const totalCertificates = await prisma.certificate.count({
    where: contentType !== 'ALL' ? { course: { contentType } } : undefined
  });

  // 2. Fetch User Registration Data for Trends
  const users = await prisma.user.findMany({
    select: { createdAt: true }
  });

  const monthlySignups: { [key: string]: number } = {};
  users.forEach(u => {
    const date = new Date(u.createdAt);
    const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // e.g. "May 2026"
    monthlySignups[monthKey] = (monthlySignups[monthKey] || 0) + 1;
  });

  // Convert to sorted array of last 6 elements
  const sortedMonths = Object.keys(monthlySignups).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  }).slice(-6);
  const signupTrendData = sortedMonths.map(m => ({ month: m, count: monthlySignups[m] }));

  // 3. Fetch Top Seen Courses (views count)
  const topSeenCourses = await prisma.course.findMany({
    where: contentType !== 'ALL' ? { contentType } : undefined,
    take: 5,
    orderBy: { views: 'desc' },
    select: { title: true, views: true, category: true }
  });

  // 4. Fetch Top Hours Spent Courses
  const allProgress = await prisma.progress.findMany({
    where: contentType !== 'ALL' ? { episode: { course: { contentType } } } : undefined,
    select: { position: true, episode: { select: { courseId: true } } }
  });
  
  const courseWatchSeconds: { [key: string]: number } = {};
  allProgress.forEach(p => {
    if (p.episode?.courseId) {
      courseWatchSeconds[p.episode.courseId] = (courseWatchSeconds[p.episode.courseId] || 0) + (p.position || 0);
    }
  });

  // Fetch course titles to map
  const coursesList = await prisma.course.findMany({
    where: contentType !== 'ALL' ? { contentType } : undefined,
    select: { id: true, title: true }
  });

  const courseTitleMap = new Map(coursesList.map(c => [c.id, c.title]));
  const topWatchCourses = Object.keys(courseWatchSeconds).map(cid => ({
    title: courseTitleMap.get(cid) || 'Unknown Course',
    hours: Number((courseWatchSeconds[cid] / 3600).toFixed(1)),
    rawSeconds: courseWatchSeconds[cid]
  })).sort((a, b) => b.rawSeconds - a.rawSeconds).slice(0, 5);

  // 5. Total watch hours spent overall
  const totalSeconds = allProgress.reduce((sum, p) => sum + (p.position || 0), 0);
  const totalHoursOverall = (totalSeconds / 3600).toFixed(1);

  // 6. User Ratings statistics
  const reviews = await prisma.review.findMany({
    where: contentType !== 'ALL' ? { course: { contentType } } : undefined,
    select: { rating: true }
  });
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '5.0';

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = r.rating as 1 | 2 | 3 | 4 | 5;
    if (ratingCounts[star] !== undefined) ratingCounts[star]++;
  });

  // 7. Fetch All Users with Geographic & Subscription Attributes
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      country: true,
      plan: true,
      planInterval: true,
      planStartedAt: true,
      planExpiresAt: true,
      razorpaySubscriptionId: true,
      createdAt: true,
    }
  });

  // Local vs International Split
  let localUsersCount = 0;
  let intlUsersCount = 0;
  const countryCounts: { [countryCode: string]: number } = {};

  const localPlanDist = { free: 0, goldMonthly: 0, goldYearly: 0, platinumMonthly: 0, platinumYearly: 0, totalPaid: 0 };
  const intlPlanDist = { free: 0, goldMonthly: 0, goldYearly: 0, platinumMonthly: 0, platinumYearly: 0, totalPaid: 0 };

  const planSummary = {
    free: 0,
    goldMonthly: 0,
    goldYearly: 0,
    platinumMonthly: 0,
    platinumYearly: 0,
  };

  type TierKey = 'free' | 'goldMonthly' | 'goldYearly' | 'platinumMonthly' | 'platinumYearly';

  const getTierKey = (plan: string, interval: string | null): TierKey => {
    const p = (plan || 'FREE').toUpperCase();
    const i = (interval || 'MONTHLY').toUpperCase();
    if (p === 'GOLD') {
      return i === 'YEARLY' ? 'goldYearly' : 'goldMonthly';
    } else if (p === 'PLATINUM') {
      return i === 'YEARLY' ? 'platinumYearly' : 'platinumMonthly';
    }
    return 'free';
  };

  type TierBreakdown = { free: number; goldMonthly: number; goldYearly: number; platinumMonthly: number; platinumYearly: number; total: number };

  const dailyMap: { [label: string]: TierBreakdown } = {};
  const weeklyMap: { [label: string]: TierBreakdown } = {};
  const monthlyMap: { [label: string]: TierBreakdown } = {};
  const yearlyMap: { [label: string]: TierBreakdown } = {};

  const initBreakdown = (): TierBreakdown => ({ free: 0, goldMonthly: 0, goldYearly: 0, platinumMonthly: 0, platinumYearly: 0, total: 0 });

  // Scheduled Renewals upcoming in the next 30 days
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewals: Array<{ userId: string; email: string; plan: string; interval: string; nextRenewalDate: string; country: string }> = [];

  allUsers.forEach((u) => {
    const isLocal = !u.country || u.country.toUpperCase() === 'IN';
    const cCode = u.country ? u.country.toUpperCase() : 'IN';
    countryCounts[cCode] = (countryCounts[cCode] || 0) + 1;

    if (isLocal) {
      localUsersCount++;
    } else {
      intlUsersCount++;
    }

    const tierKey = getTierKey(u.plan, u.planInterval);
    planSummary[tierKey]++;

    if (isLocal) {
      localPlanDist[tierKey]++;
      if (tierKey !== 'free') localPlanDist.totalPaid++;
    } else {
      intlPlanDist[tierKey]++;
      if (tierKey !== 'free') intlPlanDist.totalPaid++;
    }

    // Determine Renewal Dates
    if (u.plan !== 'FREE' && u.razorpaySubscriptionId) {
      let renewalDate: Date | null = null;
      if (u.planExpiresAt) {
        renewalDate = new Date(u.planExpiresAt);
      } else if (u.planStartedAt) {
        const started = new Date(u.planStartedAt);
        const daysToAdd = u.planInterval === 'YEARLY' ? 365 : 30;
        renewalDate = new Date(started.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      }

      if (renewalDate && renewalDate >= now && renewalDate <= next30Days) {
        upcomingRenewals.push({
          userId: u.id,
          email: u.email,
          plan: u.plan,
          interval: u.planInterval || 'YEARLY',
          nextRenewalDate: renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          country: cCode
        });
      }
    }

    const date = u.planStartedAt ? new Date(u.planStartedAt) : new Date(u.createdAt);

    // Day key: YYYY-MM-DD
    const dayKey = date.toISOString().split('T')[0];
    if (!dailyMap[dayKey]) dailyMap[dayKey] = initBreakdown();
    dailyMap[dayKey][tierKey]++;
    dailyMap[dayKey].total++;

    // Week key: Start of week
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);
    const weekKey = `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = initBreakdown();
    weeklyMap[weekKey][tierKey]++;
    weeklyMap[weekKey].total++;

    // Month key: "MMM YYYY"
    const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = initBreakdown();
    monthlyMap[monthKey][tierKey]++;
    monthlyMap[monthKey].total++;

    // Year key: "YYYY"
    const yearKey = date.getFullYear().toString();
    if (!yearlyMap[yearKey]) yearlyMap[yearKey] = initBreakdown();
    yearlyMap[yearKey][tierKey]++;
    yearlyMap[yearKey].total++;
  });

  const dailyBreakdown = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([period, data]) => ({ period, ...data }));

  const weeklyBreakdown = Object.entries(weeklyMap)
    .sort((a, b) => new Date(a[0].replace('Week of ', '')).getTime() - new Date(b[0].replace('Week of ', '')).getTime())
    .slice(-8)
    .map(([period, data]) => ({ period, ...data }));

  const monthlyBreakdown = Object.entries(monthlyMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-12)
    .map(([period, data]) => ({ period, ...data }));

  const yearlyBreakdown = Object.entries(yearlyMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([period, data]) => ({ period, ...data }));

  // 8. Fetch Telemetry Audit Events for Upgrades, Cancellations, Failures, Auto-Renewals & Gifts
  const rawEvents = await prisma.telemetryEvent.findMany({
    where: {
      eventType: {
        in: [
          'PLAN_UPGRADE',
          'ACCOUNT_CANCELLED',
          'SUBSCRIPTION_CANCELLED',
          'SUBSCRIPTION_PAYMENT_FAILED',
          'AUTO_RENEWAL',
          'GIFT_PURCHASED',
          'GIFT_REDEEMED'
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 300
  });

  // 9. Fetch All Subscription Vouchers & Redemption User Accounts
  const allVouchers = await prisma.subscriptionVoucher.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const redeemedUserIds = allVouchers.map(v => v.usedById).filter(Boolean) as string[];
  const redeemedUsers = await prisma.user.findMany({
    where: { id: { in: redeemedUserIds } },
    select: { id: true, email: true, name: true }
  });
  const redeemedUserMap = new Map(redeemedUsers.map(u => [u.id, u]));

  // Index Gift Telemetry Events by Voucher Code
  const giftPurchasedEventsMap = new Map<string, any>();
  const giftRedeemedEventsMap = new Map<string, any>();

  // Upgrade Transitions Aggregator
  const upgradeTransitions: { [path: string]: number } = {};
  const upgradeEventsList: Array<{ id: string; path: string; from: string; to: string; email: string; country: string; date: string }> = [];

  // Account Cancellations
  let accountCancellationsCount = 0;
  const accountCancellationsList: Array<{ id: string; email: string; plan: string; country: string; date: string }> = [];

  // Subscription Cancellations (Churn)
  let subCancellationsCount = 0;
  const subCancellationTiers: { [tier: string]: number } = { GOLD: 0, PLATINUM: 0, OTHER: 0 };
  const subCancellationsList: Array<{ id: string; email: string; plan: string; reason: string; date: string }> = [];

  // Payment Failures
  let paymentFailuresCount = 0;
  const failureReasons: { [reason: string]: number } = {};
  const paymentFailuresList: Array<{ id: string; email: string; plan: string; error: string; amount: number; date: string }> = [];

  // Auto Renewals
  let autoRenewalsCount = 0;
  const autoRenewalsByDate: { [dateKey: string]: number } = {};
  const autoRenewalsList: Array<{ id: string; email: string; plan: string; interval: string; amount: number; date: string }> = [];

  rawEvents.forEach((ev) => {
    let meta: any = {};
    try {
      meta = ev.metadata ? JSON.parse(ev.metadata) : {};
    } catch (e) {
      meta = {};
    }

    const dateStr = new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dayStr = new Date(ev.createdAt).toISOString().split('T')[0];

    if (ev.eventType === 'PLAN_UPGRADE') {
      const path = ev.sourceId || `${meta.from || 'FREE'} -> ${meta.to || 'GOLD'}`;
      upgradeTransitions[path] = (upgradeTransitions[path] || 0) + 1;
      upgradeEventsList.push({
        id: ev.id,
        path,
        from: meta.from || 'FREE',
        to: meta.to || 'GOLD',
        email: meta.email || 'User',
        country: meta.country || 'IN',
        date: dateStr
      });
    } else if (ev.eventType === 'ACCOUNT_CANCELLED') {
      accountCancellationsCount++;
      accountCancellationsList.push({
        id: ev.id,
        email: meta.email || ev.sourceId || 'User',
        plan: meta.plan || 'FREE',
        country: meta.country || 'IN',
        date: dateStr
      });
    } else if (ev.eventType === 'SUBSCRIPTION_CANCELLED') {
      subCancellationsCount++;
      const tier = (meta.previousPlan || meta.plan || 'OTHER').toUpperCase();
      if (subCancellationTiers[tier] !== undefined) {
        subCancellationTiers[tier]++;
      } else {
        subCancellationTiers.OTHER++;
      }
      subCancellationsList.push({
        id: ev.id,
        email: meta.email || 'Subscriber',
        plan: tier,
        reason: meta.reason || 'User initiated cancellation',
        date: dateStr
      });
    } else if (ev.eventType === 'SUBSCRIPTION_PAYMENT_FAILED') {
      paymentFailuresCount++;
      const err = meta.error || 'Payment declined by bank';
      failureReasons[err] = (failureReasons[err] || 0) + 1;
      paymentFailuresList.push({
        id: ev.id,
        email: meta.email || 'Subscriber',
        plan: meta.plan || 'MEMBER',
        error: err,
        amount: meta.amount || 0,
        date: dateStr
      });
    } else if (ev.eventType === 'AUTO_RENEWAL') {
      autoRenewalsCount++;
      autoRenewalsByDate[dayStr] = (autoRenewalsByDate[dayStr] || 0) + 1;
      autoRenewalsList.push({
        id: ev.id,
        email: meta.email || 'Subscriber',
        plan: meta.plan || 'GOLD',
        interval: meta.interval || 'YEARLY',
        amount: meta.amount || 0,
        date: dateStr
      });
    } else if (ev.eventType === 'GIFT_PURCHASED') {
      if (meta.codes && Array.isArray(meta.codes)) {
        meta.codes.forEach((c: string) => {
          giftPurchasedEventsMap.set(c, { ...meta, createdAt: ev.createdAt });
        });
      }
    } else if (ev.eventType === 'GIFT_REDEEMED') {
      if (meta.code) {
        giftRedeemedEventsMap.set(meta.code, { ...meta, createdAt: ev.createdAt });
      }
    }
  });

  // 10. Build Full Gift Wisdom Ledger (From Whom -> To Whom)
  let totalGiftRevenue = 0;
  let redeemedGiftsCount = 0;
  let pendingGiftsCount = 0;
  let goldGiftsCount = 0;
  let platinumGiftsCount = 0;

  const giftLedger = allVouchers.map((v) => {
    const pMeta = giftPurchasedEventsMap.get(v.code);
    const rMeta = giftRedeemedEventsMap.get(v.code);
    const usedByUser = v.usedById ? redeemedUserMap.get(v.usedById) : null;

    if (v.isUsed) redeemedGiftsCount++;
    else pendingGiftsCount++;

    if (v.plan === 'PLATINUM') platinumGiftsCount++;
    else goldGiftsCount++;

    const unitPrice = pMeta?.amount 
      ? (pMeta.amount / (pMeta.quantity || 1)) 
      : (v.plan === 'PLATINUM' ? (v.months === 12 ? 490 : 49) : (v.months === 12 ? 390 : 39));
    
    totalGiftRevenue += unitPrice;

    // Extract sender name / details from sponsoredBy or telemetry
    let senderName = pMeta?.senderName || 'Primary Sponsor';
    let senderEmail = pMeta?.senderEmail || 'gifts@vyoma.org';
    let recipientName = pMeta?.recipientName || 'Gift Recipient';
    let recipientEmail = pMeta?.recipientEmail || 'recipient@vyoma.org';
    let relationship = pMeta?.relationship || 'Loved One';
    let occasion = pMeta?.occasion || 'Sacred Gift of Wisdom';
    let personalMessage = pMeta?.personalMessage || 'Wishing you wisdom and joyful learning.';

    if (!pMeta && v.sponsoredBy) {
      const match = v.sponsoredBy.match(/Gift from (.*?) to (.*?) \((.*?) • (.*?)\)/i) || 
                    v.sponsoredBy.match(/Gift Bundle from (.*?) \((.*?)\)/i);
      if (match) {
        if (match.length >= 5) {
          senderName = match[1];
          recipientName = match[2];
          relationship = match[3];
          occasion = match[4];
        } else if (match.length >= 3) {
          senderName = match[1];
          relationship = match[2];
        }
      }
    }

    const createdDateStr = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const redeemedDateStr = rMeta ? new Date(rMeta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    return {
      id: v.id,
      code: v.code,
      plan: v.plan,
      months: v.months,
      senderName,
      senderEmail,
      recipientName,
      recipientEmail,
      relationship,
      occasion,
      personalMessage,
      amount: unitPrice,
      currency: pMeta?.currency || 'INR',
      isRedeemed: v.isUsed,
      redeemedBy: v.isUsed ? {
        name: rMeta?.redeemedByName || usedByUser?.name || 'Subscriber',
        email: rMeta?.redeemedByEmail || usedByUser?.email || 'Active Account',
        date: redeemedDateStr
      } : null,
      createdAt: createdDateStr
    };
  });

  const totalGiftsCount = allVouchers.length;
  const redemptionRate = totalGiftsCount > 0 ? ((redeemedGiftsCount / totalGiftsCount) * 100).toFixed(1) : '0.0';

  // Top Country Rankings for Geo Analytics
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([code, count]) => ({
      code,
      name: code === 'IN' ? 'India' : code === 'US' ? 'United States' : code === 'GB' ? 'United Kingdom' : code === 'SG' ? 'Singapore' : code === 'AE' ? 'United Arab Emirates' : code === 'CA' ? 'Canada' : code === 'AU' ? 'Australia' : code === 'DE' ? 'Germany' : code,
      count,
      pct: ((count / Math.max(1, totalUsersCount)) * 100).toFixed(1)
    }));

  return (
    <AnalyticsClientPage
      totalUsersCount={totalUsersCount}
      totalReferrals={totalReferrals}
      totalQuizAttempts={totalQuizAttempts}
      totalCertificates={totalCertificates}
      signupTrendData={signupTrendData}
      topSeenCourses={topSeenCourses}
      topWatchCourses={topWatchCourses}
      totalHoursOverall={totalHoursOverall}
      avgRating={avgRating}
      totalReviews={totalReviews}
      ratingCounts={ratingCounts}
      selectedType={contentType}
      planSummary={planSummary}
      timeframeAnalytics={{
        daily: dailyBreakdown,
        weekly: weeklyBreakdown,
        monthly: monthlyBreakdown,
        yearly: yearlyBreakdown,
      }}
      regionalAnalytics={{
        localUsersCount,
        intlUsersCount,
        localPlanDist,
        intlPlanDist,
        topCountries
      }}
      subscriptionTelemetry={{
        upgradeTransitions,
        upgradeEventsList: upgradeEventsList.slice(0, 15),
        totalUpgrades: upgradeEventsList.length,
        accountCancellationsCount,
        accountCancellationsList: accountCancellationsList.slice(0, 15),
        subCancellationsCount,
        subCancellationTiers,
        subCancellationsList: subCancellationsList.slice(0, 15),
        paymentFailuresCount,
        failureReasons,
        paymentFailuresList: paymentFailuresList.slice(0, 15),
        autoRenewalsCount,
        autoRenewalsByDate,
        autoRenewalsList: autoRenewalsList.slice(0, 15),
        upcomingRenewals: upcomingRenewals.slice(0, 15)
      }}
      giftAnalytics={{
        totalGiftsCount,
        totalGiftRevenue,
        redeemedGiftsCount,
        pendingGiftsCount,
        redemptionRate,
        goldGiftsCount,
        platinumGiftsCount,
        giftLedger
      }}
    />
  );
}
