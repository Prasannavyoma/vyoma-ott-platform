import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WP_URL = 'https://palevioletred-albatross-358324.hostingersite.com/vyoma-export.php';
const TOKEN = 'vyoma_secure_export_2026_super_secret';

async function fetchFromWP(type: string, page: number) {
  const url = `${WP_URL}?type=${type}&page=${page}&per_page=100`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${type}: ${res.status} ${text}`);
  }
  
  return res.json();
}

async function migrateCourses() {
  console.log('--- Migrating Courses ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`Fetching courses page ${page}...`);
    const data: any = await fetchFromWP('courses', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpCourse of data.data) {
      const existing = await prisma.course.findFirst({
        where: { title: wpCourse.post_title }
      });

      const price = wpCourse.meta?._price ? parseFloat(wpCourse.meta._price) : null;
      let accessLevel = 'FREE';
      if (price && price > 0) {
        accessLevel = 'PAID';
      }

      const thumb = typeof wpCourse.thumbnail_url === 'string' ? wpCourse.thumbnail_url : null;
      let mappedCategory = wpCourse.post_type === 'sfwd-courses' ? 'LearnDash' : 'WooCommerce';
      if (wpCourse.categories && Array.isArray(wpCourse.categories) && wpCourse.categories.length > 0) {
        mappedCategory = wpCourse.categories.join(', ');
      }

      if (!existing) {
        await prisma.course.create({
          data: {
            title: wpCourse.post_title,
            description: wpCourse.post_content,
            thumbnailUrl: thumb,
            createdAt: new Date(wpCourse.post_date),
            price: price,
            accessLevel: accessLevel,
            category: mappedCategory
          }
        });
      } else {
        await prisma.course.update({
          where: { id: existing.id },
          data: {
            description: wpCourse.post_content,
            thumbnailUrl: thumb,
            price: price,
            accessLevel: accessLevel,
            category: mappedCategory
          }
        });
      }
      totalImported++;
    }
    
    console.log(`Imported ${totalImported} / ${data.total} courses...`);
    if (page * 100 >= data.total) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

async function run() {
  try {
    await migrateCourses();
    console.log('Course Migration Completed Successfully!');
  } catch (e) {
    console.error('Course Migration Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
