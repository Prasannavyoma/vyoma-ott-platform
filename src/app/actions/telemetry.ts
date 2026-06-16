"use server";

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * Logs a telemetry event to the database.
 * @param eventType Type of event (e.g. PAGE_VIEW, BANNER_CLICK)
 * @param sourceId Identifier of the source element
 * @param metadata Optional metadata object (will be stringified)
 */
export async function logTelemetryEvent(eventType: string, sourceId: string, metadata?: Record<string, any>) {
  try {
    const user = await getCurrentUser();
    
    await prisma.telemetryEvent.create({
      data: {
        eventType,
        sourceId,
        userId: user?.id,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to log telemetry event:", error);
    return { success: false };
  }
}

/**
 * Retrieves aggregate telemetry stats for the admin dashboard.
 */
export async function getTelemetryStats() {
  try {
    const totalEvents = await prisma.telemetryEvent.count();
    
    // Group by eventType
    const byTypeRaw = await prisma.telemetryEvent.groupBy({
      by: ['eventType'],
      _count: {
        _all: true,
      },
    });
    
    const byType = byTypeRaw.map(item => ({
      type: item.eventType,
      count: item._count._all
    }));

    // Top Banners
    const topBannersRaw = await prisma.telemetryEvent.groupBy({
      by: ['sourceId'],
      where: { eventType: 'BANNER_CLICK' },
      _count: { _all: true },
      orderBy: { _count: { sourceId: 'desc' } },
      take: 10
    });
    const topBanners = topBannersRaw.map(item => ({
      sourceId: item.sourceId,
      count: item._count._all
    }));

    // Recent events
    const recentEvents = await prisma.telemetryEvent.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, totalEvents, byType, topBanners, recentEvents };
  } catch (error) {
    console.error("Failed to fetch telemetry stats:", error);
    return { success: false, totalEvents: 0, byType: [], topBanners: [], recentEvents: [] };
  }
}
