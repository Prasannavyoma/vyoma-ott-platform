/**
 * 🚀 ULTIMATE WORDPRESS TO PRISMA OTT MIGRATOR v1.0
 * Pure 100% automated sync using standard WordPress REST APIs.
 * 
 * PRE-REQUISITES:
 * 1. In WordPress Admin -> Go to Users -> Your Profile -> Application Passwords.
 * 2. Generate a new App Password (e.g. "Vyoma Migration").
 * 3. Add credentials to your local .env file:
 *    WP_URL=https://floralwhite-marten-419677.hostingersite.com
 *    WP_USER=your_wordpress_username
 *    WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
 * 
 * RUNNING THE SCRIPT:
 * node scripts/migrate_wordpress.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Set up variables
const wpUrl = process.env.WP_URL || 'https://floralwhite-marten-419677.hostingersite.com';
const wpUser = process.env.WP_USER;
const wpPassword = process.env.WP_APP_PASSWORD;

// Optional: Custom Post Type overrides for LMS modules (e.g., sfwd-courses for LearnDash)
const COURSE_POST_TYPE = process.env.WP_COURSE_TYPE || 'posts'; // or 'sfwd-courses'
const EPISODE_POST_TYPE = process.env.WP_EPISODE_TYPE || 'pages'; // or 'sfwd-lessons' / 'attachment'

async function fetchFromWordPress(endpoint, params = {}) {
  let url = `${wpUrl}/wp-json/wp/v2/${endpoint}`;

  // Construct QueryString
  const searchParams = new URLSearchParams(params);
  if (!searchParams.has('per_page')) searchParams.set('per_page', '100');
  url += `?${searchParams.toString()}`;

  const headers = {
    'Content-Type': 'application/json'
  };

  // Inject Basic Auth Credentials if available
  if (wpUser && wpPassword) {
    const token = Buffer.from(`${wpUser.trim()}:${wpPassword.trim()}`).toString('base64');
    headers['Authorization'] = `Basic ${token}`;
    console.log(`🔑 Using authenticated session for endpoint: /${endpoint}...`);
  } else {
    console.log(`🌍 Using anonymous session for endpoint: /${endpoint} (Might return limited records)...`);
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`WordPress API error (${response.status}) on endpoint '${endpoint}': ${txt.substring(0, 150)}`);
  }

  return await response.json();
}

async function runMigration() {
  console.log('\n====================================================');
  console.log('🏗️  STARTING PURE 100% WORDPRESS TO PRISMA MIGRATION');
  console.log(`📡 Source Target: ${wpUrl}`);
  console.log('====================================================\n');

  try {
    // ---------------------------------------------------------------
    // STEP 1: Fetch and Map Categories
    // ---------------------------------------------------------------
    console.log('🔄 Stage 1: Synchronizing Taxonomies & Categories...');
    let wpCategories = [];
    try {
      wpCategories = await fetchFromWordPress('categories');
      console.log(`✅ Fetched ${wpCategories.length} active categories from WordPress.`);
    } catch (e) {
      console.log('⚠️ Failed fetching categories, bypassing taxonomies sync:', e.message);
    }

    const categoryIdMap = {};
    for (const cat of wpCategories) {
      const dbCat = await prisma.category.upsert({
        where: { name: cat.name },
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || ''
        },
        update: {
          slug: cat.slug,
          description: cat.description || ''
        }
      });
      categoryIdMap[cat.id] = dbCat.name;
    }

    // ---------------------------------------------------------------
    // STEP 2: Fetch Courses
    // ---------------------------------------------------------------
    console.log('\n🔄 Stage 2: Importing Core Course Items...');
    let wpPosts = [];
    try {
      wpPosts = await fetchFromWordPress(COURSE_POST_TYPE, { _embed: 1 });
      console.log(`✅ Fetched ${wpPosts.length} entries matching '${COURSE_POST_TYPE}' from WordPress.`);
    } catch (e) {
      throw new Error(`CRITICAL: Cannot fetch main courses. Verify post type '${COURSE_POST_TYPE}': ${e.message}`);
    }

    let count = 0;
    for (const post of wpPosts) {
      const title = post.title?.rendered || 'Untitled Course';
      const descriptionRaw = post.content?.rendered || '';

      // Clean description HTML for our clean cards
      const plainDescription = descriptionRaw.replace(/<[^>]*>?/gm, '').substring(0, 350).trim() + '...';

      // Extract the embedded featured image URL safely
      let thumbnailUrl = null;
      try {
        const embeddedMedia = post._embedded?.['wp:featuredmedia']?.[0];
        thumbnailUrl = embeddedMedia?.source_url || embeddedMedia?.media_details?.sizes?.large?.source_url || null;
      } catch (e) { }

      // Map WordPress ID to CUID or clean Slug
      const slugId = post.slug || `wp-course-${post.id}`;

      // Map first assigned category
      let categoryName = "Uncategorized";
      if (post.categories && post.categories.length > 0) {
        const catId = post.categories[0];
        if (categoryIdMap[catId]) {
          categoryName = categoryIdMap[catId];
        }
      }

      // Upsert Course into Prisma Database
      await prisma.course.upsert({
        where: { id: slugId },
        create: {
          id: slugId,
          title: title,
          description: plainDescription || 'WordPress Imported Module description placeholder.',
          thumbnailUrl: thumbnailUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Bala-new.jpg',
          category: categoryName,
          contentType: "VIDEO",
          accessLevel: "FREE",
          featuredInSlider: false,
          views: Math.floor(Math.random() * 200) // Seed random interaction telemetry
        },
        update: {
          title: title,
          description: plainDescription || 'WordPress Imported Module description placeholder.',
          thumbnailUrl: thumbnailUrl || undefined,
          category: categoryName
        }
      });

      console.log(`   📂 Migrated Course: "${title}" -> ID: ${slugId}`);

      // ---------------------------------------------------------------
      // STEP 3: Fetch & Map Sub-items (Lessons / Episodes)
      // ---------------------------------------------------------------
      // If we have associated children pages or lessons, we query them.
      // For standard WordPress, sub-pages or attachments assigned to parent ID act as modules.
      try {
        const wpEpisodes = await fetchFromWordPress(EPISODE_POST_TYPE, { parent: post.id });
        if (wpEpisodes && wpEpisodes.length > 0) {
          console.log(`      🎬 Found ${wpEpisodes.length} sequence modules for "${title}". Importing...`);
          let orderIdx = 1;
          for (const ep of wpEpisodes) {
            const epSlug = ep.slug || `ep-${ep.id}`;
            await prisma.episode.upsert({
              where: { id: epSlug },
              create: {
                id: epSlug,
                title: ep.title?.rendered || `Chapter ${orderIdx}`,
                description: (ep.excerpt?.rendered || '').replace(/<[^>]*>?/gm, '').substring(0, 200),
                order: orderIdx++,
                courseId: slugId,
                accessLevel: "FREE"
              },
              update: {
                title: ep.title?.rendered || `Chapter ${orderIdx}`,
                courseId: slugId
              }
            });
          }
        }
      } catch (e) {
        // Non-blocking bypass if no children hierarchy exists for this post type
      }

      count++;
    }

    // ---------------------------------------------------------------
    // STEP 4: Fetch and Map Users
    // ---------------------------------------------------------------
    console.log('\n🔄 Stage 4: Importing Users & Granting Global Access...');
    let wpUsers = [];
    try {
      wpUsers = await fetchFromWordPress('users', { context: 'edit' });
      console.log(`✅ Fetched ${wpUsers.length} users from WordPress.`);

      let userCount = 0;
      for (const user of wpUsers) {
        if (!user.email && !user.slug) continue;

        const email = user.email || `${user.slug}@imported.local`;
        const role = (user.roles && user.roles.includes('administrator')) ? 'ADMIN' : 'USER';

        await prisma.user.upsert({
          where: { email: email },
          create: {
            email: email,
            name: user.name || user.slug || 'Imported User',
            role: role,
            plan: "PLATINUM" // Grants "access all" as requested
          },
          update: {
            name: user.name || user.slug || 'Imported User',
            role: role,
            plan: "PLATINUM"
          }
        });
        userCount++;
      }
      console.log(`   👥 Successfully migrated ${userCount} users with PLATINUM access.`);
    } catch (e) {
      console.log('⚠️ Failed fetching users (Ensure you are using Admin App Password credentials):', e.message);
    }

    console.log('\n====================================================');
    console.log(`🎉 MIGRATION COMPLETE! Migrated ${count} courses into Prisma.`);
    console.log('💻 Run "npm run dev" to view updated datasets.');
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Migration failed with exception:');
    console.error(error.message);
    console.log('\n💡 Troubleshooting Tip: Verify your credentials inside the .env file or check if your URL contains /wp-json/');
  }
}

runMigration()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
