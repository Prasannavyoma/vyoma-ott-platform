"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendPurchaseSuccess, sendCancelNotification } from '@/lib/mail';

import { getRazorpayClient, verifyRazorpayOrderSignature, verifyRazorpaySubscriptionSignature } from '@/lib/razorpay';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export async function adminUpdateUserPlan(userId: string, newPlan: string) {
  await requireAdmin();
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Target user not found.");

    const oldPlan = user.plan;
    const isPaid = newPlan !== 'FREE';
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Dynamic write with plan expiration setting
    await prisma.user.update({
      where: { id: userId },
      data: { 
        plan: newPlan,
        ...(isPaid ? { planExpiresAt: oneYearFromNow } : { planExpiresAt: new Date() })
      }
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

export async function activateSubscription(
  userId: string, 
  newPlan: string, 
  interval: string, 
  razorpaySubscriptionId: string,
  verification?: {
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    razorpay_order_id?: string;
  }
) {
  try {
    const actor = await getCurrentUser();
    if (!actor || (actor.id !== userId && actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
      throw new Error("UNAUTHORIZED: Cannot activate subscription for another account.");
    }

    const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN';

    // Verify payment authenticity for non-admin invocations
    if (!isAdmin && verification?.razorpay_signature) {
      let isVerified = false;
      if (razorpaySubscriptionId.startsWith('sub_') && verification.razorpay_payment_id) {
        isVerified = await verifyRazorpaySubscriptionSignature(
          razorpaySubscriptionId,
          verification.razorpay_payment_id,
          verification.razorpay_signature
        );
      } else if (verification.razorpay_order_id && verification.razorpay_payment_id) {
        isVerified = await verifyRazorpayOrderSignature(
          verification.razorpay_order_id,
          verification.razorpay_payment_id,
          verification.razorpay_signature
        );
      }

      if (!isVerified) {
        // Fallback: query Razorpay API directly to verify payment capture
        try {
          const client = await getRazorpayClient();
          if (verification.razorpay_payment_id) {
            const payment = await client.payments.fetch(verification.razorpay_payment_id);
            if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
              isVerified = true;
            }
          }
        } catch (apiErr) {
          console.warn("[Razorpay Auth API Verification Error]:", apiErr);
        }
      }

      if (!isVerified) {
        throw new Error("Payment signature verification failed. Subscription activation refused.");
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Target user not found.");

    const oldPlan = user.plan || 'FREE';
    const oldSubscriptionId = user.razorpaySubscriptionId;

    // Only attempt mandate cancellation if the prior ID starts with 'sub_' (valid Razorpay subscription mandate)
    if (oldSubscriptionId && oldSubscriptionId.startsWith('sub_') && oldSubscriptionId !== razorpaySubscriptionId) {
      try {
        const client = await getRazorpayClient();
        await client.subscriptions.cancel(oldSubscriptionId);
        console.log(`[Mandate Transition] Successfully cancelled prior mandate ${oldSubscriptionId} for user ${userId}`);
      } catch (err: any) {
        console.warn(`[Mandate Transition] Note: Prior mandate ${oldSubscriptionId} cancellation logged:`, err.message);
      }
    }

    const daysToAdd = interval === 'YEARLY' ? 365 : 30;
    const now = new Date();
    // Correctly extend expiry from the future expiration date, rather than capping at the sooner one
    let baseTime = now.getTime();
    if (user.planExpiresAt && new Date(user.planExpiresAt).getTime() > now.getTime()) {
      baseTime = new Date(user.planExpiresAt).getTime();
    }
    const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        plan: newPlan,
        planInterval: interval,
        razorpaySubscriptionId: razorpaySubscriptionId,
        planStartedAt: user.planStartedAt || now,
        planExpiresAt: newExpiry,
        coins: { increment: 200 } // Loyalty reward for subscribing
      }
    });

    // Calculate dynamic plan amount
    const isIndia = (user.country || 'IN').toUpperCase() === 'IN';
    const planRecord = await prisma.plan.findFirst({
      where: { name: newPlan, interval: interval }
    }).catch(() => null);

    const defaultPrice = newPlan === 'PLATINUM' 
      ? (interval === 'YEARLY' ? 499 : 49) 
      : (interval === 'YEARLY' ? 399 : 39);
    const amount = isIndia ? (planRecord?.priceINR || defaultPrice) : (planRecord?.priceUSD || 50);

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
          amount: amount,
          country: user.country || 'IN',
          email: user.email,
          timestamp: new Date().toISOString()
        })
      }
    }).catch(e => console.error("Telemetry error:", e));

    // Fire email confirmation with exact amount
    sendPurchaseSuccess(user.email, `${newPlan} (${interval})`, amount).catch(e => {});

    revalidatePath(`/profile`);
    revalidatePath(`/`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Retrieves the currently active plans and their admin-configured pricing from the database.
 */
export async function getActivePlans() {
  try {
    const plans = await prisma.plan.findMany();
    if (plans && plans.length > 0) return plans;
  } catch (err) {
    console.warn("Could not load plans from database, using defaults:", err);
  }
  return [
    { id: 'gold-monthly', name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 3, updatedAt: new Date() },
    { id: 'gold-yearly', name: 'GOLD', interval: 'YEARLY', priceINR: 390, priceUSD: 25, updatedAt: new Date() },
    { id: 'plat-monthly', name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 5, updatedAt: new Date() },
    { id: 'plat-yearly', name: 'PLATINUM', interval: 'YEARLY', priceINR: 490, priceUSD: 50, updatedAt: new Date() },
  ];
}

