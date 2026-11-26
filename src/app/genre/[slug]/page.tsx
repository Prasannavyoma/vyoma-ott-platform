import Link from 'next/link';
import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import BackToHomeButton from '@/app/components/BackToHomeButton';

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = await params;
  const rawSlug = unwrappedParams?.slug || '';
  const slug = decodeURIComponent(rawSlug);
  const slugLower = slug.toLowerCase();
  const slugUpper = slug.toUpperCase();

  // Canonical display titles for known WordPress genres and media routes
  const genreCanonicalTitles: Record<string, string> = {
    'world-of-chants': 'World of Chants',
    'bhakti-bhava-lahari': 'Bhakti Bhava Lahari',
    'language-learning': 'Language Learning',
    'grammar-simplified': 'Grammar Simplified',
    'stories-subhashitas': 'Stories & Subhashitas',
    'literature': 'Literature',
    'evergreen-epics-puranas': 'Evergreen Epics & Puranas',
    'evergreen-epics-&-puranas': 'Evergreen Epics & Puranas',
    'roots-of-dharma': 'Roots of Dharma',
    'iks': 'IKS (Indian Knowledge Systems)',
    'games-activities': 'Games & Activities',
    'kids': 'Sanskrit Kids Academy',
    'gita': 'Bhagavad Gita',
    'vedanta': 'Vedanta',
    'vedanta-vedanta': 'Vedanta',
    'shaastra-studies': 'Shaastra Studies',
    'shastra-studies': 'Shaastra Studies',
    'audiobook': 'Audiobooks',
    'audio-book': 'Audiobooks',
    'podcast': 'Podcasts',
    'video': 'Videos',
    'e-book': 'E-books',
    'e-books': 'E-books',
    'games': 'Games & Activities',
    'game': 'Games & Activities',
    'game-based-learning': 'Game-based Learning',
    'gblgame-based-learning': 'Game-based Learning',
    'learning-program': 'Learning Programs'
  };

  const categoryName = genreCanonicalTitles[slugLower] || (
    slug 
      ? slug.replace(/-/g, ' ').replace(/&amp;/g, '&').replace(/\b\w/g, l => l.toUpperCase())
      : 'Category'
  );

  const slugSingular = slug.replace(/s$/, '').toUpperCase();
  const contentTypesToSearch = [slugUpper, slugSingular];
  
  if (slugUpper.includes('AUDIOBOOK') || slugUpper.includes('PODCAST')) {
    contentTypesToSearch.push('PODCAST', 'AUDIOBOOK');
  }
  if (slugUpper.includes('LEARNING-PROGRAM') || slugUpper.includes('PROGRAM')) contentTypesToSearch.push('PROGRAM');
  if (slugUpper.includes('E-BOOK') || slugUpper.includes('EBOOK')) contentTypesToSearch.push('EBOOK');
  if (slugUpper.includes('GAME')) contentTypesToSearch.push('GAME');

  const categoriesToSearch = [
    categoryName,
    slug.replace(/-/g, ' '),
    slug.replace(/-/g, ' ').replace(/\s+and\s+/gi, ' & ')
  ];

  if (slugUpper.includes('CHANT')) {
    categoriesToSearch.push('World of Chants', 'Chants', 'Chant');
  }
  if (slugUpper.includes('BHAKTI')) {
    categoriesToSearch.push('Bhakti Bhava Lahari', 'Bhakti', 'Devotional');
  }
  if (slugUpper.includes('LANGUAGE')) {
    categoriesToSearch.push('Language Learning', 'Language');
  }
  if (slugUpper.includes('GRAMMAR')) {
    categoriesToSearch.push('Grammar Simplified', 'Grammar');
  }
  if (slugUpper.includes('STORIES') || slugUpper.includes('SUBHASHITA')) {
    categoriesToSearch.push('Stories & Subhashitas', 'Stories &amp; Subhashitas', 'Subhashita', 'Stories', 'Panchatantra');
  }
  if (slugUpper.includes('LITERATURE')) {
    categoriesToSearch.push('Literature', 'Devotional Literature');
  }
  if (slugUpper.includes('EPIC') || slugUpper.includes('PURANA')) {
    categoriesToSearch.push('Evergreen Epics & Puranas', 'Evergreen Epics &amp; Puranas', 'Epics', 'Puranas', 'Ramayana');
  }
  if (slugUpper.includes('ROOTS') || slugUpper.includes('DHARMA')) {
    categoriesToSearch.push('Roots of Dharma', 'Roots', 'Dharma', 'Sanatana Dharma');
  }
  if (slugUpper.includes('IKS')) {
    categoriesToSearch.push('IKS', 'Indian Knowledge Systems');
  }
  if (slugUpper.includes('GAME') || slugUpper.includes('ACTIVIT')) {
    categoriesToSearch.push('Games & Activities', 'Games &amp; Activities', 'Games', 'Game', 'Game-based Learning');
  }
  if (slugUpper.includes('KID') || slugUpper.includes('CHILD')) {
    categoriesToSearch.push('Kids', 'Kid', 'Children');
  }
  if (slugUpper.includes('GITA')) {
    categoriesToSearch.push('Gita', 'Bhagavad Gita', 'Srimadbhagavadgita');
  }
  if (slugUpper.includes('VEDANTA')) {
    categoriesToSearch.push('Vedanta');
  }
  if (slugUpper.includes('SHASTRA') || slugUpper.includes('SHAASTRA')) {
    categoriesToSearch.push('Shaastra Studies', 'Shastra Studies', 'Shastra', 'Shaastra');
  }
  if (slugUpper.includes('AUDIOBOOK') || slugUpper.includes('PODCAST')) {
    categoriesToSearch.push('Audiobooks', 'Audiobook', 'Podcast', 'Podcasts');
  }
  if (slugUpper.includes('E-BOOK') || slugUpper.includes('EBOOK')) {
    categoriesToSearch.push('E-books', 'E-book', 'Ebooks');
  }
  if (slugUpper.includes('VIDEO')) {
    categoriesToSearch.push('Video', 'Videos');
  }

  const uniqueCategoriesToSearch = [...new Set(categoriesToSearch.filter(Boolean))];

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        {
          contentType: {
            in: contentTypesToSearch
          }
        },
        ...uniqueCategoriesToSearch.map(cat => ({
          category: {
            contains: cat,
            mode: 'insensitive' as const
          }
        }))
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      episodes: { select: { id: true } }
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: '#030b17', color: '#fff', fontFamily: "'Futura', 'Futura PT', 'Jost', 'Outfit', 'Inter', system-ui, sans-serif" }}>
      <NavBar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '160px 24px 80px 24px' }}>
        <BackToHomeButton />
        
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.35rem)', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.5px' }}>
          {categoryName}
        </h1>
        
        {courses.length === 0 ? (
          <div style={{ padding: '80px 20px', background: 'rgba(15, 23, 42, 0.4)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
            <h3 style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 600 }}>No courses found in "{categoryName}".</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 300 }}>New course additions for this genre will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {courses.map((course) => (
              <Link href={`/watch/${course.id}`} key={course.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* BANNER THUMBNAIL */}
                  <div style={{ position: 'relative', paddingTop: '56.25%', background: '#090d16' }}>
                    <img 
                      src={course.thumbnailUrl || '/assets/Ayodhyakanda.jpg'} 
                      alt={course.title} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px', 
                      background: 'rgba(2, 6, 14, 0.85)', 
                      backdropFilter: 'blur(6px)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      fontSize: '0.65rem', 
                      fontWeight: 600, 
                      color: course.contentType === 'GAME' ? '#c084fc' : '#fbbf24' 
                    }}>
                      {course.contentType === 'GAME' ? '🎮 GAME' : `🛡️ ${course.accessLevel?.replace('_', ' ')}`}
                    </div>
                  </div>

                  {/* BODY CONTENT */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 500, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        {course.category || 'Uncategorized'}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 10px 0', color: '#fff', lineHeight: '1.4', height: '44px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {course.title}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                      <span style={{ fontWeight: 300 }}>{course.episodes?.length || 0} {course.contentType === 'GAME' ? 'Activities' : 'Units'}</span>
                      <span style={{ color: course.contentType === 'GAME' ? '#c084fc' : 'var(--primary, #f26422)', fontWeight: 600 }}>
                        {course.contentType === 'GAME' ? 'PLAY NOW 🎮' : 'EXPLORE →'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
