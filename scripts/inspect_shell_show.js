const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

const targetShow = items.find(item => String(item['wp:post_id']) === '31377');

if (targetShow) {
  console.log(`🔍 SHOW FOUND: "${targetShow.title}"`);
  console.log(`📋 METADATA:`);
  const metas = Array.isArray(targetShow['wp:postmeta']) ? targetShow['wp:postmeta'] : [targetShow['wp:postmeta']];
  
  metas.forEach(m => {
    if (m['wp:meta_key'].includes('episodes')) {
      console.log(`   🔑 ${m['wp:meta_key']}: "${m['wp:meta_value']}"`);
    }
  });
}
