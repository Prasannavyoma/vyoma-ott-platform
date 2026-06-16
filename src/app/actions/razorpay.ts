"use server";

import { getRazorpayClient, getRazorpayPublicKey } from '@/lib/razorpay';
import { getCurrentUser } from '@/lib/auth';

interface OrderParams {
  amount: number;
  currency: 'INR' | 'USD';
}

/**
 * Server Action: Initiates an official, capture-ready order in Razorpay.
 * Computes paise/cents multiplication and returns order payloads to the front-end modal.
 */
export async function createRazorpayOrder(params: OrderParams) {
  try {
    const user = await getCurrentUser();
    if (user && user.country && user.country !== 'IN' && params.currency === 'INR') {
      throw new Error("Currency evasion detected. International accounts are required to checkout in USD.");
    }

    const publicKey = await getRazorpayPublicKey();
    
    // 1. Standardized Amount Calculation (INR/USD = Major Units * 100 for Razorpay)
    const amountInSubunits = Math.round(params.amount * 100);
    
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
 */
export async function createRazorpaySubscription(params: { name: string, description: string, amount: number, currency: string, interval: 'monthly' | 'yearly', totalCount: number }) {
  try {
    const user = await getCurrentUser();
    if (user && user.country && user.country !== 'IN' && params.currency === 'INR') {
      throw new Error("Currency evasion detected. International accounts are required to checkout in USD.");
    }

    const publicKey = await getRazorpayPublicKey();
    const amountInSubunits = Math.round(params.amount * 100);
    const period = params.interval === 'yearly' ? 'yearly' : 'monthly';
    
    try {
      const client = await getRazorpayClient();
      
      // 1. Create native plan
      const plan = await client.plans.create({
        period: period,
        interval: 1,
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
        amount: params.amount,
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
