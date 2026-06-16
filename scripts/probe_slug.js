const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

const targetSlug = 'vowels';
const matched = items.filter(item => String(item['wp:post_name']) === targetSlug);

matched.forEach(found => {
  console.log(`🎯 MATCH FOUND!`);
  console.log(`   ID: ${found['wp:post_id']}`);
  console.log(`   Title: "${found.title}"`);
  console.log(`   Post Type: "${found['wp:post_type']}"`);
  console.log(`   Status: "${found['wp:status']}"`);
});
