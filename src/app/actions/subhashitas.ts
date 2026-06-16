'use server';

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helper to ensure user has super admin privileges
 */
async function checkSuperAdminAccess() {
  const user = await getCurrentUser();
  const ACCEPTED_ROLES = ['SUPER_ADMIN', 'ADMIN'];
  if (!user || !ACCEPTED_ROLES.includes(user.role)) {
    throw new Error('Forbidden: Admin access required.');
  }
  return user;
}

/**
 * Fetches all database-backed Subhashitas
 */
export async function getAllSubhashitas() {
  await checkSuperAdminAccess();

  try {
    const subhashitas = await prisma.subhashita.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return subhashitas;
  } catch (error: any) {
    console.error('Failed to fetch subhashitas:', error);
    throw new Error(error.message || 'Failed to fetch subhashitas');
  }
}

/**
 * Deletes a Subhashita from the database
 */
export async function deleteSubhashita(id: string) {
  await checkSuperAdminAccess();

  try {
    await prisma.subhashita.delete({
      where: { id }
    });
    revalidatePath('/');
    revalidatePath('/admin/sanskrit-settings/subhashitas');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete subhashita:', error);
    return { success: false, error: error.message || 'Failed to delete subhashita' };
  }
}

/**
 * Creates a single Subhashita manually
 */
export async function createSubhashita(data: {
  sanskrit: string;
  transliteration: string;
  translation: string;
  source: string;
  words: { word: string; meaning: string }[];
}) {
  await checkSuperAdminAccess();

  try {
    await prisma.subhashita.create({
      data: {
        sanskrit: data.sanskrit.trim(),
        transliteration: data.transliteration.trim(),
        translation: data.translation.trim(),
        source: data.source.trim() || 'Unknown',
        wordsJson: JSON.stringify(data.words.filter(w => w.word.trim()))
      }
    });
    revalidatePath('/');
    revalidatePath('/admin/sanskrit-settings/subhashitas');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create subhashita:', error);
    return { success: false, error: error.message || 'Failed to create subhashita' };
  }
}

/**
 * Dynamic calculation to get the Daily Subhashita
 * Maps calendar day of the month (1-31) to database size
 */
export async function getSubhashitaOfTheDay() {
  try {
    const count = await prisma.subhashita.count();
    if (count === 0) {
      return null;
    }
    const day = new Date().getDate(); // 1 to 31
    const index = day % count;
    const items = await prisma.subhashita.findMany({
      orderBy: { createdAt: 'asc' },
      skip: index,
      take: 1
    });
    return items[0] || null;
  } catch (error) {
    console.error('Failed to calculate Subhashita of the Day:', error);
    return null;
  }
}

/**
 * Bulk uploader action parsing a CSV text or file
 */
export async function uploadSubhashitasCSV(fd: FormData) {
  await checkSuperAdminAccess();

  try {
    const csvFile = fd.get('csvFile') as File;
    const csvText = fd.get('csvText') as string;

    let finalCsvString = '';
    if (csvFile && csvFile.size > 0) {
      finalCsvString = await csvFile.text();
    } else if (csvText) {
      finalCsvString = csvText;
    }

    if (!finalCsvString) {
      return { error: 'Please upload a CSV file or paste CSV content.' };
    }

    // Split lines cleanly
    const lines = finalCsvString.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return { error: 'CSV file must contain a header row and at least one Sloka record.' };
    }

    // Helper to parse CSV lines respecting quotes
    function parseCsvLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(cell => cell.replace(/^["']|["']$/g, '').trim());
    }

    // Parse headers
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    
    const sanskritIdx = headers.findIndex(h => h.includes('sanskrit') || h.includes('sloka') || h.includes('shloka') || h.includes('verse'));
    const translitIdx = headers.findIndex(h => h.includes('transliteration') || h.includes('english sanskrit') || h.includes('translit'));
    const translationIdx = headers.findIndex(h => h.includes('translation') || h.includes('meaning') || h.includes('english translation'));
    const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('origin') || h.includes('book'));
    const wordsIdx = headers.findIndex(h => h.includes('words') || h.includes('splits') || h.includes('vocabulary'));

    if (sanskritIdx === -1) {
      return { error: 'CSV must contain a "sanskrit" or "sloka" column.' };
    }
    if (translitIdx === -1) {
      return { error: 'CSV must contain a "transliteration" column.' };
    }
    if (translationIdx === -1) {
      return { error: 'CSV must contain a "translation" or "meaning" column.' };
    }

    let count = 0;
    let errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const currentLine = lines[i];
        if (!currentLine) continue;

        const cells = parseCsvLine(currentLine);
        if (cells.length < 3) continue; // Skip incomplete lines

        const sanskrit = cells[sanskritIdx];
        const transliteration = cells[translitIdx];
        const translation = cells[translationIdx];
        
        if (!sanskrit || !transliteration || !translation) {
          errors.push(`Row ${i + 1}: Missing sanskrit, transliteration, or translation.`);
          continue;
        }

        const source = sourceIdx !== -1 && sourceIdx < cells.length && cells[sourceIdx] ? cells[sourceIdx] : 'Unknown';
        const wordsCell = wordsIdx !== -1 && wordsIdx < cells.length ? cells[wordsIdx] : '';

        // Parse word splits (e.g., word:meaning;word2:meaning2)
        let wordsJsonArray: { word: string; meaning: string }[] = [];
        if (wordsCell) {
          wordsJsonArray = wordsCell.split(';').map(w => {
            const splitIdx = w.indexOf(':');
            if (splitIdx === -1) {
              return { word: w.trim(), meaning: '' };
            }
            const word = w.substring(0, splitIdx).trim();
            const meaning = w.substring(splitIdx + 1).trim();
            return { word, meaning };
          }).filter(w => w.word);
        }

        await prisma.subhashita.create({
          data: {
            sanskrit: sanskrit.replace(/\\n/g, '\n'), // Replace escaped newlines from CSV
            transliteration: transliteration.replace(/\\n/g, '\n'),
            translation,
            source,
            wordsJson: JSON.stringify(wordsJsonArray)
          }
        });
        count++;
      } catch (err: any) {
        console.error(`Error parsing row ${i + 1}:`, err);
        errors.push(`Row ${i + 1}: Failed to process record (${err.message || 'unknown error'})`);
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/sanskrit-settings/subhashitas');
    return { 
      success: true, 
      count, 
      errors: errors.length > 0 ? errors : undefined 
    };
  } catch (error: any) {
    console.error('Bulk upload failed:', error);
    return { error: error.message || 'Failed to process bulk upload' };
  }
}
