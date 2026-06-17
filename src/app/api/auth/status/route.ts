import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ isLoggedIn: !!user });
  } catch (e) {
    return NextResponse.json({ isLoggedIn: false });
  }
}
