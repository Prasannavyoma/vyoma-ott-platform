/**
 * Master Migration Engine for Vyoma OTT
 * Migrates:
 * 1. Remaining Courses & Episodes (with Images & Duplicate Skipping)
 * 2. All Users from WordPress (7,672 total, skipping duplicates)
 * 3. User Plans, Subscriptions & Purchases from WooCommerce Orders (26,849 orders)
 * 4. User Video Watching Progress from user meta (video_progress_data)
 * 5. Image downloading and local caching
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const XML_FILE = path.join(__dirname, '../export.xml');
const WP_URL = 'https://palevioletred-albatross-358324.hostingersite.com/vyoma-export.php';
const TOKEN = 'vyoma_secure_export_2026_super_secret';

// Resilient DB Operation with automatic reconnection & retry on network blips
async function dbRetry(fn, retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNet = err.code === 'P1001' || err.code === 'P1017' || 
                    (err.message && (err.message.includes('Can\'t reach database server') || err.message.includes('Connection closed')));
      if (isNet && attempt < retries) {
        console.warn(`[DB Net Retry ${attempt}/${retries}] Reconnecting to RDS in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay * attempt));
      } else {
        throw err;
      }
    }
  }
}

// Helper to download images safely
async function downloadImage(url, dest) {
  if (fs.existsSync(dest)) return true; // Already downloaded!
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(dest);
      
      const req = client.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(true);
          });
        } else {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          resolve(false);
        }
      });

      req.on('error', () => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Resilient Fetch helper with 6 retries and exponential backoff
async function fetchWp(type, page, perPage = 250) {
  const url = `${WP_URL}?type=${type}&page=${page}&per_page=${perPage}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[WP Retry ${attempt}/6] ${type} p.${page}: ${err.message}. Waiting ${attempt * 3}s...`);
      if (attempt === 6) {
        console.error(`❌ Giving up on ${type} page ${page} after 6 retries.`);
        return { data: [], total: 0 };
      }
      await new Promise(r => setTimeout(r, attempt * 3000));
    }
  }
}

// PHP serialize parser for video_progress_data
function parseVideoProgress(str) {
  if (!str || typeof str !== 'string') return [];
  const regex = /i:(\d+);a:\d+:\{s:4:"time";s:\d+:"([^"]*)";s:7:"endtime";s:\d+:"([^"]*)";/g;
  const results = [];
  let m;
  while ((m = regex.exec(str)) !== null) {
    const wpEpId = m[1];
    const time = parseFloat(m[2]) || 0;
    const endtime = parseFloat(m[3]) || 0;
    if (time > 0 || endtime > 0) {
      results.push({ wpEpId, time, endtime });
    }
  }
  return results;
}

function normalizeTitle(t) {
  if (!t) return '';
  return t
    .replace(/&#8211;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/<[^>]*>?/gm, '')
    .toLowerCase()
    .trim();
}

async function runMasterMigration() {
  console.log('========================================================================');
  console.log('🚀 VYOMA OTT COMPREHENSIVE MASTER MIGRATION ENGINE');
  console.log('Target: https://palevioletred-albatross-358324.hostingersite.com');
  console.log('========================================================================\n');

  // Ensure upload directories exist
  const coursesUploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
  const episodesUploadDir = path.join(process.cwd(), 'public', 'uploads', 'episodes');
  fs.mkdirSync(coursesUploadDir, { recursive: true });
  fs.mkdirSync(episodesUploadDir, { recursive: true });

  // =========================================================================
  // STAGE 1: PARSE XML FOR MEDIA, COURSES, EPISODES & WP_ID MAPPINGS
  // =========================================================================
  console.log('📦 STAGE 1: Parsing XML Archive for Media & Relationships...');
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, attributeNamePrefix: "@_" });
  const jsonObj = parser.parse(xmlData);
  const items = Array.isArray(jsonObj.rss.channel.item) ? jsonObj.rss.channel.item : [jsonObj.rss.channel.item];

  // A. Media Map: wp:post_id -> attachment_url
  const mediaMap = {};
  items.forEach(item => {
    if (item['wp:post_type'] === 'attachment') {
      mediaMap[item['wp:post_id']] = item['wp:attachment_url'];
    }
  });
  console.log(`✓ Mapped ${Object.keys(mediaMap).length} media attachments.`);

  // B. Episode & Course Mappings
  const wpIdToSlug = {};
  const episodeParentMap = {};

  items.forEach(item => {
    const type = item['wp:post_type'];
    const wpId = String(item['wp:post_id']);
    const slug = item['wp:post_name'] || `wp-${type}-${wpId}`;
    
    if (type === 'episodes' || type === 'movies') {
      wpIdToSlug[wpId] = slug;
    }

    if (type === 'tv_shows' || type === 'movies') {
      const metaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
      metaArr.forEach(meta => {
        if (meta['wp:meta_key'] && String(meta['wp:meta_key']).includes('episodes')) {
          const matches = String(meta['wp:meta_value']).match(/"(\d+)"/g);
          if (matches) {
            matches.forEach(m => {
              const epId = m.replace(/"/g, '');
              if (!episodeParentMap[epId]) {
                episodeParentMap[epId] = slug;
              }
            });
          }
        }
      });
    }
  });

  // C. Check Missing Courses (Already 125 courses in DB, will skip duplicates)
  console.log('\n📚 STAGE 1B: Checking Courses & Episodes in Database...');
  const existingCourses = await dbRetry(() => prisma.course.findMany({ select: { id: true, title: true } }));
  const dbCourseIds = new Set(existingCourses.map(c => c.id));
  const dbCourseTitles = new Set(existingCourses.map(c => c.title.toLowerCase().trim()));

  let newCoursesCount = 0;
  for (const item of items) {
    const type = item['wp:post_type'];
    if (type !== 'tv_shows' && type !== 'movies') continue;

    const wpId = String(item['wp:post_id']);
    const slug = item['wp:post_name'] || `wp-course-${wpId}`;
    const rawTitle = (item.title || 'Untitled').trim();
    
    if (slug.includes('__trashed') || (slug.includes('test') && rawTitle.toLowerCase() === 'test')) {
      continue;
    }

    const cleanTitle = rawTitle.replace(/<[^>]*>?/gm, '').trim();

    if (dbCourseIds.has(slug) || dbCourseTitles.has(cleanTitle.toLowerCase())) {
      continue;
    }

    let contentType = 'VIDEO';
    const lowerTitle = cleanTitle.toLowerCase();
    const lowerSlug = slug.toLowerCase();
    if (lowerTitle.includes('panchatantra') || lowerTitle.includes('audio') || lowerSlug.includes('audio')) {
      contentType = 'AUDIOBOOK';
    } else if (lowerTitle.includes('e-book') || lowerTitle.includes('ramayanam') || lowerTitle.includes('kandah') || lowerSlug.includes('ebook') || lowerSlug.includes('e-book')) {
      contentType = 'EBOOK';
    } else if (lowerTitle.includes('game') || lowerTitle.includes('activity') || lowerTitle.includes('pooja') || lowerTitle.includes('क्रीडा') || lowerSlug.includes('house') || lowerSlug.includes('cooking') || lowerSlug.includes('search')) {
      contentType = 'GAME';
    }

    let accessLevel = 'FREE';
    if (rawTitle.includes('iconplatinum') || rawTitle.includes('platinum')) {
      accessLevel = 'PLATINUM';
    } else if (rawTitle.includes('G_black') || rawTitle.includes('gold')) {
      accessLevel = 'GOLD';
    }

    let category = 'Literature';
    if (item.category) {
      const catArr = Array.isArray(item.category) ? item.category : [item.category];
      const foundCat = catArr.find(c => c['@_domain'] === 'genre' || c['@_domain'] === 'category');
      if (foundCat) category = foundCat['#text'] || foundCat;
    }

    let thumbId = null;
    let videosUrl = '';
    const metaArr = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : (item['wp:postmeta'] ? [item['wp:postmeta']] : []);
    metaArr.forEach(m => {
      if (m['wp:meta_key'] === '_thumbnail_id') thumbId = m['wp:meta_value'];
      if (m['wp:meta_key'] === 'videos_url') videosUrl = m['wp:meta_value'];
    });

    let localThumbUrl = '/assets/Ayodhyakanda.jpg';
    if (thumbId && mediaMap[thumbId]) {
      const extUrl = mediaMap[thumbId];
      const fileName = path.basename(new URL(extUrl).pathname);
      const destFile = path.join(coursesUploadDir, fileName);
      const ok = await downloadImage(extUrl, destFile);
      if (ok || fs.existsSync(destFile)) {
        localThumbUrl = `/uploads/courses/${fileName}`;
      } else {
        localThumbUrl = extUrl;
      }
    }

    const cleanDesc = (item['content:encoded'] || '').replace(/<[^>]*>?/gm, '').substring(0, 400).trim();

    await dbRetry(() => prisma.course.create({
      data: {
        id: slug,
        title: cleanTitle,
        description: cleanDesc || 'Interactive Sanskrit learning course and module.',
        thumbnailUrl: localThumbUrl,
        category: category,
        contentType: contentType,
        accessLevel: accessLevel,
        createdAt: new Date(item['wp:post_date'] || Date.now())
      }
    }));

    dbCourseIds.add(slug);
    dbCourseTitles.add(cleanTitle.toLowerCase());
    newCoursesCount++;

    if (videosUrl) {
      const epId = `stream-${slug}`;
      await dbRetry(() => prisma.episode.upsert({
        where: { id: epId },
        create: {
          id: epId,
          title: cleanTitle,
          description: cleanDesc || 'Interactive curriculum viewer.',
          order: 1,
          courseId: slug,
          videoUrl: videosUrl,
          thumbnailUrl: localThumbUrl,
          accessLevel: accessLevel
        },
        update: {
          videoUrl: videosUrl
        }
      }));
      wpIdToSlug[wpId] = epId;
    }
  }
  console.log(`✓ Total courses in DB: ${dbCourseIds.size} (${newCoursesCount} newly added).`);

  // Load all DB episodes into memory for progress matching
  const allDbEpisodes = await dbRetry(() => prisma.episode.findMany({ select: { id: true, courseId: true } }));
  const dbEpisodeSet = new Set(allDbEpisodes.map(e => e.id));
  console.log(`✓ Total episodes in DB: ${allDbEpisodes.length}.`);

  // =========================================================================
  // STAGE 2: MIGRATE ALL USERS & PROGRESS (7,672 TOTAL WP USERS)
  // =========================================================================
  console.log('\n👥 STAGE 2 & 4: Migrating Users & Video Progress (Live WP API)...');
  let userPage = 1;
  let hasMoreUsers = true;
  let totalUsersProcessed = 0;
  let newUsersCreated = 0;
  let existingUsersUpdated = 0;
  let totalProgressImported = 0;

  // Cache existing users and existing progress users in DB
  const existingDbUsers = await dbRetry(() => prisma.user.findMany({ select: { id: true, email: true } }));
  const emailToUserId = new Map();
  existingDbUsers.forEach(u => emailToUserId.set(u.email.toLowerCase(), u.id));

  const existingProgressUsers = new Set(
    (await dbRetry(() => prisma.progress.findMany({ select: { userId: true }, distinct: ['userId'] }))).map(p => p.userId)
  );
  console.log(`✓ Existing DB users: ${emailToUserId.size}, Users with existing progress: ${existingProgressUsers.size}`);

  while (hasMoreUsers) {
    const userBatch = await fetchWp('users', userPage, 250);
    if (!userBatch.data || userBatch.data.length === 0) {
      break;
    }

    for (const wpUser of userBatch.data) {
      const email = (wpUser.user_email || `${wpUser.user_login}@vyoma.invalid`).toLowerCase().trim();
      const name = wpUser.display_name || wpUser.user_login;

      const phone = Array.isArray(wpUser.meta?.billing_phone) ? wpUser.meta.billing_phone[0] : wpUser.meta?.billing_phone;
      const city = Array.isArray(wpUser.meta?.billing_city) ? wpUser.meta.billing_city[0] : wpUser.meta?.billing_city;
      const state = Array.isArray(wpUser.meta?.billing_state) ? wpUser.meta.billing_state[0] : wpUser.meta?.billing_state;
      const country = Array.isArray(wpUser.meta?.billing_country) ? wpUser.meta.billing_country[0] : (wpUser.meta?.billing_country || 'IN');
      const zipCode = Array.isArray(wpUser.meta?.billing_postcode) ? wpUser.meta.billing_postcode[0] : wpUser.meta?.billing_postcode;

      let userId = emailToUserId.get(email);

      if (!userId) {
        try {
          const newUser = await dbRetry(() => prisma.user.create({
            data: {
              email,
              name,
              password: 'migrated_user_password',
              forcePasswordChange: true,
              plan: 'FREE',
              phone: phone || null,
              city: city || null,
              state: state || null,
              country: country || 'IN',
              zipCode: zipCode || null,
              createdAt: new Date(wpUser.user_registered || Date.now())
            }
          }));
          userId = newUser.id;
          emailToUserId.set(email, userId);
          newUsersCreated++;
        } catch {
          try {
            const found = await dbRetry(() => prisma.user.findUnique({ where: { email } }));
            if (found) {
              userId = found.id;
              emailToUserId.set(email, userId);
            }
          } catch {}
        }
      } else {
        existingUsersUpdated++;
      }

      // Check Video Progress Data (Skip if user's progress was already imported)
      if (userId && !existingProgressUsers.has(userId) && wpUser.meta && wpUser.meta.video_progress_data) {
        const rawProgress = Array.isArray(wpUser.meta.video_progress_data) ? wpUser.meta.video_progress_data[0] : wpUser.meta.video_progress_data;
        const parsedProgress = parseVideoProgress(rawProgress);

        for (const prog of parsedProgress) {
          const epSlug = wpIdToSlug[prog.wpEpId];
          if (epSlug && dbEpisodeSet.has(epSlug)) {
            const isCompleted = prog.endtime > 0 && prog.time >= (prog.endtime * 0.85);
            const posSeconds = Math.round(prog.time);

            try {
              await dbRetry(() => prisma.progress.upsert({
                where: {
                  userId_episodeId: {
                    userId: userId,
                    episodeId: epSlug
                  }
                },
                create: {
                  userId: userId,
                  episodeId: epSlug,
                  completed: isCompleted,
                  position: posSeconds
                },
                update: {
                  completed: isCompleted,
                  position: posSeconds
                }
              }));
              totalProgressImported++;
            } catch {
              // Ignore single duplicate collision
            }
          }
        }
        existingProgressUsers.add(userId);
      }

      totalUsersProcessed++;
    }

    console.log(`... Users: ${totalUsersProcessed} / ${userBatch.total} (New: ${newUsersCreated}, Progress entries: ${totalProgressImported})`);

    await new Promise(r => setTimeout(r, 200));

    if (userPage * 250 >= userBatch.total) {
      hasMoreUsers = false;
    } else {
      userPage++;
    }
  }

  console.log(`✓ Users Migration Complete: ${totalUsersProcessed} total processed (${newUsersCreated} newly created, ${existingUsersUpdated} retained).`);
  console.log(`✓ Progress Migration Complete: ${totalProgressImported} new progress checkpoints migrated!`);

  // =========================================================================
  // STAGE 3: MIGRATE USER PLANS, SUBSCRIPTIONS & PURCHASES (26,849 ORDERS)
  // =========================================================================
  console.log('\n💳 STAGE 3: Migrating Plans, Subscriptions & Orders from WooCommerce...');
  let orderPage = 1;
  let hasMoreOrders = true;
  let totalOrdersProcessed = 0;
  let totalPurchasesCreated = 0;

  const userPlanMap = new Map();

  const courseTitleMap = new Map();
  const allCourses = await dbRetry(() => prisma.course.findMany({ select: { id: true, title: true } }));
  allCourses.forEach(c => {
    courseTitleMap.set(normalizeTitle(c.title), c.id);
    courseTitleMap.set(c.id.toLowerCase(), c.id);
  });

  while (hasMoreOrders) {
    const orderBatch = await fetchWp('orders', orderPage, 250);
    if (!orderBatch.data || orderBatch.data.length === 0) {
      break;
    }

    for (const order of orderBatch.data) {
      totalOrdersProcessed++;
      const email = order.billing_email ? order.billing_email.toLowerCase().trim() : null;
      if (!email) continue;

      const userId = emailToUserId.get(email);
      if (!userId) continue;

      const status = (order.status || '').toLowerCase();
      if (status !== 'completed' && status !== 'processing') continue;

      const orderDate = new Date(order.date_created || Date.now());

      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const itemName = (item.name || '').trim();
          const lowerName = itemName.toLowerCase();

          // 1. Subscription Plan Matching
          if (lowerName.includes('platinum')) {
            const isYearly = lowerName.includes('annual') || lowerName.includes('yearly');
            const durationDays = isYearly ? 365 : 30;
            const expDate = new Date(orderDate.getTime() + durationDays * 86400000);

            const curr = userPlanMap.get(email);
            if (!curr || expDate > curr.expiresAt) {
              userPlanMap.set(email, {
                plan: 'PLATINUM',
                interval: isYearly ? 'YEARLY' : 'MONTHLY',
                startedAt: orderDate,
                expiresAt: expDate
              });
            }
          } else if (lowerName.includes('gold')) {
            const isYearly = lowerName.includes('annual') || lowerName.includes('yearly');
            const durationDays = isYearly ? 365 : 30;
            const expDate = new Date(orderDate.getTime() + durationDays * 86400000);

            const curr = userPlanMap.get(email);
            if (!curr || (curr.plan !== 'PLATINUM' && expDate > curr.expiresAt)) {
              userPlanMap.set(email, {
                plan: 'GOLD',
                interval: isYearly ? 'YEARLY' : 'MONTHLY',
                startedAt: orderDate,
                expiresAt: expDate
              });
            }
          }

          // 2. Standalone Course Purchases
          const normalized = normalizeTitle(itemName);
          let matchedCourseId = courseTitleMap.get(normalized);
          if (!matchedCourseId) {
            if (normalized.includes('ramayana')) matchedCourseId = courseTitleMap.get('ramayana companion') || 'ramayana-companion';
            else if (normalized.includes('kalidasa')) matchedCourseId = courseTitleMap.get('literary treasures of kalidasa') || 'literary_treasures_of_kalidasa';
            else if (normalized.includes('narayaneeyam')) matchedCourseId = courseTitleMap.get('sriman narayaneeyam companion') || 'sriman_narayaneeyam_companion';
            else if (normalized.includes('srirama')) matchedCourseId = courseTitleMap.get('srirama experience companion') || 'srirama_experience_companion';
            else if (normalized.includes('kids')) matchedCourseId = courseTitleMap.get('personal sanskrit companion - kids') || 'personal_sanskrit_companion_kids';
          }

          if (matchedCourseId) {
            try {
              const existingPurchase = await dbRetry(() => prisma.purchase.findUnique({
                where: {
                  userId_courseId: {
                    userId: userId,
                    courseId: matchedCourseId
                  }
                }
              }));

              if (!existingPurchase) {
                await dbRetry(() => prisma.purchase.create({
                  data: {
                    userId: userId,
                    courseId: matchedCourseId,
                    amount: parseFloat(item.total || order.total || '0'),
                    razorpayOrderId: `WP-${order.ID}`,
                    billingAddress: order.billing_address || `${order.billing_city || ''}, ${order.billing_state || ''} ${order.billing_country || ''}`.trim(),
                    createdAt: orderDate
                  }
                }));
                totalPurchasesCreated++;
              }
            } catch {
              // Ignore single duplicate purchase
            }
          }
        }
      }
    }

    if (orderPage % 10 === 0 || orderPage * 250 >= orderBatch.total) {
      console.log(`... Scanned ${totalOrdersProcessed} / ${orderBatch.total} orders (Found ${userPlanMap.size} subscription holders, ${totalPurchasesCreated} course purchases)`);
    }

    await new Promise(r => setTimeout(r, 200));

    if (orderPage * 250 >= orderBatch.total) {
      hasMoreOrders = false;
    } else {
      orderPage++;
    }
  }

  // Update user plans in DB
  console.log(`\n💎 Applying upgraded Plans to ${userPlanMap.size} subscriber accounts...`);
  let updatedPlanCount = 0;
  for (const [email, planData] of userPlanMap.entries()) {
    try {
      await dbRetry(() => prisma.user.update({
        where: { email },
        data: {
          plan: planData.plan,
          planInterval: planData.interval,
          planStartedAt: planData.startedAt,
          planExpiresAt: planData.expiresAt
        }
      }));
      updatedPlanCount++;
    } catch {
      // User update error handled
    }
  }
  console.log(`✓ Updated plans for ${updatedPlanCount} users!`);

  // =========================================================================
  // STAGE 5: VERIFY & LOCALLY CACHE ALL IMAGES
  // =========================================================================
  console.log('\n🖼 STAGE 5: Verifying & Locally Caching External Images...');
  const externalCourses = await dbRetry(() => prisma.course.findMany({
    where: { thumbnailUrl: { contains: 'hostingersite.com' } }
  }));

  console.log(`Found ${externalCourses.length} courses with external Hostinger images.`);
  for (const c of externalCourses) {
    if (!c.thumbnailUrl) continue;
    try {
      const fileName = path.basename(new URL(c.thumbnailUrl).pathname);
      const dest = path.join(coursesUploadDir, fileName);
      const ok = await downloadImage(c.thumbnailUrl, dest);
      if (ok || fs.existsSync(dest)) {
        await dbRetry(() => prisma.course.update({
          where: { id: c.id },
          data: { thumbnailUrl: `/uploads/courses/${fileName}` }
        }));
      }
    } catch (e) {
      console.warn(`Could not cache image for course ${c.id}: ${e.message}`);
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 COMPREHENSIVE MIGRATION FINISHED SUCCESSFULLY!');
  console.log(` - Total Users Processed: ${totalUsersProcessed} (${newUsersCreated} newly created)`);
  console.log(` - Subscriptions/Plans Assigned: ${updatedPlanCount}`);
  console.log(` - Course Purchases Created: ${totalPurchasesCreated}`);
  console.log(` - Progress Checkpoints Migrated: ${totalProgressImported}`);
  console.log(` - Missing Courses Restored: ${newCoursesCount}`);
  console.log('========================================================================\n');
}

runMasterMigration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
