'use server';

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helper to ensure user has admin or super admin privileges
 */
async function checkAdminAccess() {
  const user = await getCurrentUser();
  const ACCEPTED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
  if (!user || !ACCEPTED_ROLES.includes(user.role)) {
    throw new Error('Forbidden: Admin access required.');
  }
  return user;
}

/**
 * Fetches all user reviews/comments for moderation
 */
export async function getAllReviewsForAdmin() {
  await checkAdminAccess();

  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return reviews;
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    throw new Error(error.message || 'Failed to fetch reviews');
  }
}

/**
 * Approves a user review so that it is displayed publicly on the watch page
 */
export async function approveReview(reviewId: string) {
  await checkAdminAccess();

  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { approved: true }
    });

    revalidatePath('/admin/comments');
    revalidatePath(`/watch/${review.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to approve review:', error);
    return { success: false, error: error.message || 'Failed to approve review' };
  }
}

/**
 * Disapproves (deletes) a user review to remove it from the platform
 */
export async function disapproveReview(reviewId: string) {
  await checkAdminAccess();

  try {
    const review = await prisma.review.delete({
      where: { id: reviewId }
    });

    revalidatePath('/admin/comments');
    revalidatePath(`/watch/${review.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to disapprove review:', error);
    return { success: false, error: error.message || 'Failed to disapprove review' };
  }
}
