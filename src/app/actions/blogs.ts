"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createBlogPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;
  const author = formData.get('author') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string || null;
  const published = formData.get('published') === 'true';

  await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      author,
      thumbnailUrl,
      published
    }
  });

  revalidatePath('/blog');
  revalidatePath('/admin/blogs');
}

export async function updateBlogPost(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;
  const author = formData.get('author') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string || null;
  const published = formData.get('published') === 'true';

  await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      content,
      author,
      thumbnailUrl,
      published
    }
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/admin/blogs');
}

export async function deleteBlogPost(id: string) {
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/blog');
  revalidatePath('/admin/blogs');
}

export async function toggleBlogPublish(id: string, published: boolean) {
  const blog = await prisma.blogPost.update({
    where: { id },
    data: { published }
  });
  revalidatePath('/blog');
  revalidatePath(`/blog/${blog.slug}`);
  revalidatePath('/admin/blogs');
}
