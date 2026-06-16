import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

interface WeightedVector {
  [term: string]: number;
}

/**
 * Core Algorithmic Recommendation Engine (Simulated Content-Based NLP Filter)
 * Dynamically parses user dossier tokens, implicit progress vectors, and search history
 * to score and rank universal catalogs.
 */
export async function getAIRecommendedCourses() {
  // 1. RETRIEVE ACTIVE SENSORY PROFILE AND RECENT SEARCH INTENT
  const user = await getCurrentUser();
  
  let lastSearch = '';
  try {
    const cookieStore = await cookies();
    lastSearch = cookieStore.get('last_search_query')?.value || '';
  } catch (e) {
    console.error("Failed to read search cookie in recommendations:", e);
  }

  // If both are absent, return empty (gracefully fallback)
  if (!user && !lastSearch) {
    return [];
  }

  try {
    // 2. AGGREGATE SIGNALS FOR PREFERENCE VECTOR CONSTRUCTION
    const preferenceVector: WeightedVector = {};
    const alreadyWatchedIds = new Set<string>();
    
    // A. Parse User Explicit Interests Dossier (High Weight: 10)
    if (user && user.interests) {
      const explicitTokens = user.interests.toLowerCase()
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length > 3); // Remove small stop words

      for (const token of explicitTokens) {
        preferenceVector[token] = (preferenceVector[token] || 0) + 10;
      }
    }

    // B. Gather Categories from Watch Progress (Medium Weight: 5)
    if (user) {
      const watchProgress = await prisma.progress.findMany({
        where: { userId: user.id },
        include: { episode: { include: { course: true } } }
      });

      for (const p of watchProgress) {
        if (!p.episode?.course) continue;
        const course = p.episode.course;
        alreadyWatchedIds.add(course.id);
        
        if (course.category) {
          const catToken = course.category.toLowerCase();
          preferenceVector[catToken] = (preferenceVector[catToken] || 0) + 5;
        }
      }
    }

    // C. Gather Categories from Wishlist (Low Weight: 3)
    if (user) {
      let watchlistCourses: any[] = [];
      try {
        const wlRaw: any = await prisma.$queryRawUnsafe(`
          SELECT c.* FROM WatchlistItem w
          JOIN Course c ON w.courseId = c.id
          WHERE w.userId = ?
        `, user.id);
        if (Array.isArray(wlRaw)) watchlistCourses = wlRaw;
      } catch (e) {
        // Fallback silently if WatchlistItem schema differs
      }

      for (const wc of watchlistCourses) {
        if (wc.category) {
          const catToken = wc.category.toLowerCase();
          preferenceVector[catToken] = (preferenceVector[catToken] || 0) + 3;
        }
      }
    }

    // D. Parse Recent Search Query (Weight: 8)
    if (lastSearch) {
      const searchTokens = lastSearch.toLowerCase()
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);

      for (const token of searchTokens) {
        preferenceVector[token] = (preferenceVector[token] || 0) + 8;
      }
    }

    // 4. LOAD UNIVERSAL CATALOG CANDIDATES
    // Exclude courses user has already fully/partially completed to show FRESH items!
    const candidates = await prisma.course.findMany({
      where: {
        id: { notIn: Array.from(alreadyWatchedIds) }
      },
      take: 150
    });

    // If user has sparse history and sparse profile, return fallback top items
    if (Object.keys(preferenceVector).length === 0) {
      return candidates.slice(0, 8); // Standard fallback
    }

    // 5. EXECUTE NLP SCORING MATRIX
    const scoredCandidates = candidates.map(course => {
      let score = 0;
      
      // Match A: Category Token Direct Hit
      const catToken = (course.category || "").toLowerCase();
      if (preferenceVector[catToken]) {
        score += preferenceVector[catToken] * 1.5; // Bonus weighting for category matches
      }

      // Match B: Title Word Intersection
      const titleTokens = course.title.toLowerCase()
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length > 3);
      
      for (const token of titleTokens) {
        if (preferenceVector[token]) {
          score += preferenceVector[token];
        }
      }

      // Match C: Description Word Intersection
      const descTokens = (course.description || "").toLowerCase()
        .replace(/[^\w\s]/gi, ' ')
        .split(/\s+/)
        .filter(t => t.length > 3);
      
      for (const token of descTokens) {
        if (preferenceVector[token]) {
          score += preferenceVector[token] * 0.5; // Decay factor for description matches
        }
      }

      return { course, score };
    });

    // 6. RANK & PRUNE PREDICTIONS
    // Sort descending by Score, filtering out 0-matches if sufficient content exists
    const ranked = scoredCandidates
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.course);

    // If ranked results are lean, pad with high-tier generic inventory to ensure row fills beautifully
    if (ranked.length < 6) {
      const fillAmount = 6 - ranked.length;
      const fillers = candidates.slice(0, fillAmount);
      return [...ranked, ...fillers];
    }

    return ranked.slice(0, 12); // Return top 12 dynamic matches for UI slider strip

  } catch (error) {
    console.error("ML Recommendation Matrix Error:", error);
    // Absolute fallback safety
    return (await prisma.course.findMany({ take: 8 }));
  }
}
