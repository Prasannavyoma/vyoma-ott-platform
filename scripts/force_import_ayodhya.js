const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();
const XML_FILE = path.join(__dirname, '../export.xml');

const TARGET_IDS = [
  '32576','32578','32580','32582','32584','32586','32588','32590','32592','32594','32596',
  '32473','32475','32479','32521','32523','32525','32527','32529','32531','32533','32535','32537'
];

const TARGET_COURSE = 'english-discourse-on-ayodhyakanda-of-srimad-valmiki-ramayana';

function parseDurationToSeconds(durStr) {
  if (!durStr) return 0;
  const parts = String(durStr).trim().split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseInt(durStr) || 0;
}

async function main() {
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, attributeNamePrefix: "@_" });
  const jsonObj = parser.parse(xmlData);
  const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

  // Index media for thumbnails
  const mediaMap = {};
  items.forEach(item => {
    if (item['wp:post_type'] === 'attachment') {
      mediaMap[item['wp:post_id']] = item['wp:attachment_url'];
    }
  });

  console.log(`📡 Force-Importing ${TARGET_IDS.length} orphaned Ayodhyakanda items...`);
  let imported = 0;

  for (let i = 0; i < TARGET_IDS.length; i++) {
    const wpId = TARGET_IDS[i];
    const item = items.find(x => String(x['wp:post_id']) === wpId);
    
    if (item) {
      const title = (item.title || `Episode`).replace(/<[^>]*>?/gm, '').trim();
      const epSlug = item['wp:post_name'] || `ep-${wpId}`;
      const rawContent = item['content:encoded'] || '';
      const description = rawContent.replace(/<[^>]*>?/gm, '').substring(0, 250).trim();

      let videoUrl = null;
      let durationStr = null;
      let epThumbId = null;

      const epMetaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
      epMetaArr.forEach(meta => {
        const key = meta['wp:meta_key'];
        const val = meta['wp:meta_value'];
        if (key === 'videos_url') videoUrl = val;
        if (key === 'videos_time') durationStr = val;
        if (key === '_thumbnail_id') epThumbId = val;
      });

      const thumbUrl = epThumbId ? mediaMap[epThumbId] : null;
      const durationSecs = parseDurationToSeconds(durationStr);

      await prisma.episode.upsert({
        where: { id: epSlug },
        create: {
          id: epSlug,
          title,
          description: description || 'Ramayana Episode.',
          order: i + 1,
          courseId: TARGET_COURSE,
          videoUrl: videoUrl || '',
          duration: durationSecs,
          thumbnailUrl: thumbUrl || '',
          accessLevel: 'FREE'
        },
        update: {
          title,
          videoUrl: videoUrl || '',
          duration: durationSecs,
          courseId: TARGET_COURSE,
          order: i + 1
        }
      });
      imported++;
    }
  }

  console.log(`✅ Force-Import complete! Added/Updated ${imported} episodes for Ayodhyakanda!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
