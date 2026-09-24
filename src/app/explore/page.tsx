import prisma from '@/lib/prisma';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ExploreClient from './ExploreClient';

export const revalidate = 3600; // Cache this page for 1 hour (ISR)

const FALLBACK_EXPLORE_COURSES = [
  {
    id: 'c1',
    title: 'Srimad Valmiki Ramayana - Balakanda',
    thumbnailUrl: '/assets/Balakanda.jpg',
    accessLevel: 'FREE',
    category: 'Evergreen Epics & Puranas',
    contentType: 'VIDEO',
    createdAt: new Date().toISOString(),
    showRibbon: true,
    views: 1240,
    price: 0
  },
  {
    id: 'c2',
    title: 'Bhagavad Gita - Chapter 1 to 6 Simplified',
    thumbnailUrl: '/assets/Bala-new.jpg',
    accessLevel: 'GOLD',
    category: 'Bhagavad Gita',
    contentType: 'VIDEO',
    createdAt: new Date().toISOString(),
    showRibbon: false,
    views: 980,
    price: 0
  },
  {
    id: 'c3',
    title: 'Sanskrit Grammar Masterclass - Ashtadhyayi Foundations',
    thumbnailUrl: '/assets/May-Images-2.jpg',
    accessLevel: 'PLATINUM',
    category: 'Grammar Simplified',
    contentType: 'COURSE',
    createdAt: new Date().toISOString(),
    showRibbon: true,
    views: 1520,
    price: 0
  },
  {
    id: 'c4',
    title: 'Subhashita Sangraha: 100 Gems of Sanskrit Wisdom',
    thumbnailUrl: '/assets/Balakanda.jpg',
    accessLevel: 'FREE',
    category: 'Stories & Subhashitas',
    contentType: 'EBOOK',
    createdAt: new Date().toISOString(),
    showRibbon: false,
    views: 740,
    price: 0
  },
  {
    id: 'c5',
    title: 'Vedic Chanting & Stotra Recitation Essentials',
    thumbnailUrl: '/assets/Bala-new.jpg',
    accessLevel: 'GOLD',
    category: 'World of Chants',
    contentType: 'AUDIOBOOK',
    createdAt: new Date().toISOString(),
    showRibbon: false,
    views: 630,
    price: 0
  },
  {
    id: 'c6',
    title: 'Sanskrit Word Puzzle & Interactive Quest',
    thumbnailUrl: '/assets/May-Images-2.jpg',
    accessLevel: 'FREE',
    category: 'Games & Activities',
    contentType: 'GAME',
    createdAt: new Date().toISOString(),
    showRibbon: true,
    views: 890,
    price: 0
  }
];

export default async function ExplorePage() {
  let allCourses: any[] = [];
  try {
    allCourses = await prisma.course.findMany({
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
  } catch (e) {
    console.error("ExplorePage course query failed:", e);
  }

  const coursesToRender = (allCourses && allCourses.length > 0) ? allCourses : FALLBACK_EXPLORE_COURSES;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <ExploreClient initialCourses={coursesToRender} />
      <Footer />
    </main>
  );
}
