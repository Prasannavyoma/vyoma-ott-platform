import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await prisma.blogPost.findUnique({
    where: { slug: params.slug }
  });

  if (!blog || !blog.published) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      
      {blog.thumbnailUrl && (
        <div style={{ width: '100%', height: '400px', position: 'relative', marginTop: '80px' }}>
          <img src={blog.thumbnailUrl} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(0deg, var(--background) 0%, transparent 100%)' }} />
        </div>
      )}

      <div style={{ padding: blog.thumbnailUrl ? '0 5% 50px' : '120px 5% 50px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2 }}>{blog.title}</h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: '#888', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px', marginBottom: '40px' }}>
          <span><strong>✍️ {blog.author}</strong></span>
          <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Since content is plain HTML/Text for V1, we use dangerouslySetInnerHTML */}
        <div 
          style={{ fontSize: '1.15rem', lineHeight: 1.8, color: '#ddd' }} 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }} 
        />
        
        <style>{`
          .blog-content p { margin-bottom: 1.5em; }
          .blog-content h2 { margin-top: 2em; margin-bottom: 0.5em; color: white; }
          .blog-content h3 { margin-top: 1.5em; margin-bottom: 0.5em; color: white; }
          .blog-content a { color: #f26422; text-decoration: underline; }
          .blog-content blockquote { border-left: 4px solid #f26422; padding-left: 20px; color: #aaa; font-style: italic; margin-left: 0; }
          .blog-content ul { padding-left: 20px; margin-bottom: 1.5em; }
          .blog-content li { margin-bottom: 0.5em; }
        `}</style>

      </div>
      <Footer />
    </main>
  );
}
