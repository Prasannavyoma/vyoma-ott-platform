import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vyoma-Offline-Proxy/1.0',
        'Accept': '*/*'
      }
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
    headers.set('Cache-Control', 'public, max-age=31536000');

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
