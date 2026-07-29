"use server";

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export async function generateAiBlog(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { error: 'Unauthorized' };
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return { error: 'Course not found' };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: 'GEMINI_API_KEY not configured' };

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Write a comprehensive, highly engaging, 1500-word SEO-optimized blog post about the Sanskrit topic covered in this course. 
    Course Title: ${course.title}
    Course Description: ${course.description}
    
    The blog should have:
    - An engaging title (H1)
    - SEO optimized subheadings (H2, H3)
    - Explanations of the concepts in simple English
    - A conclusion inviting readers to join the full course on Vyoma OTT.
    Format the entire output strictly in Markdown format, with no extra conversational filler before or after. Ensure the first line is the Title.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const markdownContent = response.text || '';
    if (!markdownContent) return { error: 'AI failed to generate content' };

    // Extract title from first line (e.g. "# The Beauty of Sanskrit")
    let title = course.title + ' - A Deep Dive';
    const lines = markdownContent.split('\n');
    if (lines[0].startsWith('# ')) {
        title = lines[0].replace('# ', '').trim();
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    await prisma.blogPost.create({
      data: {
        title: title,
        slug: slug,
        excerpt: markdownContent.substring(0, 150).replace(/#/g, '') + '...',
        content: markdownContent,
        author: 'Vyoma AI',
        published: true,
      }
    });

    return { success: true, slug };
  } catch (error: any) {
    console.error('Marketing AI Error:', error);
    return { error: error.message || 'Internal error' };
  }
}
