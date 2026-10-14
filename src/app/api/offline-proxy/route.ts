import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Authentication Gate: Downloads strictly require logged-in user
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: You must be logged in to download content for offline viewing.' },
      { status: 401 }
    );
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // 2. Audit Telemetry: Record who downloaded which video/course/episode
  const courseId = request.nextUrl.searchParams.get('courseId');
  const episodeId = request.nextUrl.searchParams.get('episodeId');
  const courseTitle = request.nextUrl.searchParams.get('courseTitle');
  const episodeTitle = request.nextUrl.searchParams.get('episodeTitle');

  const rangeHeader = request.headers.get('range');
  const isInitialRequest = !rangeHeader || rangeHeader.startsWith('bytes=0-');

  if (isInitialRequest) {
    try {
      await prisma.telemetryEvent.create({
        data: {
          eventType: 'OFFLINE_DOWNLOAD',
          sourceId: episodeId || courseId || 'offline_media',
          userId: user.id,
          metadata: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || 'Learner',
            userPlan: user.plan || 'FREE',
            courseId: courseId || null,
            episodeId: episodeId || null,
            courseTitle: courseTitle || null,
            episodeTitle: episodeTitle || null,
            url: url,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            downloadedAt: new Date().toISOString()
          })
        }
      });
    } catch (e) {
      console.error('Failed to log offline download audit:', e);
    }
  }

  // 3. Forward request to upstream media source
  try {
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Vyoma-Offline-Proxy/1.0',
      'Accept': '*/*'
    };
    if (rangeHeader) {
      upstreamHeaders['range'] = rangeHeader;
    }

    const targetUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${request.nextUrl.origin}${url.startsWith('/') ? '' : '/'}${url}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders
    });

    const headers = new Headers();
    const headersToCopy = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified'
    ];

    headersToCopy.forEach(h => {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Force CORS to allow the frontend DownloadButton to save it to Cache API
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error('Offline proxy failed:', error);
    return new NextResponse('Failed to proxy resource', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
    }
  });
}
