"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateChannel(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const icon = formData.get('icon') as string;
  const order = parseInt(formData.get('order') as string || "0");

  await prisma.homepageChannel.update({
    where: { id },
    data: { name, url, icon, order }
  });
  
  revalidatePath('/admin/layout-settings');
  revalidatePath('/');
}

export async function addSection(formData: FormData) {
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const order = parseInt(formData.get('order') as string || "0");

  await prisma.homepageSection.create({
     data: {
       title,
       category,
       order,
       active: true
     }
  });
  revalidatePath('/admin/layout-settings');
  revalidatePath('/');
}

export async function deleteSection(formData: FormData) {
  const id = formData.get('id') as string;
  await prisma.homepageSection.delete({ where: { id } });
  revalidatePath('/admin/layout-settings');
  revalidatePath('/');
}

export async function updateSection(formData: FormData) {
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const order = parseInt(formData.get('order') as string || "0");

  await prisma.homepageSection.update({
    where: { id },
    data: {
      title,
      category,
      order
    }
  });

  revalidatePath('/admin/layout-settings');
  revalidatePath('/');
}

export async function toggleKnowledgeRoadmap(enabled: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: 'FEATURE_KNOWLEDGE_ROADMAP' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'FEATURE_KNOWLEDGE_ROADMAP', value: enabled ? 'true' : 'false' }
  });
  revalidatePath('/admin/layout-settings');
  revalidatePath('/profile');
}

export async function toggleShortsFeature(enabled: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: 'FEATURE_SHORTS' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'FEATURE_SHORTS', value: enabled ? 'true' : 'false' }
  });
  revalidatePath('/admin/layout-settings');
  revalidatePath('/', 'layout');
}

export async function toggleBlogFeature(enabled: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: 'FEATURE_BLOG' },
    update: { value: enabled ? 'true' : 'false' },
    create: { key: 'FEATURE_BLOG', value: enabled ? 'true' : 'false' }
  });
  revalidatePath('/admin/layout-settings');
  revalidatePath('/', 'layout');
}
