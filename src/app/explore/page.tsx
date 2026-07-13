import prisma from '@/lib/prisma';
import NavBar from '../components/NavBar';
import ExploreClient from './ExploreClient';

export const revalidate = 3600; // Cache this page for 1 hour (ISR)

export default async function ExplorePage() {
  const allCourses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      accessLevel: true,
      category: true,
      contentType: true,
      createdAt: true,
      showRibbon: true,
      views: true,
      price: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <ExploreClient initialCourses={allCourses} />
    </main>
  );
}
