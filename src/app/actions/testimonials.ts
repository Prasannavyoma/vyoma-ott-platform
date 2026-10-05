"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function submitTestimonial(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const content = formData.get('content') as string;
    const rating = parseInt(formData.get('rating') as string || "5");

    if (!name || !name.trim() || !content || !content.trim()) {
      return { success: false, error: "Please enter your name and testimonial experience." };
    }

    const user = await getCurrentUser();

    await prisma.testimonial.create({
      data: {
        userId: user?.id || null,
        name: name.trim(),
        role: role ? role.trim() : null,
        content: content.trim(),
        rating: isNaN(rating) ? 5 : rating,
        avatarUrl: (user as any)?.avatarUrl || null,
        status: "PENDING"
      }
    });

    revalidatePath('/testimonials');
    revalidatePath('/admin/testimonials');
    return { success: true };
  } catch (err: any) {
    console.error("Error submitting testimonial:", err);
    return { success: false, error: err?.message || "Failed to submit testimonial. Please try again." };
  }
}

export async function adminCreateTestimonial(formData: FormData) {
  try {
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
    return { success: true };
  } catch (err: any) {
    console.error("Error creating admin testimonial:", err);
    return { success: false, error: err?.message || "Failed to save testimonial." };
  }
}

export async function updateTestimonialStatus(id: string, status: string) {
  try {
    await prisma.testimonial.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/testimonials');
    revalidatePath('/admin/testimonials');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating testimonial status:", err);
    return { success: false, error: err?.message || "Failed to update status." };
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath('/testimonials');
    revalidatePath('/admin/testimonials');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting testimonial:", err);
    return { success: false, error: err?.message || "Failed to delete testimonial." };
  }
}
