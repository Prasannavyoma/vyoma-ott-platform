const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const channel = jsonObj.rss.channel;
const items = Array.isArray(channel.item) ? channel.item : [channel.item];

const postTypes = {};
items.forEach(item => {
  const type = item['wp:post_type'];
  if (type) {
    postTypes[type] = (postTypes[type] || 0) + 1;
  }
});

console.log('📊 WordPress XML File - All Post Types found:');
console.log(JSON.stringify(postTypes, null, 2));
