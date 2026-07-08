import { PrismaClient } from '@prisma/client';
// Refreshed Client Ingestion Marker: Dynamic Routing Cache Flush

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let dbUrl = process.env.DATABASE_URL || '';
// Vercel strips the .pem file during build. AWS RDS native SSL is trusted by Node automatically,
// so we forcefully overwrite the connection string to use sslmode=require and drop the missing file.
if (dbUrl.includes('global-bundle.pem')) {
  dbUrl = dbUrl.replace('sslmode=verify-full', 'sslmode=require').replace('&sslcert=global-bundle.pem', '').replace('?sslcert=global-bundle.pem', '');
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
