const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

console.log('🕵️‍♂️ SCANNING WP_ID RANGE (32418 TO 32600) FOR AYODHYA EPISODES...');

const matched = [];
items.forEach(item => {
  if (item['wp:post_type'] === 'episodes') {
    const id = parseInt(item['wp:post_id']);
    if (id >= 32418 && id <= 32600) {
      matched.push({
        id: id,
        title: item.title,
        slug: item['wp:post_name']
      });
    }
  }
});

matched.sort((a, b) => a.id - b.id);

console.log(`📦 Total Episodes in Range: ${matched.length}`);
matched.forEach(m => {
  console.log(`   [ID: ${m.id}] "${m.title}" (Slug: ${m.slug})`);
});
