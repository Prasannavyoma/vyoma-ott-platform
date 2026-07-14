import prisma from '@/lib/prisma';
import NavBar from '../components/NavBar';
import ShortsFeedClient from './ShortsFeedClient';

export const metadata = {
  title: 'Vyoma Shorts | Bite-Sized Learning',
  description: 'Quick, 60-second vertical videos to learn Sanskrit and ancient wisdom.',
};

export default async function ShortsPage() {
  // Fetch all courses marked as "SHORT" along with their first video episode
  const rawShorts = await prisma.course.findMany({
    where: { contentType: 'SHORT' },
    orderBy: { createdAt: 'desc' },
    include: {
      episodes: {
        orderBy: { order: 'asc' },
        take: 1
      }
    }
  });

  const shorts = rawShorts.map(short => ({
    id: short.id,
    title: short.title,
    description: short.description,
    videoUrl: short.episodes[0]?.videoUrl || '',
    thumbnailUrl: short.thumbnailUrl || ''
  })).filter(s => s.videoUrl); // Only send shorts that actually have a video

  return (
    <main style={{ background: '#000', minHeight: '100vh', overflow: 'hidden' }}>
      <NavBar />
      <div style={{ height: 'calc(100vh - 70px)', marginTop: '70px', position: 'relative' }}>
        {shorts.length > 0 ? (
          <ShortsFeedClient shorts={shorts} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📱</span>
            <h2>No Shorts Available Yet</h2>
            <p>Check back later for bite-sized learning!</p>
          </div>
        )}
      </div>
    </main>
  );
}
