import Link from 'next/link';
import prisma from '@/lib/prisma';
export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams?.slug || '';
  const categoryName = slug 
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Category';

  const courses = await prisma.course.findMany({
    where: {
      category: {
        contains: categoryName,
        mode: 'insensitive'
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '120px 5% 50px', minHeight: '100vh', background: '#0f1014', color: 'white' }}>
      <Link href="/" style={{ color: 'var(--primary)', display: 'inline-block', marginBottom: '30px' }}>
        ← Back to Home
      </Link>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>{categoryName}</h1>
      
      {courses.length === 0 ? (
        <p>No courses found in this category.</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {courses.map((course) => (
            <Link href={`/watch/${course.id}`} key={course.id} className="poster" style={{ width: '100%', height: '180px', position: 'relative', display: 'block', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={course.thumbnailUrl || '/images/default-course.jpg'} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="poster-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.6)', position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px' }}>
                <div className="poster-title" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{course.title}</div>
                <div className="poster-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '5px' }}>
                  <span style={{ color: '#46d369' }}>{course.accessLevel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
