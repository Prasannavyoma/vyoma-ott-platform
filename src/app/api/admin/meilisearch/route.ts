import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMeilisearchSettings, indexAllContent, getMeilisearchClient } from '@/lib/meilisearch';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getMeilisearchSettings();
    
    // Check connectivity if enabled
    let connected = false;
    let statusMessage = 'Disabled';
    if (settings.enabled && settings.host) {
      try {
        const client = await getMeilisearchClient();
        if (client) {
          const health = await client.isHealthy();
          connected = health;
          statusMessage = health ? 'Connected & Healthy' : 'Unhealthy';
        }
      } catch (err: any) {
        statusMessage = err.message || 'Connection failed';
      }
    }

    return NextResponse.json({
      ...settings,
      connected,
      statusMessage
    });
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
    
    const updates = [
      { key: 'MEILISEARCH_ENABLED', value: body.enabled ? 'true' : 'false' },
      { key: 'MEILISEARCH_HOST', value: body.host || '' },
      { key: 'MEILISEARCH_API_KEY', value: body.apiKey || '' }
    ];

    // Atomically update setting configuration keys
    await prisma.$transaction(
      updates.map(({ key, value }) => 
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    // If enabled, attempt an automatic initial indexing run in the background
    if (body.enabled && body.host) {
      // Fire-and-forget background indexing execution
      indexAllContent().catch(err => {
        console.error('[Background Meilisearch Auto-Indexing Error]:', err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Meilisearch Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
