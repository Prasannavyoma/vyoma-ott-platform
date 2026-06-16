import { NextResponse } from 'next/server';
import { logTelemetryEvent } from '@/app/actions/telemetry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, sourceId, metadata } = body;

    if (!eventType || !sourceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await logTelemetryEvent(eventType, sourceId, metadata);
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }
  } catch (error) {
    console.error("Telemetry API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
