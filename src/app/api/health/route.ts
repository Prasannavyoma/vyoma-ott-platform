import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Health check for the load balancer and monitoring.
 * GET /api/health          -> liveness only (no DB), used by the ALB target group
 * GET /api/health?deep=1   -> also checks the database, for monitoring / smoke tests
 */
export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get('deep') === '1';
  if (!deep) {
    return NextResponse.json({ status: 'ok' });
  }

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'ok', dbLatencyMs: Date.now() - started });
  } catch (e: any) {
    console.error('Health check: database unreachable', e?.message);
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
