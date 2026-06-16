const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

const target = items.find(item => item['wp:post_name'] && item['wp:post_name'].includes('e_book'));

if (target) {
  console.log(`📖 FOUND EBOOK POST: "${target.title}"`);
  console.log(`📝 CONTENT ENCODED:`);
  console.log(target['content:encoded'] ? target['content:encoded'].substring(0, 500) : 'EMPTY');
  console.log(`📋 METADATA KEYS & VALUES:`);
  const metas = Array.isArray(target['wp:postmeta']) ? target['wp:postmeta'] : [target['wp:postmeta']];
  metas.forEach(m => {
    console.log(`   🔑 ${m['wp:meta_key']}: "${m['wp:meta_value']}"`);
  });
} else {
  console.log('❌ Ebook post not found in XML.');
}
