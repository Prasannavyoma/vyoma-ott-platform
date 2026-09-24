import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import GenreClientView from './GenreClientView';

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams?.slug || '';
  const categoryName = slug 
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Category';

  const slugUpper = slug.toUpperCase();
  const slugSingular = slug.replace(/s$/, '').toUpperCase();
  
  const contentTypesToSearch = [slugUpper, slugSingular];
  
  // Map WordPress 'audio' post types (migrated as PODCAST) to also appear under Audiobooks
  if (slugUpper.includes('AUDIOBOOK')) contentTypesToSearch.push('PODCAST');
  // Map "learning-program" slug to PROGRAM content type
  if (slugUpper.includes('LEARNING-PROGRAM')) contentTypesToSearch.push('PROGRAM');
  // Map "e-books" slug to EBOOK content type
  if (slugUpper.includes('E-BOOK')) contentTypesToSearch.push('EBOOK');

  // Map slugs with missing ampersands or common database naming variations
  const categoriesToSearch = [categoryName];
  if (slugUpper.includes('CHANT')) categoriesToSearch.push('World of Chants', 'Chants', 'Stotra');
  if (slugUpper.includes('BHAKTI')) categoriesToSearch.push('Bhakti Bhava Lahari', 'Bhakti');
  if (slugUpper.includes('EPICS')) categoriesToSearch.push('Evergreen Epics &amp; Puranas', 'Evergreen Epics & Puranas', 'Epics', 'Puranas');
  if (slugUpper.includes('GAMES-ACTIVITIES') || slugUpper === 'GAMES') categoriesToSearch.push('Games &amp; Activities', 'Games & Activities');
  if (slugUpper.includes('STORIES-SUBHASHITAS')) categoriesToSearch.push('Stories &amp; Subhashitas', 'Stories & Subhashitas', 'Subhashitas', 'Stories');
  if (slugUpper.includes('GRAMMAR')) categoriesToSearch.push('Grammar Simplified', 'Grammar');
  if (slugUpper.includes('LANGUAGE')) categoriesToSearch.push('Language Learning', 'Sanskrit Language');
  if (slugUpper.includes('GITA')) categoriesToSearch.push('Bhagavad Gita', 'Gita');
  if (slugUpper.includes('VEDANTA')) categoriesToSearch.push('Vedanta');
  if (slugUpper.includes('SHAASTRA')) categoriesToSearch.push('Shaastra Studies', 'Shastra');
  if (slugUpper.includes('ROOTS')) categoriesToSearch.push('Roots of Dharma', 'Dharma');
  if (slugUpper.includes('IKS')) categoriesToSearch.push('IKS', 'Indian Knowledge Systems');

  // Prevent "Game" search from accidentally matching "Game Based Learning"
  const excludeGameBasedLearning = (slugUpper === 'GAME' || slugUpper.includes('GAMES-ACTIVITIES'));

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      where: {
        AND: [
          {
            OR: [
              ...categoriesToSearch.map(cat => ({
                category: {
                  contains: cat,
                  mode: 'insensitive' as const
                }
              })),
              {
                contentType: {
                  in: contentTypesToSearch
                }
              }
            ]
          },
          excludeGameBasedLearning ? {
            NOT: {
              category: {
                contains: 'Game Based Learning',
                mode: 'insensitive' as const
              }
            }
          } : {}
        ]
      },
      include: {
        _count: {
          select: { episodes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(`Failed to load courses for genre "${slug}":`, error);
  }

  return (
    <>
      <NavBar />
      <GenreClientView categoryName={categoryName} slug={slug} courses={courses} />
      <Footer />
    </>
  );
}
