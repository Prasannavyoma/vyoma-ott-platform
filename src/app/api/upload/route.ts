import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define physical storage target (obfuscated to trick Vercel NFT into NOT bundling 745 images)
    const pub = 'public';
    const up = 'uploads';
    const uploadsDir = path.join(process.cwd(), pub, up);
    
    // Ensure dir exists safely
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch(e){}

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const absolutePath = path.join(uploadsDir, filename);

    await writeFile(absolutePath, buffer);
    
    // The public-facing relative web url
    const webUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: webUrl });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
