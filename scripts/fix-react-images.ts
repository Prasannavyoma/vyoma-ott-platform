import fs from 'fs';
import path from 'path';
import https from 'https';

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

const assets = [
  { name: 'logo-200-x-70-px.png', url: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png' },
  { name: 'Ayodhyakanda.jpg', url: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg' },
  { name: 'Balakanda.jpg', url: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg' },
  { name: 'Bala-new.jpg', url: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg' },
  { name: 'May-Images-2.jpg', url: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/04/May-Images-2.jpg' }
];

const replacers = [
  { old: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png", new: "/assets/logo-200-x-70-px.png" },
  { old: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg", new: "/assets/Ayodhyakanda.jpg" },
  { old: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg", new: "/assets/Balakanda.jpg" },
  { old: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg", new: "/assets/Bala-new.jpg" },
  { old: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/04/May-Images-2.jpg", new: "/assets/May-Images-2.jpg" },
  { old: "https://palevioletred-albatross-358324.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png", new: "/assets/logo-200-x-70-px.png" }
];

async function replaceInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rep of replacers) {
        if (content.includes(rep.old)) {
          content = content.split(rep.old).join(rep.new);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

async function run() {
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  for (const asset of assets) {
    const dest = path.join(assetsDir, asset.name);
    console.log('Downloading', asset.name);
    await downloadFile(asset.url, dest);
  }

  console.log('Replacing strings in src...');
  await replaceInDir(path.join(process.cwd(), 'src'));
  console.log('Done!');
}

run().catch(console.error);
