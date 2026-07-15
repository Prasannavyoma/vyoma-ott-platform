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
  console.log('--- Migrating Orders (Invoices & Subscriptions) ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  // We need to keep track of active plans for users based on recent orders

  while (hasMore) {
    console.log(`Fetching orders page ${page}...`);
    const data: any = await fetchFromWP('orders', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpOrder of data.data) {
      const email = wpOrder.billing_email;
      if (!email) {
        console.log(`Skipping order ${wpOrder.ID} - no billing email provided.`);
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        console.log(`Skipping order ${wpOrder.ID} - user ${email} not found in DB.`);
        continue;
      }

      // We have the user! Now let's migrate the purchase and invoice.
      // A WP order might have multiple items (courses). We'll create a Purchase for each course in the order.
      // If it's a subscription, we'll map it to a Plan.
      let orderTotal = parseFloat(wpOrder.total || '0');
      let isSubscription = false;

      for (const item of wpOrder.items) {
        // Try to match the product by name
        const course = await prisma.course.findFirst({
          where: { title: item.name }
        });

        if (course) {
          // It's a course purchase
          const existingPurchase = await prisma.purchase.findFirst({
             where: { userId: user.id, courseId: course.id }
          });
          
              if (!existingPurchase) {
                 await prisma.purchase.create({
                    data: {
                      userId: user.id,
                      courseId: course.id,
                      amount: parseFloat(item.total || '0'),
                      razorpayOrderId: `WP-${wpOrder.ID}`,
                      billingAddress: wpOrder.billing_address,
                      createdAt: new Date(wpOrder.date_created || Date.now())
                    }
                 });
              }
            }
          }

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
