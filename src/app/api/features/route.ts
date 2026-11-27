import { NextResponse } from 'next/server';
import { getSystemSettingsMap } from '@/lib/settings';

export async function GET() {
  try {
    const settingsMap = await getSystemSettingsMap();
    
    const shortsEnabled = settingsMap.has('FEATURE_SHORTS') ? settingsMap.get('FEATURE_SHORTS') === 'true' : true;
    const blogEnabled = settingsMap.has('FEATURE_BLOG') ? settingsMap.get('FEATURE_BLOG') === 'true' : true;
    const scriptSwitcherEnabled = settingsMap.has('FEATURE_SCRIPT_SWITCHER') ? settingsMap.get('FEATURE_SCRIPT_SWITCHER') === 'true' : false; // TURNED OFF BY DEFAULT
    const streaksEnabled = settingsMap.has('FEATURE_GAMIFICATION_STREAKS') ? settingsMap.get('FEATURE_GAMIFICATION_STREAKS') === 'true' : true;
    const aiPronunciationEnabled = settingsMap.has('FEATURE_AI_PRONUNCIATION') ? settingsMap.get('FEATURE_AI_PRONUNCIATION') === 'true' : false; // TURNED OFF BY DEFAULT
    const roadmapEnabled = settingsMap.has('FEATURE_KNOWLEDGE_ROADMAP') ? settingsMap.get('FEATURE_KNOWLEDGE_ROADMAP') === 'true' : false; // TURNED OFF BY DEFAULT

    return NextResponse.json({ 
      shortsEnabled, 
      blogEnabled,
      scriptSwitcherEnabled,
      streaksEnabled,
      aiPronunciationEnabled,
      roadmapEnabled
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (e) {
    return NextResponse.json({ 
      shortsEnabled: true, 
      blogEnabled: true,
      scriptSwitcherEnabled: false,
      streaksEnabled: true,
      aiPronunciationEnabled: false,
      roadmapEnabled: false
    });
  }
}
