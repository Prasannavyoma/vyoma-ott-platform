import prisma from '@/lib/prisma';
import LayoutSettingsClient from './LayoutSettingsClient';

async function getSafeSections(): Promise<any[]> {
  try {
    return await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' }
    });
  } catch(e) { return []; }
}

async function getSafeChannels(): Promise<any[]> {
  try {
    // 1. Ensure table exists in SQLite
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS HomepageChannel (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT NOT NULL,
        "order" INTEGER DEFAULT 0
      )
    `);

    // 2. Query channels
    // @ts-ignore
    let raw = await prisma.$queryRawUnsafe(`SELECT * FROM HomepageChannel ORDER BY "order" ASC`);
    
    if (!Array.isArray(raw) || raw.length === 0) {
      // Seed defaults
      const defaults = [
        ['chan_1', 'Originals', '/genre/Vyoma-Originals', '🔥', 10],
        ['chan_2', 'Kids Academy', '/genre/Kids', '🧸', 20],
        ['chan_3', 'Sanskrit Audio', '/genre/Audiobook', '🎧', 30],
        ['chan_4', 'E-Book Shelf', '/genre/Ebook', '📖', 40],
        ['chan_5', 'Fun & Games', '/genre/Game', '🎮', 50]
      ];
      for (const row of defaults) {
        await prisma.$queryRawUnsafe(
          `INSERT INTO HomepageChannel (id, name, url, icon, "order") VALUES ($1, $2, $3, $4, $5) ON CONFLICT(id) DO NOTHING`,
          row[0], row[1], row[2], row[3], row[4]
        );
      }
      // @ts-ignore
      raw = await prisma.$queryRawUnsafe(`SELECT * FROM HomepageChannel ORDER BY "order" ASC`);
    }
    return raw as any[];
  } catch (e) {
    console.error("Failed reading/bootstrapping channels:", e);
    return [];
  }
}

export default async function LayoutSettingsPage() {
  const sections = await getSafeSections();
  const channels = await getSafeChannels();

  const courses = await prisma.course.findMany({ select: { category: true } });
  const rawCats = courses.map((c: any) => c.category).filter(Boolean) as string[];
  const availableCategories = Array.from(new Set(rawCats));

  const roadmapSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_KNOWLEDGE_ROADMAP' } });
  const roadmapEnabled = roadmapSetting ? roadmapSetting.value === 'true' : true; // Default true

  return (
    <LayoutSettingsClient 
      sections={sections} 
      channels={channels} 
      availableCategories={availableCategories} 
      roadmapEnabled={roadmapEnabled}
    />
  );
}
