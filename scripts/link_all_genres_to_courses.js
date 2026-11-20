/**
 * Link all WordPress Genres and Categories to Courses in Vyoma OTT
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const XML_FILE = path.join(__dirname, '../export.xml');

function clean(str) {
  return String(str || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, '\x27')
    .replace(/&#038;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function run() {
  console.log('🔄 Loading export.xml and parsing WordPress taxonomy data...');
  const xmlData = fs.readFileSync(XML_FILE, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xmlData);
  const items = [].concat(parsed.rss.channel.item || []);

  const xmlItemsWithCats = items.filter(it =>
    ['movies', 'tv_shows', 'product', 'episodes'].includes(it['wp:post_type']) && it.category
  );
  console.log(`✓ Found ${xmlItemsWithCats.length} catalog items with category/genre tags in XML.`);

  const courses = await prisma.course.findMany();
  console.log(`✓ Fetched ${courses.length} courses from Prisma RDS database.`);

  let updatedCount = 0;
  const genreCourseCounts = {};

  for (const course of courses) {
    const cClean = clean(course.title);
    
    // 1. Exact match by post_name (slug)
    let matchedItem = xmlItemsWithCats.find(it => String(it['wp:post_name'] || '') === course.id);

    // 2. Exact match by clean title
    if (!matchedItem) {
      matchedItem = xmlItemsWithCats.find(it => clean(it.title) === cClean);
    }

    // 3. Substring match
    if (!matchedItem) {
      matchedItem = xmlItemsWithCats.find(it => {
        const itClean = clean(it.title);
        return itClean && cClean && (itClean.includes(cClean) || cClean.includes(itClean));
      });
    }

    let genres = [];
    if (matchedItem) {
      const cats = [].concat(matchedItem.category || []);
      genres = cats
        .filter(cat => cat && (cat['@_domain'] === 'genre' || cat['@_domain'] === 'movies_cat' || cat['@_domain'] === 'tv_shows_cat'))
        .map(cat => typeof cat === 'string' ? cat : cat['#text'])
        .filter(Boolean)
        .map(g => g.replace(/&amp;/g, '&').trim());
    }

    // Standardize naming conventions with Next.js navigation
    genres = genres.map(g => {
      const gl = g.toLowerCase();
      if (gl === 'shastra studies' || gl === 'shaastra studies') return 'Shaastra Studies';
      if (gl === 'e-book' || gl === 'e-books') return 'E-books';
      if (gl === 'games' || gl === 'games & activities' || gl === 'games &amp; activities') return 'Games & Activities';
      if (gl === 'gblgame-based-learning' || gl === 'game-based learning') return 'Game-based Learning';
      if (gl === 'audio-book' || gl === 'audiobook' || gl === 'audiobooks') return 'Audiobooks';
      if (gl === 'vedanta-vedanta' || gl === 'vedanta') return 'Vedanta';
      return g;
    });

    // ContentType & Domain Intelligence fallbacks
    if (cClean.includes('panchatantra')) {
      genres.push('Stories & Subhashitas', 'Kids', 'Audiobooks');
    }
    if ((course.contentType === 'GAME' || cClean.includes('game') || cClean.includes('activity') || cClean.includes('क्रीडा') || cClean.includes('summit') || cClean.includes('treasure')) && !genres.includes('Games & Activities')) {
      genres.push('Games & Activities', 'Kids');
    }
    if ((cClean.includes('vowel') || cClean.includes('consonant') || cClean.includes('words') || cClean.includes('listening') || cClean.includes('language') || cClean.includes('dhatu') || cClean.includes('shabdah')) && !genres.includes('Language Learning')) {
      genres.push('Language Learning', 'Grammar Simplified');
    }
    if ((cClean.includes('ramayana') || cClean.includes('balakanda') || cClean.includes('ayodhyakanda') || cClean.includes('aranyakanda') || cClean.includes('kishkindhakanda') || cClean.includes('sundarakanda') || cClean.includes('yuddhakanda')) && !genres.includes('Evergreen Epics & Puranas')) {
      genres.push('Evergreen Epics & Puranas');
    }
    if (cClean.includes('gita') && !genres.includes('Gita')) {
      genres.push('Gita');
    }
    if (cClean.includes('saundarya lahari') || cClean.includes('suprabhatam') || cClean.includes('stotra') || cClean.includes('sahasranama') || cClean.includes('namaramayanam') || cClean.includes('mookapanchashati') || cClean.includes('raghuveera')) {
      genres.push('Bhakti Bhava Lahari', 'World of Chants');
    }
    if (cClean.includes('debating') || cClean.includes('nigrahasthanas')) {
      genres.push('Shaastra Studies');
    }
    if (cClean.includes('sanatana dharma') || cClean.includes('roots of dharma')) {
      genres.push('Roots of Dharma');
    }

    // Retain existing category if not Uncategorized
    if (course.category && course.category !== 'Uncategorized' && !genres.includes(course.category)) {
      const existingParts = course.category.split(',').map(s => s.trim());
      genres.push(...existingParts);
    }

    const uniqueGenres = [...new Set(genres)].filter(g => g && g !== 'Uncategorized');
    const finalCategoryString = uniqueGenres.join(', ');

    // Track statistics
    uniqueGenres.forEach(g => {
      genreCourseCounts[g] = (genreCourseCounts[g] || 0) + 1;
    });

    await prisma.course.update({
      where: { id: course.id },
      data: { category: finalCategoryString }
    });

    updatedCount++;
    console.log(`[${updatedCount}/${courses.length}] "${course.title.slice(0, 35)}..." -> [${finalCategoryString}]`);
  }

  console.log('\n======================================================');
  console.log(`🎉 Successfully linked genres to ${updatedCount} courses!`);
  console.log('Course Distribution by Genre:');
  console.log(JSON.stringify(genreCourseCounts, null, 2));
  console.log('======================================================\n');

  // Also ensure Category table has all active genres
  console.log('📂 Syncing Category table with all active genres...');
  for (const [genreName, count] of Object.entries(genreCourseCounts)) {
    const slug = genreName
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await prisma.category.upsert({
      where: { name: genreName },
      update: { description: `Curated Sanskrit OTT collection with ${count} courses.` },
      create: {
        name: genreName,
        slug: slug,
        description: `Curated Sanskrit OTT collection with ${count} courses.`
      }
    });
  }
  console.log('✓ Category table synced!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
