"use server";
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createShort(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const videoUrl = formData.get('videoUrl') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;

  if (!title || !videoUrl) {
    throw new Error("Title and Video URL are required.");
  }

  // Create a Course with contentType SHORT
  const short = await prisma.course.create({
    data: {
      title,
      description: description || '',
      thumbnailUrl: thumbnailUrl || '',
      category: 'Shorts',
      contentType: 'SHORT',
      accessLevel: 'FREE',
      episodes: {
        create: {
          title: title,
          videoUrl: videoUrl,
          duration: 60,
          order: 1
        }
      }
    }
  });

  revalidatePath('/shorts');
  return short.id;
}
