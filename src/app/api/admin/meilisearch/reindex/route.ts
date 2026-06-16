import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { indexAllContent } from '@/lib/meilisearch';

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await indexAllContent();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Manual Meilisearch Re-indexing Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to re-index content' }, { status: 500 });
  }
}
