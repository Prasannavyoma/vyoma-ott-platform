import prisma from '@/lib/prisma';
import BundleForm from './BundleForm';

export default async function NewBundlePage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '20px 40px', color: '#fff', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>Create New Bundle</h1>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>Package multiple courses into a single offer with customized pricing and validity.</p>
      
      <BundleForm courses={courses} />
    </div>
  );
}
