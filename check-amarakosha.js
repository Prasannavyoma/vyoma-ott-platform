const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCourse() {
  const course = await prisma.course.findFirst({
    where: { title: { contains: 'Amarakosha' } },
    include: { episodes: true }
  });

  if (!course) {
    console.log("Course not found!");
    return;
  }

  console.log(`Course: ${course.title}`);
  console.log(`Type: ${course.contentType}`);
  console.log(`Episodes count: ${course.episodes.length}`);
  if (course.episodes.length > 0) {
    console.log("Sample episode 1:", course.episodes[0]);
  }
}

checkCourse().then(() => prisma.$disconnect());
