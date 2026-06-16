"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendTemplatedEmail } from '@/lib/mail';

export async function saveEmailTemplateAction(templateKey: string, subject: string, body: string) {
  const subjectKey = `TEMPLATE_${templateKey}_SUBJECT`;
  const bodyKey = `TEMPLATE_${templateKey}_BODY`;

  await prisma.systemSetting.upsert({
    where: { key: subjectKey },
    update: { value: subject },
    create: { key: subjectKey, value: subject }
  });

  await prisma.systemSetting.upsert({
    where: { key: bodyKey },
    update: { value: body },
    create: { key: bodyKey, value: body }
  });

  revalidatePath('/admin/email-settings');
}

export async function sendTestEmailAction(toEmail: string, templateKey: string, testUserId: string) {
  // Fetch user if specified to substitute name, otherwise use default mock data
  let userName = "Seeker";
  if (testUserId) {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { name: true }
    });
    if (user && user.name) {
      userName = user.name;
    }
  }

  const platformUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  await sendTemplatedEmail(toEmail, templateKey, {
    name: userName,
    platform_url: platformUrl
  });
}
