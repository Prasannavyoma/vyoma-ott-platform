const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

const target = items.find(item => item['wp:post_name'] === 'english-discourse-on-ayodhyakanda-of-srimad-valmiki-ramayana');

if (target) {
  console.log(`🔍 FOUND AYODHYAKANDA: "${target.title}"`);
  console.log('📋 POSTMETA FIELDS:');
  const metas = Array.isArray(target['wp:postmeta']) ? target['wp:postmeta'] : [target['wp:postmeta']];
  
  metas.forEach(m => {
    if (m['wp:meta_key'].includes('episode') || m['wp:meta_key'].includes('season')) {
      console.log(`   🔑 ${m['wp:meta_key']}: "${m['wp:meta_value']}"`);
    }
  });
} else {
  console.log('❌ Target Ayodhyakanda course not found in XML.');
}
