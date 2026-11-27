import { PrismaClient } from '@prisma/client';
// Refreshed Client Ingestion Marker: Dynamic Routing Cache Flush 2026-07-14

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let dbUrl = process.env.DATABASE_URL || '';
// On ECS the password is injected from Secrets Manager as separate DB_* variables
if (!dbUrl && process.env.DB_HOST && process.env.DB_PASSWORD) {
  const user = encodeURIComponent(process.env.DB_USERNAME || 'vyoma');
  const password = encodeURIComponent(process.env.DB_PASSWORD);
  dbUrl = `postgresql://${user}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'vyoma_ott'}?schema=public`;
}
// Prisma's default pool is (2 x CPUs + 1) connections, i.e. 3 on a 1-vCPU Fargate task - too few under load
if (dbUrl && process.env.DB_CONNECTION_LIMIT && !dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + `connection_limit=${process.env.DB_CONNECTION_LIMIT}&pool_timeout=20`;
}
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
