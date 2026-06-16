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
  console.log(`🎯 AYODHYAKANDA WP_ID: ${target['wp:post_id']}`);
} else {
  console.log('❌ Not found');
}
