"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function submitTestimonial(formData: FormData) {
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const content = formData.get('content') as string;
  const rating = parseInt(formData.get('rating') as string || "5");
  
  const user = await getCurrentUser();

  await prisma.testimonial.create({
    data: {
      userId: user?.id || null,
      name,
      role,
      content,
      rating,
      status: "PENDING" // Always pending by default
    }
  });

  revalidatePath('/testimonials');
  revalidatePath('/admin/testimonials');
}

export async function adminCreateTestimonial(formData: FormData) {
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const content = formData.get('content') as string;
  const rating = parseInt(formData.get('rating') as string || "5");
  const status = formData.get('status') as string || "APPROVED";

  await prisma.testimonial.create({
    data: {
      name,
      role,
      content,
      rating,
      status
    }
  });

  revalidatePath('/testimonials');
  revalidatePath('/admin/testimonials');
}

export async function updateTestimonialStatus(id: string, status: string) {
  await prisma.testimonial.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/testimonials');
  revalidatePath('/admin/testimonials');
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath('/testimonials');
  revalidatePath('/admin/testimonials');
}
