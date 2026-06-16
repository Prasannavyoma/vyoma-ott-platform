const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎬 SETTING UP HERO SLIDER SELECTIONS...\n');
  
  // Reset current featured flags
  await prisma.course.updateMany({ data: { featuredInSlider: false } });

  // Fetch more records across types
  const courses = await prisma.course.findMany({ take: 1000 });
  
  // Shuffle courses randomly
  const shuffled = courses.sort(() => Math.random() - 0.5);

  // Identify targets dynamically
  const titlesToFeature = [
    'Balakanda',
    'Ayodhya',
    'Bhava',
    'Kids',
    'Chants',
    'Flipbook',
    'Devotion',
    'Raghuvamsa'
  ];

  let count = 0;
  for (const c of shuffled) {
    const shouldFeature = titlesToFeature.some(t => c.title.toLowerCase().includes(t.toLowerCase()));
    if (shouldFeature && count < 6) {
      await prisma.course.update({
        where: { id: c.id },
        data: { featuredInSlider: true }
      });
      console.log(`✅ Added to Hero Slider: "${c.title}"`);
      count++;
    }
  }
  
  if (count < 5) {
     // Pad to ensure at least 5
     for (const c of shuffled) {
       if (count >= 6) break;
       // Check if not already featured
       const fresh = await prisma.course.findUnique({ where: { id: c.id } });
       if (!fresh?.featuredInSlider) {
         await prisma.course.update({
           where: { id: c.id },
           data: { featuredInSlider: true }
         });
         console.log(`✅ Added to Hero Slider (Padding): "${c.title}"`);
         count++;
       }
     }
  }
  
  if (count === 0 && courses.length > 0) {
     // Fallback to first 5
     for(let i=0; i<Math.min(5, courses.length); i++) {
        await prisma.course.update({
           where: { id: courses[i].id },
           data: { featuredInSlider: true }
        });
        console.log(`✅ Added to Hero Slider (Fallback): "${courses[i].title}"`);
     }
  }

  console.log('\n🎉 HERO SLIDER POPULATED SUCCESSFULLY!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
