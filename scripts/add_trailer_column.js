const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function run() {
  console.log("🚀 RUNNING SAFE SQL DATABASE ALTERATION...");
  try {
    // Direct non-destructive alter
    await prisma.$executeRawUnsafe(`ALTER TABLE Course ADD COLUMN trailerUrl TEXT`);
    console.log("✅ Column 'trailerUrl' successfully ADDED to Course table in SQLite!");
  } catch (e) {
    if (e.message.includes("duplicate column") || e.message.includes("already exists")) {
      console.log("ℹ️ Column 'trailerUrl' already exists. Skipping.");
    } else {
      console.error("⚠️ Unexpected SQL Error:", e.message || e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
