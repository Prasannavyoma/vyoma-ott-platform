const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function run() {
  console.log("🔍 AUDITING NAVIGATION MENUS...");
  try {
    const menus = await prisma.navigationMenu.findMany({
      where: { parentId: null },
      include: { children: true }
    });
    console.log("📊 Current Menus in Database:", JSON.stringify(menus, null, 2));
    
    if (menus.length === 0) {
      console.log("⚠️ Navigation table is EMPTY! Let's provision a gorgeous set of dynamic Hotstar-style nested menus!");
      
      // 1. Free Content
      const m1 = await prisma.navigationMenu.create({
        data: { label: "Free Content", url: "/genre/Free", order: 1 }
      });
      await prisma.navigationMenu.createMany({
        data: [
          { label: "Sanskrit Audiobooks", url: "/genre/Audiobook", order: 1, parentId: m1.id },
          { label: "Kids Academy", url: "/genre/Kids", order: 2, parentId: m1.id },
          { label: "Fun & Games", url: "/genre/Game", order: 3, parentId: m1.id },
        ]
      });

      // 2. Premium Vault
      const m2 = await prisma.navigationMenu.create({
        data: { label: "Premium Shelf", url: "/subscribe", order: 2 }
      });
      await prisma.navigationMenu.createMany({
        data: [
          { label: "👑 Gold Courses", url: "/genre/Gold", order: 1, parentId: m2.id },
          { label: "💎 Platinum Exclusives", url: "/genre/Platinum", order: 2, parentId: m2.id },
          { label: "🔥 Vyoma Originals", url: "/genre/Vyoma-Originals", order: 3, parentId: m2.id },
        ]
      });

      // 3. Simple link: Pricing
      await prisma.navigationMenu.create({
        data: { label: "Pricing Plans", url: "/subscribe", order: 3 }
      });

      console.log("✅ Dynamic Menus SEEDED Successfully!");
    }
  } catch (e) {
    console.error("❌ Audit Error:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
