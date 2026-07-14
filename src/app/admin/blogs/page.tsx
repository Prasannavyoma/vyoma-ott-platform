import prisma from '@/lib/prisma';
import BlogsClient from './BlogsClient';

export default async function AdminBlogsPage() {
  const blogs = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>📝 Blog CMS</h1>
        <p style={{ color: '#aaa', marginTop: '5px' }}>Write, edit, and publish blog posts for the frontend.</p>
      </div>

      <BlogsClient blogs={blogs} />
    </div>
  );
}
