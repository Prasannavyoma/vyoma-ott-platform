import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CourseMetadataForm from '../../components/CourseMetadataForm';
import QuizUploader from './quiz-uploader';

export default async function CourseEditorPage(props: any) {
  const params = await props.params;
  const courseId = params.id;

  let course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { episodes: { orderBy: { order: 'asc' } } }
  });

  // Self-healing URI decoding fallback
  if (!course && courseId.includes('%')) {
    try {
      course = await prisma.course.findUnique({
        where: { id: decodeURIComponent(courseId) },
        include: { episodes: { orderBy: { order: 'asc' } } }
      });
    } catch (e) {}
  }

  if (!course) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ marginBottom: '20px' }}>Course payload structure not found.</h2>
        <Link href="/admin/courses" style={{ color: 'var(--primary)' }}>← Return to Hub</Link>
      </div>
    );
  }

  // Get available categories from taxonomy
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  } catch (e) {}

  const targetId = course.id;

  // Server Action: Update Core Metadata
  async function updateCourse(formData: FormData) {
    "use server";
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const trailerUrl = formData.get('trailerUrl') as string;
    const category = formData.get('category') as string;
    const contentType = formData.get('contentType') as string;
    const accessLevel = formData.get('accessLevel') as string;
    const price = parseFloat(formData.get('price') as string || '0');
    const showRibbon = formData.get('showRibbon') === 'on';
    const seoKeywords = formData.get('seoKeywords') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const imageAlt = formData.get('imageAlt') as string;
    const roadmapOrder = parseInt(formData.get('roadmapOrder') as string || '0', 10);
    const hasFreeTrial = formData.get('hasFreeTrial') === 'on';

    await prisma.course.update({
      where: { id: targetId }, // Use sanitized fetched model ID
      data: { 
        title, 
        description, 
        thumbnailUrl, 
        trailerUrl,
        category, 
        contentType, 
        accessLevel, 
        price,
        showRibbon,
        hasFreeTrial,
        seoKeywords,
        metaTitle,
        metaDescription,
        imageAlt,
        roadmapOrder
      } as any
    });
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath(`/admin/courses`);
  }

  // Server Action: Spawn Episode
  async function addEpisode(formData: FormData) {
    "use server";
    const epTitle = formData.get('epTitle') as string;
    const epVideo = formData.get('epVideo') as string;
    const epDesc = formData.get('epDesc') as string;
    const epAccess = formData.get('epAccess') as string;
    const epOrder = parseInt(formData.get('epOrder') as string || "0");

    await prisma.episode.create({
      data: {
        title: epTitle,
        videoUrl: epVideo,
        description: epDesc,
        accessLevel: epAccess,
        order: epOrder,
        courseId: targetId
      }
    });
    revalidatePath(`/admin/courses/${courseId}`);
  }

  // Server Action: Purge Episode
  async function deleteEpisode(formData: FormData) {
    "use server";
    const epId = formData.get('epId') as string;
    // Wipe dependency records
    await prisma.progress.deleteMany({ where: { episodeId: epId } });
    await prisma.episode.delete({ where: { id: epId } });
    revalidatePath(`/admin/courses/${courseId}`);
  }

  return (
    <div style={{ paddingBottom: '50px', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      <div style={{ marginBottom: '20px' }}>
         <Link href="/admin/courses" style={{ color: '#777', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 800 }}>← RETURN TO COURSE HUB</Link>
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>Curriculum Orchestrator</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>Editing: <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{course.title}</span></p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
        
        {/* 1. PARENT COURSE METADATA */}
        <div>
          <CourseMetadataForm course={course} categories={categories} updateCourseAction={updateCourse} />
          
          <QuizUploader episodes={course.episodes} courseId={course.id} />

          <div style={{ marginTop: '20px', background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(242, 100, 34, 0.2)' }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>🎓 Validation & Quizzing</h3>
             <p style={{ fontSize: '0.8rem', color: '#777', marginBottom: '20px' }}>Attach modular quizzes yielding automated certification detachment and rewards upon course completion.</p>
             <Link href={`/admin/courses/${course.id}/quiz`} style={{ display: 'block', width: '100%', padding: '15px', background: 'var(--primary, #f26422)', color: '#fff', textAlign: 'center', borderRadius: '8px', fontWeight: 900, textDecoration: 'none', boxShadow: '0 4px 15px rgba(242, 100, 34, 0.2)' }}>
                MANAGE COURSE QUIZ & CERTIFICATE
             </Link>
          </div>
        </div>

        {/* 2. EPISODE INJECTOR & ORDERING (ALBUM STRUCTURE) */}
        <div>
          <div style={{ background: 'var(--card-bg, #111)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' }}>
             <h3 style={{ marginBottom: '15px', fontSize: '1.1rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                <span>📺 Curriculum Modules / Episodes</span>
                <span style={{ fontSize: '0.75rem', background: '#000', padding: '4px 10px', borderRadius: '20px', border: '1px solid #333', fontWeight: 'normal', color: '#aaa' }}>{course.episodes.length} Units Configured</span>
             </h3>

             {/* List existing episodes */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {course.episodes.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#555', border: '1px dashed #222', borderRadius: '8px', fontSize: '0.9rem' }}>No modules instantiated yet. Convert this envelope into an Album by adding modules below.</div>
                ) : (
                  course.episodes.map((ep) => (
                    <div key={ep.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <div style={{ background: '#000', color: 'var(--primary)', border: '1px solid #333', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>{ep.order}</div>
                          <div>
                             <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {ep.title}
                               <span style={{ fontSize: '0.65rem', background: '#111', border: '1px solid #333', padding: '2px 6px', borderRadius: '4px', color: '#aaa', fontWeight: 'bold' }}>
                                 🛡️ {ep.accessLevel || 'FREE'}
                               </span>
                             </div>
                             <div style={{ fontSize: '0.7rem', color: '#666', fontFamily: 'monospace', marginTop: '4px' }}>VIDEO: {ep.videoUrl ? (ep.videoUrl.length > 45 ? ep.videoUrl.substring(0,45)+'...' : ep.videoUrl) : 'None'}</div>
                          </div>
                       </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                           <Link href={`/admin/episodes/${ep.id}`} style={{ background: 'rgba(70,211,105,0.1)', border: '1px solid rgba(70,211,105,0.3)', color: '#46d369', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>✎ EDIT</Link>
                           <form action={deleteEpisode}>
                              <input type="hidden" name="epId" value={ep.id} />
                              <button type="submit" style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', color: '#e50914', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✕ PURGE</button>
                           </form>
                        </div>
                    </div>
                  ))
                )}
             </div>

             {/* Add New Episode Form with granular access config */}
             <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #222' }}>
               <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f26422', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>➕ Append Sequence Module</h4>
               <form action={addEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Module Title</label>
                      <input required type="text" name="epTitle" placeholder="e.g. Balakanda - Part 1" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Cloud Streaming/Video URL</label>
                      <input required type="text" name="epVideo" placeholder="https://digitalsanskrit.b-cdn.net/..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Module Synopsis (Optional)</label>
                      <input type="text" name="epDesc" placeholder="Short context..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Episode Lock Tier</label>
                      <select name="epAccess" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}>
                        <option value="FREE">🆓 FREE ACCESS</option>
                        <option value="GOLD_MONTHLY">🌟 GOLD (MONTHLY)</option>
                        <option value="GOLD_YEARLY">👑 GOLD (YEARLY)</option>
                        <option value="PLATINUM_MONTHLY">💎 PLATINUM (MONTHLY)</option>
                        <option value="PLATINUM_YEARLY">🔮 PLATINUM (YEARLY)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Seq</label>
                      <input type="number" name="epOrder" defaultValue={course.episodes.length + 1} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                    </div>
                  </div>

                  <button type="submit" style={{ marginTop: '5px', width: '100%', padding: '12px', background: 'rgba(242, 100, 34, 0.1)', color: '#f26422', border: '1px solid rgba(242, 100, 34, 0.3)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.5px' }}>
                     🚀 INJECT MODULE INTO SEQUENCE
                  </button>
               </form>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
