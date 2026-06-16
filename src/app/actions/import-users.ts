"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/hash';

export async function registerUsersFromCSV(fd: FormData) {
  const rawCsvText = fd.get('csvText') as string;
  const csvFile = fd.get('csvFile') as File;

  let finalCsvString = '';

  // Read file if uploaded, fallback to textarea paste
  if (csvFile && csvFile.size > 0) {
    finalCsvString = await csvFile.text();
  } else if (rawCsvText) {
    finalCsvString = rawCsvText;
  }

  if (!finalCsvString) {
    return { error: 'Please upload a CSV file or paste CSV content.' };
  }

  const lines = finalCsvString.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return { error: 'CSV file must contain a header row and at least one user record.' };
  }

  // Parse headers: name, email, temporarypassword, plan
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('login') || h.includes('mail'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('display') || h.includes('user'));
  const passwordIdx = headers.findIndex(h => h.includes('password') || h.includes('pass') || h.includes('temp'));
  const planIdx = headers.findIndex(h => h.includes('plan') || h.includes('membership') || h.includes('tier'));

  if (emailIdx === -1) {
    return { error: 'CSV must contain an "email" column.' };
  }

  let count = 0;
  let errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const currentLine = lines[i];
      if (!currentLine) continue;

      const cells = currentLine.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      
      const email = cells[emailIdx];
      if (!email || !email.includes('@')) {
        errors.push(`Row ${i + 1}: Invalid or missing email`);
        continue;
      }

      const name = nameIdx !== -1 && nameIdx < cells.length ? cells[nameIdx] : email.split('@')[0];
      const tempPass = passwordIdx !== -1 && passwordIdx < cells.length ? cells[passwordIdx] : 'VyomaTemp123!';
      const csvPlan = planIdx !== -1 && planIdx < cells.length ? cells[planIdx].toUpperCase() : 'FREE';
      
      // Map plans nicely
      let finalPlan = 'FREE';
      if (csvPlan.includes('GOLD')) finalPlan = 'GOLD';
      else if (csvPlan.includes('PLATINUM')) finalPlan = 'PLATINUM';
      else if (csvPlan.includes('ABROAD') || csvPlan.includes('INTERNATIONAL')) finalPlan = 'ABROAD';

      // Set subscription cycle info if not free
      let planStartedAt = null;
      let planExpiresAt = null;
      let planInterval = null;
      if (finalPlan !== 'FREE') {
        planStartedAt = new Date();
        planInterval = 'YEARLY';
        planExpiresAt = new Date();
        planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
      }

      const hashedPassword = hashPassword(tempPass);

      await prisma.user.upsert({
        where: { email },
        update: {
          name,
          plan: finalPlan,
          planInterval,
          planStartedAt,
          planExpiresAt,
          password: hashedPassword,
          forcePasswordChange: true // Require password change at next login
        },
        create: {
          email,
          name,
          plan: finalPlan,
          planInterval,
          planStartedAt,
          planExpiresAt,
          password: hashedPassword,
          forcePasswordChange: true
        }
      });
      count++;
    } catch (err: any) {
      console.error(`Error parsing row ${i + 1}:`, err);
      errors.push(`Row ${i + 1}: Failed to process user (${err.message || 'unknown error'})`);
    }
  }

  revalidatePath('/admin/users');
  return { 
    success: true, 
    count, 
    errors: errors.length > 0 ? errors : undefined 
  };
}

export async function handleMigrationCSV(fd: FormData) {
  const rawCsvText = fd.get('csvText') as string;
  const csvFile = fd.get('csvFile') as File;

  let finalCsvString = '';

  if (csvFile && csvFile.size > 0) {
    finalCsvString = await csvFile.text();
  } else if (rawCsvText) {
    finalCsvString = rawCsvText;
  }

  if (!finalCsvString) return { error: 'No CSV content found.' };

  const lines = finalCsvString.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length <= 1) return { error: 'No user rows found.' };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('user_login'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('display'));
  const planIdx = headers.findIndex(h => h.includes('plan') || h.includes('membership') || h.includes('role'));
  const dateIdx = headers.findIndex(h => h.includes('start') || h.includes('date') || h.includes('registered') || h.includes('validity'));

  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    try {
      const currentLine = lines[i];
      if (!currentLine) continue;

      const cells = currentLine.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      
      const email = emailIdx !== -1 && emailIdx < cells.length ? cells[emailIdx] : null;
      if (!email || !email.includes('@')) continue;

      const name = nameIdx !== -1 && nameIdx < cells.length && cells[nameIdx] ? cells[nameIdx] : 'Imported Member';
      
      let wpPlan = (planIdx !== -1 && planIdx < cells.length && cells[planIdx] ? cells[planIdx].toUpperCase() : 'FREE');
      let finalPlan = 'FREE';
      if (wpPlan.includes('GOLD')) finalPlan = 'GOLD';
      else if (wpPlan.includes('PLATINUM')) finalPlan = 'PLATINUM';
      else if (wpPlan.includes('ABROAD') || wpPlan.includes('INTERNATIONAL')) finalPlan = 'ABROAD';
      
      let planStartedAt = new Date();
      if (dateIdx !== -1 && dateIdx < cells.length && cells[dateIdx]) {
        const parsedDate = new Date(cells[dateIdx]);
        if (!isNaN(parsedDate.getTime())) {
          planStartedAt = parsedDate;
        }
      }

      await prisma.user.upsert({
        where: { email },
        update: {
          name,
          plan: finalPlan as any,
          planInterval: 'YEARLY', 
          planStartedAt
        },
        create: {
          email,
          name,
          plan: finalPlan as any,
          planInterval: 'YEARLY',
          planStartedAt,
          coins: 0
        }
      });
      count++;
    } catch (itemError) {
      console.error("Skipping malformed row in CSV:", itemError);
    }
  }

  revalidatePath('/admin/users');
  return { success: true, count };
}
