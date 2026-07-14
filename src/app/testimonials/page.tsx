import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Link from 'next/link';

export const revalidate = 3600; // Cache for 1 hour

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <div style={{ padding: '120px 5% 50px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Community Voices</h1>
            <p style={{ color: '#aaa', fontSize: '1.1rem', margin: 0 }}>Discover how Vyoma is transforming the way people learn Sanskrit worldwide.</p>
          </div>
          <Link href="/submit-testimonial" className="btn btn-primary premium-glow-btn" style={{ textDecoration: 'none' }}>
            + Share Your Story
          </Link>
        </div>

        {testimonials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '20px' }}>No stories have been published yet.</p>
            <Link href="/submit-testimonial" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 24px', borderRadius: '12px' }}>Be the first to share!</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {testimonials.map(t => (
              <div key={t.id} style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '30px', 
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s'
              }}>
                <div style={{ color: '#ffd700', fontSize: '1.2rem', marginBottom: '15px' }}>
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
                <p style={{ color: '#e0e0e0', fontSize: '1.05rem', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>"{t.content}"</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #f26422, #ff8c42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem' }}>{t.name}</strong>
                    {t.role && <span style={{ color: '#888', fontSize: '0.85rem' }}>{t.role}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
