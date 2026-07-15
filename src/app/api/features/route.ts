import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rawSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['FEATURE_SHORTS', 'FEATURE_BLOG']
        }
      }
    });
    
    const settingsMap = new Map(rawSettings.map(s => [s.key, s.value]));
    
    const shortsEnabled = settingsMap.has('FEATURE_SHORTS') ? settingsMap.get('FEATURE_SHORTS') === 'true' : true;
    const blogEnabled = settingsMap.has('FEATURE_BLOG') ? settingsMap.get('FEATURE_BLOG') === 'true' : true;

    return NextResponse.json({ shortsEnabled, blogEnabled });
  } catch (e) {
    return NextResponse.json({ shortsEnabled: true, blogEnabled: true });
  }
}
