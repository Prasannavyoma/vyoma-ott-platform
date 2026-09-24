import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSanskritSettings } from '@/app/actions/sanskrit-settings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isFooter = type === 'footer';

    // Fetch primary menus with their nested children, sorted by priority
    let items: any[] = [];
    try {
      items = await prisma.navigationMenu.findMany({
        where: { parentId: null, isFooter },
        include: { children: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' }
      });
    } catch (dbErr) {
      console.error("Prisma navigationMenu fetch error:", dbErr);
    }

    if (isFooter && (!items || items.length === 0 || !items.some(i => i.children && i.children.length > 0))) {
      return NextResponse.json([
        {
          id: 'footer-account',
          label: 'Account & Plans',
          children: [
            { id: 'f-sub', label: 'Subscribe / Gold', url: '/subscribe' },
            { id: 'f-gift', label: 'Referral Rewards', url: '/gift' },
            { id: 'f-pwd', label: 'Change Password', url: '/change-password' }
          ]
        },
        {
          id: 'footer-legal',
          label: 'Legal & Guidelines',
          children: [
            { id: 'f-privacy', label: 'Privacy Policy', url: '#' },
            { id: 'f-terms', label: 'Terms of Service', url: '#' },
            { id: 'f-refund', label: 'Refund Policy', url: '#' }
          ]
        }
      ]);
    }

    if (!isFooter) {
      try {
        const sansSettings = await getSanskritSettings();
        if (sansSettings.hubEnabled) {
          const children = [];
          if (sansSettings.grammarEnabled) {
            children.push({
              id: 'sans-tool-grammar',
              label: 'Grammar Analyzer',
              url: '/tools/grammar-analyzer',
              order: 1,
              parentId: 'sans-hub-menu'
            });
          }
          if (sansSettings.memorizerEnabled) {
            children.push({
              id: 'sans-tool-memorizer',
              label: 'Shloka Memorizer',
              url: '/tools/shloka-memorizer',
              order: 2,
              parentId: 'sans-hub-menu'
            });
          }


          if (children.length > 0) {
            items.push({
              id: 'sans-hub-menu',
              label: 'Practice Hub',
              url: '#',
              order: 99,
              parentId: null,
              children: children,
              isFooter: false,
              createdAt: new Date()
            } as any);
          }
        }
      } catch (err) {
        console.error("Failed to inject Sanskrit Hub into navigation menu:", err);
      }
    }
    
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json([]);
  }
}
