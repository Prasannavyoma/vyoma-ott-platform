"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addItem(fd: FormData) {
  const label = fd.get('label') as string;
  const url = fd.get('url') as string;
  const parentId = fd.get('parentId') as string || null;
  const order = parseInt(fd.get('order') as string) || 0;
  const isFooter = fd.get('isFooter') === 'true';

  await prisma.navigationMenu.create({
    data: { label, url, parentId, order, isFooter }
  });
  revalidatePath('/admin/navigation');
  revalidatePath('/');
}

export async function deleteItem(fd: FormData) {
  const id = fd.get('id') as string;
  await prisma.navigationMenu.delete({ where: { id } });
  revalidatePath('/admin/navigation');
  revalidatePath('/');
}

export async function updateItem(fd: FormData) {
  const id = fd.get('id') as string;
  const label = fd.get('label') as string;
  const url = fd.get('url') as string;

  await prisma.navigationMenu.update({
    where: { id },
    data: { label, url }
  });
  revalidatePath('/admin/navigation');
  revalidatePath('/');
}
