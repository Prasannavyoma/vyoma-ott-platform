const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);
const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

console.log('🔍 SCANNING FOR GENRE DROPDOWN CHILDREN...');

const genreId = '20420';
let foundCount = 0;

items.forEach(item => {
  if (item['wp:post_type'] === 'nav_menu_item') {
    let parentId = '0';
    const metas = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
    metas.forEach(m => {
      if (m['wp:meta_key'] === '_menu_item_menu_item_parent') parentId = String(m['wp:meta_value']);
    });

    if (parentId === genreId) {
       console.log(`   👉 Found child under Genre: "${item.title}" (ID: ${item['wp:post_id']})`);
       foundCount++;
    }
  }
});

if (foundCount === 0) {
  console.log('❌ No explicit children found pointing directly to Menu ID 20420 in XML.');
}
