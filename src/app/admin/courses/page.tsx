import Link from 'next/link';
import prisma from '@/lib/prisma';
import { handleDeleteCourse } from './actions';
import BulkUploader from '../components/BulkUploader';
import BroadcastButton from './BroadcastButton';

export default async function AdminCoursesList() {
  // Fetch real dynamic data directly from prisma
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { episodes: true }
      }
    }
  });

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Course Distribution Hub</h1>
        <Link href="/admin/courses/new" className="btn btn-primary">
          + Add Single Course
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <BulkUploader />
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '15px' }}>Thumbnail</th>
              <th style={{ padding: '15px' }}>Title</th>
              <th style={{ padding: '15px' }}>Category</th>
              <th style={{ padding: '15px' }}>Access</th>
              <th style={{ padding: '15px' }}>Videos</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                  No posts found. Click 'Add New' to replicate an item from your WordPress clone.
                </td>
              </tr>
            )}
            {courses.map((course) => (
              <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 15px' }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="" style={{ width: '70px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '70px', height: '40px', background: '#333', borderRadius: '4px' }} />
                  )}
                </td>
                <td style={{ padding: '15px', fontWeight: '600' }}>{course.title}</td>
                <td style={{ padding: '15px', color: '#aaa' }}>{course.category || 'Uncategorized'}</td>
                <td style={{ padding: '15px' }}>
                  <span className="poster-tag" style={{ 
                    background: course.accessLevel === 'PLATINUM' ? '#e50914' : '#f26422' 
                  }}>
                    {course.accessLevel}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>{course._count.episodes}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <BroadcastButton courseId={course.id} courseTitle={course.title} />
                    <Link href={`/admin/courses/${course.id}`} style={{ background: 'transparent', border: 'none', color: '#46d369', cursor: 'pointer', textDecoration: 'none', fontSize: '0.9rem' }}>Edit</Link>
                    
                    <form action={handleDeleteCourse}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <button style={{ background: 'transparent', border: 'none', color: '#e50914', cursor: 'pointer' }} type="submit">
                          Trash
                        </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
