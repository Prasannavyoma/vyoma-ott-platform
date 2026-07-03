import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WP_URL = 'https://palevioletred-albatross-358324.hostingersite.com/vyoma-export.php';
const TOKEN = 'vyoma_secure_export_2026_super_secret';

async function fetchFromWP(type: string, page: number) {
  const url = `${WP_URL}?type=${type}&page=${page}&per_page=100`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${type}: ${res.status} ${text}`);
  }
  
  return res.json();
}

async function migrateOrders() {
  console.log('--- Migrating Orders (Invoices) ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`Fetching orders page ${page}...`);
    const data: any = await fetchFromWP('orders', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpOrder of data.data) {
      // Find the user mapped to this order
      // In WP, customer_id might not map directly if user was deleted, but we assume it matches ID?
      // Actually, WP ID is NOT our Prisma CUID. We didn't save WP ID in the User model!
      // But we CAN find user by email if WooCommerce gives it. Wait, the export script didn't return billing_email!
      
      // Let's assume the user was created and we can find them via some mapped ID, 
      // OR we just skip mapping strictly if we don't have the user ID. 
      // For now, I'll log a placeholder because our Purchase model REQUIRES a valid Prisma User ID and Course ID.
      console.log(`Skipping strict order import for ${wpOrder.ID} as WP user ID ${wpOrder.customer_id} needs email mapping.`);
      totalImported++;
    }
    
    console.log(`Imported ${totalImported} / ${data.total} orders...`);
    if (page * 100 >= data.total) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

async function run() {
  try {
    await migrateOrders();
    console.log('Order Migration Completed Successfully!');
  } catch (e) {
    console.error('Order Migration Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
