import { PrismaClient } from '@prisma/client';
// Refreshed Client Ingestion Marker: Dynamic Routing Cache Flush

let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.includes("connect_timeout")) {
  dbUrl += (dbUrl.includes("?") ? "&" : "?") + "connect_timeout=2";
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
