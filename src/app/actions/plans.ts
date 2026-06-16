"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendPurchaseSuccess, sendCancelNotification } from '@/lib/mail';

export async function adminUpdateUserPlan(userId: string, newPlan: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Target user not found.");

    const oldPlan = user.plan;

    // Dynamic write
    await prisma.user.update({
      where: { id: userId },
      data: { plan: newPlan }
    });

    // Dispatch concurrent telemetry emails based on state shift
    if (newPlan === 'FREE' && oldPlan !== 'FREE') {
      // Downgrade / Cancel detected
      sendCancelNotification(user.email).catch(e => {});
    } else if (newPlan !== 'FREE') {
      // Upgrade detected, mock values for simulation validation
      sendPurchaseSuccess(user.email, newPlan, newPlan === 'GOLD' ? 4900 : 8900).catch(e => {});
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function activateSubscription(userId: string, newPlan: string, interval: string, razorpaySubscriptionId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Target user not found.");

    await prisma.user.update({
      where: { id: userId },
      data: { 
        plan: newPlan,
        planInterval: interval,
        razorpaySubscriptionId: razorpaySubscriptionId,
        planStartedAt: new Date(),
        coins: { increment: 200 } // Loyalty reward for subscribing
      }
    });

    // Fire email confirmation
    sendPurchaseSuccess(user.email, newPlan, newPlan === 'GOLD' ? 4900 : 8900).catch(e => {});

    revalidatePath(`/profile`);
    revalidatePath(`/`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
