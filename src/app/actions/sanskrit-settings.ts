'use server';

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get configurations for the Sanskrit Practice Hub features.
 */
export async function getSanskritSettings() {
  // Anyone can retrieve settings for frontend toggles, but we can default value in db if not exists
  const settingsList = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'SANSKRIT_HUB_ENABLED',
          'SANSKRIT_SUBHASHITA_ENABLED',
          'SANSKRIT_GRAMMAR_ENABLED',
          'SANSKRIT_MEMORIZER_ENABLED',
          'SANSKRIT_COACH_ENABLED',
          'SANSKRIT_COACH_THRESHOLD',
          'SANSKRIT_GEMINI_KEY'
        ]
      }
    }
  });

  const config = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    hubEnabled: config['SANSKRIT_HUB_ENABLED'] !== 'false', // default: true
    subhashitaEnabled: config['SANSKRIT_SUBHASHITA_ENABLED'] !== 'false', // default: true
    grammarEnabled: config['SANSKRIT_GRAMMAR_ENABLED'] !== 'false', // default: true
    memorizerEnabled: config['SANSKRIT_MEMORIZER_ENABLED'] !== 'false', // default: true
    coachEnabled: config['SANSKRIT_COACH_ENABLED'] !== 'false', // default: true
    coachThreshold: parseInt(config['SANSKRIT_COACH_THRESHOLD'] || '75', 10), // default: 75
    sanskritGeminiKey: config['SANSKRIT_GEMINI_KEY'] || '', // default: empty
  };
}

/**
 * Update Sanskrit Practice Hub settings (SUPER_ADMIN restricted)
 */
export async function updateSanskritSettings(settings: {
  hubEnabled: boolean;
  subhashitaEnabled: boolean;
  grammarEnabled: boolean;
  memorizerEnabled: boolean;
  coachEnabled: boolean;
  coachThreshold: number;
  sanskritGeminiKey: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }

  const dataToUpsert = [
    { key: 'SANSKRIT_HUB_ENABLED', value: settings.hubEnabled ? 'true' : 'false' },
    { key: 'SANSKRIT_SUBHASHITA_ENABLED', value: settings.subhashitaEnabled ? 'true' : 'false' },
    { key: 'SANSKRIT_GRAMMAR_ENABLED', value: settings.grammarEnabled ? 'true' : 'false' },
    { key: 'SANSKRIT_MEMORIZER_ENABLED', value: settings.memorizerEnabled ? 'true' : 'false' },
    { key: 'SANSKRIT_COACH_ENABLED', value: settings.coachEnabled ? 'true' : 'false' },
    { key: 'SANSKRIT_COACH_THRESHOLD', value: String(settings.coachThreshold) },
    { key: 'SANSKRIT_GEMINI_KEY', value: settings.sanskritGeminiKey.trim() },
  ];

  for (const item of dataToUpsert) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: { value: item.value, updatedAt: new Date() },
      create: { key: item.key, value: item.value, updatedAt: new Date() }
    });
  }

  revalidatePath('/');
  revalidatePath('/admin/sanskrit-settings');
  revalidatePath('/tools/grammar-analyzer');
  revalidatePath('/tools/shloka-memorizer');


  return { success: true };
}

/**
 * Award coin rewards to the user for Sanskrit Practice Hub engagement targets
 */
export async function awardSanskritCoins(feature: 'memorizer' | 'coach') {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  let settingKey = '';
  let defaultCoins = 0;
  if (feature === 'memorizer') {
    settingKey = 'COINS_MEMORIZER_REWARD';
    defaultCoins = 15;
  } else if (feature === 'coach') {
    settingKey = 'COINS_COACH_REWARD';
    defaultCoins = 20;
  } else {
    return { success: false, error: 'Invalid feature' };
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey }
    });
    const coinsToAward = setting ? (parseInt(setting.value, 10) || 0) : defaultCoins;

    if (coinsToAward > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          coins: { increment: coinsToAward }
        }
      });
      return { success: true, coinsAwarded: coinsToAward };
    }
    return { success: true, coinsAwarded: 0 };
  } catch (err: any) {
    console.error(`Failed to award coins for ${feature}:`, err);
    return { success: false, error: err.message || 'Database error' };
  }
}
