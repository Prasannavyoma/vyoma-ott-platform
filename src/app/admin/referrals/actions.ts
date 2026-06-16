"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveTierAction(referralsRequired: number, rewardName: string) {
  await prisma.referralTier.upsert({
    where: { referralsRequired },
    update: { rewardName },
    create: { referralsRequired, rewardName }
  });

  revalidatePath('/admin/referrals');
  revalidatePath('/profile');
}

export async function deleteTierAction(id: string) {
  await prisma.referralTier.delete({ where: { id } });

  revalidatePath('/admin/referrals');
  revalidatePath('/profile');
}

export async function toggleRewardStatusAction(rewardId: string, currentStatus: string) {
  const nextStatus = currentStatus === "PENDING" ? "DELIVERED" : "PENDING";
  await prisma.referralReward.update({
    where: { id: rewardId },
    data: { status: nextStatus }
  });

  revalidatePath('/admin/referrals');
}
