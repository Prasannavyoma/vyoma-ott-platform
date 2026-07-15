"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getThemeSettings() {
  const keys = [
    'THEME_PRIMARY_COLOR',
    'THEME_BACKGROUND_COLOR',
    'THEME_FONT_FAMILY',
    'THEME_FONT_SIZE_BASE',
    'THEME_BUTTON_RADIUS',
    'THEME_CARD_BG'
  ];

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } }
  });

  const map = new Map(settings.map(s => [s.key, s.value]));

  return {
    primaryColor: map.get('THEME_PRIMARY_COLOR') || '#f26422',
    backgroundColor: map.get('THEME_BACKGROUND_COLOR') || '#030b17',
    cardBg: map.get('THEME_CARD_BG') || '#0f1624',
    fontFamily: map.get('THEME_FONT_FAMILY') || 'Outfit',
    fontSizeBase: map.get('THEME_FONT_SIZE_BASE') || '16px',
    buttonRadius: map.get('THEME_BUTTON_RADIUS') || '8px',
  };
}

export async function saveThemeSettings(data: {
  primaryColor: string;
  backgroundColor: string;
  cardBg: string;
  fontFamily: string;
  fontSizeBase: string;
  buttonRadius: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");

  const settingsToSave = [
    { key: 'THEME_PRIMARY_COLOR', value: data.primaryColor },
    { key: 'THEME_BACKGROUND_COLOR', value: data.backgroundColor },
    { key: 'THEME_CARD_BG', value: data.cardBg },
    { key: 'THEME_FONT_FAMILY', value: data.fontFamily },
    { key: 'THEME_FONT_SIZE_BASE', value: data.fontSizeBase },
    { key: 'THEME_BUTTON_RADIUS', value: data.buttonRadius },
  ];

  for (const s of settingsToSave) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }
  
  revalidatePath('/', 'layout');

  return { success: true };
}
