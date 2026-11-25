import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPurchaseSuccess, sendCancelNotification } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secretSetting = await prisma.systemSetting.findUnique({ where: { key: 'RAZORPAY_WEBHOOK_SECRET' } });
    const secret = secretSetting?.value || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[Razorpay Webhook] Critical Error: Webhook Secret not configured.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');

    // Timing-safe signature comparison to mitigate side-channel timing attacks
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      console.warn('[Razorpay Webhook] Invalid signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);
    const eventId = event.id || `${event.event}_${event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id}_${event.created_at || Date.now()}`;

    // Webhook Idempotency: Ignore duplicate webhook deliveries from Razorpay retries
    const existingProcessed = await prisma.telemetryEvent.findFirst({
      where: {
        eventType: 'RAZORPAY_WEBHOOK_EVENT',
        sourceId: eventId
      }
    });

    if (existingProcessed) {
      console.log(`[Razorpay Webhook] Duplicate event ${eventId} ignored.`);
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (event.event === 'subscription.charged') {
      const subscriptionEntity = event.payload?.subscription?.entity;
      const razorpaySubscriptionId = subscriptionEntity?.id;
      const amountCharged = (subscriptionEntity?.paid_count ? subscriptionEntity?.plan_id : null) || subscriptionEntity?.amount || 0;

      let user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId }
      });

      // Fallback: match by customer email if subscription ID was not previously bound
      if (!user) {
        const payloadEmail = event.payload?.payment?.entity?.email || subscriptionEntity?.customer_email;
        if (payloadEmail) {
          user = await prisma.user.findUnique({ where: { email: payloadEmail } });
          if (user && razorpaySubscriptionId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { razorpaySubscriptionId }
            });
          }
        }
      }

      if (!user) {
        console.error(`[Razorpay Webhook] Auto-renew succeeded but user with subscription ID ${razorpaySubscriptionId} not found.`);
        return NextResponse.json({ success: true, warning: 'User not found' });
      }

      // Calculate extended expiration date for recurring billing
      const interval = user.planInterval || 'MONTHLY';
      const daysToAdd = interval === 'YEARLY' ? 365 : 30;
      const now = new Date();
      let baseTime = now.getTime();
      if (user.planExpiresAt && new Date(user.planExpiresAt).getTime() > now.getTime()) {
        baseTime = new Date(user.planExpiresAt).getTime();
      }
      const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          planStartedAt: now,
          planExpiresAt: newExpiry,
          coins: { increment: 200 }
        }
      });

      // Dispatch auto-renewal confirmation email to user & admin
      const chargeAmount = amountCharged ? (typeof amountCharged === 'number' ? amountCharged / 100 : 4900) : (user.plan === 'PLATINUM' ? 8900 : 4900);
      sendPurchaseSuccess(user.email, `${user.plan || 'PREMIUM'} (Auto-Renewed)`, chargeAmount).catch(e => {});

      // Log AUTO_RENEWAL telemetry event
      await prisma.telemetryEvent.create({
        data: {
          eventType: 'AUTO_RENEWAL',
          sourceId: user.plan || 'MEMBER',
          userId: user.id,
          metadata: JSON.stringify({
            subscriptionId: razorpaySubscriptionId,
            email: user.email,
            plan: user.plan,
            interval: user.planInterval,
            country: user.country || 'IN',
            chargeDate: new Date().toISOString(),
            amount: chargeAmount
          })
        }
      }).catch(e => console.error("Telemetry error:", e));

      console.log(`[Razorpay Webhook] Successfully processed auto-renewal and extended expiry for ${user.email}`);
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
      const subscriptionEntity = event.payload?.subscription?.entity;
      const razorpaySubscriptionId = subscriptionEntity?.id;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId }
      });

      if (user) {
        // Demote user plan to FREE and revoke subscription mandate
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: 'FREE',
            planInterval: null,
            razorpaySubscriptionId: null,
            planExpiresAt: new Date()
          }
        });

        // Dispatch cancellation notice email
        sendCancelNotification(user.email).catch(e => {});

        await prisma.telemetryEvent.create({
          data: {
            eventType: 'SUBSCRIPTION_CANCELLED',
            sourceId: `${user.plan} -> FREE`,
            userId: user.id,
            metadata: JSON.stringify({
              subscriptionId: razorpaySubscriptionId,
              email: user.email,
              plan: user.plan,
              country: user.country || 'IN',
              reason: subscriptionEntity?.cancel_reason || 'Mandate Halted / Cancelled',
              timestamp: new Date().toISOString()
            })
          }
        }).catch(e => console.error("Telemetry error:", e));
      }
    } else if (event.event === 'payment.refunded' || event.event === 'refund.processed') {
      const paymentEntity = event.payload?.payment?.entity;
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = paymentEntity?.id || refundEntity?.payment_id;
      const orderId = paymentEntity?.order_id;
      const email = paymentEntity?.email;

      // 1. Revoke individual Course purchase if refunded
      if (paymentId || orderId) {
        const purchase = await prisma.purchase.findFirst({
          where: {
            OR: [
              ...(paymentId ? [{ razorpayPaymentId: paymentId }] : []),
              ...(orderId ? [{ razorpayOrderId: orderId }] : [])
            ]
          }
        });

        if (purchase) {
          await prisma.purchase.delete({ where: { id: purchase.id } });
          console.log(`[Razorpay Webhook] Revoked course purchase ${purchase.courseId} for user ${purchase.userId} due to refund.`);
        }
      }

      // 2. Revert user subscription to FREE if membership was refunded
      if (email) {
        const refundedUser = await prisma.user.findUnique({ where: { email } });
        if (refundedUser && refundedUser.plan !== 'FREE') {
          await prisma.user.update({
            where: { id: refundedUser.id },
            data: {
              plan: 'FREE',
              planInterval: null,
              razorpaySubscriptionId: null,
              planExpiresAt: new Date()
            }
          });
          console.log(`[Razorpay Webhook] Reverted user ${refundedUser.email} to FREE due to processed refund.`);
        }
      }
    } else if (event.event === 'payment.failed' || event.event === 'subscription.pending') {
      const paymentEntity = event.payload?.payment?.entity;
      const subscriptionId = paymentEntity?.subscription_id || event.payload?.subscription?.entity?.id;
      const errorDescription = paymentEntity?.error_description || paymentEntity?.error_reason || 'Recurring payment failure';

      const user = subscriptionId ? await prisma.user.findFirst({ where: { razorpaySubscriptionId: subscriptionId } }) : null;

      await prisma.telemetryEvent.create({
        data: {
          eventType: 'SUBSCRIPTION_PAYMENT_FAILED',
          sourceId: subscriptionId || 'GATEWAY_ERROR',
          userId: user?.id,
          metadata: JSON.stringify({
            subscriptionId,
            email: user?.email || paymentEntity?.email,
            plan: user?.plan || 'UNKNOWN',
            country: user?.country || 'IN',
            error: errorDescription,
            amount: paymentEntity?.amount ? paymentEntity.amount / 100 : 0,
            timestamp: new Date().toISOString()
          })
        }
      }).catch(e => console.error("Telemetry error:", e));
    }

    // Record webhook event to enforce idempotency across retries
    await prisma.telemetryEvent.create({
      data: {
        eventType: 'RAZORPAY_WEBHOOK_EVENT',
        sourceId: eventId,
        metadata: JSON.stringify({
          event: event.event,
          processedAt: new Date().toISOString()
        })
      }
    }).catch(e => console.error("Webhook idempotency record error:", e));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Internal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

