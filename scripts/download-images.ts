import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';

const prisma = new PrismaClient();

const downloadImage = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlink(dest, () => reject(new Error(`Failed to download ${url}: ${response.statusCode}`)));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function run() {
  console.log("Scanning database for external images...");
  
  const courses = await prisma.course.findMany({
    where: {
      thumbnailUrl: {
        contains: 'floralwhite-marten-419677.hostingersite.com'
      }
    }
  });

  console.log(`Found ${courses.length} courses with external images.`);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const course of courses) {
    if (!course.thumbnailUrl) continue;
    
    try {
      const fileName = path.basename(new URL(course.thumbnailUrl).pathname);
      const localPath = path.join(uploadDir, fileName);
      const publicUrl = `/uploads/courses/${fileName}`;

      console.log(`Downloading ${fileName}...`);
      await downloadImage(course.thumbnailUrl, localPath);

      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnailUrl: publicUrl }
      });
      console.log(`Updated course ${course.id} to use local image.`);
    } catch (e: any) {
      console.error(`Failed to process image for course ${course.id}:`, e.message);
    }
  }

  console.log("Image migration complete!");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
