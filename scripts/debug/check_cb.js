const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: ['CHATBOT_ENABLED', 'CHATBOT_MODE', 'CHATBOT_CUSTOM_EMBED_CODE'] } } });
  console.log('SETTINGS:', settings);
}
run().finally(() => prisma.$disconnect());
