// Database & API Schema Integrity Check
const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function runCheck() {
  console.log('🏁 Starting Database & API Schema Integrity Check...');
  const results = [];
  
  // Helper to time a query
  async function testQuery(name, queryFn) {
    const start = performance.now();
    try {
      const data = await queryFn();
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      results.push({ name, status: 'PASSED', duration: `${duration}ms`, details: `Returned ${Array.isArray(data) ? data.length : '1'} items` });
      console.log(`✅ [${name}] PASSED in ${duration}ms`);
    } catch (err) {
      results.push({ name, status: 'FAILED', duration: 'N/A', details: err.message });
      console.error(`❌ [${name}] FAILED: ${err.message}`);
    }
  }

  // 1. Connection test
  await testQuery('Database Connection', () => prisma.$queryRaw`SELECT 1`);

  // 2. Fetch Users
  await testQuery('Fetch Users (User Model)', () => prisma.user.findMany({ take: 5 }));

  // 3. Fetch Courses
  await testQuery('Fetch Courses (Course Model)', () => prisma.course.findMany({ take: 5 }));

  // 4. Fetch Sponsors
  await testQuery('Fetch Sponsors (Sponsor Model)', () => prisma.sponsor.findMany({ take: 5 }));

  // 5. Fetch Settings
  await testQuery('Fetch System Settings', () => prisma.systemSetting.findMany());

  // 6. Fetch Progress records
  await testQuery('Fetch Progress', () => prisma.progress.findMany({ take: 5 }));

  console.log('\n📊 Integrity Check Results Summary:');
  console.table(results);

  await prisma.$disconnect();
  const hasFailed = results.some(r => r.status === 'FAILED');
  if (hasFailed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCheck();
