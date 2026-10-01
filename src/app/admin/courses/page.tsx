import Link from 'next/link';
import prisma from '@/lib/prisma';
import BulkUploader from '../components/BulkUploader';
import CoursesClientTable from './CoursesClientTable';

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
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Course Distribution Hub</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '4px' }}>
            Manage curriculum catalog items, edit modules, broadcast updates, or provision new assets.
          </p>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 800 }}>
          + Add Single Course
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <BulkUploader />
      </div>

      {/* CLIENT SEARCH BAR AND INTERACTIVE TABLE */}
      <CoursesClientTable initialCourses={courses} />
    </div>
  );
}
