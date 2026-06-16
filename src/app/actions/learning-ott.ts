"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ==========================================
// 🎴 FLASHCARDS (LEITNER SYSTEM) ACTIONS
// ==========================================

export async function addFlashcard(word: string, definition: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const normalizedWord = word.trim();
  const normalizedDef = definition.trim();

  // Check if already exists for user
  const existing = await prisma.flashcard.findFirst({
    where: {
      userId: user.id,
      word: normalizedWord
    }
  });

  if (existing) {
    return { success: true, message: "Flashcard already exists in your deck!" };
  }

  await prisma.flashcard.create({
    data: {
      userId: user.id,
      word: normalizedWord,
      definition: normalizedDef,
      box: 1,
      nextReviewAt: new Date()
    }
  });

  revalidatePath('/profile/flashcards');
  return { success: true, message: "Flashcard added successfully!" };
}

export async function getDueFlashcards() {
  const user = await getCurrentUser();
  if (!user) return [];

  return await prisma.flashcard.findMany({
    where: {
      userId: user.id,
      nextReviewAt: {
        lte: new Date()
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

export async function getAllFlashcards() {
  const user = await getCurrentUser();
  if (!user) return [];

  return await prisma.flashcard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function reviewFlashcard(cardId: string, remembered: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const card = await prisma.flashcard.findUnique({
    where: { id: cardId }
  });

  if (!card || card.userId !== user.id) {
    throw new Error("Card not found");
  }

  let nextBox = card.box;
  if (remembered) {
    nextBox = Math.min(5, card.box + 1);
  } else {
    nextBox = 1; // Reset on failure
  }

  // Leitner Interval Math: Box 1 = 1 day, Box 2 = 3 days, Box 3 = 7 days, Box 4 = 14 days, Box 5 = 30 days
  const intervals = [1, 3, 7, 14, 30];
  const daysToAdd = intervals[nextBox - 1];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

  await prisma.flashcard.update({
    where: { id: cardId },
    data: {
      box: nextBox,
      nextReviewAt: nextReviewDate
    }
  });

  revalidatePath('/profile/flashcards');
  return { success: true, nextBox };
}

// ==========================================
// 👥 STUDY ROOMS (CO-WATCHING) ACTIONS
// ==========================================

export async function createStudyRoom(courseId: string, episodeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const room = await prisma.studyRoom.create({
    data: {
      hostId: user.id,
      courseId,
      episodeId,
      isPlaying: false,
      position: 0
    }
  });

  return { success: true, roomId: room.id };
}

export async function getStudyRoom(roomId: string) {
  const room = await prisma.studyRoom.findUnique({
    where: { id: roomId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50
      }
    }
  });
  return room;
}

export async function pollStudyRoom(roomId: string) {
  const room = await prisma.studyRoom.findUnique({
    where: { id: roomId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!room) return null;

  // Reverse messages to show chronological order
  const orderedMessages = [...room.messages].reverse();

  return {
    roomId: room.id,
    hostId: room.hostId,
    isPlaying: room.isPlaying,
    position: room.position,
    episodeId: room.episodeId,
    lastUpdateAt: room.lastUpdateAt,
    messages: orderedMessages
  };
}

export async function updateStudyRoomState(roomId: string, isPlaying: boolean, position: number, episodeId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const room = await prisma.studyRoom.findUnique({
    where: { id: roomId }
  });

  if (!room) throw new Error("Room not found");

  // Only the host can dictate play/pause state synchronization
  if (room.hostId !== user.id) {
    return { success: false, error: "Only the host can control media synchronization." };
  }

  const updateData: any = {
    isPlaying,
    position: Math.round(position),
    lastUpdateAt: new Date()
  };

  if (episodeId) {
    updateData.episodeId = episodeId;
  }

  await prisma.studyRoom.update({
    where: { id: roomId },
    data: updateData
  });

  return { success: true };
}

export async function sendStudyRoomMessage(roomId: string, text: string, senderId?: string, senderName?: string) {
  let finalUserId = "";
  let finalUserName = "";

  const user = await getCurrentUser();
  if (user) {
    finalUserId = user.id;
    finalUserName = user.name || user.email.split('@')[0] || "Student";
  } else if (senderId && senderId.startsWith('guest-')) {
    // Find or create a system Guest user to satisfy the foreign key constraint
    let guestUser = await prisma.user.findUnique({
      where: { id: 'guest-system-id' }
    });
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          id: 'guest-system-id',
          email: 'guest@vyoma-ott.org',
          name: 'System Guest',
          role: 'USER',
          plan: 'FREE'
        }
      });
    }
    finalUserId = guestUser.id;
    finalUserName = senderName || "Guest";
  } else {
    throw new Error("Unauthorized");
  }

  await prisma.studyRoomMessage.create({
    data: {
      roomId,
      userId: finalUserId,
      userName: finalUserName,
      text: text.trim()
    }
  });

  return { success: true };
}

export async function getClientUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan
  };
}
