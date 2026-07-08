import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Local file uploads are disabled in the Vercel Serverless environment. Please configure AWS S3.' },
    { status: 501 }
  );
}
