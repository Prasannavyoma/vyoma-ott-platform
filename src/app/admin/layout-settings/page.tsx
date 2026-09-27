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
    // 2. Query channels
    let raw = await prisma.homepageChannel.findMany({
      orderBy: { order: 'asc' }
    });
    
    if (!raw || raw.length === 0) {
      // Seed defaults
      const defaults = [
        { id: 'chan_1', name: 'Originals', url: '/genre/Vyoma-Originals', icon: '🔥', order: 10 },
        { id: 'chan_2', name: 'Kids Academy', url: '/genre/Kids', icon: '🧸', order: 20 },
        { id: 'chan_3', name: 'Sanskrit Audio', url: '/genre/Audiobook', icon: '🎧', order: 30 },
        { id: 'chan_4', name: 'E-Book Shelf', url: '/genre/Ebook', icon: '📖', order: 40 },
        { id: 'chan_5', name: 'Fun & Games', url: '/genre/Game', icon: '🎮', order: 50 }
      ];
      await prisma.homepageChannel.createMany({
        data: defaults,
        skipDuplicates: true
      });
      raw = await prisma.homepageChannel.findMany({
        orderBy: { order: 'asc' }
      });
    }
    return raw;
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

  const shortsSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_SHORTS' } });
  const shortsEnabled = shortsSetting ? shortsSetting.value === 'true' : true; // Default true

  const blogSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_BLOG' } });
  const blogEnabled = blogSetting ? blogSetting.value === 'true' : true; // Default true

  const hotstarSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_HOTSTAR_CHANNELS' } });
  const hotstarEnabled = hotstarSetting ? hotstarSetting.value === 'true' : true; // Default true

  const scriptSwitcherSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_SCRIPT_SWITCHER' } });
  const scriptSwitcherEnabled = scriptSwitcherSetting ? scriptSwitcherSetting.value === 'true' : true;

  const streaksSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_GAMIFICATION_STREAKS' } });
  const streaksEnabled = streaksSetting ? streaksSetting.value === 'true' : true;

  const aiPronunciationSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_AI_PRONUNCIATION' } });
  const aiPronunciationEnabled = aiPronunciationSetting ? aiPronunciationSetting.value === 'true' : true;

  return (
    <LayoutSettingsClient 
      sections={sections} 
      channels={channels} 
      availableCategories={availableCategories} 
      roadmapEnabled={roadmapEnabled}
      shortsEnabled={shortsEnabled}
      blogEnabled={blogEnabled}
      hotstarEnabled={hotstarEnabled}
      scriptSwitcherEnabled={scriptSwitcherEnabled}
      streaksEnabled={streaksEnabled}
      aiPronunciationEnabled={aiPronunciationEnabled}
    />
  );
}
