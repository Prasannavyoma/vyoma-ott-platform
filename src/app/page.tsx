import Link from 'next/link';
import CourseRow from './components/CourseRow';
import NavBar from './components/NavBar';
import SearchBar from './components/SearchBar';
import HeroSlider from './components/HeroSlider';
import { getFeaturedSlider, getTrendingNow } from './actions/analytics';
import { getContinueWatching, getUserWatchlist } from './actions/ott';
import { getAIRecommendedCourses } from '@/lib/recommendation-engine';
import prisma from '@/lib/prisma';
import SponsorSlider from './components/SponsorSlider';
import { cookies } from 'next/headers';
import SubhashitaWidget from './components/SubhashitaWidget';

// Direct safe SQL conduit bypassing Prisma cached TS model definition locks
async function getSafeHomepageSections(): Promise<any[]> {
  try {
    const raw = await prisma.homepageSection.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error("Failed reading layout sections via SQL:", e);
    return [];
  }
}

async function getSafeHomepageChannels(): Promise<any[]> {
  try {
    // 1. Auto Bootstrap
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS HomepageChannel (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT NOT NULL,
        "order" INTEGER DEFAULT 0
      )
    `);

    let raw = await prisma.homepageChannel.findMany({ 
      where: { active: true },
      orderBy: { order: 'asc' } 
    });
    
    if (!Array.isArray(raw) || raw.length === 0) {
      const defaults = [
        { id: 'chan_1', name: 'Originals', url: '/genre/Vyoma-Originals', icon: '🔥', order: 10 },
        { id: 'chan_2', name: 'Kids Academy', url: '/genre/Kids', icon: '🧸', order: 20 },
        { id: 'chan_3', name: 'Sanskrit Audio', url: '/genre/Audiobook', icon: '🎧', order: 30 },
        { id: 'chan_4', name: 'E-Book Shelf', url: '/genre/Ebook', icon: '📖', order: 40 },
        { id: 'chan_5', name: 'Fun & Games', url: '/genre/Game', icon: '🎮', order: 50 }
      ];
      for (const c of defaults) {
        await prisma.homepageChannel.upsert({
          where: { id: c.id },
          update: {},
          create: { id: c.id, name: c.name, url: c.url, icon: c.icon, order: c.order, active: true }
        });
      }
      raw = await prisma.homepageChannel.findMany({ 
        where: { active: true },
        orderBy: { order: 'asc' } 
      });
    }
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error("Failed reading layout channels:", e);
    return [];
  }
}

async function seedSafeSections() {
  try {
     const now = new Date().toISOString();
     const seeds = [
       { id: 'row1', title: '📖 Must Read E-Books', category: 'E-books', order: 10, active: 1 },

       { id: 'row2', title: '🌟 Evergreen Epics & Puranas', category: 'Evergreen Epics & Puranas', order: 20, active: 1 },
       { id: 'row3', title: '🎙️ Featured Podcasts', category: 'Devotional', order: 30, active: 1 },
       { id: 'row4', title: '📽️ Popular Videos', category: 'Bhakti Bhava Lahari', order: 40, active: 1 },
       { id: 'row5', title: '🎮 Interactive Games', category: 'Games & Activities', order: 50, active: 1 },
       { id: 'row6', title: '👶 Sanskrit Kids Academy', category: 'Kids', order: 60, active: 1 }
     ];
     for(const section of seeds) {
       await prisma.homepageSection.upsert({
         where: { id: section.id },
         update: {},
         create: {
           id: section.id,
           title: section.title,
           category: section.category,
           order: section.order,
           active: section.active === 1
         }
       });
     }
  } catch(e) { console.error("Seeding fallback failed:", e); }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lastSearchQuery = cookieStore.get('last_search_query')?.value || '';
  let dbErrorStr: string | null = null;

  const [
    featuredCourses,
    trendingCourses,
    allCourses,
    dynamicSectionsRaw,
    dynamicChannels,
    continueWatching,
    userWatchlist,
    aiRecommended,
    sponsors,
    hideDummySetting,
    footerMenusData
  ] = await Promise.all([
    getFeaturedSlider(),
    getTrendingNow(),
    (async () => { try { return await prisma.course.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); } catch (e: any) { dbErrorStr = e.message; return []; } })(),
    getSafeHomepageSections(),
    getSafeHomepageChannels(),
    getContinueWatching(),
    getUserWatchlist(),
    getAIRecommendedCourses(),
    (async () => { try { return await prisma.sponsor.findMany({ orderBy: { createdAt: 'desc' } }); } catch (e: any) { dbErrorStr = e.message; return []; } })(),
    (async () => { try { return await prisma.systemSetting.findUnique({ where: { key: 'HIDE_DUMMY_SPONSORS' } }); } catch (e) { return null; } })(),
    (async () => {
      try {
        let menus = await prisma.navigationMenu.findMany({
          where: { parentId: null, isFooter: true },
          include: { children: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        });

        if (menus.length === 0) {
          const defaultFooters = [
            {
              label: 'Account & Plans',
              order: 20,
              isFooter: true,
              children: {
                create: [
                  { label: "Subscribe / Gold", url: "/subscribe", order: 10 },
                  { label: "Referral Rewards", url: "/gift", order: 20 },
                  { label: "Change Password", url: "/change-password", order: 30 }
                ]
              }
            },
            {
              label: 'Legal & Guidelines',
              order: 30,
              isFooter: true,
              children: {
                create: [
                  { label: "Privacy Policy", url: "#", order: 10 },
                  { label: "Terms of Service", url: "#", order: 20 },
                  { label: "Refund Policy", url: "#", order: 30 }
                ]
              }
            }
          ];

          for (const f of defaultFooters) {
            await prisma.navigationMenu.create({ data: f });
          }

          menus = await prisma.navigationMenu.findMany({
            where: { parentId: null, isFooter: true },
            include: { children: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' }
          });
        }
        return menus;
      } catch (e) {
        console.error("Footer fetch failed:", e);
        return [];
      }
    })()
  ]);

  let dynamicSections = dynamicSectionsRaw;
  let hideDummy = hideDummySetting?.value === 'true';
  let footerMenus = footerMenusData;

  // Personalized Hero Slider: Boost courses matching the last search query
  let personalizedFeatured = [...featuredCourses];
  if (lastSearchQuery) {
    const queryLower = lastSearchQuery.toLowerCase();
    personalizedFeatured.sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(queryLower) || (a.category && a.category.toLowerCase().includes(queryLower));
      const bMatch = b.title.toLowerCase().includes(queryLower) || (b.category && b.category.toLowerCase().includes(queryLower));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  // Dynamic Channel Shelf Sorting based on search query
  let personalizedChannels = [...dynamicChannels];
  if (lastSearchQuery) {
    const queryLower = lastSearchQuery.toLowerCase();
    personalizedChannels.sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(queryLower) || a.url.toLowerCase().includes(queryLower);
      const bMatch = b.name.toLowerCase().includes(queryLower) || b.url.toLowerCase().includes(queryLower);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  // Fetch search matches for the dedicated row
  let searchMatchedCourses: any[] = [];
  if (lastSearchQuery) {
    const queryWithAmp = lastSearchQuery.replace(/&/g, '&amp;');
    try {
      searchMatchedCourses = await prisma.course.findMany({
        where: {
          OR: [
            { title: { contains: lastSearchQuery } },
            { title: { contains: queryWithAmp } },
            { category: { contains: lastSearchQuery } },
            { category: { contains: queryWithAmp } },
            { description: { contains: lastSearchQuery } },
            { description: { contains: queryWithAmp } }
          ]
        },
        take: 8
      });
    } catch (e: any) {
      dbErrorStr = e.message;
    }
  }

  if (dynamicSections.length === 0) {
    await seedSafeSections();
    dynamicSections = await getSafeHomepageSections();
  }

  return (
    <main>
      <NavBar />
      
      {/* 📣 Highly Visible Welcome Banner for New Portal Migration */}
      <div style={{
        background: 'linear-gradient(90deg, #1a1c29, #ffd70033)',
        padding: '12px 20px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,215,0,0.2)',
        marginTop: '70px', /* Push down below fixed navbar */
        position: 'relative',
        zIndex: 50
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>
          🎉 Welcome to the new Vyoma OTT 2.0! Migrating from the old portal? 
          <Link href="/faq" style={{ color: '#ffd700', marginLeft: '10px', fontWeight: 'bold', textDecoration: 'underline' }}>
            Click here for the User Guide
          </Link>
        </p>
      </div>


      <HeroSlider items={personalizedFeatured} />


      <section className="row-container">
        
        {/* SLICK DYNAMIC HOTSTAR STUDIO/GENRE CHANNEL SHELF */}
        <div className="channels-shelf">
          {personalizedChannels.map((chan: any) => (
            <Link href={chan.url} key={chan.id} className="channel-card">
              <span className="emoji">
                {chan.icon?.startsWith('http') || chan.icon?.startsWith('/') ? (
                  <img src={chan.icon} alt={chan.name} className="channel-icon-img" />
                ) : (
                  chan.icon
                )}
              </span>
              <span className="channel-title">{chan.name}</span>
            </Link>
          ))}
        </div>

        {/* DYNAMIC ENGAGEMENT SHELF 1: CONTINUE WATCHING */}
        {continueWatching.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <CourseRow 
              title="🟠 Continue Watching"
              courses={continueWatching.map((c: any) => ({
                id: c.id, 
                title: c.title, 
                image: c.thumbnailUrl || 'https://placehold.co/300x160', 
                match: 'Resuming', 
                episodeId: c.activeEpisodeId,
                subTitle: c.activeEpisodeTitle,
                progressPercent: c.progressPercent,
                durationLeftStr: c.durationLeftStr,
                tag: c.accessLevel,
                imageAlt: c.imageAlt,
                trailerUrl: c.trailerUrl
              }))}
            />
          </div>
        )}

        {/* DYNAMIC ENGAGEMENT SHELF 2: MY LIST */}
        {userWatchlist.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <CourseRow 
              title="➕ My List / Favorites"
              courses={userWatchlist.map((c: any) => ({
                id: c.id, 
                title: c.title, 
                image: c.thumbnailUrl || 'https://placehold.co/300x160', 
                match: '99% Match', 
                tag: c.accessLevel,
                createdAt: c.createdAt,
                showRibbon: c.showRibbon,
                imageAlt: c.imageAlt,
                trailerUrl: c.trailerUrl
              }))}
            />
          </div>
        )}

        {/* DYNAMIC SEARCH-INTENT ROW */}
        {lastSearchQuery && searchMatchedCourses.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <CourseRow 
              title={`🔍 Because you searched for "${lastSearchQuery}"`}
              courses={searchMatchedCourses.map((c: any) => ({
                id: c.id, 
                title: c.title, 
                image: c.thumbnailUrl || 'https://placehold.co/300x160', 
                match: '98% Match', 
                tag: c.accessLevel,
                createdAt: c.createdAt,
                showRibbon: c.showRibbon,
                imageAlt: c.imageAlt,
                trailerUrl: c.trailerUrl
              }))}
            />
          </div>
        )}

        {/* ✨ INTELLIGENT AI PERSONALIZED ROW */}
        {aiRecommended.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <CourseRow 
              title="✨ Inspired by your Interests"
              courses={aiRecommended.map((c: any) => ({
                id: c.id, 
                title: c.title, 
                image: c.thumbnailUrl || 'https://placehold.co/300x160', 
                match: 'AI Recommended', 
                tag: c.accessLevel,
                createdAt: c.createdAt,
                showRibbon: c.showRibbon,
                imageAlt: c.imageAlt,
                trailerUrl: c.trailerUrl
              }))}
            />
          </div>
        )}

        {trendingCourses.length > 0 && (
          <CourseRow 
            title="🔥 Trending & Top Engaged Now"
            courses={trendingCourses.map(c => ({
              id: c.id, title: c.title, image: c.thumbnailUrl || 'https://placehold.co/300x160', match: `${Math.min(100, 95 + c.views)}% Match`, tag: c.accessLevel, createdAt: c.createdAt, showRibbon: c.showRibbon, imageAlt: c.imageAlt, trailerUrl: c.trailerUrl
            }))}
          />
        )}

        {/* 💳 EXCLUSIVE PAID PRODUCTS SHELF */}
        {allCourses.filter(c => c.accessLevel === 'PAID').length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <CourseRow 
              title="💳 Flagship Courses (One-time Buy)"
              courses={allCourses.filter(c => c.accessLevel === 'PAID').map(c => ({
                id: c.id, 
                title: c.title, 
                image: c.thumbnailUrl || 'https://placehold.co/300x160', 
                match: '99% Match', 
                tag: c.accessLevel,
                createdAt: c.createdAt,
                showRibbon: c.showRibbon,
                imageAlt: c.imageAlt,
                trailerUrl: c.trailerUrl
              }))}
            />
          </div>
        )}

        {dynamicSections.map((section: any) => {
          const matching = allCourses.filter(c => {
            // Clean Category comparison
            const dbCatClean = (c.category || '').replace(/&amp;/g, '&').trim();
            const targetCatClean = (section.category || '').replace(/&amp;/g, '&').trim();
            
            return dbCatClean === targetCatClean || 
                   c.category === section.category ||
                   (targetCatClean === 'EBOOK' && c.contentType === 'EBOOK') ||
                   (targetCatClean === 'PODCAST' && c.contentType === 'PODCAST') ||
                   (targetCatClean === 'GAME' && c.contentType === 'GAME');
          });
          
          if (matching.length === 0 && allCourses.length > 5) return null;
          if (matching.length > 0) {
            return (
              <CourseRow 
                key={section.id}
                title={section.title}
                courses={matching.map(c => ({
                  id: c.id, title: c.title, image: c.thumbnailUrl || 'https://placehold.co/300x160', match: 'Recommended', tag: c.accessLevel, createdAt: c.createdAt, showRibbon: c.showRibbon, imageAlt: c.imageAlt, trailerUrl: c.trailerUrl
                }))}
              />
            );
          }
          return (
            <CourseRow 
              key={section.id}
              title={section.title}
              courses={[
                { id: 'p1', title: 'Curriculum Track 1', image: '/assets/Bala-new.jpg', match: '99%', tag: 'PLATINUM' },
                { id: 'p2', title: 'Curriculum Track 2', image: '/assets/May-Images-2.jpg', match: '97%', tag: 'GOLD' }
              ]}
            />
          );
        })}

        {/* Daily Sanskrit Wisdom Quote Banner */}
        <SubhashitaWidget />

        <SponsorSlider dbSponsors={sponsors as any} hideDummy={hideDummy} />

        <footer style={{ 
          marginTop: '80px', 
          borderTop: '1px solid rgba(255,255,255,0.06)', 
          paddingTop: '60px', 
          paddingBottom: '30px', 
          color: '#8f98a9',
          fontFamily: 'inherit'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '40px', 
            marginBottom: '50px' 
          }}>
            {/* Branding Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <img 
                src="/assets/logo-200-x-70-px.png" 
                alt="Vyoma Logo" 
                style={{ height: '45px', width: 'fit-content', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(242, 100, 34, 0.15))' }} 
              />
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0, color: '#687387' }}>
                Vyoma Linguistic Labs Foundation is a non-profit organization pioneering digital Sanskrit education globally.
              </p>
            </div>

            {/* Dynamic Columns */}
            {footerMenus.map(menu => (
              <div key={menu.id}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  marginBottom: '20px', 
                  position: 'relative',
                  paddingBottom: '8px',
                  borderBottom: '2px solid rgba(242,100,34,0.3)',
                  display: 'inline-block'
                }}>
                  {menu.label}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  {menu.children && menu.children.map((child: any) => (
                    <Link 
                      key={child.id}
                      href={child.url || '#'} 
                      style={{ 
                        color: '#8f98a9', 
                        textDecoration: 'none', 
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        display: 'block'
                      }} 
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom copyright segment */}
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.04)', 
            paddingTop: '30px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '20px',
            fontSize: '0.85rem',
            color: '#687387'
          }}>
            <div>
              © 2026 Vyoma Sanskrit OTT. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="#" style={{ color: '#687387', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="#" style={{ color: '#687387', textDecoration: 'none' }}>Terms of Use</Link>
              <Link href="#" style={{ color: '#687387', textDecoration: 'none' }}>Refund Policy</Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
