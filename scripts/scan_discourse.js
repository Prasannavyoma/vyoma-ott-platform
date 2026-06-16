const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

console.log('🕵️‍♂️ SCANNING ALL RAMAYANA EPISODES...');

const ramayanaEps = [];
items.forEach(item => {
  if (item['wp:post_type'] === 'episodes') {
    const slug = String(item['wp:post_name']).toLowerCase();
    const title = String(item.title).toLowerCase();
    if (slug.includes('upanyasa') || slug.includes('sarga') || title.includes('sarga')) {
      ramayanaEps.push({
        id: item['wp:post_id'],
        title: item.title,
        slug: item['wp:post_name']
      });
    }
  }
});

// Sort by ID or slug to see the sequence
ramayanaEps.sort((a, b) => parseInt(a.id) - parseInt(b.id));

console.log(`📦 Total Ramayana Episodes found: ${ramayanaEps.length}`);
ramayanaEps.forEach(ep => {
  console.log(`   [ID: ${ep.id}] "${ep.title}" (${ep.slug})`);
});
