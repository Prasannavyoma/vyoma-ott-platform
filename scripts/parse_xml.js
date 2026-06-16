const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../generated/client');
const { XMLParser } = require('fast-xml-parser');

const prisma = new PrismaClient();
const XML_FILE = path.join(__dirname, '../export.xml');

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

async function run() {
  console.log('====================================================');
  console.log('🚀 INITIALIZING COMPREHENSIVE OTT MIGRATION ENGINE');
  console.log('====================================================\n');

  if (!fs.existsSync(XML_FILE)) {
    console.error('❌ ERROR: export.xml not found at ' + XML_FILE);
    process.exit(1);
  }

  console.log('📦 Loading 42MB XML payload into memory...');
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  
  console.log('🧠 Parsing XML structure...');
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    attributeNamePrefix : "@_"
  });
  const jsonObj = parser.parse(xmlData);

  const rss = jsonObj.rss;
  if (!rss || !rss.channel) {
    console.error('❌ ERROR: Invalid WordPress Export format.');
    process.exit(1);
  }

  const channel = rss.channel;
  
  // -----------------------------------------------------------------
  // STAGE 1: USERS
  // -----------------------------------------------------------------
  console.log('\n🔄 Stage 1: Migrating Users & Granting PLATINUM Access...');
  const wpAuthors = Array.isArray(channel['wp:author']) ? channel['wp:author'] : (channel['wp:author'] ? [channel['wp:author']] : []);
  let userCount = 0;

  for (const author of wpAuthors) {
    const email = author['wp:author_email'] || `${author['wp:author_login']}@imported.local`;
    const name = author['wp:author_display_name'] || author['wp:author_login'];
    
    await prisma.user.upsert({
      where: { email },
      create: { email, name: name || 'Imported User', role: 'USER', plan: 'PLATINUM' },
      update: { name: name || 'Imported User', plan: 'PLATINUM' }
    });
    userCount++;
  }
  console.log(`✅ Successfully migrated ${userCount} users with Platinum access.`);

  // -----------------------------------------------------------------
  // STAGE 2: CATEGORIES
  // -----------------------------------------------------------------
  console.log('\n🔄 Stage 2: Synchronizing Categories...');
  const wpCategories = Array.isArray(channel['wp:category']) ? channel['wp:category'] : (channel['wp:category'] ? [channel['wp:category']] : []);
  
  for (const cat of wpCategories) {
    const name = cat['wp:cat_name'];
    const slug = cat['wp:category_nicename'];
    if (!name) continue;
    await prisma.category.upsert({
      where: { name: name },
      create: { name, slug: slug || name },
      update: {}
    });
  }
  console.log(`✅ Synchronized categories.`);

  // -----------------------------------------------------------------
  // PREPARE MEDIA MAP
  // -----------------------------------------------------------------
  const items = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
  const mediaMap = {};
  console.log('\n🖼️  Indexing Media Attachments...');
  
  items.forEach(item => {
    if (item['wp:post_type'] === 'attachment') {
      const id = item['wp:post_id'];
      const url = item['wp:attachment_url'];
      if (id && url) mediaMap[id] = url;
    }
  });
  console.log(`✅ Indexed ${Object.keys(mediaMap).length} media items.`);

  // Global Relationship Map: episodePostId -> courseSlugId
  const episodeParentMap = {};

  // -----------------------------------------------------------------
  // STAGE 3: COURSES (Movies & TV Shows)
  // -----------------------------------------------------------------
  console.log('\n🔄 Stage 3: Importing Courses (Movies & TV Shows)...');
  const validCourseTypes = ['movies', 'tv_shows', 'post'];
  let courseCount = 0;
  
  for (const item of items) {
    const type = item['wp:post_type'];
    const status = item['wp:status'];
    
    // Allow publish and private (some course content is private)
    if (status !== 'publish' && status !== 'private') continue;

    if (validCourseTypes.includes(type)) {
      const title = (item.title || 'Untitled').replace(/<[^>]*>?/gm, '').trim();
      const wpId = item['wp:post_id'];
      const slugId = item['wp:post_name'] || `wp-course-${wpId}`;
      const rawContent = item['content:encoded'] || '';
      const description = rawContent.replace(/<[^>]*>?/gm, '').substring(0, 450).trim();

      // Extract Category (Genres)
      let categoryName = "Uncategorized";
      if (item.category) {
        const catArr = Array.isArray(item.category) ? item.category : [item.category];
        const genreCat = catArr.find(c => c['@_domain'] === 'genre' || c['@_domain'] === 'category');
        if (genreCat) categoryName = genreCat['#text'] || genreCat;
      }

      // Extract Metadata
      let thumbId = null;
      const metaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
      
      metaArr.forEach(meta => {
        const key = meta['wp:meta_key'];
        const val = meta['wp:meta_value'];
        if (!key || !val) return;

        // Thumbnail check
        if (key === '_thumbnail_id') {
          thumbId = val;
        }

        // ACF Repeater / Serialized Episode Relationships check
        if (key.includes('episodes')) {
          // Serialized PHP array looks like: a:15:{i:0;s:5:"10435";...}
          const matches = String(val).match(/"(\d+)"/g);
          if (matches) {
            const epCount = matches.length;
            matches.forEach(m => {
              const epId = m.replace(/"/g, '');
              
              // CRITICAL LOGIC: Prioritize parent shows with MORE episodes so parent collections maintain ownership
              if (!episodeParentMap[epId] || episodeParentMap[epId].count < epCount) {
                episodeParentMap[epId] = { slug: slugId, count: epCount };
              }
            });
          }
        }
      });

      const thumbnailUrl = thumbId ? mediaMap[thumbId] : null;

      await prisma.course.upsert({
        where: { id: slugId },
        create: {
          id: slugId,
          title,
          description: description || 'Imported premium module.',
          thumbnailUrl: thumbnailUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg',
          category: categoryName,
          accessLevel: 'FREE', 
          contentType: type === 'movies' ? 'VIDEO' : 'PROGRAM',
          views: Math.floor(Math.random() * 100) + 50
        },
        update: {
          title,
          description: description || 'Imported premium module.',
          thumbnailUrl: thumbnailUrl || undefined,
          category: categoryName
        }
      });
      courseCount++;
    }
  }
  console.log(`✅ Migrated ${courseCount} main courses (Movies / Shows).`);
  console.log(`🧬 Mapped ${Object.keys(episodeParentMap).length} relationships in the database.`);

  // -----------------------------------------------------------------
  // STAGE 4: EPISODES
  // -----------------------------------------------------------------
  console.log('\n🔄 Stage 4: Importing Episodes & Sequential Modules...');
  let episodeCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const type = item['wp:post_type'];
    const status = item['wp:status'];
    
    if (status !== 'publish' && status !== 'private') continue;

    if (type === 'episodes') {
      const epWpId = item['wp:post_id'];
      
      // Lookup the parent course from our mapped relationship table
      const parentNode = episodeParentMap[epWpId];
      if (!parentNode || !parentNode.slug) {
        skippedCount++;
        continue; // Skip orphaned episodes
      }

      const parentSlug = parentNode.slug;

      // Verify presence in Course DB
      const courseExists = await prisma.course.findUnique({ where: { id: parentSlug } });
      if (!courseExists) {
         skippedCount++;
         continue;
      }

      const title = (item.title || `Episode`).replace(/<[^>]*>?/gm, '').trim();
      const epSlug = item['wp:post_name'] || `ep-${epWpId}`;
      const rawContent = item['content:encoded'] || '';
      const description = rawContent.replace(/<[^>]*>?/gm, '').substring(0, 250).trim();

      // Load Episode Postmeta (video file url, length, ordering)
      let videoUrl = null;
      let durationStr = null;
      let epOrder = 0;
      let epThumbId = null;

      const epMetaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
      epMetaArr.forEach(meta => {
        const key = meta['wp:meta_key'];
        const val = meta['wp:meta_value'];
        if (!key || !val) return;

        if (key === 'videos_url') videoUrl = val;
        if (key === 'videos_time') durationStr = val;
        if (key === 'episodes_number') epOrder = parseInt(val) || 0;
        if (key === '_thumbnail_id') epThumbId = val;
      });

      const thumbUrl = epThumbId ? mediaMap[epThumbId] : null;
      const durationSecs = parseDurationToSeconds(durationStr);

      await prisma.episode.upsert({
        where: { id: epSlug },
        create: {
          id: epSlug,
          title,
          description: description || 'Lesson episode module.',
          order: epOrder || (episodeCount + 1),
          courseId: parentSlug,
          videoUrl: videoUrl || '',
          duration: durationSecs,
          thumbnailUrl: thumbUrl || '',
          accessLevel: 'FREE'
        },
        update: {
          title,
          videoUrl: videoUrl || '',
          duration: durationSecs,
          thumbnailUrl: thumbUrl || undefined,
          courseId: parentSlug
        }
      });
      episodeCount++;
    }
  }

  console.log(`✅ Migrated ${episodeCount} episodes.`);
  console.log(`⚠️ Skipped ${skippedCount} orphaned or unassigned episodes.`);

  console.log('\n====================================================');
  console.log('🎉 XML OFFLINE MIGRATION 100% COMPLETE!');
  console.log('💻 Courses, Episode files, and Access Levels migrated!');
  console.log('====================================================\n');
}

run()
  .catch(e => console.error('Migration crashed:', e))
  .finally(async () => await prisma.$disconnect());
