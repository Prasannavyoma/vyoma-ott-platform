import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

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
      const subscriptionEntity = event.payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionEntity.id;

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

      console.log(`[Razorpay Webhook] Successfully processed auto-renewal for ${user.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Internal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

