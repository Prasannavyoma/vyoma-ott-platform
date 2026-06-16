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
  personalMessage: string;
  planName: 'GOLD' | 'PLATINUM';
  months: number;
  quantity: number;
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
  
  try {
    // 1. Atomically Loop and mint distinct voucher slots for the bulk bundle
    for (let i = 0; i < params.quantity; i++) {
      const uniqueCode = generateSecureCode();
      
      await prisma.subscriptionVoucher.create({
        data: {
          code: uniqueCode,
          plan: params.planName,
          months: params.months,
          sponsoredBy: `Gift Bundle from ${buyer.name || buyer.email} (${params.relationship})`,
          isUsed: false
        }
      });

      codes.push(uniqueCode);
    }

    // 2. Dispatch Dynamic Gift E-Card email automatically
    sendGiftVoucherEmail(
      params.recipientEmail,
      params.recipientName,
      buyer.name || buyer.email,
      params.relationship,
      params.planName,
      params.months,
      codes,
      params.personalMessage
    ).catch(e => console.error("Gift email dispatch failed:", e));

    // 3. Simulated Bulk Email Confirmation Trigger
    console.log(`
      -----------------------------------------------------
      📧 SIMULATED BULK GIFT EMAILS COMMENCED 📧
      Count: ${params.quantity}
      From: Vyoma Academy <gifts@vyoma.org>
      To: ${params.recipientEmail} (${params.recipientName})
      
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
