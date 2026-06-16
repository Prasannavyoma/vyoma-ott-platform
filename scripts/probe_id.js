const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

const targetId = '10435';
const found = items.find(item => String(item['wp:post_id']) === targetId);

if (found) {
  console.log(`🎯 FULL ITEM FOR ID: ${targetId}:`);
  console.log(JSON.stringify(found, null, 2));
}
