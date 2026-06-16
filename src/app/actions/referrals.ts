'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fulfillReward(rewardId: string) {
  try {
    await prisma.referralReward.update({
      where: { id: rewardId },
      data: { 
        status: 'DELIVERED',
        updatedAt: new Date()
      }
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Fulfillment failure:", error);
    return { error: 'Failed to fulfill reward' };
  }
}
