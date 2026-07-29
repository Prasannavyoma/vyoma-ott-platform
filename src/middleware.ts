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

  // 3. GEO Engine: Detect country and map currency
  // Vercel injects 'x-vercel-ip-country' in production edge networks
  const country = request.headers.get('x-vercel-ip-country') || 'IN';
  
  // If user is from India, default to INR, otherwise USD
  const currency = country === 'IN' ? 'INR' : 'USD';
  requestHeaders.set('x-user-currency', currency);

  // 4. Propagate transaction to Next.js pipeline
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Match all routes except static assets to ensure pricing pages always get currency
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
