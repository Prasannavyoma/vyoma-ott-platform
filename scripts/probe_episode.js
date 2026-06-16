const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const channel = jsonObj.rss.channel;
const items = Array.isArray(channel.item) ? channel.item : [channel.item];

const sampleEpisode = items.find(item => item['wp:post_type'] === 'episodes');
console.log('🎬 SAMPLE EPISODE JSON OBJECT:');
console.log(JSON.stringify(sampleEpisode, null, 2));
