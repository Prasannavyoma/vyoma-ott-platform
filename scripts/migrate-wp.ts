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

async function migrateUsers() {
  console.log('--- Migrating Users ---');
  let page = 1;
  let hasMore = true;
  let totalImported = 0;

  while (hasMore) {
    console.log(`Fetching users page ${page}...`);
    const data: any = await fetchFromWP('users', page);
    
    if (!data.data || data.data.length === 0) {
      hasMore = false;
      break;
    }

    for (const wpUser of data.data) {
      const email = wpUser.user_email || `${wpUser.user_login}@vyoma.invalid`;
      
      // Determine plan from roles or subscriptions
      let plan = 'FREE';
      let expiresAt = null;

      if (wpUser.subscriptions && wpUser.subscriptions.length > 0) {
        const activeSub = wpUser.subscriptions.find((s: any) => s.status === 'active') || wpUser.subscriptions[0];
        const subName = activeSub.name ? activeSub.name.toUpperCase() : '';
        if (subName.includes('PLATINUM')) {
          plan = 'PLATINUM';
        } else if (subName.includes('GOLD')) {
          plan = 'GOLD';
        } else {
          // fallback if sub name is not clear, but we have roles
          if (wpUser.roles && wpUser.roles.includes('platinum_member')) plan = 'PLATINUM';
          else if (wpUser.roles && wpUser.roles.includes('gold_member')) plan = 'GOLD';
          else plan = 'GOLD'; // Default to Gold if active sub exists but unrecognized name
        }
        expiresAt = activeSub.next_payment ? new Date(activeSub.next_payment) : null;
      } else if (wpUser.roles) {
        if (wpUser.roles.includes('platinum_member')) plan = 'PLATINUM';
        else if (wpUser.roles.includes('gold_member')) plan = 'GOLD';
      }

      const phone = Array.isArray(wpUser.meta?.billing_phone) ? wpUser.meta.billing_phone[0] : wpUser.meta?.billing_phone;
      const city = Array.isArray(wpUser.meta?.billing_city) ? wpUser.meta.billing_city[0] : wpUser.meta?.billing_city;
      const state = Array.isArray(wpUser.meta?.billing_state) ? wpUser.meta.billing_state[0] : wpUser.meta?.billing_state;
      const country = Array.isArray(wpUser.meta?.billing_country) ? wpUser.meta.billing_country[0] : (wpUser.meta?.billing_country || 'IN');
      const zipCode = Array.isArray(wpUser.meta?.billing_postcode) ? wpUser.meta.billing_postcode[0] : wpUser.meta?.billing_postcode;

      await prisma.user.upsert({
        where: { email },
        update: {
          name: wpUser.display_name,
          plan: plan,
          planExpiresAt: expiresAt,
          phone: phone,
          city: city,
          state: state,
          country: country,
          zipCode: zipCode
        },
        create: {
          email,
          name: wpUser.display_name,
          password: 'migrated_user_password',
          forcePasswordChange: true,
          plan: plan,
          planExpiresAt: expiresAt,
          phone: phone,
          city: city,
          state: state,
          country: country,
          zipCode: zipCode,
          createdAt: new Date(wpUser.user_registered)
        }
      });
      totalImported++;
    }

    console.log(`Imported ${totalImported} / ${data.total} users...`);
    if (page * 100 >= data.total) {
      hasMore = false;
    } else {
      page++;
    }
  }
}

async function run() {
  try {
    await migrateUsers();
    console.log('Migration Completed Successfully!');
  } catch (e) {
    console.error('Migration Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
