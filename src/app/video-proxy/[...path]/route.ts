import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await props.params;
  const pathParts = resolvedParams.path;
  const targetUrl = `https://d3a8qbwm8iliew.cloudfront.net/${pathParts.join('/')}`;

  try {
    const requestHeaders: Record<string, string> = {
      'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
      'Accept': request.headers.get('accept') || '*/*',
    };

    const range = request.headers.get('range');
    if (range) {
      requestHeaders['Range'] = range;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: requestHeaders,
    });

    const headers = new Headers();
    const headersToCopy = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
      'cache-control'
    ];

    headersToCopy.forEach(h => {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Force CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }
  });
}
