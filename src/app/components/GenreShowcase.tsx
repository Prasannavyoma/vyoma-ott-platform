import Link from 'next/link';
import prisma from '@/lib/prisma';

interface GenreShowcaseProps {
  contentType: string;
  title: string;
  description: string;
}

export default async function GenreShowcase({ contentType, title, description }: GenreShowcaseProps) {
  // Dynamic database extraction matching target ContentType key
  const courses = await prisma.course.findMany({
    where: { contentType },
    orderBy: { createdAt: 'desc' },
    include: {
      episodes: { select: { id: true } }
    }
  });

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '40px 20px' }}>
       
       {/* HEADER BLOCK */}
       <div style={{ maxWidth: '1400px', margin: '0 auto 40px auto' }}>
          <Link href="/" style={{ color: '#777', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px' }}>
            ← BACK TO HOME
          </Link>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 950, marginTop: '20px', marginBottom: '10px', color: '#fff' }}>
             {title}
          </h1>
          <p style={{ color: '#888', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.6' }}>
             {description}
          </p>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, #f26422 0%, rgba(242,100,34,0) 100%)', width: '150px', marginTop: '20px' }}></div>
       </div>

       {/* GRID LISTING */}
       <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {courses.length === 0 ? (
             <div style={{ padding: '100px 20px', background: '#0a0a0a', border: '1px dashed #222', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📂</div>
                <h3 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '10px' }}>No active items in this classification yet.</h3>
                <p style={{ color: '#555', fontSize: '0.9rem' }}>New dynamic provisions under '{contentType}' will appear here synchronously.</p>
             </div>
          ) : (
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
               gap: '30px' 
             }}>
                {courses.map((course) => (
                   <Link href={`/watch/${course.id}`} key={course.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ 
                        background: '#0d0d0d', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '16px', 
                        overflow: 'hidden', 
                        transition: 'transform 0.3s, border 0.3s',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      }} onMouseEnter={(e)=>{e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.borderColor='rgba(242,100,34,0.3)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}}>
                         
                         {/* BANNER */}
                         <div style={{ position: 'relative', paddingTop: '56.25%', background: '#1a1a1a' }}>
                            <img 
                               src={course.thumbnailUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg'} 
                               alt={course.title}
                               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ 
                              position: 'absolute', top: '10px', right: '10px', 
                              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', 
                              border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', 
                              borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', color: '#ffb84d' 
                            }}>
                               🛡️ {course.accessLevel?.replace('_', ' ')}
                            </div>
                         </div>

                         {/* BODY */}
                         <div style={{ padding: '20px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#777', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
                               {course.category || 'Uncategorized'}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#fff', height: '44px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                               {course.title}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', fontSize: '0.75rem', color: '#aaa', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                               <span>{course.episodes.length} {course.episodes.length === 1 ? 'Unit' : 'Units'} Included</span>
                               <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>ENTER →</span>
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
