const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const XML_FILE = path.join(__dirname, '../export.xml');
const xmlData = fs.readFileSync(XML_FILE, 'utf8');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
const jsonObj = parser.parse(xmlData);

const channel = jsonObj.rss.channel;
const items = Array.isArray(channel.item) ? channel.item : [channel.item];

const targetShow = items.find(item => item['wp:post_name'] === 'sanskrit_games_your_brain_gym');
if (targetShow) {
  console.log(`🔍 SHOW FOUND: "${targetShow.title}"`);
  console.log(`📝 SLUG: "${targetShow['wp:post_name']}"`);
  console.log('📋 POSTMETA FIELDS:');
  
  const metas = Array.isArray(targetShow['wp:postmeta']) ? targetShow['wp:postmeta'] : [targetShow['wp:postmeta']];
  metas.forEach(m => {
    if (m['wp:meta_key'].includes('episode') || m['wp:meta_key'].includes('season')) {
      console.log(`   🔑 Key: "${m['wp:meta_key']}"`);
      console.log(`   📄 Value: "${m['wp:meta_value']}"`);
      
      // Test the regex
      const val = String(m['wp:meta_value']);
      const matches = val.match(/"(\d+)"/g);
      console.log(`      🧠 Regex Matches:`, matches);
    }
  });
} else {
  console.log('❌ Target show not found.');
}
