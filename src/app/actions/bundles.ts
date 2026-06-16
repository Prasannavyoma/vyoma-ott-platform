'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBundle(data: {
  title: string;
  description: string;
  price: number;
  validityDays?: number | null;
  thumbnailUrl?: string;
  courseIds: string[];
}) {
  try {
    const bundle = await prisma.bundle.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        validityDays: data.validityDays,
        thumbnailUrl: data.thumbnailUrl,
        courses: {
          connect: data.courseIds.map(id => ({ id }))
        }
      }
    });

    revalidatePath('/admin');
    revalidatePath('/admin/bundles');
    
    return { success: true, bundleId: bundle.id };
  } catch (error: any) {
    console.error('Failed to create bundle', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBundle(bundleId: string) {
  try {
    await prisma.bundle.delete({
      where: { id: bundleId }
    });
    revalidatePath('/admin');
    revalidatePath('/admin/bundles');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
