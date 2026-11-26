import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import BackToHomeButton from '@/app/components/BackToHomeButton';
import { getCurrentUser } from '@/lib/auth';
import { getUserLikedCourses } from '@/app/actions/ott';
import { getAIRecommendedCourses } from '@/lib/recommendation-engine';
import prisma from '@/lib/prisma';
import { ThumbsUp, Sparkles, Compass, Play, UserCheck, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterestsPage() {
  const user = await getCurrentUser();
  const [likedCourses, aiRecommended] = await Promise.all([
    getUserLikedCourses(),
    getAIRecommendedCourses()
  ]);

  // Fallback if AI recommendations empty (e.g. guest or new user)
  let fallbackCourses: any[] = [];
  if (aiRecommended.length === 0) {
    try {
      fallbackCourses = await prisma.course.findMany({
        take: 8,
        orderBy: { views: 'desc' }
      });
    } catch (e) {}
  }

  const recommendedToDisplay = aiRecommended.length > 0 ? aiRecommended : fallbackCourses;

  return (
    <div style={{ minHeight: '100vh', background: '#030b17', color: '#fff', fontFamily: "'Futura', 'Futura PT', 'Jost', 'Outfit', 'Inter', system-ui, sans-serif" }}>
      <NavBar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '160px 24px 80px 24px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '36px' }}>
          <BackToHomeButton label="← BACK TO HOME" />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem' }}>✨</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                  Inspired by Your Interests
                </h1>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '720px', lineHeight: '1.6', margin: 0, fontWeight: 300 }}>
                Curated learning streams tailored to topics you enjoy, profile preferences, and content you have given a thumbs-up (👍).
              </p>
            </div>

            {user?.interests && (
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 18px', 
                borderRadius: '16px',
                maxWidth: '340px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>
                  🎯 Your Registered Topics:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>
                  {user.interests}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, #f26422 0%, rgba(242,100,34,0) 100%)', width: '120px', marginTop: '24px', borderRadius: '2px' }} />
        </div>

        {/* SECTION 1: PRODUCTS GIVEN A THUMBS UP */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.4rem' }}>👍</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Products You Liked & Endorsed ({likedCourses.length})
            </h2>
          </div>

          {!user ? (
            <div style={{ 
              padding: '40px 24px', 
              background: 'rgba(15, 23, 42, 0.5)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              textAlign: 'center'
            }}>
              <p style={{ color: '#94a3b8', margin: '0 0 16px 0', fontSize: '0.95rem' }}>
                Sign in to see courses you have given a thumbs up.
              </p>
              <Link href="/login" style={{ color: '#f26422', fontWeight: 800, textDecoration: 'none' }}>
                Sign In →
              </Link>
            </div>
          ) : likedCourses.length === 0 ? (
            <div style={{ 
              padding: '40px 24px', 
              background: 'rgba(15, 23, 42, 0.4)', 
              border: '1px dashed rgba(255,255,255,0.1)', 
              borderRadius: '16px', 
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👍</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '6px' }}>
                No Liked Products Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                When you watch or browse courses, tap the <strong>👍 Thumbs Up</strong> button on any course card or watch player to bookmark what you love and refine your feed.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {likedCourses.map((course: any) => (
                <Link 
                  href={`/watch/${course.id}`} 
                  key={course.id} 
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{ 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#020617' }}>
                      <img 
                        src={course.thumbnailUrl || 'https://placehold.co/600x340/111/fff?text=Vyoma+OTT'} 
                        alt={course.title || 'Course'} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <span style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '12px', 
                        background: 'rgba(70,211,105,0.2)', 
                        color: '#46d369', 
                        border: '1px solid rgba(70,211,105,0.4)',
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem', 
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        👍 Liked
                      </span>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {course.category || 'Sanskrit OTT'}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                        {course.title ? course.title.replace(/&amp;/g, '&') : ''}
                      </h3>
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{course.contentType || 'VIDEO'}</span>
                        <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Play size={12} fill="currentColor" /> Watch
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: RECOMMENDATIONS BASED ON INTERESTS & SENSORY PROFILE */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Curated Recommendations For You
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: 300 }}>
                Powered by our AI recommendation engine analyzing your watch patterns and syllabus topics.
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {recommendedToDisplay.map((course: any) => (
              <Link 
                href={`/watch/${course.id}`} 
                key={course.id} 
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#020617' }}>
                    <img 
                      src={course.thumbnailUrl || 'https://placehold.co/600x340/111/fff?text=Vyoma+OTT'} 
                      alt={course.title || 'Course'} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: 'rgba(242,100,34,0.9)', 
                      color: '#fff', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.65rem', 
                      fontWeight: 600
                    }}>
                      ✨ Recommended
                    </span>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>
                        {course.category || 'Sanskrit OTT'}
                      </span>
                      <span style={{ color: '#46d369', fontSize: '0.75rem', fontWeight: 600 }}>
                        98% Match
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                      {course.title ? course.title.replace(/&amp;/g, '&') : ''}
                    </h3>

                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 300 }}>{course.contentType || 'VIDEO'}</span>
                      <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Play size={12} fill="currentColor" /> Watch Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
