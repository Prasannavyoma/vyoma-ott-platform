"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCourse(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;
  const category = formData.get('category') as string;
  const contentType = formData.get('contentType') as string || 'VIDEO';
  const accessLevel = formData.get('accessLevel') as string;
  const videoUrl = formData.get('videoUrl') as string;
  const priceInput = formData.get('price') as string;
  const price = priceInput ? parseFloat(priceInput) : null;
  const priceUSDInput = formData.get('priceUSD') as string;
  const priceUSD = priceUSDInput ? parseFloat(priceUSDInput) : null;
  const featuredInSlider = formData.get('featuredInSlider') === 'on';
  const showRibbon = formData.get('showRibbon') === 'on';
  const hasFreeTrial = formData.get('hasFreeTrial') === 'on';
  const seoKeywords = formData.get('seoKeywords') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;
  const imageAlt = formData.get('imageAlt') as string;

  // Create the Course in the SQLite database
  const course = await prisma.course.create({
    data: {
      title,
      description,
      thumbnailUrl,
      category,
      contentType,
      accessLevel,
      price,
      priceUSD,
      featuredInSlider,
      showRibbon,
      hasFreeTrial,
      seoKeywords,
      metaTitle,
      metaDescription,
      imageAlt
    } as any,
  });

  // Immediately create a default "main episode" attached to this content, containing the video URL
  if (videoUrl) {
    await prisma.episode.create({
      data: {
        title: "Main Video",
        courseId: course.id,
        videoUrl,
        order: 1,
      },
    });
  }

  // 💬 WhatsApp Bulk Automation Dispatch (Background Task)
  (async () => {
    try {
      const { sendWhatsAppMessage, getWhatsAppSettings } = await import('@/lib/whatsapp');
      const settings = await getWhatsAppSettings();
      if (settings.enabled && settings.templates.newCourse) {
         const users = await prisma.user.findMany({
           where: { phone: { not: null } }
         });
         
         // Dispatch non-blocking
         for (const u of users) {
           if (u.phone) {
             sendWhatsAppMessage(u.phone, settings.templates.newCourse, 'en_US', [
               { type: "text", text: u.name || 'Student' },
               { type: "text", text: course.title }
             ]).catch(console.error);
           }
         }
      }
    } catch (e) {
      console.error('[WhatsApp Bulk Failed]', e);
    }
  })();

  revalidatePath('/admin/courses');
  return { success: true, courseId: course.id };
}

export async function deleteCourse(courseId: string) {
  // Manually wipe all child nodes securely to bypass SQLite foreign key constraint quirks!
  try {
    // 1. Clear Sticky Notes
    await prisma.userNote.deleteMany({ where: { courseId } });
    
    // 2. Clear Reviews
    await prisma.review.deleteMany({ where: { courseId } });

    // 3. Clear Certificates
    await prisma.certificate.deleteMany({ where: { courseId } });

    // 4. Clear Individual Course Purchases
    await prisma.purchase.deleteMany({ where: { courseId } });

    // 5. Clear Quizzes and dependent questions/results
    const courseQuizzes = await prisma.quiz.findMany({ where: { courseId } });
    for (const quiz of courseQuizzes) {
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
      await prisma.quizResult.deleteMany({ where: { quizId: quiz.id } });
    }
    await prisma.quiz.deleteMany({ where: { courseId } });

    // 6. Clear Episodes and their telemetry Progress records
    const courseEpisodes = await prisma.episode.findMany({ where: { courseId } });
    for (const ep of courseEpisodes) {
      await prisma.progress.deleteMany({ where: { episodeId: ep.id } });
    }
    await prisma.episode.deleteMany({ where: { courseId } });

    // 7. Absolute final wipe of the Course root node itself
    await prisma.course.delete({
      where: { id: courseId }
    });
  } catch (err) {
    console.error("Manual relational cleanup failed, trying direct delete:", err);
    // Fallback
    await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
  }

  revalidatePath('/admin/courses');
}

export async function handleDeleteCourse(formData: FormData) {
  const id = formData.get('courseId') as string;
  if (!id) return;
  await deleteCourse(id);
}

export async function bulkCreateCourses(coursesData: any[]) {
  try {
    for (const item of coursesData) {
      const course = await prisma.course.create({
        data: {
          title: item.title || 'Untitled Imported',
          description: item.description || '',
          thumbnailUrl: item.thumbnailUrl || '',
          category: item.category || 'Imported',
          accessLevel: item.accessLevel || 'FREE',
          price: parseFloat(item.price) || 0,
          priceUSD: parseFloat(item.priceUSD) || 0
        }
      });
      
      if (item.videoUrl) {
        await prisma.episode.create({
          data: {
            title: "Main Video",
            courseId: course.id,
            videoUrl: item.videoUrl,
            order: 1
          }
        });
      }
    }
    revalidatePath('/admin/courses');
    return { success: true, count: coursesData.length };
  } catch (err: any) {
    console.error('Bulk upload failed:', err);
    return { success: false, error: err.message };
  }
}

function parseCSVLine(line: string): string[] {
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

export async function bulkUploadQuizCSV(episodeId: string, formData: FormData) {
  const csvFile = formData.get('csvFile') as File;
  if (!csvFile || csvFile.size === 0) {
    return { error: 'Please upload a valid CSV file.' };
  }

  try {
    const rawCsvText = await csvFile.text();
    const lines = rawCsvText.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return { error: 'CSV file must contain a header row and at least one quiz marker row.' };
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('sec'));
    const questionIdx = headers.findIndex(h => h.includes('quest') || h.includes('q'));
    const optAIdx = headers.findIndex(h => h.includes('optiona') || h === 'a' || h === 'opt_a' || h === 'opta');
    const optBIdx = headers.findIndex(h => h.includes('optionb') || h === 'b' || h === 'opt_b' || h === 'optb');
    const optCIdx = headers.findIndex(h => h.includes('optionc') || h === 'c' || h === 'opt_c' || h === 'optc');
    const optDIdx = headers.findIndex(h => h.includes('optiond') || h === 'd' || h === 'opt_d' || h === 'optd');
    const correctIdx = headers.findIndex(h => h.includes('correct') || h.includes('ans'));

    if (timeIdx === -1 || questionIdx === -1 || optAIdx === -1 || optBIdx === -1 || optCIdx === -1 || optDIdx === -1 || correctIdx === -1) {
      return { error: 'CSV headers must contain: Timestamp_Seconds, Question, OptionA, OptionB, OptionC, OptionD, CorrectOption' };
    }

    let count = 0;
    const markersToCreate = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 7) continue;

      const timestamp = parseInt(cells[timeIdx], 10);
      if (isNaN(timestamp)) continue;

      const question = cells[questionIdx];
      const optA = cells[optAIdx];
      const optB = cells[optBIdx];
      const optC = cells[optCIdx];
      const optD = cells[optDIdx];
      const correctRaw = cells[correctIdx];

      if (!question || !optA || !optB || !optC || !optD || !correctRaw) continue;

      let correctAnswer = correctRaw;
      const lowerCorrect = correctRaw.toLowerCase().trim();
      if (lowerCorrect === 'a' || lowerCorrect === 'optiona') correctAnswer = optA;
      else if (lowerCorrect === 'b' || lowerCorrect === 'optionb') correctAnswer = optB;
      else if (lowerCorrect === 'c' || lowerCorrect === 'optionc') correctAnswer = optC;
      else if (lowerCorrect === 'd' || lowerCorrect === 'optiond') correctAnswer = optD;

      const payloadObj = {
        question,
        options: [optA, optB, optC, optD],
        correctAnswer
      };

      markersToCreate.push({
        episodeId,
        timestamp,
        type: 'QUIZ_PROMPT',
        payload: JSON.stringify(payloadObj)
      });
    }

    if (markersToCreate.length === 0) {
      return { error: 'No valid quiz marker rows were parsed.' };
    }

    // Delete existing QUIZ_PROMPT markers for this episode
    await prisma.videoMarker.deleteMany({
      where: {
        episodeId,
        type: 'QUIZ_PROMPT'
      }
    });

    // Create the new markers
    for (const marker of markersToCreate) {
      await prisma.videoMarker.create({
        data: marker
      });
    }

    revalidatePath(`/admin/courses`);
    return { success: true, count: markersToCreate.length };
  } catch (err: any) {
    console.error('Quiz bulk upload failed:', err);
    return { error: err.message || 'Failed to parse/upload quiz CSV.' };
  }
}

export async function broadcastNewCourse(courseId: string) {
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return { error: "Course not found" };

    const users = await prisma.user.findMany({ select: { id: true } });
    
    // We use a loop instead of createMany to ensure compatibility with both SQLite (local) and PostgreSQL (AWS RDS)
    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "New Course Launched! 🎉",
          message: `We just launched "${course.title}". Click here to check it out!`,
          type: "INFO",
          linkUrl: `/watch/${course.id}`,
          read: false
        }
      });
    }

    return { success: true, count: users.length };
  } catch (err: any) {
    console.error("Broadcast failed:", err);
    return { error: "Failed to broadcast notification." };
  }
}
