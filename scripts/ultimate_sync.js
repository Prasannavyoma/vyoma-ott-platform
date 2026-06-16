const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();
const SQL_FILE = path.join(__dirname, '../OLD wordpress.sql');
const XML_FILE = path.join(__dirname, '../export.xml');

function parseSqlTuple(tupleStr) {
  // Simple, fast state-machine for SQL string parsing
  const values = [];
  let current = '';
  let inQuote = false;
  let isEscaped = false;

  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];

    if (isEscaped) {
      current += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === "'" || char === '"') {
      inQuote = !inQuote;
      continue;
    }

    if (char === ',' && !inQuote) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }
  values.push(current.trim());
  return values;
}

async function main() {
  console.log('====================================================================');
  console.log('🚀 LAUNCHING THE ULTIMATE SYNC, RESCUE & NAVIGATION RESTORE MASTER');
  console.log('====================================================================\n');

  // -----------------------------------------------------------------
  // PHASE 1: PARSE XML & EXTRACT MEDIA/NAV-MENUS/EBOOKS
  // -----------------------------------------------------------------
  console.log('📦 Reading 42MB XML Archive...');
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, attributeNamePrefix: "@_" });
  const jsonObj = parser.parse(xmlData);
  const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

  // A. Map Media
  const mediaMap = {};
  items.forEach(item => {
    if (item['wp:post_type'] === 'attachment') {
      mediaMap[item['wp:post_id']] = item['wp:attachment_url'];
    }
  });

  // B. Re-Import E-books and standalone movie section documents!
  console.log('\n📖 Phase 1: Re-Importing E-Book Flipbooks & Interactive Documents...');
  let ebooksProcessed = 0;
  
  for (const item of items) {
    const type = item['wp:post_type'];
    const titleRaw = item.title || 'Untitled';
    
    // Filter: Only import actual Movies / Tv Shows that are Ebooks or Interactive modules!
    const isEbook = String(titleRaw).includes('(E-book)') || String(item['wp:post_name']).includes('e-book') || String(item['wp:post_name']).includes('e_book');
    if (isEbook && (type === 'movies' || type === 'tv_shows')) {
      const slugId = item['wp:post_name'] || `ebook-${item['wp:post_id']}`;
      const title = titleRaw.replace(/<[^>]*>?/gm, '').trim();
      
      // Extract values
      let thumbId = null;
      let videosUrl = '';
      const metaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
      metaArr.forEach(meta => {
        if (meta['wp:meta_key'] === '_thumbnail_id') thumbId = meta['wp:meta_value'];
        if (meta['wp:meta_key'] === 'videos_url') videosUrl = meta['wp:meta_value'];
      });

      const thumbUrl = thumbId ? mediaMap[thumbId] : null;
      const cleanDesc = (item['content:encoded'] || '').replace(/<[^>]*>?/gm, '').substring(0, 300).trim();

      // 1. Re-insert Course
      await prisma.course.upsert({
        where: { id: slugId },
        create: {
          id: slugId,
          title,
          description: cleanDesc || 'Digital educational flipbook / document.',
          thumbnailUrl: thumbUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg',
          category: 'E-books',
          contentType: 'EBOOK',
          accessLevel: 'PLATINUM'
        },
        update: {
          title,
          contentType: 'EBOOK'
        }
      });

      // 2. Generate standalone Episode for content streaming
      const epSlug = `read-${slugId}`;
      await prisma.episode.upsert({
        where: { id: epSlug },
        create: {
          id: epSlug,
          title: 'Read Interactive Flipbook',
          description: 'Access the full digitized edition of this volume.',
          order: 1,
          courseId: slugId,
          videoUrl: videosUrl || '', // Holds iframe or file link
          thumbnailUrl: thumbUrl || '',
          accessLevel: 'PLATINUM'
        },
        update: {
          videoUrl: videosUrl || ''
        }
      });
      ebooksProcessed++;
    }
  }
  console.log(`✅ Successfully restored and synthesized ${ebooksProcessed} E-Book Courses & Episode contents!`);

  // C. Rebuild Menu System
  console.log('\n🧭 Phase 2: Mapping WordPress Navigation Menu Tree...');
  
  // Clear current menus to fully "reset"
  await prisma.navigationMenu.deleteMany({});
  
  const rawMenus = items.filter(item => item['wp:post_type'] === 'nav_menu_item');
  const menuMap = {}; // Maps original WP ID to parent IDs

  // Helper to format links
  const formatUrl = (url) => {
    if (!url || url === '#') return '#';
    if (url.includes('/product_category/')) {
      return `/category/${url.split('/product_category/')[1].replace(/\/$/, '').toLowerCase()}`;
    }
    if (url.includes('/product-category/')) {
      return `/category/${url.split('/product-category/')[1].replace(/\/$/, '').toLowerCase()}`;
    }
    if (url.includes('/e-books_cat/')) {
      return `/category/ebooks`;
    }
    return '/';
  };

  // Pass 1: Create all items first
  let rootOrder = 1;
  let childOrder = 1;

  // Filter out the invalid empty menu item
  const filteredMenus = rawMenus.filter(m => m.title && m.title.trim() !== '');

  for (const menu of filteredMenus) {
    const wpId = String(menu['wp:post_id']);
    let parentWpId = '0';
    let url = '';

    const metas = Array.isArray(menu['wp:postmeta']) ? menu['wp:postmeta'] : [menu['wp:postmeta']];
    metas.forEach(meta => {
      if (meta['wp:meta_key'] === '_menu_item_menu_item_parent') parentWpId = String(meta['wp:meta_value']);
      if (meta['wp:meta_key'] === '_menu_item_url') url = String(meta['wp:meta_value']);
    });

    menuMap[wpId] = {
      label: menu.title,
      url: formatUrl(url),
      parentWpId: parentWpId,
      order: parentWpId === '0' ? rootOrder++ : childOrder++
    };
  }

  // Pass 2: Insert root menus
  const insertedIds = {}; // wpId -> cuid()
  for (const wpId in menuMap) {
    const node = menuMap[wpId];
    if (node.parentWpId === '0') {
      const inserted = await prisma.navigationMenu.create({
        data: {
          label: node.label,
          url: node.url,
          order: node.order
        }
      });
      insertedIds[wpId] = inserted.id;
    }
  }

  // Pass 3: Insert nested child dropdowns
  let nestedCount = 0;
  for (const wpId in menuMap) {
    const node = menuMap[wpId];
    if (node.parentWpId !== '0') {
      const parentCuid = insertedIds[node.parentWpId];
      if (parentCuid) {
        await prisma.navigationMenu.create({
          data: {
            label: node.label,
            url: node.url,
            order: node.order,
            parentId: parentCuid
          }
        });
        nestedCount++;
      }
    }
  }
  console.log(`✅ Extracted and populated ${Object.keys(insertedIds).length} root menus & ${nestedCount} dropdown nodes!`);


  // -----------------------------------------------------------------
  // PHASE 3: STREAM SQL & SYNC SUBSCRIPTION TIMESTAMPS
  // -----------------------------------------------------------------
  console.log('\n📡 Phase 3: Extracting Precise Subscription Dates from 448MB SQL Dump...');
  
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ Error: SQL file missing.');
    process.exit(1);
  }

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const wpUserMap = {}; // WP_ID -> Email
  const wpSubMap = {}; // WP_ID -> { start, end }

  let currentState = null; // 'USERS' | 'PMPRO' | null
  
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect beginning of Insert blocks
    if (trimmed.includes('INSERT INTO `wp_users`')) {
      currentState = 'USERS';
      continue;
    }
    if (trimmed.includes('INSERT INTO `wp_pmpro_memberships_users`')) {
      currentState = 'PMPRO';
      continue;
    }

    // Detect boundaries (Lock Tables / Unlock / Other Inserts)
    if (trimmed.startsWith('INSERT INTO') || trimmed.startsWith('LOCK TABLES') || trimmed.startsWith('UNLOCK TABLES')) {
      if (!trimmed.includes('`wp_users`') && !trimmed.includes('`wp_pmpro_memberships_users`')) {
        currentState = null;
      }
    }

    // State 1: Extract User Mappings
    if (currentState === 'USERS') {
      const tupleMatch = trimmed.match(/^\((\d+),/);
      if (tupleMatch) {
        const cleanTuple = trimmed.replace(/^\(/, '').replace(/\),?;?$/, '');
        const parts = parseSqlTuple(cleanTuple);
        if (parts.length >= 5) {
          const id = parts[0].trim();
          const email = parts[4].trim();
          if (id && email) {
            wpUserMap[id] = email.toLowerCase();
          }
        }
      }
    }

    // State 2: Extract Active Memberships
    if (currentState === 'PMPRO') {
      const tupleMatch = trimmed.match(/^\((\d+),/);
      if (tupleMatch) {
        const cleanTuple = trimmed.replace(/^\(/, '').replace(/\),?;?$/, '');
        const parts = parseSqlTuple(cleanTuple);
        if (parts.length >= 14) {
          const userId = parts[1].trim();
          const status = parts[11].toLowerCase();
          const startStr = parts[12];
          const endStr = parts[13];

          if (userId && status === 'active') {
            let end = null;
            if (endStr && endStr !== '0000-00-00 00:00:00') {
              end = new Date(endStr);
            }
            const start = startStr && startStr !== '0000-00-00 00:00:00' ? new Date(startStr) : new Date();
            
            // Capture the active subscription record
            wpSubMap[userId] = { start, end };
          }
        }
      }
    }
  }

  console.log(`🔎 Total Unique Users Extracted from wp_users: ${Object.keys(wpUserMap).length}`);
  console.log(`🔎 Total Active PMPro Subscriptions Captured: ${Object.keys(wpSubMap).length}`);

  // Iterate and execute bulk updates into SQLite DB
  console.log('⚡ Syncing Precise Subscriptions into SQLite DB...');
  let datesSynced = 0;

  for (const userId in wpSubMap) {
    const email = wpUserMap[userId];
    if (!email) continue;

    const subData = wpSubMap[userId];
    
    // Verify local User profile exists
    const localUser = await prisma.user.findUnique({ where: { email } });
    if (localUser) {
      await prisma.user.update({
        where: { email },
        data: {
          planStartedAt: subData.start,
          planExpiresAt: subData.end,
          plan: 'PLATINUM'
        }
      });
      datesSynced++;
    }
  }

  console.log(`✅ Successfully synced active dates for ${datesSynced} genuine platform accounts!`);

  console.log('\n====================================================================');
  console.log('🎉 GLOBAL MASTER SYNCHRONIZATION COMPLETED!');
  console.log('💻 1. E-books Restored & Synthesized.');
  console.log('💻 2. Real WordPress Navigation Tree Populated.');
  console.log('💻 3. Precise User Subscription Dates Mapped from SQL.');
  console.log('====================================================================\n');
}

main()
  .catch(e => console.error('Execution Crash:', e))
  .finally(async () => await prisma.$disconnect());
