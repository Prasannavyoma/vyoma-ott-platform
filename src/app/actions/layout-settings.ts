"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateChannel(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const icon = formData.get('icon') as string;
  const order = parseInt(formData.get('order') as string || "0");

  await prisma.$executeRawUnsafe(
    `UPDATE HomepageChannel SET name = ?, url = ?, icon = ?, "order" = ? WHERE id = ?`,
    name, url, icon, order, id
  );
  
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

