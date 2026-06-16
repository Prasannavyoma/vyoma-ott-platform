import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';

async function downloadImage(url: string, prefix: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const res = await fetch(url);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const extension = path.extname(new URL(url).pathname) || '.jpg';
      const filename = `wp-api-${prefix}-${Date.now()}${extension}`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      return `/uploads/${filename}`;
    }
  } catch (e) {
    console.error('Failed to download remote binary:', e);
  }
  return url; // fallback to remote URL
}

function extractVideoUrl(content: string): string | null {
  // Look for iframes
  const iframeRegex = /<iframe[^>]+src="([^">]+)"/i;
  const match = content.match(iframeRegex);
  if (match) return match[1];

  // Try to find direct video extensions
  const urlRegex = /(https?:\/\/[^\s"']+\.(?:mp4|webm|ogg|mp3|wav))/i;
  const matchUrl = content.match(urlRegex);
  if (matchUrl) return matchUrl[1];

  // Try to find youtube links
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s"']+)/i;
  const matchYt = content.match(ytRegex);
  if (matchYt) return matchYt[1];

  return null;
}

export default async function ImportWPCoursesPage({ searchParams }: { searchParams: Promise<{ success?: string, count?: string, epCount?: string, error?: string }> }) {
  
  // Option A: XML File Upload Importer Action
  async function handleWPXMLImport(fd: FormData) {
    "use server";
    const file = fd.get('xmlFile') as File;
    if (!file || file.size === 0) return;

    const xmlText = await file.text();
    
    // Split items using regex
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    let importCount = 0;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const postTypeMatch = itemXml.match(/<wp:post_type>([\s\S]*?)<\/wp:post_type>/i);
      const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);

      const postType = postTypeMatch ? postTypeMatch[1].trim() : '';
      
      const validTypes = ['course', 'lesson', 'post', 'sfwd-courses', 'sensei_course'];
      if (!validTypes.includes(postType.toLowerCase())) continue;

      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Untitled WordPress Course';
      const contentRaw = contentMatch ? contentMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
      
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      let remoteImgUrl = '';
      const imgRegex = /<img[^>]+src="([^">]+)"/i;
      const imgMatch = contentRaw.match(imgRegex);
      if (imgMatch) {
        remoteImgUrl = imgMatch[1];
      }

      let finalThumbnailUrl = '/images/course-placeholder.jpg';

      if (remoteImgUrl && (remoteImgUrl.startsWith('http://') || remoteImgUrl.startsWith('https://'))) {
        try {
          const imgRes = await fetch(remoteImgUrl);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const extension = path.extname(new URL(remoteImgUrl).pathname) || '.jpg';
            const filename = `wp-migrated-${slug}-${Date.now()}${extension}`;
            fs.writeFileSync(path.join(uploadDir, filename), buffer);
            finalThumbnailUrl = `/uploads/${filename}`;
          }
        } catch (e) {
          finalThumbnailUrl = remoteImgUrl; 
        }
      }

      const cleanedDesc = contentRaw
        .replace(/\[\/?[^\]]+\]/g, '') // Strip WP Shortcodes
        .substring(0, 400) + '...';

      await prisma.course.upsert({
        where: { id: slug },
        update: {
          title,
          description: cleanedDesc,
          thumbnailUrl: finalThumbnailUrl,
        },
        create: {
          id: slug,
          title,
          description: cleanedDesc,
          thumbnailUrl: finalThumbnailUrl,
          accessLevel: 'FREE',
          category: 'Imported from WordPress',
          price: 0
        }
      });

      importCount++;
    }

    redirect(`/admin/courses/import-wp?success=1&count=${importCount}`);
  }

  // Option B: Live REST API Importer Action
  async function handleWPAPISync(fd: FormData) {
    "use server";
    const siteUrl = fd.get('siteUrl') as string;
    const username = fd.get('username') as string || '';
    const appPassword = fd.get('appPassword') as string || '';
    const courseEndpoint = fd.get('courseEndpoint') as string || 'sfwd-courses';
    const lessonEndpoint = fd.get('lessonEndpoint') as string || 'sfwd-lessons';

    if (!siteUrl) return;

    let cleanUrl = siteUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (username && appPassword) {
      const creds = Buffer.from(`${username}:${appPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }

    try {
      // 1. Fetch courses
      const coursesUrl = `${cleanUrl}/wp-json/wp/v2/${courseEndpoint}?per_page=100`;
      const coursesRes = await fetch(coursesUrl, { headers });
      if (!coursesRes.ok) {
        throw new Error(`Failed to fetch from course endpoint '${courseEndpoint}'. Check credentials or endpoint name.`);
      }
      
      const wpCourses = await coursesRes.json();
      let courseCount = 0;
      let lessonCount = 0;

      for (const wpCourse of wpCourses) {
        const title = (wpCourse.title?.rendered || wpCourse.title || 'Untitled Course').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const content = wpCourse.content?.rendered || wpCourse.content || '';
        const rawId = String(wpCourse.id);
        const slug = wpCourse.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        let thumbnailUrl = '/images/course-placeholder.jpg';
        if (wpCourse.featured_media) {
          try {
            const mediaRes = await fetch(`${cleanUrl}/wp-json/wp/v2/media/${wpCourse.featured_media}`, { headers });
            if (mediaRes.ok) {
              const media = await mediaRes.json();
              if (media.source_url) {
                thumbnailUrl = await downloadImage(media.source_url, slug);
              }
            }
          } catch (err) {
            console.error('Failed to download course thumbnail:', err);
          }
        }

        const cleanDesc = content.replace(/\[\/?[^\]]+\]/g, '').substring(0, 400) + '...';

        await prisma.course.upsert({
          where: { id: slug },
          update: {
            title,
            description: cleanDesc,
            thumbnailUrl
          },
          create: {
            id: slug,
            title,
            description: cleanDesc,
            thumbnailUrl,
            accessLevel: 'FREE',
            category: 'WordPress API Sync',
            price: 0
          }
        });
        courseCount++;

        // 2. Fetch linked lessons/episodes
        try {
          const lessonsUrl = `${cleanUrl}/wp-json/wp/v2/${lessonEndpoint}?course=${rawId}&per_page=100`;
          const lessonsRes = await fetch(lessonsUrl, { headers });
          if (lessonsRes.ok) {
            const wpLessons = await lessonsRes.json();
            let orderIndex = 1;
            for (const wpLesson of wpLessons) {
              const lTitle = (wpLesson.title?.rendered || wpLesson.title || 'Untitled Lesson').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
              const lContent = wpLesson.content?.rendered || wpLesson.content || '';
              const lSlug = wpLesson.slug || lTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              
              let lThumbnail = '/images/course-placeholder.jpg';
              if (wpLesson.featured_media) {
                try {
                  const lMediaRes = await fetch(`${cleanUrl}/wp-json/wp/v2/media/${wpLesson.featured_media}`, { headers });
                  if (lMediaRes.ok) {
                    const lMedia = await lMediaRes.json();
                    if (lMedia.source_url) {
                      lThumbnail = await downloadImage(lMedia.source_url, lSlug);
                    }
                  }
                } catch (err) {}
              }

              const videoUrl = extractVideoUrl(lContent);

              await prisma.episode.upsert({
                where: { id: lSlug },
                update: {
                  title: lTitle,
                  description: lContent.replace(/\[\/?[^\]]+\]/g, '').substring(0, 200) + '...',
                  thumbnailUrl: lThumbnail,
                  videoUrl: videoUrl,
                  courseId: slug
                },
                create: {
                  id: lSlug,
                  title: lTitle,
                  description: lContent.replace(/\[\/?[^\]]+\]/g, '').substring(0, 200) + '...',
                  thumbnailUrl: lThumbnail,
                  videoUrl: videoUrl,
                  courseId: slug,
                  accessLevel: 'FREE',
                  order: orderIndex++
                }
              });
              lessonCount++;
            }
          }
        } catch (lErr) {
          console.error(`Error loading lessons for course ${title}:`, lErr);
        }
      }

      redirect(`/admin/courses/import-wp?success=1&count=${courseCount}&epCount=${lessonCount}`);
    } catch (error: any) {
      console.error('WP API Ingestion Error:', error);
      redirect(`/admin/courses/import-wp?error=${encodeURIComponent(error.message || 'API connection failed')}`);
    }
  }

  const sp = await searchParams;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', color: '#fff' }}>
       
       <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🌐 WordPress Content Importer Console
          </h1>
          <p style={{ color: '#aaa', marginTop: '5px' }}>Ingest entire WordPress course catalogs, download referenced media assets, clean legacy shortcodes, and link lessons automatically.</p>
       </div>

       {sp.success && (
          <div style={{ background: 'rgba(70,211,105,0.15)', border: '1px solid #46d369', color: '#46d369', padding: '20px', borderRadius: '10px', marginBottom: '30px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>🎉 MIGRATION COMPLETE: Hydrated {sp.count} courses {sp.epCount ? `and ${sp.epCount} lessons` : ''} into the database successfully!</div>
             <a href="/admin/courses" style={{ background: '#46d369', color: '#000', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>View Catalog →</a>
          </div>
       )}

       {sp.error && (
          <div style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid #ff4757', color: '#ff4757', padding: '20px', borderRadius: '10px', marginBottom: '30px', fontWeight: 'bold' }}>
             ❌ MIGRATION ERROR: {decodeURIComponent(sp.error)}
          </div>
       )}

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          {/* OPTION A: XML WXR FILE IMPORT */}
          <div style={{ background: '#111', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
             <div>
                <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>📄 Option A: WXR File Import (.xml)</h3>
                <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>Export individual XML files using WordPress built-in exporting tools and upload them here to index items.</p>
             </div>
             
             <form action={handleWPXMLImport}>
                <div style={{ border: '2px dashed #333', borderRadius: '12px', padding: '35px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', marginBottom: '20px' }}>
                   <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
                   <input type="file" name="xmlFile" accept=".xml" required style={{ color: '#aaa', fontSize: '0.85rem' }} />
                   <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '10px' }}>WordPress eXtended RSS (.xml) formats</div>
                </div>

                <div style={{ background: 'rgba(242,100,34,0.05)', borderLeft: '3px solid var(--primary)', padding: '12px', fontSize: '0.8rem', color: '#ccc', marginBottom: '20px' }}>
                   * Images referenced in &lt;content:encoded&gt; will be downloaded to standard local folders automatically.
                </div>

                <button type="submit" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}>
                   Upload and Migrate XML
                </button>
             </form>
          </div>

          {/* OPTION B: LIVE REST API SYNCS */}
          <div style={{ background: '#111', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ Option B: Live REST API Syncer</h3>
             <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>Pull and import courses directly from a live WordPress site using the WordPress JSON API.</p>

             <form action={handleWPAPISync} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>WordPress Site URL</label>
                   <input type="text" name="siteUrl" required placeholder="https://old-site.com" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>WP Username (Optional)</label>
                      <input type="text" name="username" placeholder="e.g. admin" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none' }} />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>App Password (Optional)</label>
                      <input type="password" name="appPassword" placeholder="xxxx xxxx xxxx xxxx" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none' }} />
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Courses CPT Endpoint</label>
                      <input type="text" name="courseEndpoint" required defaultValue="sfwd-courses" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none' }} />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Lessons CPT Endpoint</label>
                      <input type="text" name="lessonEndpoint" required defaultValue="sfwd-lessons" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px', outline: 'none' }} />
                   </div>
                </div>

                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, #ff8c53 100%)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 25px rgba(242,100,34,0.2)' }}>
                   Trigger Live API Ingestion
                </button>
             </form>
          </div>

       </div>

       {/* WP MIGRATION PLAYBOOK */}
       <div style={{ background: '#111', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: '#aaa' }}>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>📖 WordPress Content Sync Playbook</h4>
          
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px', lineHeight: '1.6', paddingLeft: '20px' }}>
             <li>
                <strong style={{ color: '#fff' }}>WordPress API Access:</strong> Ensure that your old site has REST API JSON endpoints exposed (accessible via `https://old-site.com/wp-json/wp/v2`).
             </li>
             <li>
                <strong style={{ color: '#fff' }}>Application Passwords:</strong> If your WP API is protected, create a dedicated password by going to **WordPress Admin ➔ Users ➔ Profile ➔ Application Passwords** (add name, click Add, and copy the 24-character code). Do not use your standard login password.
             </li>
             <li>
                <strong style={{ color: '#fff' }}>Custom Post Types (CPT) mapping:</strong> Default values are set to `sfwd-courses` (LearnDash courses) and `sfwd-lessons` (LearnDash lessons). If you are using standard WordPress pages/posts or Sensei LMS, change endpoints to `courses` and `lessons` or `posts` and `pages`.
             </li>
             <li>
                <strong style={{ color: '#fff' }}>Automated Asset Local Ingestion:</strong> The migration engine automatically contacts the remote WP uploads folder, downloads binary images, saves them locally in Next.js public directories, and updates image reference maps to guarantee image persistence.
             </li>
          </ul>
       </div>

    </div>
  );
}
