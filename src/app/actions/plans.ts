"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendPurchaseSuccess, sendCancelNotification } from '@/lib/mail';

import { getRazorpayClient } from '@/lib/razorpay';

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

    // Dispatch telemetry logging & emails based on state shift
    if (newPlan === 'FREE' && oldPlan !== 'FREE') {
      // Downgrade / Cancel detected
      sendCancelNotification(user.email).catch(e => {});
      await prisma.telemetryEvent.create({
        data: {
          eventType: 'SUBSCRIPTION_CANCELLED',
          sourceId: `${oldPlan} -> FREE`,
          userId: user.id,
          metadata: JSON.stringify({
            previousPlan: oldPlan,
            userId: user.id,
            email: user.email,
            country: user.country || 'IN',
            timestamp: new Date().toISOString()
          })
        }
      }).catch(e => console.error("Telemetry error:", e));
    } else if (newPlan !== 'FREE') {
      // Upgrade / Activation detected
      sendPurchaseSuccess(user.email, newPlan, newPlan === 'GOLD' ? 4900 : 8900).catch(e => {});
      await prisma.telemetryEvent.create({
        data: {
          eventType: 'PLAN_UPGRADE',
          sourceId: `${oldPlan || 'FREE'} -> ${newPlan}`,
          userId: user.id,
          metadata: JSON.stringify({
            from: oldPlan || 'FREE',
            to: newPlan,
            country: user.country || 'IN',
            email: user.email,
            timestamp: new Date().toISOString()
          })
        }
      }).catch(e => console.error("Telemetry error:", e));
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

    const oldPlan = user.plan || 'FREE';
    const oldSubscriptionId = user.razorpaySubscriptionId;

    // If upgrading and there was an existing active mandate, automatically cancel it on Razorpay
    if (oldSubscriptionId && oldSubscriptionId !== razorpaySubscriptionId) {
      try {
        const client = await getRazorpayClient();
        await client.subscriptions.cancel(oldSubscriptionId);
        console.log(`[Mandate Transition] Successfully cancelled prior mandate ${oldSubscriptionId} for user ${userId}`);
      } catch (err: any) {
        console.warn(`[Mandate Transition] Note: Prior mandate ${oldSubscriptionId} cancellation logged:`, err.message);
      }
    }

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

    // Record Telemetry Event for Upgrade / Transition
    await prisma.telemetryEvent.create({
      data: {
        eventType: 'PLAN_UPGRADE',
        sourceId: `${oldPlan} -> ${newPlan}`,
        userId: user.id,
        metadata: JSON.stringify({
          from: oldPlan,
          to: newPlan,
          interval: interval,
          subscriptionId: razorpaySubscriptionId,
          country: user.country || 'IN',
          email: user.email,
          timestamp: new Date().toISOString()
        })
      }
    }).catch(e => console.error("Telemetry error:", e));

    // Fire email confirmation
    sendPurchaseSuccess(user.email, newPlan, newPlan === 'GOLD' ? 4900 : 8900).catch(e => {});

    revalidatePath(`/profile`);
    revalidatePath(`/`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
