import Link from 'next/link';
import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';

interface GenreShowcaseProps {
  contentType: string;
  title: string;
  description: string;
}

export default async function GenreShowcase({ contentType, title, description }: GenreShowcaseProps) {
  const upperType = contentType.toUpperCase();
  
  // Construct flexible category search terms
  const searchCategories: string[] = [contentType];
  if (upperType === 'EBOOK') {
    searchCategories.push('E-book', 'Ebooks', 'Ebook');
  } else if (upperType === 'PODCAST' || upperType === 'AUDIOBOOK') {
    searchCategories.push('Podcast', 'Audiobook', 'Audio', 'Podcasts');
  } else if (upperType === 'GAME') {
    searchCategories.push('Game', 'Games', 'Games & Activities');
  }

  const contentTypesToSearch = (upperType === 'PODCAST' || upperType === 'AUDIOBOOK') 
    ? ['PODCAST', 'AUDIOBOOK'] 
    : [upperType];

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { contentType: { in: contentTypesToSearch } },
        ...searchCategories.map(cat => ({
          category: { contains: cat, mode: 'insensitive' as const }
        }))
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      episodes: { select: { id: true } }
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: '#030b17', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}>
      <NavBar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '160px 24px 80px 24px' }}>
        {/* HEADER BLOCK */}
        <div style={{ marginBottom: '40px' }}>
          <Link 
            href="/" 
            style={{ 
              color: 'var(--primary, #f26422)', 
              textDecoration: 'none', 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px'
            }}
          >
            ← BACK TO HOME
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0', color: '#fff', letterSpacing: '-0.5px' }}>
            {title}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '680px', lineHeight: '1.6', margin: 0 }}>
            {description}
          </p>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #f26422 0%, rgba(242,100,34,0) 100%)', width: '120px', marginTop: '20px', borderRadius: '2px' }} />
        </div>

        {/* GRID LISTING */}
        <div>
          {courses.length === 0 ? (
            <div style={{ padding: '80px 20px', background: 'rgba(15, 23, 42, 0.4)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
              <h3 style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '8px' }}>No active items in this category yet.</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>New course additions for '{title}' will appear here automatically.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {courses.map((course) => (
                <Link href={`/watch/${course.id}`} key={course.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* BANNER THUMBNAIL */}
                    <div style={{ position: 'relative', paddingTop: '56.25%', background: '#090d16' }}>
                      <img 
                        src={course.thumbnailUrl || '/assets/Ayodhyakanda.jpg'} 
                        alt={course.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        background: 'rgba(2, 6, 14, 0.85)', 
                        backdropFilter: 'blur(6px)', 
                        border: '1px solid rgba(255,255,255,0.15)', 
                        padding: '4px 10px', 
                        borderRadius: '8px', 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: '#fbbf24' 
                      }}>
                        🛡️ {course.accessLevel?.replace('_', ' ')}
                      </div>
                    </div>

                    {/* BODY CONTENT */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                          {course.category || 'Uncategorized'}
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 10px 0', color: '#fff', lineHeight: '1.4', height: '44px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                        <span>{course.episodes.length} {course.episodes.length === 1 ? 'Unit' : 'Units'}</span>
                        <span style={{ color: 'var(--primary, #f26422)', fontWeight: 800 }}>EXPLORE →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
