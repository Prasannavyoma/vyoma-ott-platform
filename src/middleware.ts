import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enterprise request interceptor.
 * Captures incoming paths and propagates them downstream via headers to enable
 * secure Server Component routing decisions.
 */
export function middleware(request: NextRequest) {
  // 1. Instantiate request clone to manipulate headers
  const requestHeaders = new Headers(request.headers);
  
  // 2. Inject absolute target pathname for Layout resolution
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // 3. Propagate transaction to Next.js pipeline
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Match only routes we need (ignoring assets and static API payloads)
export const config = {
  matcher: ['/admin/:path*', '/watch/:path*', '/quiz/:path*'],
};
