const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

console.log('🕵️‍♂️ SCANNING FOR ORPHANED AYODHYAKANDA EPISODES...');
let matchCount = 0;

items.forEach(item => {
  if (item['wp:post_type'] === 'episodes') {
    const title = String(item.title).toLowerCase();
    const slug = String(item['wp:post_name']).toLowerCase();
    
    if (title.includes('ayodhya') || slug.includes('ayodhya')) {
      console.log(`   🎯 Found Episode ID ${item['wp:post_id']}: "${item.title}" (Slug: ${item['wp:post_name']})`);
      matchCount++;
    }
  }
});

console.log(`\n📈 Total Matches: ${matchCount} orphaned episodes.`);
