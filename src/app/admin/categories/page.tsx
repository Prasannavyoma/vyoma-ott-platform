import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function getSafeCategories(): Promise<any[]> {
  try {
    // Standard Prisma might have generator lag here too, applying decoupling logic safely
    // @ts-ignore
    const raw = await prisma.$queryRawUnsafe(`SELECT * FROM Category ORDER BY name ASC`);
    return Array.isArray(raw) ? raw : [];
  } catch(e) { return []; }
}

export default async function CategoriesAdminPage() {
  const categories = await getSafeCategories();

  async function createCategory(formData: FormData) {
    "use server";
    const name = formData.get('name') as string;
    const desc = formData.get('description') as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const id = `cat_${Date.now()}`;
    const now = new Date().toISOString();

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO Category (id, name, description, slug, createdAt) VALUES (?, ?, ?, ?, ?)`,
        id, name, desc, slug, now
      );
      revalidatePath('/admin/categories');
    } catch (e) {
      console.error("Duplicate category or error:", e);
    }
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    const id = formData.get('id') as string;
    await prisma.$executeRawUnsafe(`DELETE FROM Category WHERE id = ?`, id);
    revalidatePath('/admin/categories');
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="admin-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Taxonomy & Categories</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Configure global taxonomy trees allowing structural grouping across the curriculum graph.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* Left side: Add new */}
        <div>
          <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>➕ Spawn Category</h3>
            <form action={createCategory}>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Name</label>
                 <input required type="text" name="name" placeholder="e.g. Advanced Grammar" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
               </div>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Description</label>
                 <textarea name="description" rows={3} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
               </div>
               <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                 Register Node
               </button>
            </form>
          </div>
        </div>

        {/* Right side: List */}
        <div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.length === 0 ? (
                 <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #333', borderRadius: '10px', color: '#666' }}>
                    No standalone taxonomies exist. Spawn one using the console to the left.
                 </div>
              ) : (
                 categories.map((cat: any) => (
                   <div key={cat.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                         <div style={{ fontWeight: 'bold', color: '#fff' }}>{cat.name}</div>
                         <div style={{ fontSize: '0.75rem', color: '#666' }}>Slug: {cat.slug}</div>
                         {cat.description && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px' }}>{cat.description}</div>}
                      </div>
                      <form action={deleteCategory}>
                         <input type="hidden" name="id" value={cat.id} />
                         <button type="submit" style={{ background: 'none', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
                           Trash
                         </button>
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
