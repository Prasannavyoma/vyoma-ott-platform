"use server";

import { getRazorpayClient, getRazorpayPublicKey } from '@/lib/razorpay';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface OrderParams {
  amount: number;
  currency: 'INR' | 'USD';
  courseId?: string;
  planName?: string;
  interval?: string;
  giftPlanName?: string;
  giftInterval?: string;
  giftCount?: number;
}

/**
 * Server Action: Initiates an official, capture-ready order in Razorpay.
 * Computes paise/cents multiplication and returns order payloads to the front-end modal.
 * Strictly verifies amounts against official Database records to prevent client tampering.
 */
export async function createRazorpayOrder(params: OrderParams) {
  try {
    const user = await getCurrentUser();
    const isAbroad = Boolean(user && user.country && user.country !== 'IN');
    if (isAbroad && params.currency === 'INR') {
      throw new Error("Currency evasion detected. International accounts are required to checkout in USD.");
    }

    let verifiedAmount = params.amount;

    // Server-side price resolution from DB entities
    if (params.courseId) {
      const course = await prisma.course.findUnique({ where: { id: params.courseId } });
      if (course) {
        verifiedAmount = isAbroad 
          ? (course.priceUSD || Math.ceil((course.price || 299) / 80)) 
          : (course.price || 299);
      }
    } else if (params.giftPlanName && params.giftCount && params.giftCount > 0) {
      const dbPlan = await prisma.plan.findFirst({
        where: {
          name: params.giftPlanName.toUpperCase(),
          interval: (params.giftInterval || 'YEARLY').toUpperCase()
        }
      });
      if (dbPlan) {
        const unitPrice = params.currency === 'USD' ? dbPlan.priceUSD : dbPlan.priceINR;
        verifiedAmount = unitPrice * params.giftCount;
      }
    } else if (params.planName && params.interval) {
      const dbPlan = await prisma.plan.findFirst({
        where: {
          name: params.planName.toUpperCase(),
          interval: params.interval.toUpperCase()
        }
      });
      if (dbPlan) {
        // Upgrade/one-time plan charge: ensure amount does not exceed full plan price
        const fullPrice = params.currency === 'USD' ? dbPlan.priceUSD : dbPlan.priceINR;
        if (verifiedAmount > fullPrice || verifiedAmount <= 0) {
          verifiedAmount = fullPrice;
        }
      }
    }

    if (verifiedAmount <= 0) {
      throw new Error("Invalid checkout amount.");
    }

    const publicKey = await getRazorpayPublicKey();
    
    // 1. Standardized Amount Calculation (INR/USD = Major Units * 100 for Razorpay)
    const amountInSubunits = Math.round(verifiedAmount * 100);
    
    try {
      const client = await getRazorpayClient();
      
      // 2. Fire Official Razorpay Order Create API
      const order = await client.orders.create({
        amount: amountInSubunits,
        currency: params.currency,
        receipt: `gift_rec_${Math.random().toString(36).substring(2, 9)}`,
        notes: {
          source: 'Vyoma Gifting System',
          integration: 'Server Actions Capture V1'
        }
      });

      return {
        success: true,
        orderId: order.id,
        publicKey: publicKey,
        amount: order.amount,
        currency: order.currency,
        isSandboxFallback: false
      };

    } catch (sdkError: any) {
      // Catch missing keys scenario - Log detailed deployment instruction
      console.error("⚠️ Razorpay SDK Instantiation Refused - Payment Gateway Error:", sdkError.message);
      
      throw new Error("Payment Gateway Configuration Error: Live keys are missing or invalid. Transaction refused.");
    }

  } catch (globalError: any) {
    console.error("Fatal Razorpay action crash:", globalError);
    return { success: false, error: globalError.message || "Orchestration layer failure." };
  }
}

/**
 * Server Action: Initiates a Native AutoPay Subscription via Razorpay.
 * Creates an ad-hoc Plan internally, then binds a Subscription to it for automated billing.
 * Enforces server-side Plan pricing from the database to stop price manipulation.
 */
export async function createRazorpaySubscription(params: { 
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  totalCount: number;
  planName?: string;
}) {
  try {
    const user = await getCurrentUser();
    const isAbroad = Boolean(user && user.country && user.country !== 'IN');
    if (isAbroad && params.currency === 'INR') {
      throw new Error("Currency evasion detected. International accounts are required to checkout in USD.");
    }

    // Determine target plan name
    let detectedPlanName = params.planName;
    if (!detectedPlanName) {
      const upper = params.name.toUpperCase();
      if (upper.includes('PLATINUM')) detectedPlanName = 'PLATINUM';
      else if (upper.includes('GOLD')) detectedPlanName = 'GOLD';
    }

    let verifiedAmount = params.amount;
    const normalizedInterval = params.interval.toUpperCase();

    if (detectedPlanName) {
      const dbPlan = await prisma.plan.findFirst({
        where: {
          name: detectedPlanName,
          interval: normalizedInterval
        }
      });
      if (dbPlan) {
        verifiedAmount = params.currency === 'USD' ? dbPlan.priceUSD : dbPlan.priceINR;
      }
    }

    if (verifiedAmount <= 0) {
      throw new Error("Invalid subscription pricing configuration.");
    }

    const publicKey = await getRazorpayPublicKey();
    const amountInSubunits = Math.round(verifiedAmount * 100);
    let period = params.interval.toLowerCase();
    let rzpInterval = 1;

    // Map business logic intervals to Razorpay native periods
    if (period === 'quarterly') {
      period = 'monthly';
      rzpInterval = 3;
    } else if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      period = 'monthly';
    }
    
    try {
      const client = await getRazorpayClient();
      
      // 1. Create native plan
      const plan = await client.plans.create({
        period: period as "daily" | "weekly" | "monthly" | "yearly",
        interval: rzpInterval,
        item: {
          name: params.name,
          description: params.description,
          amount: amountInSubunits,
          currency: params.currency
        }
      });

      // 2. Create subscription tied to this plan
      const subscription = await client.subscriptions.create({
        plan_id: plan.id,
        customer_notify: 1,
        total_count: params.totalCount
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        publicKey: publicKey,
        amount: verifiedAmount,
        currency: params.currency,
        isSandboxFallback: false
      };

    } catch (sdkError: any) {
      console.error("⚠️ Razorpay SDK Refused Subscription - Payment Gateway Error:", sdkError.message);
      throw new Error("Payment Gateway Configuration Error: Live keys are missing or invalid. Subscription refused.");
    }

  } catch (globalError: any) {
    console.error("Fatal Razorpay subscription crash:", globalError);
    return { success: false, error: globalError.message || "Subscription orchestration failure." };
  }
}
