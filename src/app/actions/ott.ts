"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * 1. WATCHLIST CORE LOGIC
 */
export async function toggleWatchlist(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Authentication required" };

  try {
    // Check if already exists via direct raw SQL
    // @ts-ignore
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM WatchlistItem WHERE userId = ? AND courseId = ?`,
      user.id, courseId
    );

    if (existing && existing.length > 0) {
      // Remove it
      await prisma.$executeRawUnsafe(
        `DELETE FROM WatchlistItem WHERE userId = ? AND courseId = ?`,
        user.id, courseId
      );
      revalidatePath('/');
      revalidatePath(`/watch/${courseId}`);
      return { success: true, isAdded: false };
    } else {
      // Add it
      const now = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `INSERT INTO WatchlistItem (userId, courseId, createdAt) VALUES (?, ?, ?)`,
        user.id, courseId, now
      );
      revalidatePath('/');
      revalidatePath(`/watch/${courseId}`);
      return { success: true, isAdded: true };
    }
  } catch (e) {
    console.error("Watchlist error:", e);
    return { success: false };
  }
}

export async function getWatchlistStatus(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    // @ts-ignore
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM WatchlistItem WHERE userId = ? AND courseId = ?`,
      user.id, courseId
    );
    return existing && existing.length > 0;
  } catch (e) {
    return false;
  }
}

export async function getUserWatchlist() {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    // @ts-ignore
    const items: any[] = await prisma.$queryRawUnsafe(
      `SELECT courseId FROM WatchlistItem WHERE userId = ? ORDER BY createdAt DESC`,
      user.id
    );
    if (!items || items.length === 0) return [];

    const ids = items.map(i => i.courseId);
    // Fetch actual course models
    const courses = await prisma.course.findMany({
      where: { id: { in: ids } }
    });
    
    // Keep order
    return ids.map(id => courses.find(c => c.id === id)).filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * 2. LIKE/DISLIKE CORE LOGIC
 */
export async function toggleCourseLike(courseId: string, isLike: boolean) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Authentication required" };

  try {
    // Check if exists
    // @ts-ignore
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT isLike FROM CourseLike WHERE userId = ? AND courseId = ?`,
      user.id, courseId
    );

    const numericLike = isLike ? 1 : 0;

    let activeStatus: boolean | null = null;

    if (existing && existing.length > 0) {
      if (parseInt(existing[0].isLike) === numericLike) {
        // If same option clicked twice, we REMOVE the rating entirely (undo toggle)
        await prisma.$executeRawUnsafe(
          `DELETE FROM CourseLike WHERE userId = ? AND courseId = ?`,
          user.id, courseId
        );
        activeStatus = null;
      } else {
        // Update existing to the other rating
        await prisma.$executeRawUnsafe(
          `UPDATE CourseLike SET isLike = ? WHERE userId = ? AND courseId = ?`,
          numericLike, user.id, courseId
        );
        activeStatus = isLike;
      }
    } else {
      // Insert fresh rating
      const now = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `INSERT INTO CourseLike (userId, courseId, isLike, createdAt) VALUES (?, ?, ?, ?)`,
        user.id, courseId, numericLike, now
      );
      activeStatus = isLike;
    }

    const likesCount = await getCourseLikesCount(courseId);
    return { success: true, activeStatus, likesCount };
  } catch (e) {
    console.error("CourseLike toggle error:", e);
    return { success: false };
  }
}

export async function getCourseLikesCount(courseId: string): Promise<number> {
  try {
    // @ts-ignore
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM CourseLike WHERE courseId = ? AND isLike = 1`,
      courseId
    );
    if (!result || result.length === 0) return 0;
    return parseInt(result[0].count || 0);
  } catch (e) {
    console.error("Failed to query course likes count:", e);
    return 0;
  }
}

export async function getCourseLikeStatus(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    // @ts-ignore
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT isLike FROM CourseLike WHERE userId = ? AND courseId = ?`,
      user.id, courseId
    );
    if (!existing || existing.length === 0) return null;
    return parseInt(existing[0].isLike) === 1;
  } catch (e) {
    return null;
  }
}

/**
 * 3. CONTINUE WATCHING LOGIC
 */
export async function getContinueWatching() {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    // Fetch dynamic progress where they haven't marked it completed and position > 0
    const inProgress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        completed: false,
        position: { gt: 0 }
      },
      include: {
        episode: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        id: 'desc' // Proxy sorting
      },
      take: 10
    });

    // Map into unique course objects, attaching progress details
    const uniqueCoursesMap = new Map<string, any>();

    for (const prog of inProgress) {
      if (!prog.episode || !prog.episode.course) continue;
      const course = prog.episode.course;
      const duration = prog.episode.duration || 3600; // Fallback to 60 mins if not set
      const pct = Math.min(98, Math.max(2, Math.round((prog.position / duration) * 100)));

      if (!uniqueCoursesMap.has(course.id)) {
        uniqueCoursesMap.set(course.id, {
          ...course,
          activeEpisodeId: prog.episode.id,
          activeEpisodeTitle: prog.episode.title,
          progressPercent: pct,
          durationLeftStr: `${Math.ceil((duration - prog.position) / 60)}m left`
        });
      }
    }

    return Array.from(uniqueCoursesMap.values());
  } catch (e) {
    console.error("Continue Watching fetch error:", e);
    return [];
  }
}
