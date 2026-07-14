const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('OLD wordpress.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const postTypes = new Set();
  
  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `wp_posts` VALUES ')) {
      // Very hacky split by ',' but good enough for a rough idea
      const parts = line.split("','");
      // Find where the post_type usually is (around index 20)
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'post' || parts[i] === 'page' || parts[i] === 'sfwd-courses' || parts[i] === 'product' || parts[i] === 'attachment' || parts[i] === 'nav_menu_item' || parts[i] === 'revision' || parts[i] === 'e-books' || parts[i] === 'podcast') {
           postTypes.add(parts[i]);
        }
      }
    }
  }

  console.log('Found post types:', Array.from(postTypes));
}

processLineByLine();
