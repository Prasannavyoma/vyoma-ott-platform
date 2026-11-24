import { PrismaClient } from '@prisma/client';
// Refreshed Client Ingestion Marker: Dynamic Routing Cache Flush 2026-07-14

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let dbUrl = process.env.DATABASE_URL || '';
// Ensure AWS RDS connections always use SSL
if (dbUrl.includes('global-bundle.pem')) {
  dbUrl = dbUrl.replace('sslmode=verify-full', 'sslmode=require').replace('&sslcert=global-bundle.pem', '').replace('?sslcert=global-bundle.pem', '');
}
if (dbUrl.includes('rds.amazonaws.com') && !dbUrl.includes('sslmode=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: { url: dbUrl }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
