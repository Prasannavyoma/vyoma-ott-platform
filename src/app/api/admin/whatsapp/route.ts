import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getWhatsAppSettings } from '@/lib/whatsapp';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getWhatsAppSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Define the keys we expect from the body
    const updates = [
      { key: 'WHATSAPP_ENABLED', value: body.enabled ? 'true' : 'false' },
      { key: 'WHATSAPP_PHONE_ID', value: body.phoneId || '' },
      { key: 'WHATSAPP_ACCESS_TOKEN', value: body.accessToken || '' },
      { key: 'WHATSAPP_TEMPLATE_NEW_COURSE', value: body.templates?.newCourse || '' },
      { key: 'WHATSAPP_TEMPLATE_CERTIFICATE', value: body.templates?.certificate || '' },
      { key: 'WHATSAPP_TEMPLATE_SUBSCRIPTION', value: body.templates?.subscription || '' },
      { key: 'WHATSAPP_TEMPLATE_PROGRESS', value: body.templates?.progress || '' },
      { key: 'WHATSAPP_TEMPLATE_RESUME', value: body.templates?.resume || '' },
      { key: 'WHATSAPP_TEMPLATE_REFERRAL', value: body.templates?.referral || '' },
      { key: 'WHATSAPP_TEMPLATE_DISCOUNT', value: body.templates?.discount || '' }
    ];

    // Use Prisma transaction to update all settings atomically
    await prisma.$transaction(
      updates.map(({ key, value }) => 
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save WhatsApp Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
