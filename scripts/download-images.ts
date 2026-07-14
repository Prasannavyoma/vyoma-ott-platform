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
  
  // 1. Download Course Images
  const courses = await prisma.course.findMany({
    where: {
      thumbnailUrl: {
        contains: 'hostingersite.com'
      }
    }
  });

  console.log(`Found ${courses.length} courses with external images.`);

  const courseDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
  if (!fs.existsSync(courseDir)) {
    fs.mkdirSync(courseDir, { recursive: true });
  }

  for (const course of courses) {
    if (!course.thumbnailUrl) continue;
    
    try {
      const fileName = path.basename(new URL(course.thumbnailUrl).pathname);
      const localPath = path.join(courseDir, fileName);
      const publicUrl = `/uploads/courses/${fileName}`;

      console.log(`Downloading course image ${fileName}...`);
      await downloadImage(course.thumbnailUrl, localPath);

      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnailUrl: publicUrl }
      });
    } catch (e: any) {
      console.error(`Failed to process image for course ${course.id}:`, e.message);
    }
  }

  // 2. Download Episode Images
  const episodes = await prisma.episode.findMany({
    where: {
      thumbnailUrl: {
        contains: 'hostingersite.com'
      }
    }
  });

  console.log(`Found ${episodes.length} episodes with external images.`);

  const episodeDir = path.join(process.cwd(), 'public', 'uploads', 'episodes');
  if (!fs.existsSync(episodeDir)) {
    fs.mkdirSync(episodeDir, { recursive: true });
  }

  for (const episode of episodes) {
    if (!episode.thumbnailUrl) continue;
    
    try {
      const fileName = path.basename(new URL(episode.thumbnailUrl).pathname);
      const localPath = path.join(episodeDir, fileName);
      const publicUrl = `/uploads/episodes/${fileName}`;

      console.log(`Downloading episode image ${fileName}...`);
      await downloadImage(episode.thumbnailUrl, localPath);

      await prisma.episode.update({
        where: { id: episode.id },
        data: { thumbnailUrl: publicUrl }
      });
    } catch (e: any) {
      console.error(`Failed to process image for episode ${episode.id}:`, e.message);
    }
  }

  console.log("Image migration complete!");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
