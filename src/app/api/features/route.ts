import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rawSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'FEATURE_SHORTS', 
            'FEATURE_BLOG',
            'FEATURE_SCRIPT_SWITCHER',
            'FEATURE_GAMIFICATION_STREAKS',
            'FEATURE_AI_PRONUNCIATION'
          ]
        }
      }
    });
    
    const settingsMap = new Map(rawSettings.map(s => [s.key, s.value]));
    
    const shortsEnabled = settingsMap.has('FEATURE_SHORTS') ? settingsMap.get('FEATURE_SHORTS') === 'true' : true;
    const blogEnabled = settingsMap.has('FEATURE_BLOG') ? settingsMap.get('FEATURE_BLOG') === 'true' : true;
    const scriptSwitcherEnabled = settingsMap.has('FEATURE_SCRIPT_SWITCHER') ? settingsMap.get('FEATURE_SCRIPT_SWITCHER') === 'true' : true;
    const streaksEnabled = settingsMap.has('FEATURE_GAMIFICATION_STREAKS') ? settingsMap.get('FEATURE_GAMIFICATION_STREAKS') === 'true' : true;
    const aiPronunciationEnabled = settingsMap.has('FEATURE_AI_PRONUNCIATION') ? settingsMap.get('FEATURE_AI_PRONUNCIATION') === 'true' : true;

    return NextResponse.json({ 
      shortsEnabled, 
      blogEnabled,
      scriptSwitcherEnabled,
      streaksEnabled,
      aiPronunciationEnabled
    });
  } catch (e) {
    return NextResponse.json({ 
      shortsEnabled: true, 
      blogEnabled: true,
      scriptSwitcherEnabled: true,
      streaksEnabled: true,
      aiPronunciationEnabled: true
    });
  }
}
