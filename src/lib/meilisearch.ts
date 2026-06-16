import { Meilisearch } from 'meilisearch';
import prisma from '@/lib/prisma';

export async function getMeilisearchSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'MEILISEARCH_ENABLED',
          'MEILISEARCH_HOST',
          'MEILISEARCH_API_KEY'
        ]
      }
    }
  });

  const config = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    enabled: config['MEILISEARCH_ENABLED'] === 'true',
    host: config['MEILISEARCH_HOST'] || '',
    apiKey: config['MEILISEARCH_API_KEY'] || ''
  };
}

export async function getMeilisearchClient() {
  const settings = await getMeilisearchSettings();
  if (!settings.enabled || !settings.host) {
    return null;
  }
  
  try {
    return new Meilisearch({
      host: settings.host,
      apiKey: settings.apiKey,
    });
  } catch (error) {
    console.error('[Meilisearch Client Init Error]:', error);
    return null;
  }
}

export async function indexAllContent(clientInstance?: Meilisearch) {
  const client = clientInstance || (await getMeilisearchClient());
  if (!client) {
    throw new Error('Meilisearch client is not configured or disabled');
  }

  // 1. Fetch data from DB
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

  const episodes = await prisma.episode.findMany({
    include: {
      course: {
        select: {
          title: true
        }
      }
    }
  });

  // 2. Format to Meilisearch document structure
  // Document IDs in Meilisearch must be a string containing only alphanumeric characters, hyphens, and underscores.
  // cuids / default ids in next apps are safe. Let's make sure we clean them.
  const cleanId = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, '');

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

  // 3. Send documents to Meilisearch
  const index = client.index('ott_content');
  
  // Set index search settings (like searchable attributes, filterable attributes, etc.)
  await index.updateSettings({
    searchableAttributes: ['title', 'description', 'category', 'courseTitle'],
    filterableAttributes: ['type', 'category', 'accessLevel', 'contentType'],
    displayedAttributes: ['id', 'dbId', 'type', 'title', 'description', 'category', 'thumbnailUrl', 'accessLevel', 'videoUrl', 'audioUrl', 'courseId', 'courseTitle']
  });

  // Upload documents (replaces index if already present, or creates if not)
  const response = await index.addDocuments(documents);
  return response;
}
