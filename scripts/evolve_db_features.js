const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function run() {
  console.log("🚀 STARTING PREMIUM DB EVOLUTION (Safe SQL Execution)...");
  try {
    // 1. Create WatchlistItem table if not exists
    console.log("🔹 Creating WatchlistItem Table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS WatchlistItem (
        userId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId, courseId)
      )
    `);
    console.log("✅ WatchlistItem table READY.");

    // 2. Create CourseLike table if not exists
    console.log("🔹 Creating CourseLike Table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS CourseLike (
        userId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        isLike INTEGER DEFAULT 1, -- 1 for Like, 0 for Dislike
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId, courseId)
      )
    `);
    console.log("✅ CourseLike table READY.");
    
    console.log("✨ All database evolutions COMPLETED SUCCESSFULLY.");
  } catch (e) {
    console.error("❌ Failed Evolving Database:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
