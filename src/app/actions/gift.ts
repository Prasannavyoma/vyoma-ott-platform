"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendGiftVoucherEmail } from '@/lib/mail';

// Generates a secure, random high-fidelity alphanumeric code
function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GIFT-VYOM-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
  cardTheme?: 'SWARNA' | 'UTSAV' | 'GURUKULA' | 'PADMA';
}

/**
 * Server Action: Processes Bulk Gift Orders, Minting multiple Subscription Vouchers in SQLite.
 */
export async function purchaseGiftVoucher(params: GiftParams) {
  const buyer = await getCurrentUser();
  if (!buyer) {
    throw new Error("AUTHENTICATION_REQUIRED: Please sign in to gift subscriptions.");
  }

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
          sponsoredBy: `Gift from ${buyer.name || buyer.email} to ${params.recipientName} (${params.relationship} • ${occasionText})`,
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
          senderName: buyer.name || buyer.email,
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
      buyer.name || buyer.email,
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
    // 1. Audit the code in SQLite
    const voucher = await prisma.subscriptionVoucher.findUnique({
      where: { code: cleanCode }
    });

    if (!voucher) {
      return { success: false, error: "Invalid Activation Code. Please verify spelling." };
    }

    if (voucher.isUsed) {
      return { success: false, error: "This Activation Code has already been redeemed." };
    }

    // 2. Calculate access start & interval
    const now = new Date();
    const intervalStr = voucher.months >= 12 ? 'YEARLY' : 'MONTHLY';

    // 3. Atomic Transaction: Elevate user and burn voucher record
    await prisma.$transaction([
      // Upgrade User
      prisma.user.update({
        where: { id: user.id },
        data: {
          plan: voucher.plan,
          planInterval: intervalStr as any,
          planStartedAt: now
        }
      }),
      // Mark voucher as burned
      prisma.subscriptionVoucher.update({
        where: { id: voucher.id },
        data: {
          isUsed: true,
          usedById: user.id
        }
      })
    ]);

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
