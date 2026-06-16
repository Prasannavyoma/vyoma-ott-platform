const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function run() {
  console.log("🚀 STARTING NOTE PERSISTENCE DIAGNOSTICS...");
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error("❌ NO USERS found in DB! Note saving will fail because guest accounts are not supported.");
      return;
    }
    console.log(`✅ Found Test User: ${user.email} (ID: ${user.id})`);

    const course = await prisma.course.findFirst();
    if (!course) {
      console.error("❌ NO COURSES found in DB!");
      return;
    }
    console.log(`✅ Found Test Course: ${course.title} (ID: ${course.id})`);

    console.log("🔄 Executing Mock Upsert Command...");
    const saved = await prisma.userNote.upsert({
      where: { 
        userId_courseId: { userId: user.id, courseId: course.id } 
      },
      update: { content: "GEMINI DIAGNOSTIC REPRO: " + new Date().toISOString() },
      create: { 
        userId: user.id, 
        courseId: course.id, 
        content: "GEMINI DIAGNOSTIC INITIAL" 
      }
    });

    console.log("🎉 UPSERT SUCCESSFUL! DB Entry Created/Updated:", saved.id);
    console.log("Content saved:", saved.content);

    // Attempt a direct readback
    const verified = await prisma.userNote.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } }
    });
    console.log("🧐 READBACK VERIFIED:", verified ? "YES" : "NO", "Length:", verified?.content?.length);

  } catch (e) {
    console.error("⚠️ CRITICAL DATABASE REPRODUCTION FAILURE! Details below:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
