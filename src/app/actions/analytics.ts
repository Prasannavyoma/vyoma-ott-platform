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
        
        let filter: string | undefined = undefined;
        if (filterCategory !== 'All') {
          // Simplistic mapping - in a real app, you might map 'Ebooks' -> 'EBOOK'
          // assuming Meilisearch docs have `category` or `type`.
          // We stored `type` as 'course' or 'episode' and `category` as actual category string.
          if (filterCategory === 'Ebooks') filter = "category = 'Ebook' OR category = 'Ebooks'";
          else filter = `category = '${filterCategory}'`;
        }

        const searchOptions: any = {
          limit: 12,
          attributesToHighlight: ['title', 'description'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>'
        };

        if (filter) {
          searchOptions.filter = filter;
        }

        const searchResult = await index.search(cleanQuery, searchOptions);

        if (searchResult.hits && searchResult.hits.length > 0) {
          const hits = searchResult.hits.map((hit: any) => {
            const isEpisode = hit.type === 'episode';
            let badge = 'MODULE';
            let badgeColor = '#aaa';
            
            if (isEpisode) {
              if (!!hit.videoUrl) { badge = 'VIDEO'; badgeColor = '#e50914'; }
              else if (!!hit.audioUrl) { badge = 'AUDIO'; badgeColor = '#1db954'; }
            } else {
              badge = hit.category?.toUpperCase() || 'COURSE';
              badgeColor = '#0055a5'; // OTT 1.0 Blue badge style
            }

            const formatted = hit._formatted || hit;

            return {
              id: hit.dbId,
              title: formatted.title, // Highlighted
              description: formatted.description || '', // Highlighted
              subTitle: isEpisode ? `In: ${hit.courseTitle || 'Course'}` : (hit.category || "Course"),
              thumbnail: hit.thumbnailUrl || 'https://placehold.co/60x35',
              url: isEpisode ? `/watch/${hit.courseId}?ep=${hit.dbId}` : `/watch/${hit.dbId}`,
              badge: badge,
              badgeColor: badgeColor,
              type: hit.type
            };
          });
          return { hits, engine: 'meilisearch' };
        }
      } catch (meiliError) {
        console.error("Meilisearch Search Failure, falling back to database query:", meiliError);
      }
    }

    // 2. DATABASE FALLBACK
    const queryWithAmp = cleanQuery.replace(/&/g, '&amp;');

    // Helper to wrap matched text in <mark>
    const highlight = (text: string | null) => {
      if (!text) return '';
      const regex = new RegExp(`(${cleanQuery})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    };

    let courseWhere: any = {
      OR: [
        { title: { contains: cleanQuery, mode: 'insensitive' } },
        { title: { contains: queryWithAmp, mode: 'insensitive' } },
        { description: { contains: cleanQuery, mode: 'insensitive' } },
        { description: { contains: queryWithAmp, mode: 'insensitive' } }
      ]
    };

    if (filterCategory !== 'All') {
      courseWhere.category = { contains: filterCategory, mode: 'insensitive' };
    }

    const matchedCourses = await prisma.course.findMany({
      where: courseWhere,
      take: 8,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        accessLevel: true,
        category: true
      }
    });

    let episodeWhere: any = {
      OR: [
        { title: { contains: cleanQuery, mode: 'insensitive' } },
        { title: { contains: queryWithAmp, mode: 'insensitive' } },
        { description: { contains: cleanQuery, mode: 'insensitive' } },
        { description: { contains: queryWithAmp, mode: 'insensitive' } }
      ]
    };

    // If filtering by Category, we might skip episodes entirely or filter their course category
    if (filterCategory !== 'All') {
      episodeWhere.course = {
        category: { contains: filterCategory, mode: 'insensitive' }
      };
    }

    const matchedEpisodes = await prisma.episode.findMany({
      where: episodeWhere,
      take: 6,
      include: {
        course: { select: { title: true } }
      }
    });

    // Consolidate into a Unified Search Projection
    const normalizedCourses = matchedCourses.map(c => ({
      id: c.id,
      title: highlight(c.title),
      description: highlight(c.description),
      subTitle: c.category || "Course",
      thumbnail: c.thumbnailUrl || 'https://placehold.co/60x35',
      url: `/watch/${c.id}`,
      badge: (c.category || 'COURSE').toUpperCase(),
      badgeColor: '#0055a5',
      type: 'course'
    }));

    const normalizedEpisodes = matchedEpisodes.map(e => {
      let badge = 'MODULE';
      let badgeColor = '#aaa';
      if (!!e.videoUrl) { badge = 'VIDEO'; badgeColor = '#e50914'; }
      else if (!!e.audioUrl) { badge = 'AUDIO'; badgeColor = '#1db954'; }

      return {
        id: e.id,
        title: highlight(e.title),
        description: highlight(e.description),
        subTitle: `In: ${e.course?.title || 'Course'}`,
        thumbnail: e.thumbnailUrl || 'https://placehold.co/60x35',
        url: `/watch/${e.courseId}?ep=${e.id}`,
        badge: badge,
        badgeColor: badgeColor,
        type: 'episode'
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
