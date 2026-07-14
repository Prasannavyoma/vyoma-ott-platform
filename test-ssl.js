const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:June0612@vyoma-ott-db.cilwzpnwpl5x.us-east-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=require'
    }
  }
});
prisma.user.count().then(console.log).catch(console.error).finally(() => process.exit(0));
