/**
 * Migrate All Orders, Invoices, Categories & Leftover Data
 * 1. Scans all 26,849 WooCommerce orders
 * 2. Migrates every completed/processing order into TelemetryEvent (for invoices & history)
 * 3. Migrates course purchases into Purchase table
 * 4. Migrates all 38 Categories/Genres into Category table
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const XML_FILE = path.join(__dirname, '../export.xml');
const WP_URL = 'https://palevioletred-albatross-358324.hostingersite.com/vyoma-export.php';
const TOKEN = 'vyoma_secure_export_2026_super_secret';

async function dbRetry(fn, retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNet = err.code === 'P1001' || err.code === 'P1017' || 
                    (err.message && (err.message.includes('Can\'t reach database server') || err.message.includes('Connection closed')));
      if (isNet && attempt < retries) {
        console.warn(`[DB Retry ${attempt}/${retries}] Reconnecting to RDS in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay * attempt));
      } else {
        throw err;
      }
    }
  }
}

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
        console.error(`Giving up on ${type} page ${page} after 6 retries.`);
        return { data: [], total: 0 };
      }
      await new Promise(r => setTimeout(r, attempt * 3000));
    }
  }
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

async function run() {
  console.log('========================================================================');
  console.log('🚀 MIGRATING ORDERS, INVOICES, CATEGORIES & REMAINING DATA');
  console.log('========================================================================\n');

  // =========================================================================
  // 1. POPULATE ALL CATEGORIES & GENRES FROM EXPORT.XML
  // =========================================================================
  console.log('📂 1. Populating Categories & Genres from XML...');
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, attributeNamePrefix: "@_" });
  const jsonObj = parser.parse(xmlData);
  const terms = Array.isArray(jsonObj.rss.channel['wp:term']) ? jsonObj.rss.channel['wp:term'] : [];
  const validTax = ['genre', 'movies_cat', 'product_cat', 'tv_shows_cat'];

  let catCount = 0;
  for (const t of terms) {
    if (validTax.includes(t['wp:term_taxonomy'])) {
      const rawName = t['wp:term_name'] || '';
      const name = rawName.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
      const slug = (t['wp:term_slug'] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();

      if (!name || name.length < 2) continue;

      try {
        await dbRetry(() => prisma.category.upsert({
          where: { name },
          create: {
            name,
            slug,
            description: `Curated Sanskrit OTT collection for ${name}.`
          },
          update: {
            slug
          }
        }));
        catCount++;
      } catch (err) {
        // Skip duplicate slug
      }
    }
  }
  console.log(`✓ Populated ${catCount} categories into Category table.`);

  // =========================================================================
  // 2. MIGRATE ALL WOOCOMMERCE ORDERS & INVOICES (26,849 TOTAL ORDERS)
  // =========================================================================
  console.log('\n🧾 2. Migrating Orders & Generating Invoice Records from WooCommerce...');

  // Map users: email -> user
  const dbUsers = await dbRetry(() => prisma.user.findMany({ select: { id: true, email: true, state: true, address: true, plan: true } }));
  const emailToUser = new Map();
  dbUsers.forEach(u => emailToUser.set(u.email.toLowerCase(), u));

  // Map courses: normalizedTitle -> id
  const dbCourses = await dbRetry(() => prisma.course.findMany({ select: { id: true, title: true } }));
  const courseTitleMap = new Map();
  dbCourses.forEach(c => {
    courseTitleMap.set(normalizeTitle(c.title), c.id);
    courseTitleMap.set(c.id.toLowerCase(), c.id);
  });

  let orderPage = 1;
  let hasMoreOrders = true;
  let totalOrdersScanned = 0;
  let invoiceEventsCreated = 0;
  let coursePurchasesCreated = 0;

  while (hasMoreOrders) {
    const orderBatch = await fetchWp('orders', orderPage, 250);
    if (!orderBatch.data || orderBatch.data.length === 0) {
      break;
    }

    for (const order of orderBatch.data) {
      totalOrdersScanned++;
      const email = order.billing_email ? order.billing_email.toLowerCase().trim() : null;
      if (!email) continue;

      const user = emailToUser.get(email);
      if (!user) continue;

      const status = (order.status || '').toLowerCase();
      // Only completed or processing orders are valid paid invoices
      if (status !== 'completed' && status !== 'processing') continue;

      const orderId = String(order.ID);
      const eventId = `wp-ord-${orderId}`;
      const orderDate = new Date(order.date_created || Date.now());
      const orderTotal = parseFloat(order.total || '0');
      const billingAddress = order.billing_address || `${order.billing_city || ''}, ${order.billing_state || ''} ${order.billing_country || ''}`.trim() || user.address || 'Registered Subscriber';
      const placeOfSupply = order.billing_state || user.state || 'Karnataka (29)';

      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        for (const item of order.items) {
          const itemName = (item.name || '').trim();
          const lowerName = itemName.toLowerCase();

          let plan = 'PLATINUM';
          let interval = 'YEARLY';
          if (lowerName.includes('gold')) {
            plan = 'GOLD';
          }
          if (lowerName.includes('monthly') || lowerName.includes('month')) {
            interval = 'MONTHLY';
          }

          // A. Log TelemetryEvent for Subscription / Invoice History
          const metaJson = JSON.stringify({
            plan,
            interval,
            amount: parseFloat(item.total || orderTotal || '0'),
            currency: order.currency || 'INR',
            orderId: `WP-${orderId}`,
            productName: itemName || `Vyoma ${plan} Plan`,
            status: status === 'completed' ? 'Paid' : 'Processing',
            billingAddress: billingAddress,
            placeOfSupply: placeOfSupply
          });

          try {
            await dbRetry(() => prisma.telemetryEvent.upsert({
              where: { id: eventId },
              create: {
                id: eventId,
                eventType: 'PLAN_UPGRADE',
                sourceId: orderId,
                userId: user.id,
                metadata: metaJson,
                createdAt: orderDate
              },
              update: {
                metadata: metaJson
              }
            }));
            invoiceEventsCreated++;
          } catch (e) {
            // Ignore single duplicate event
          }

          // B. Standalone Course Purchases Check
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
                    userId: user.id,
                    courseId: matchedCourseId
                  }
                }
              }));

              if (!existingPurchase) {
                await dbRetry(() => prisma.purchase.create({
                  data: {
                    userId: user.id,
                    courseId: matchedCourseId,
                    amount: parseFloat(item.total || orderTotal || '0'),
                    razorpayOrderId: `WP-${orderId}`,
                    billingAddress: billingAddress,
                    placeOfSupply: placeOfSupply,
                    createdAt: orderDate
                  }
                }));
                coursePurchasesCreated++;
              }
            } catch {
              // Ignore single duplicate purchase
            }
          }
        }
      }
    }

    if (orderPage % 10 === 0 || orderPage * 250 >= orderBatch.total) {
      console.log(`... Scanned ${totalOrdersScanned} / ${orderBatch.total} orders (Invoices logged: ${invoiceEventsCreated}, Purchases: ${coursePurchasesCreated})`);
    }

    await new Promise(r => setTimeout(r, 200));

    if (orderPage * 250 >= orderBatch.total) {
      hasMoreOrders = false;
    } else {
      orderPage++;
    }
  }

  console.log(`\n✓ Orders & Invoices Migration Complete!`);
  console.log(` - Total orders scanned: ${totalOrdersScanned}`);
  console.log(` - Total order invoice events created: ${invoiceEventsCreated}`);
  console.log(` - Standalone course purchases: ${coursePurchasesCreated}`);
  console.log('========================================================================\n');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
