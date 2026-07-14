"use server";
import prisma from '@/lib/prisma';
import { getMeilisearchClient } from '@/lib/meilisearch';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';

export async function incrementView(courseId: string) {
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { views: { increment: 1 } }
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function searchContent(query: string) {
  if (!query || query.trim().length < 2) return [];

  try {
    const cleanQuery = query.trim();

    // -- AI Intent Tracking: Save last search term to cookie --
    try {
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'last_search_query',
        value: cleanQuery,
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    } catch (cookieError) {
      console.error("Failed to write search cookie:", cookieError);
    }

    // Save to user profile interests if logged in
    try {
      const user = await getCurrentUser();
      if (user) {
        const cleanKeyword = cleanQuery.toLowerCase();
        let existingInterests = user.interests ? user.interests.split(',').map(i => i.trim().toLowerCase()) : [];
        if (!existingInterests.includes(cleanKeyword)) {
          existingInterests.push(cleanKeyword);
          if (existingInterests.length > 8) {
            existingInterests.shift(); // Keep last 8 unique search terms
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { interests: existingInterests.join(',') }
          });
        }
      }
    } catch (dbError) {
      console.error("Failed to append search to user interests:", dbError);
    }

    // 1. Try Meilisearch query first if configured & enabled
    const meiliClient = await getMeilisearchClient();
    if (meiliClient) {
      try {
        const index = meiliClient.index('ott_content');
        const searchResult = await index.search(cleanQuery, {
          limit: 12
        });

        if (searchResult.hits && searchResult.hits.length > 0) {
          const hits = searchResult.hits.map((hit: any) => {
            const isEpisode = hit.type === 'episode';
            if (isEpisode) {
              const isAudio = !!hit.audioUrl;
              const isVideo = !!hit.videoUrl;
              
              let badge = '📄 Module';
              let badgeColor = '#aaa';
              if (isVideo) { badge = '📽️ Video'; badgeColor = '#e50914'; }
              else if (isAudio) { badge = '🎧 Audio'; badgeColor = '#1db954'; }

              return {
                id: hit.dbId,
                title: hit.title,
                subTitle: `In: ${hit.courseTitle || 'Course'}`,
                thumbnail: hit.thumbnailUrl || 'https://placehold.co/60x35',
                url: `/watch/${hit.courseId}?ep=${hit.dbId}`,
                badge: badge,
                badgeColor: badgeColor
              };
            } else {
              return {
                id: hit.dbId,
                title: hit.title,
                subTitle: hit.category || "Course",
                thumbnail: hit.thumbnailUrl || 'https://placehold.co/60x35',
                url: `/watch/${hit.dbId}`,
                badge: '🎓 Course',
                badgeColor: '#ffd700'
              };
            }
          });
          return { hits, engine: 'meilisearch' };
        }
      } catch (meiliError) {
        console.error("Meilisearch Search Failure, falling back to database query:", meiliError);
      }
    }

    // 2. DATABASE FALLBACK
    const queryWithAmp = cleanQuery.replace(/&/g, '&amp;');

    // Search Courses (Top-level Products)
    const matchedCourses = await prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery } },
          { title: { contains: queryWithAmp } },
          { description: { contains: cleanQuery } },
          { description: { contains: queryWithAmp } },
          { category: { contains: cleanQuery } },
          { category: { contains: queryWithAmp } }
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        accessLevel: true,
        category: true
      }
    });

    // Deep Search Episodes (Nested content: Videos, Audios, etc.)
    const matchedEpisodes = await prisma.episode.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery } },
          { title: { contains: queryWithAmp } },
          { description: { contains: cleanQuery } },
          { description: { contains: queryWithAmp } }
        ]
      },
      take: 6,
      include: {
        course: {
          select: {
            title: true
          }
        }
      }
    });

    // Consolidate into a Unified Search Projection
    const normalizedCourses = matchedCourses.map(c => ({
      id: c.id,
      title: c.title,
      subTitle: c.category || "Course",
      thumbnail: c.thumbnailUrl || 'https://placehold.co/60x35',
      url: `/watch/${c.id}`,
      badge: '🎓 Course',
      badgeColor: '#ffd700'
    }));

    const normalizedEpisodes = matchedEpisodes.map(e => {
      const isAudio = !!e.audioUrl;
      const isVideo = !!e.videoUrl;
      
      let badge = '📄 Module';
      let badgeColor = '#aaa';
      if (isVideo) { badge = '📽️ Video'; badgeColor = '#e50914'; }
      else if (isAudio) { badge = '🎧 Audio'; badgeColor = '#1db954'; }

      return {
        id: e.id,
        title: e.title,
        subTitle: `In: ${e.course?.title || 'Course'}`,
        thumbnail: e.thumbnailUrl || 'https://placehold.co/60x35',
        url: `/watch/${e.courseId}?ep=${e.id}`,
        badge: badge,
        badgeColor: badgeColor
      };
    });

    return { hits: [...normalizedCourses, ...normalizedEpisodes], engine: 'postgres' };

  } catch (error) {
    console.error("Deep Search Action Error:", error);
    return { hits: [], engine: 'postgres' };
  }
}

export async function getTrendingNow() {
  try {
    return await prisma.course.findMany({
      orderBy: { views: 'desc' },
      take: 10
    });
  } catch (error) {
    console.error("Database connection error in getTrendingNow:", error);
    return [];
  }
}

export async function getFeaturedSlider() {
  try {
    const featured = await prisma.course.findMany({
      where: { featuredInSlider: true },
      orderBy: { createdAt: 'desc' },
      take: 8
    });
    
    if (featured.length > 0) return featured;
    
    // Resilient fallback if no explicit flags set yet
    return await prisma.course.findMany({
      orderBy: { views: 'desc' },
      take: 5
    });
  } catch (error) {
    console.error("Database connection error in getFeaturedSlider:", error);
    return [];
  }
}
