const { Meilisearch } = require('meilisearch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function doIndex() {
  const client = new Meilisearch({
    host: 'https://search.digitalsanskrit.com',
    apiKey: 'Q7mR4v9sX2TbLpE6'
  });

  console.log("Fetching courses from DB...");
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      thumbnailUrl: true,
      accessLevel: true,
      contentType: true
    }
  });

  console.log("Fetching episodes from DB...");
  const episodes = await prisma.episode.findMany({
    include: {
      course: {
        select: { title: true }
      }
    }
  });

  const cleanId = (id) => id.replace(/[^a-zA-Z0-9-_]/g, '');

  const courseDocs = courses.map(c => ({
    id: `course_${cleanId(c.id)}`,
    dbId: c.id,
    type: 'course',
    title: c.title,
    description: c.description || '',
    category: c.category || 'Course',
    thumbnailUrl: c.thumbnailUrl || '',
    accessLevel: c.accessLevel,
    contentType: c.contentType
  }));

  const episodeDocs = episodes.map(e => ({
    id: `episode_${cleanId(e.id)}`,
    dbId: e.id,
    type: 'episode',
    title: e.title,
    description: e.description || '',
    category: 'Episode',
    thumbnailUrl: e.thumbnailUrl || '',
    accessLevel: e.accessLevel,
    videoUrl: e.videoUrl || '',
    audioUrl: e.audioUrl || '',
    courseId: e.courseId,
    courseTitle: e.course?.title || ''
  }));

  const documents = [...courseDocs, ...episodeDocs];
  console.log(`Uploading ${documents.length} documents to Meilisearch...`);

  const index = client.index('ott_content');
  
  await index.updateSettings({
    searchableAttributes: ['title', 'description', 'category', 'courseTitle'],
    filterableAttributes: ['type', 'category', 'accessLevel', 'contentType'],
    displayedAttributes: ['id', 'dbId', 'type', 'title', 'description', 'category', 'thumbnailUrl', 'accessLevel', 'videoUrl', 'audioUrl', 'courseId', 'courseTitle']
  });

  const response = await index.addDocuments(documents, { primaryKey: 'id' });
  console.log("Success! Task ID:", response.taskUid);
  await prisma.$disconnect();
}

doIndex().catch(console.error);
