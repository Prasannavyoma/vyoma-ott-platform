import prisma from '@/lib/prisma';
import NavBar from '../components/NavBar';
import ExploreClient from './ExploreClient';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  // Use raw SQL to bypass strict Prisma Client validation which crashes 
  // if the Next.js server hasn't been restarted after a schema push.
  const allCourses = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, title, thumbnailUrl, accessLevel, category, contentType, createdAt, showRibbon, views, price
    FROM Course 
    ORDER BY createdAt DESC
  `);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <ExploreClient initialCourses={allCourses} />
    </main>
  );
}
