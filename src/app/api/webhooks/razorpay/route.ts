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

    if (expectedSignature !== signature) {
      console.warn('[Razorpay Webhook] Invalid signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'subscription.charged') {
      const subscriptionEntity = event.payload?.subscription?.entity;
      const razorpaySubscriptionId = subscriptionEntity?.id;
      const amountCharged = (subscriptionEntity?.paid_count ? subscriptionEntity?.plan_id : null) || subscriptionEntity?.amount || 0;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId }
      });

      if (!user) {
        console.error(`[Razorpay Webhook] Auto-renew succeeded but user with subscription ID ${razorpaySubscriptionId} not found.`);
        return NextResponse.json({ success: true, warning: 'User not found' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          planStartedAt: new Date(),
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

      console.log(`[Razorpay Webhook] Successfully processed auto-renewal and sent email for ${user.email}`);
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
      const subscriptionEntity = event.payload?.subscription?.entity;
      const razorpaySubscriptionId = subscriptionEntity?.id;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId }
      });

      if (user) {
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Internal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

