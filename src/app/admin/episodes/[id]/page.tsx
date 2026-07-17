import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function EpisodeEditorPage(props: any) {
  const params = await props.params;
  const epId = params.id;

  let episode = await prisma.episode.findUnique({
    where: { id: epId },
    include: { course: true }
  });

  if (!episode) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ marginBottom: '20px' }}>Episode asset payload not located.</h2>
        <Link href="/admin/episodes" style={{ color: 'var(--primary)' }}>← Return to Episodes</Link>
      </div>
    );
  }

  const courses = await prisma.course.findMany({
    orderBy: { title: 'asc' }
  });

  async function updateEpisode(formData: FormData) {
    "use server";
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const videoUrl = formData.get('videoUrl') as string;
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const audioUrl = formData.get('audioUrl') as string;
    const subtitleUrl = formData.get('subtitleUrl') as string;
    const order = parseInt(formData.get('order') as string || "1");
    const accessLevel = formData.get('accessLevel') as string;
    const duration = parseInt(formData.get('duration') as string || "0");
    const courseId = formData.get('courseId') as string;

    await prisma.$executeRawUnsafe(
      `UPDATE Episode SET title=?, description=?, videoUrl=?, thumbnailUrl=?, audioUrl=?, subtitleUrl=?, \"order\"=?, accessLevel=?, duration=?, courseId=? WHERE id=?`,
      title,
      description || null,
      videoUrl || null,
      thumbnailUrl || null,
      audioUrl || null,
      subtitleUrl || null,
      order,
      accessLevel,
      duration || null,
      courseId,
      epId
    );

    revalidatePath('/admin/episodes');
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  }

  return (
    <div style={{ paddingBottom: '50px', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      <div style={{ marginBottom: '20px' }}>
         <Link href={`/admin/courses/${episode.courseId}`} style={{ color: '#777', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 800 }}>← RETURN TO COURSE EDITOR</Link>
      </div>
      
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '5px' }}>Episode Editor</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>Refining asset: <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{episode.title}</span></p>

      <div style={{ maxWidth: '800px', background: 'var(--card-bg, #111)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <form action={updateEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Episode Title</label>
                <input required type="text" name="title" defaultValue={episode.title} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Parent Course</label>
                <select name="courseId" defaultValue={episode.courseId} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>
                  {courses.map(c => (
                     <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
             </div>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Episode Synopsis / Short Description</label>
              <textarea name="description" defaultValue={episode.description || ''} rows={3} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontFamily: 'inherit' }} />
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Video Stream URL</label>
                <input type="text" name="videoUrl" defaultValue={episode.videoUrl || ''} placeholder="https://cdn.example.com/stream.mp4" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Episode Thumbnail (Poster Image)</label>
                <input type="text" name="thumbnailUrl" defaultValue={episode.thumbnailUrl || ''} placeholder="https://cdn.example.com/thumb.jpg" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
             </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Seq Order</label>
                 <input type="number" name="order" defaultValue={episode.order} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Lock Tier</label>
                 <select name="accessLevel" defaultValue={episode.accessLevel} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}>
                    <option value="FREE">FREE</option>
                    <option value="GOLD_MONTHLY">GOLD (MONTHLY)</option>
                    <option value="GOLD_YEARLY">GOLD (YEARLY)</option>
                    <option value="PLATINUM_MONTHLY">PLATINUM (MONTHLY)</option>
                    <option value="PLATINUM_YEARLY">PLATINUM (YEARLY)</option>
                 </select>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Duration (Seconds)</label>
                 <input type="number" name="duration" defaultValue={episode.duration || 0} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Audio Track URL (Optional)</label>
                 <input type="text" name="audioUrl" defaultValue={episode.audioUrl || ''} placeholder="https://cdn.example.com/audio.mp3" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                   Subtitle File URL (.vtt / .srt)
                   {(episode as any).subtitleUrl ? (
                     <span style={{ marginLeft: '10px', background: 'rgba(70,211,105,0.2)', border: '1px solid rgba(70,211,105,0.4)', color: '#46d369', padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900 }}>✓ ACTIVE</span>
                   ) : (
                     <span style={{ marginLeft: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900 }}>NOT UPLOADED</span>
                   )}
                 </label>
                 <input type="text" name="subtitleUrl" defaultValue={(episode as any).subtitleUrl || ''} placeholder="https://cdn.example.com/subtitle.vtt" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid rgba(70,211,105,0.2)', borderRadius: '8px', color: '#fff' }} />
                 <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#666' }}>Paste a URL to a .vtt or .srt subtitle file. When set, CC is enabled automatically for viewers.</p>
              </div>
            </div>

           <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
             <button type="submit" style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px rgba(242,100,34,0.2)' }}>
                💾 SAVE EPISODE CHANGES
             </button>
             <Link href={`/admin/courses/${episode.courseId}`} style={{ padding: '16px 25px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Cancel
             </Link>
           </div>

        </form>
      </div>
    </div>
  );
}
