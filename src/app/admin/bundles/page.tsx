import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    include: {
      courses: true,
      purchases: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '20px 40px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Course Bundles</h1>
          <p style={{ color: '#aaa' }}>Combine multiple courses into a single sellable product.</p>
        </div>
        <Link 
          href="/admin/bundles/new" 
          style={{ 
            background: 'linear-gradient(135deg, #46d369 0%, #20993f 100%)', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none', 
            fontWeight: 'bold', 
            boxShadow: '0 4px 15px rgba(70,211,105,0.3)'
          }}
        >
          + Create New Bundle
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {bundles.length === 0 ? (
          <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            No bundles found. Create one to group your courses.
          </div>
        ) : (
          bundles.map(bundle => (
            <div key={bundle.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{bundle.title}</h2>
                <div style={{ background: '#f26422', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  ₹{bundle.price}
                </div>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>
                {bundle.description.substring(0, 80)}{bundle.description.length > 80 ? '...' : ''}
              </p>
              
              <div style={{ background: '#000', borderRadius: '8px', padding: '10px', marginBottom: '15px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>
                  INCLUDED COURSES ({bundle.courses.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {bundle.courses.slice(0, 3).map(c => (
                    <div key={c.id} style={{ fontSize: '0.8rem', color: '#ccc' }}>• {c.title}</div>
                  ))}
                  {bundle.courses.length > 3 && (
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>+ {bundle.courses.length - 3} more...</div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#777' }}>
                <span>Validity: {bundle.validityDays ? `${bundle.validityDays} Days` : 'Lifetime Access'}</span>
                <span>Sales: {bundle.purchases.length}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
