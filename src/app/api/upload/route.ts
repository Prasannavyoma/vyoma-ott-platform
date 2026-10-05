import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Check server environment: If running in Serverless / Vercel, convert to Data URL
    const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

    if (isServerless) {
      const mimeType = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }

    // 2. Local Node/Dev Environment: Save file to public/uploads/
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      const publicUrl = `/uploads/${fileName}`;

      return NextResponse.json({ success: true, url: publicUrl });
    } catch (fsError) {
      // Fallback to Data URL if filesystem write fails
      const mimeType = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
