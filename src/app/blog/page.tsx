import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function BlogListingPage() {
  const blogs = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <div style={{ padding: '120px 5% 50px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px' }}>Vyoma Insights</h1>
          <p style={{ color: '#aaa', fontSize: '1.2rem', margin: 0 }}>Articles, news, and deep-dives into Sanskrit literature.</p>
        </div>

        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#888', fontSize: '1.2rem' }}>
            No articles have been published yet. Check back later!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '40px' }}>
            {blogs.map(b => (
              <Link href={`/blog/${b.slug}`} key={b.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'row',
                  overflow: 'hidden',
                  transition: 'transform 0.3s, background 0.3s',
                  cursor: 'pointer'
                }} className="blog-card">
                  <style>{`
                    .blog-card:hover {
                      transform: translateY(-5px);
                      background: rgba(255,255,255,0.05) !important;
                    }
                  `}</style>
                  
                  {b.thumbnailUrl && (
                    <div style={{ width: '300px', background: '#111', flexShrink: 0 }}>
                      <img src={b.thumbnailUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  
                  <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 15px 0' }}>{b.title}</h2>
                    <p style={{ color: '#aaa', fontSize: '1.1rem', lineHeight: 1.6, margin: '0 0 25px 0' }}>{b.excerpt}</p>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: '#777', fontSize: '0.9rem' }}>
                      <span>✍️ {b.author}</span>
                      <span>📅 {new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
