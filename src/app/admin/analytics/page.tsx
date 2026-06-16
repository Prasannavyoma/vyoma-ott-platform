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
    />
  );
}
