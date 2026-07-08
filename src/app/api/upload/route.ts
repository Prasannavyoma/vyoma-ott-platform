import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Vercel Serverless Functions have a read-only filesystem.
  // Local disk uploads (fs.writeFile to /public/uploads) are not supported on Vercel.
  // To enable uploads in production, you must integrate an S3 bucket or Vercel Blob.
  return NextResponse.json(
    { success: false, error: 'Local file uploads are disabled in the Vercel Serverless environment. Please provide a URL instead or configure AWS S3.' },
    { status: 501 }
  );
}
