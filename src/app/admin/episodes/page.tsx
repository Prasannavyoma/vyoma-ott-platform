import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminEpisodesPage() {
  // 1. Fetch ALL Episodes with Parent Course relations
  const episodes = await prisma.episode.findMany({
    include: { course: true },
    orderBy: [{ courseId: 'asc' }, { order: 'asc' }]
  });

  // 2. Fetch ALL Courses to populate relational selection list
  const courses = await prisma.course.findMany({
    orderBy: { title: 'asc' }
  });

  // 3. SERVER ACTION: Atomic creation of new episode with relational linking
  async function handleCreateEpisode(fd: FormData) {
    "use server";
    const title = fd.get('title') as string;
    const courseId = fd.get('courseId') as string;
    const videoUrl = fd.get('videoUrl') as string;
    const thumbnailUrl = fd.get('thumbnailUrl') as string;
    const orderStr = fd.get('order') as string;
    const description = fd.get('description') as string;

    if (!title || !courseId) return;

    await prisma.episode.create({
      data: {
        title,
        courseId,
        videoUrl: videoUrl || "https://digitalsanskrit.b-cdn.net/Videos/Raghuveera_Gadyam_Chanting/01_Balakanda.mp4",
        thumbnailUrl: thumbnailUrl || null,
        order: Number(orderStr) || 1,
        description: description || ''
      }
    });

    revalidatePath('/admin/episodes');
  }

  // 4. SERVER ACTION: Atomic deletion logic
  async function handleDeleteEpisode(fd: FormData) {
    "use server";
    const id = fd.get('id') as string;
    if (id) {
      await prisma.episode.delete({ where: { id } });
      revalidatePath('/admin/episodes');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
         <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>🎬 Episodes & Video Stream Asset Management</h1>
         <p style={{ color: '#888', marginTop: '5px' }}>Manage discrete curriculum assets, upload streams, and establish parent-child relationship binds.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
         
         {/* MAIN EPISODES LISTINGS */}
         <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>📂 Active Learning Catalog ({episodes.length})</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {episodes.map(ep => (
                  <div key={ep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{ep.title}</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '5px', display: 'flex', gap: '15px', color: '#aaa' }}>
                           <span>📚 Parent Course: <strong style={{ color: 'var(--primary)' }}>{ep.course.title}</strong></span>
                           <span>🔢 Position Order: <strong style={{ color: '#fff' }}>{ep.order}</strong></span>
                        </div>
                        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555', marginTop: '5px', wordBreak: 'break-all' }}>
                           Stream: {ep.videoUrl}
                        </div>
                     </div>
                     
                     <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link href={`/admin/episodes/${ep.id}`} style={{ background: 'rgba(70,211,105,0.1)', color: '#46d369', border: '1px solid rgba(70,211,105,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }}>
                           ✎ Edit
                        </Link>
                        <form action={handleDeleteEpisode}>
                           <input type="hidden" name="id" value={ep.id} />
                           <button type="submit" style={{ background: 'rgba(255,0,0,0.1)', color: 'red', border: '1px solid rgba(255,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                              🗑️ Delete
                           </button>
                        </form>
                     </div>
                  </div>
               ))}
               {episodes.length === 0 && (
                  <div style={{ padding: '50px', textAlign: 'center', color: '#555' }}>
                     No child episodes provisioned yet. Deploy one using console on right.
                  </div>
               )}
            </div>
         </div>

         {/* CREATION CONSOLE WITH EXPLICIT DROP DOWN SELECT */}
         <div>
            <div style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(242,100,34,0.2)', position: 'sticky', top: '20px' }}>
               <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: 'var(--primary)' }}>
                  ✨ Provision Episode / Lesson
               </h3>
               
               <form action={handleCreateEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* RECURSIVE RELATIONAL SELECT DROPDOWN (Ultimate Request Solved) */}
                  <div>
                     <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>🔗 Select Parent Course</label>
                     <select name="courseId" required style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}>
                        <option value="">-- Select Target Parent Course --</option>
                        {courses.map(c => (
                           <option key={c.id} value={c.id}>{c.title} ({c.accessLevel})</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Episode Title</label>
                     <input type="text" name="title" required placeholder="e.g. Lesson 01: Introduction to Sanskrit Grammar" style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     <div>
                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Position Order</label>
                        <input type="number" name="order" defaultValue={episodes.length + 1} required style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none' }} />
                     </div>
                     <div>
                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Access Tier</label>
                        <div style={{ background: '#222', border: '1px solid #333', color: '#666', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                           Inherited from Parent
                        </div>
                     </div>
                  </div>

                  <div>
                     <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Video Stream URL (HLS / MP4)</label>
                     <input type="url" name="videoUrl" placeholder="https://cdn.example.com/stream.m3u8" style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none' }} />
                  </div>

                  <div>
                     <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Episode Thumbnail URL (Separate Image)</label>
                     <input type="url" name="thumbnailUrl" placeholder="e.g. /uploads/custom-episode.jpg" style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none' }} />
                  </div>

                  <div>
                     <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Short Summary / Description</label>
                     <textarea name="description" placeholder="Optional short descriptive synopsis..." style={{ width: '100%', minHeight: '80px', background: '#000', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}></textarea>
                  </div>

                  <button type="submit" style={{ marginTop: '10px', width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, #ff8c53 100%)', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 25px rgba(242,100,34,0.15)' }}>
                     ➕ PROVISION VIDEO EPISODE
                  </button>

               </form>
            </div>
         </div>

      </div>
    </div>
  );
}
