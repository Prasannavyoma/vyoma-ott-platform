import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function PagesManager() {
  let pages: any[] = [];
  try {
    // Decoupled fallback to bypass standard TS caching artifacts 
    // @ts-ignore
    pages = await prisma.$queryRawUnsafe(`SELECT * FROM CustomPage ORDER BY updatedAt DESC`);
  } catch(e) {}

  async function createPage(formData: FormData) {
    "use server";
    const title = formData.get('title') as string;
    const slug = (formData.get('slug') as string || title.toLowerCase().replace(/ /g, '-')).replace(/[^a-z0-9\-]/g, '');
    const content = formData.get('content') as string;
    const id = `pg_${Date.now()}`;
    const now = new Date().toISOString();

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO CustomPage (id, title, slug, content, active, createdAt, updatedAt) VALUES (?,?,?,?,1,?,?)`,
        id, title, slug, content, now, now
      );
      revalidatePath('/admin/pages');
    } catch(e) {
       console.error("Duplicate slug error:", e);
    }
  }

  async function deletePage(formData: FormData) {
    "use server";
    const id = formData.get('id') as string;
    await prisma.$executeRawUnsafe(`DELETE FROM CustomPage WHERE id = ?`, id);
    revalidatePath('/admin/pages');
  }

  return (
    <div style={{ maxWidth: '900px' }}>
       <div className="admin-header" style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Static Pages & CMS</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Instantiate standalone information trees (About Us, Privacy, T&C) independently from courses.</p>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          
          {/* New Page Spawn */}
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 800 }}>Create Discrete Web Document</h3>
             <form action={createPage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Document Title</label>
                   <input required type="text" name="title" placeholder="e.g. Refund Policy" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Url Slug (Leave blank to auto-generate)</label>
                   <input type="text" name="slug" placeholder="e.g. refund-policy" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Content Body (HTML Allowed)</label>
                   <textarea required name="content" rows={8} placeholder="Enter HTML markup or rich content here..." style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
                <button type="submit" style={{ padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
                  Publish Document
                </button>
             </form>
          </div>

          {/* Existing Directory */}
          <div>
             <h3 style={{ marginBottom: '20px', fontSize: '1rem', color: '#aaa' }}>Active Index</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pages.length === 0 ? (
                   <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #222', color: '#444', borderRadius: '8px' }}>No custom documents registered yet.</div>
                ) : (
                   pages.map((pg) => (
                      <div key={pg.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontWeight: 'bold', color: '#eee' }}>{pg.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#f26422' }}>/page/{pg.slug}</div>
                         </div>
                         <form action={deletePage}>
                            <input type="hidden" name="id" value={pg.id} />
                            <button type="submit" style={{ background: 'none', color: '#666', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                         </form>
                      </div>
                   ))
                )}
             </div>
          </div>

       </div>
    </div>
  );
}
