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

async function migratePages() {
  console.log('--- Migrating Custom Pages ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`Fetching pages page ${page}...`);
    const data: any = await fetchFromWP('pages', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpPage of data.data) {
      const slug = wpPage.slug || wpPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const existing = await prisma.customPage.findUnique({
        where: { slug }
      });

      if (!existing) {
        await prisma.customPage.create({
          data: {
            title: wpPage.title,
            slug: slug,
            content: wpPage.content,
            published: true,
            createdAt: new Date(wpPage.created_at || Date.now())
          }
        });
      } else {
        await prisma.customPage.update({
          where: { slug },
          data: {
            title: wpPage.title,
            content: wpPage.content
          }
        });
      }
      totalImported++;
    }
    
    console.log(`Imported ${totalImported} / ${data.total} pages...`);
    if (page * 100 >= data.total) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

async function migrateProgress() {
  console.log('--- Migrating User Course Progress ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`Fetching progress page ${page}...`);
    const data: any = await fetchFromWP('progress', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpData of data.data) {
      const email = wpData.user_email;
      if (!email) continue;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) continue;

      for (const [courseTitle, completedLessons] of Object.entries(wpData.progress)) {
        if ((completedLessons as number) === 0) continue;

        const course = await prisma.course.findFirst({
          where: { title: courseTitle }
        });

        if (!course) continue;

        // In LearnDash, we just know they finished X lessons.
        // In our DB, we need to mark X episodes as completed.
        const episodes = await prisma.episode.findMany({
          where: { courseId: course.id },
          orderBy: { sequenceOrder: 'asc' },
          take: completedLessons as number
        });

        for (const ep of episodes) {
           const existing = await prisma.progress.findUnique({
             where: { userId_episodeId: { userId: user.id, episodeId: ep.id } }
           });

           if (!existing) {
             await prisma.progress.create({
               data: {
                 userId: user.id,
                 courseId: course.id,
                 episodeId: ep.id,
                 isCompleted: true,
                 progressSeconds: 100 // dummy value to indicate completion
               }
             });
           }
        }
      }
      totalImported++;
    }
    
    console.log(`Imported progress for ${totalImported} / ${data.total} users...`);
    if (page * 100 >= data.total) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

async function run() {
  try {
    await migratePages();
    await migrateProgress();
    console.log('Phase 4 Migration Completed Successfully!');
  } catch (e) {
    console.error('Phase 4 Migration Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
