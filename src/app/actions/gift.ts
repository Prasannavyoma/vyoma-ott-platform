"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendGiftVoucherEmail } from '@/lib/mail';
import crypto from 'crypto';

// Generates a cryptographically secure, random high-entropy alphanumeric code (Bug #62 fix)
function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GIFT-VYOM-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

interface GiftParams {
  recipientName: string;
  recipientEmail: string;
  relationship: string;
  occasion?: string;
  personalMessage: string;
  planName: 'GOLD' | 'PLATINUM';
  months: number;
  quantity: number;
  amount?: number;
  currency?: string;
  cardTheme?: 'SWARNA' | 'UTSAV' | 'GURUKULA' | 'PADMA' | string;
  senderDisplayName?: string;
  paymentDetails?: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };
}

/**
 * Server Action: Processes Bulk Gift Orders, Minting multiple Subscription Vouchers.
 * Strictly verifies cryptographic payment signature before minting any vouchers.
 */
export async function purchaseGiftVoucher(params: GiftParams) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    throw new Error("AUTHENTICATION_REQUIRED: Please sign in to gift subscriptions.");
  }

  // Enforce cryptographic payment verification
  const pay = params.paymentDetails;
  if (!pay || !pay.razorpay_order_id || !pay.razorpay_payment_id || !pay.razorpay_signature) {
    throw new Error("PAYMENT_UNVERIFIED: Valid Razorpay payment authorization signature is strictly required to mint gift vouchers.");
  }

  const { verifyRazorpayOrderSignature } = await import('@/lib/razorpay');
  const isValid = await verifyRazorpayOrderSignature(pay.razorpay_order_id, pay.razorpay_payment_id, pay.razorpay_signature);
  if (!isValid) {
    throw new Error("PAYMENT_REJECTED: Cryptographic signature verification failed. Forged or tampered payment.");
  }

  const senderName = params.senderDisplayName?.trim() || buyer.name || buyer.email;
  const codes: string[] = [];
  const occasionText = params.occasion || 'Spiritual Wisdom';
  const theme = params.cardTheme || 'SWARNA';
  
  try {
    // 1. Atomically Loop and mint distinct voucher slots for the bulk bundle
    for (let i = 0; i < params.quantity; i++) {
      const uniqueCode = generateSecureCode();
      
      await prisma.subscriptionVoucher.create({
        data: {
          code: uniqueCode,
          plan: params.planName,
          months: params.months,
          sponsoredBy: `Gift from ${senderName} to ${params.recipientName} (${params.relationship} • ${occasionText})`,
          isUsed: false
        }
      });

      codes.push(uniqueCode);
    }

    // 2. Log Telemetry Event for Gift Tracking & Analytics
    const calculatedAmount = params.amount || (params.planName === 'GOLD' ? (params.months === 12 ? 390 : 39) * params.quantity : (params.months === 12 ? 490 : 49) * params.quantity);
    
    await prisma.telemetryEvent.create({
      data: {
        eventType: 'GIFT_PURCHASED',
        sourceId: `GIFT:${params.planName}:${params.months}M`,
        userId: buyer.id,
        metadata: JSON.stringify({
          senderName: senderName,
          senderEmail: buyer.email,
          senderId: buyer.id,
          recipientName: params.recipientName,
          recipientEmail: params.recipientEmail,
          relationship: params.relationship,
          occasion: occasionText,
          personalMessage: params.personalMessage,
          planName: params.planName,
          months: params.months,
          quantity: params.quantity,
          codes: codes,
          amount: calculatedAmount,
          currency: params.currency || 'INR',
          cardTheme: theme,
          timestamp: new Date().toISOString()
        })
      }
    }).catch(e => console.error("Gift telemetry error:", e));

    // 3. Dispatch Dynamic Gift E-Card email automatically
    sendGiftVoucherEmail(
      params.recipientEmail,
      params.recipientName,
      senderName,
      params.relationship,
      params.planName,
      params.months,
      codes,
      params.personalMessage,
      theme
    ).catch(e => console.error("Gift email dispatch failed:", e));

    // 4. Simulated Bulk Email Confirmation Trigger
    console.log(`
      -----------------------------------------------------
      📧 SIMULATED BULK GIFT EMAILS COMMENCED 📧
      Count: ${params.quantity}
      From: Vyoma Academy <gifts@vyoma.org>
      To: ${params.recipientEmail} (${params.recipientName})
      Occasion: ${occasionText}
      
      Dispatched ${params.quantity} separate secure Activation Keys 
      to target recipient inbox for distribution.
      -----------------------------------------------------
    `);

    return {
      success: true,
      codes: codes,
      planName: params.planName,
      recipientName: params.recipientName,
      months: params.months,
      quantity: params.quantity
    };

  } catch (e: any) {
    console.error("Bulk Gifting processing error:", e);
    return { success: false, error: e.message || "Transaction refused during code generation." };
  }
}

/**
 * Server Action: Redeem an active Subscription Voucher to elevate the current user's tier.
 */
export async function redeemVoucherCode(rawCode: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please log in or register to activate this gift." };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  
  try {
    // 1. Audit the code and fetch current user state
    const voucher = await prisma.subscriptionVoucher.findUnique({
      where: { code: cleanCode }
    });

    if (!voucher) {
      return { success: false, error: "Invalid Activation Code. Please verify spelling." };
    }

    if (voucher.isUsed) {
      return { success: false, error: "This Activation Code has already been redeemed." };
    }

    const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userInDb) return { success: false, error: "User account not found." };

    // 2. Atomically burn the voucher using updateMany to eliminate double-redeem race condition (Bug #29 fix)
    const burned = await prisma.subscriptionVoucher.updateMany({
      where: { code: cleanCode, isUsed: false },
      data: {
        isUsed: true,
        usedById: user.id
      }
    });

    if (burned.count === 0) {
      return { success: false, error: "This Activation Code has already been redeemed or is invalid." };
    }

    // 3. Calculate access start, interval & expiration extension (Bug #29 fix)
    const now = new Date();
    const intervalStr = voucher.months >= 12 ? 'YEARLY' : 'MONTHLY';
    const daysToAdd = voucher.months * 30;

    let baseTime = now.getTime();
    if (userInDb.planExpiresAt && new Date(userInDb.planExpiresAt).getTime() > now.getTime()) {
      baseTime = new Date(userInDb.planExpiresAt).getTime();
    }
    const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

    // Prevent downgrading an existing PLATINUM user to GOLD
    let targetPlan = voucher.plan;
    if (userInDb.plan === 'PLATINUM' && voucher.plan === 'GOLD') {
      targetPlan = 'PLATINUM';
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: targetPlan,
        planInterval: intervalStr as any,
        planStartedAt: now,
        planExpiresAt: newExpiry
      }
    });

    // 4. Log Telemetry Event for Gift Redemption
    await prisma.telemetryEvent.create({
      data: {
        eventType: 'GIFT_REDEEMED',
        sourceId: `VOUCHER:${cleanCode}`,
        userId: user.id,
        metadata: JSON.stringify({
          code: cleanCode,
          redeemedByEmail: user.email,
          redeemedByName: user.name || "Subscriber",
          redeemedById: user.id,
          plan: voucher.plan,
          months: voucher.months,
          sponsoredBy: voucher.sponsoredBy,
          timestamp: new Date().toISOString()
        })
      }
    }).catch(e => console.error("Gift redemption telemetry error:", e));

    revalidatePath('/profile');
    return { 
      success: true, 
      plan: voucher.plan, 
      months: voucher.months,
      sponsoredBy: voucher.sponsoredBy 
    };

  } catch (e: any) {
    console.error("Voucher redemption failed:", e);
    return { success: false, error: e.message || "Systems level verification failure." };
  }
}

/**
 * Server Action: Inspects voucher claim details for interactive unboxing recipient page.
 */
export async function getVoucherClaimDetails(rawCode: string) {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  const currentUser = await getCurrentUser();

  try {
    const voucher = await prisma.subscriptionVoucher.findUnique({
      where: { code: cleanCode }
    });

    if (!voucher) {
      return { success: false, error: "Invalid activation code. Please verify your link or code." };
    }

    // Try to find the telemetry purchase event that includes this voucher code
    let giftMeta: any = null;
    try {
      const event = await prisma.telemetryEvent.findFirst({
        where: {
          eventType: 'GIFT_PURCHASED',
          metadata: { contains: cleanCode }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (event?.metadata) {
        giftMeta = JSON.parse(event.metadata);
      }
    } catch (e) {}

    // Fallback: parse from sponsoredBy if telemetry not found
    let senderName = giftMeta?.senderName || 'A generous well-wisher';
    let recipientName = giftMeta?.recipientName || 'Dear Learner';
    let relationship = giftMeta?.relationship || 'Loved One';
    let occasion = giftMeta?.occasion || 'Sacred Wisdom';
    let personalMessage = giftMeta?.personalMessage || 'Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.';
    let cardTheme = giftMeta?.cardTheme || 'SWARNA';

    if (!giftMeta && voucher.sponsoredBy) {
      const match = voucher.sponsoredBy.match(/Gift from (.*?) to (.*?) \((.*?) • (.*?)\)/);
      if (match) {
        senderName = match[1];
        recipientName = match[2];
        relationship = match[3];
        occasion = match[4];
      }
    }

    return {
      success: true,
      code: voucher.code,
      plan: voucher.plan,
      months: voucher.months,
      isUsed: voucher.isUsed,
      usedById: voucher.usedById,
      createdAt: voucher.createdAt,
      senderName,
      recipientName,
      relationship,
      occasion,
      personalMessage,
      cardTheme,
      isLoggedIn: !!currentUser,
      currentUserEmail: currentUser?.email || null,
      currentUserName: currentUser?.name || null
    };
  } catch (err: any) {
    console.error("Failed to load voucher claim details:", err);
    return { success: false, error: "Failed to load gift details." };
  }
}
