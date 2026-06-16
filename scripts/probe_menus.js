const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

console.log('🧭 PROBING NAV MENUS...');

const menus = items.filter(item => item['wp:post_type'] === 'nav_menu_item');

menus.forEach(m => {
  console.log(`\n👉 MENU ITEM: "${m.title}" (ID: ${m['wp:post_id']})`);
  
  const metas = Array.isArray(m['wp:postmeta']) ? m['wp:postmeta'] : [m['wp:postmeta']];
  metas.forEach(meta => {
    const key = meta['wp:meta_key'];
    const val = meta['wp:meta_value'];
    if (key === '_menu_item_url' || key === '_menu_item_menu_item_parent' || key === '_menu_item_object_id') {
      console.log(`   🔑 ${key}: "${val}"`);
    }
  });
});
