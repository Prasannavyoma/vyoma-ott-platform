import { PrismaClient } from '@prisma/client';
// Refreshed Client Ingestion Marker: Dynamic Routing Cache Flush 2026-07-14

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let dbUrl = process.env.DATABASE_URL || '';
// Vercel strips the .pem file during build. AWS RDS native SSL is trusted by Node automatically,
// so we forcefully overwrite the connection string to use sslmode=require and drop the missing file.
if (dbUrl.includes('global-bundle.pem')) {
  dbUrl = dbUrl.replace('sslmode=verify-full', 'sslmode=require').replace('&sslcert=global-bundle.pem', '').replace('?sslcert=global-bundle.pem', '');
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    dbUrl
      ? {
          log: ['error', 'warn'],
          datasources: {
            db: { url: dbUrl }
          }
        }
      : {
          log: ['error', 'warn']
        }
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
