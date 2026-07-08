"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


/**
 * Server Action: Save a sponsor with local file logo upload
 */
export async function saveSponsor(fd: FormData) {
  try {
    const id = fd.get('id') as string | null;
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;
    const logoFile = fd.get('logoFile') as File | null;
    const fallbackLogoUrl = fd.get('logoUrl') as string | null;

    let finalLogoUrl = fallbackLogoUrl || '';

    // Vercel has a read-only filesystem, so we cannot save physical files to public/uploads.
    if (logoFile && logoFile.size > 0 && logoFile.name) {
      return { success: false, error: "Physical file uploads are disabled on Vercel. Please upload the image to an external host (like S3 or Imgur) and paste the URL instead." };
    }

    if (!finalLogoUrl) {
      finalLogoUrl = 'https://placehold.co/150x80?text=Sponsor';
    }

    if (id) {
      // Update existing sponsor
      await prisma.sponsor.update({
        where: { id },
        data: {
          name,
          description,
          logoUrl: finalLogoUrl
        }
      });
    } else {
      // Create new sponsor
      await prisma.sponsor.create({
        data: {
          name,
          description,
          logoUrl: finalLogoUrl
        }
      });
    }

    revalidatePath('/admin/sponsors');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save sponsor:", error);
    return { success: false, error: error.message || "Failed to commit sponsor." };
  }
}

/**
 * Server Action: Remove a sponsor
 */
export async function deleteSponsor(id: string) {
  try {
    await prisma.sponsor.delete({
      where: { id }
    });
    revalidatePath('/admin/sponsors');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete sponsor:", error);
    return { success: false, error: error.message || "Failed to delete sponsor." };
  }
}

/**
 * Helper to fetch all sponsors
 */
export async function getSponsors() {
  return await prisma.sponsor.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30
  });
}

/**
 * Server Action: Save setting to hide dummy sponsors
 */
export async function setHideDummySponsors(hide: boolean) {
  try {
    const value = hide ? 'true' : 'false';
    const now = new Date();
    await prisma.$executeRawUnsafe(
      `INSERT INTO SystemSetting ("key", "value", "updatedAt") VALUES ('HIDE_DUMMY_SPONSORS', ?, ?) 
       ON CONFLICT("key") DO UPDATE SET "value"=excluded.value, "updatedAt"=excluded.updatedAt`,
      value, now.toISOString()
    );
    revalidatePath('/admin/sponsors');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save setting:", error);
    return { success: false, error: error.message || "Failed to update setting." };
  }
}

/**
 * Helper to get HIDE_DUMMY_SPONSORS setting
 */
export async function getHideDummySponsors() {
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT value FROM SystemSetting WHERE key = 'HIDE_DUMMY_SPONSORS' LIMIT 1`) as any[];
    return res?.[0]?.value === 'true';
  } catch (e) {
    return false;
  }
}
