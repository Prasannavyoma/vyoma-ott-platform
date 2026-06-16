'use server';

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get core AI configurations including status, key, and custom directive
 */
export async function getAiSettings() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  const enabledSetting = await prisma.systemSetting.findUnique({
    where: { key: 'CHATBOT_ENABLED' }
  });
  
  const apiKeySetting = await prisma.systemSetting.findUnique({
    where: { key: 'GEMINI_API_KEY' }
  });

  const directiveSetting = await prisma.systemSetting.findUnique({
    where: { key: 'AI_CUSTOM_DIRECTIVE' }
  });

  const modeSetting = await prisma.systemSetting.findUnique({
    where: { key: 'CHATBOT_MODE' }
  });

  const customApiUrlSetting = await prisma.systemSetting.findUnique({
    where: { key: 'CHATBOT_CUSTOM_API_URL' }
  });

  const customApiKeySetting = await prisma.systemSetting.findUnique({
    where: { key: 'CHATBOT_CUSTOM_API_KEY' }
  });

  const customEmbedCodeSetting = await prisma.systemSetting.findUnique({
    where: { key: 'CHATBOT_CUSTOM_EMBED_CODE' }
  });

  return {
    enabled: enabledSetting?.value === 'true',
    apiKey: apiKeySetting?.value || '',
    customDirective: directiveSetting?.value || '',
    chatbotMode: modeSetting?.value || 'BUILTIN',
    customApiUrl: customApiUrlSetting?.value || '',
    customApiKey: customApiKeySetting?.value || '',
    customEmbedCode: customEmbedCodeSetting?.value || '',
  };
}

/**
 * Update core AI settings in SystemSetting table
 */
export async function updateAiSettings(
  enabled: boolean,
  apiKey: string,
  customDirective: string,
  chatbotMode: string,
  customApiUrl: string,
  customApiKey: string,
  customEmbedCode: string
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  await prisma.systemSetting.upsert({
    where: { key: 'CHATBOT_ENABLED' },
    update: { value: enabled ? 'true' : 'false', updatedAt: new Date() },
    create: { key: 'CHATBOT_ENABLED', value: enabled ? 'true' : 'false', updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'GEMINI_API_KEY' },
    update: { value: apiKey.trim(), updatedAt: new Date() },
    create: { key: 'GEMINI_API_KEY', value: apiKey.trim(), updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'AI_CUSTOM_DIRECTIVE' },
    update: { value: customDirective.trim(), updatedAt: new Date() },
    create: { key: 'AI_CUSTOM_DIRECTIVE', value: customDirective.trim(), updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'CHATBOT_MODE' },
    update: { value: chatbotMode.trim(), updatedAt: new Date() },
    create: { key: 'CHATBOT_MODE', value: chatbotMode.trim(), updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'CHATBOT_CUSTOM_API_URL' },
    update: { value: customApiUrl.trim(), updatedAt: new Date() },
    create: { key: 'CHATBOT_CUSTOM_API_URL', value: customApiUrl.trim(), updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'CHATBOT_CUSTOM_API_KEY' },
    update: { value: customApiKey.trim(), updatedAt: new Date() },
    create: { key: 'CHATBOT_CUSTOM_API_KEY', value: customApiKey.trim(), updatedAt: new Date() }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'CHATBOT_CUSTOM_EMBED_CODE' },
    update: { value: customEmbedCode.trim(), updatedAt: new Date() },
    create: { key: 'CHATBOT_CUSTOM_EMBED_CODE', value: customEmbedCode.trim(), updatedAt: new Date() }
  });

  revalidatePath('/');
  revalidatePath('/admin/ai-settings');
  return { success: true };
}

/**
 * FAQ Operations - Fetch FAQs
 */
export async function getAiFaqs() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  return prisma.aiFaq.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * FAQ Operations - Create FAQ
 */
export async function createAiFaq(question: string, answer: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  if (!question.trim() || !answer.trim()) {
    throw new Error('Question and Answer cannot be empty.');
  }

  const faq = await prisma.aiFaq.create({
    data: {
      question: question.trim(),
      answer: answer.trim()
    }
  });

  revalidatePath('/');
  revalidatePath('/admin/ai-settings');
  return faq;
}

/**
 * FAQ Operations - Update FAQ
 */
export async function updateAiFaq(id: string, question: string, answer: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  if (!question.trim() || !answer.trim()) {
    throw new Error('Question and Answer cannot be empty.');
  }

  const faq = await prisma.aiFaq.update({
    where: { id },
    data: {
      question: question.trim(),
      answer: answer.trim()
    }
  });

  revalidatePath('/');
  revalidatePath('/admin/ai-settings');
  return faq;
}

/**
 * FAQ Operations - Delete FAQ
 */
export async function deleteAiFaq(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  await prisma.aiFaq.delete({
    where: { id }
  });

  revalidatePath('/');
  revalidatePath('/admin/ai-settings');
  return { success: true };
}

/**
 * Get public Quick Contact Widget configuration settings
 */
export async function getContactSettings() {
  const widgetEnabled = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_WIDGET_ENABLED' } });
  const phoneEnabled = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_PHONE_ENABLED' } });
  const phoneNumber = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_PHONE_NUMBER' } });
  const whatsappEnabled = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_WHATSAPP_ENABLED' } });
  const whatsappNumber = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_WHATSAPP_NUMBER' } });
  const whatsappMessage = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_WHATSAPP_MESSAGE' } });
  const emailEnabled = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_EMAIL_ENABLED' } });
  const emailAddress = await prisma.systemSetting.findUnique({ where: { key: 'CONTACT_EMAIL_ADDRESS' } });

  return {
    widgetEnabled: widgetEnabled ? widgetEnabled.value === 'true' : true,
    phoneEnabled: phoneEnabled ? phoneEnabled.value === 'true' : true,
    phoneNumber: phoneNumber ? phoneNumber.value : '+919876543210',
    whatsappEnabled: whatsappEnabled ? whatsappEnabled.value === 'true' : true,
    whatsappNumber: whatsappNumber ? whatsappNumber.value : '+919876543210',
    whatsappMessage: whatsappMessage ? whatsappMessage.value : 'Namaste! I have a question about Vyoma Sanskrit OTT.',
    emailEnabled: emailEnabled ? emailEnabled.value === 'true' : true,
    emailAddress: emailAddress ? emailAddress.value : 'support@vyomasanskrit.in',
  };
}

/**
 * Update Quick Contact Widget configuration settings (restricted to Super Admin)
 */
export async function updateContactSettings(settings: {
  widgetEnabled: boolean;
  phoneEnabled: boolean;
  phoneNumber: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  emailEnabled: boolean;
  emailAddress: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  const dataToUpsert = [
    { key: 'CONTACT_WIDGET_ENABLED', value: settings.widgetEnabled ? 'true' : 'false' },
    { key: 'CONTACT_PHONE_ENABLED', value: settings.phoneEnabled ? 'true' : 'false' },
    { key: 'CONTACT_PHONE_NUMBER', value: settings.phoneNumber.trim() },
    { key: 'CONTACT_WHATSAPP_ENABLED', value: settings.whatsappEnabled ? 'true' : 'false' },
    { key: 'CONTACT_WHATSAPP_NUMBER', value: settings.whatsappNumber.trim() },
    { key: 'CONTACT_WHATSAPP_MESSAGE', value: settings.whatsappMessage.trim() },
    { key: 'CONTACT_EMAIL_ENABLED', value: settings.emailEnabled ? 'true' : 'false' },
    { key: 'CONTACT_EMAIL_ADDRESS', value: settings.emailAddress.trim() },
  ];

  for (const item of dataToUpsert) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: { value: item.value, updatedAt: new Date() },
      create: { key: item.key, value: item.value, updatedAt: new Date() }
    });
  }

  revalidatePath('/');
  revalidatePath('/admin/ai-settings');
  return { success: true };
}

