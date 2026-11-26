import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import BackToHomeButton from '@/app/components/BackToHomeButton';
import { getUserWatchlist } from '@/app/actions/ott';
import { getCurrentUser } from '@/lib/auth';
import { Bookmark, Sparkles, Compass, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  const watchlistCourses = await getUserWatchlist();

  return (
    <div style={{ minHeight: '100vh', background: '#030b17', color: '#fff', fontFamily: "'Futura', 'Futura PT', 'Jost', 'Outfit', 'Inter', system-ui, sans-serif" }}>
      <NavBar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '160px 24px 80px 24px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <BackToHomeButton label="← BACK TO HOME" />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem' }}>🔖</span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                  My List / Favorites
                </h1>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '680px', lineHeight: '1.6', margin: 0, fontWeight: 300 }}>
                All the Sanskrit masterclasses, episodes, and sacred texts you've saved to your private watchlist.
              </p>
            </div>

            {watchlistCourses.length > 0 && (
              <span style={{ 
                background: 'rgba(242, 100, 34, 0.15)', 
                color: '#f26422', 
                border: '1px solid rgba(242, 100, 34, 0.3)',
                padding: '8px 16px', 
                borderRadius: '20px', 
                fontSize: '0.9rem', 
                fontWeight: 500 
              }}>
                {watchlistCourses.length} {watchlistCourses.length === 1 ? 'Item' : 'Items'} Saved
              </span>
            )}
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, #f26422 0%, rgba(242,100,34,0) 100%)', width: '120px', marginTop: '24px', borderRadius: '2px' }} />
        </div>

        {/* Not Logged In Notice */}
        {!user ? (
          <div style={{ 
            padding: '60px 24px', 
            background: 'rgba(15, 23, 42, 0.5)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '20px', 
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
              Sign In to Access Your Favorites
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', fontWeight: 300 }}>
              Your watchlist is synced securely across all your devices once you log in to your DigitalSanskrit account.
            </p>
            <Link 
              href="/login" 
              style={{ 
                background: 'var(--primary, #f26422)', 
                color: '#fff', 
                padding: '12px 30px', 
                borderRadius: '30px', 
                textDecoration: 'none', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                display: 'inline-block',
                boxShadow: '0 4px 15px rgba(242,100,34,0.4)',
                letterSpacing: '0.3px'
              }}
            >
              Sign In Now →
            </Link>
          </div>
        ) : watchlistCourses.length === 0 ? (
          /* Empty Watchlist State */
          <div style={{ 
            padding: '80px 24px', 
            background: 'rgba(15, 23, 42, 0.4)', 
            border: '1px dashed rgba(255,255,255,0.1)', 
            borderRadius: '20px', 
            textAlign: 'center',
            maxWidth: '680px',
            margin: '30px auto'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📂</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
              Your Watchlist is Empty
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px', fontWeight: 300 }}>
              You haven't bookmarked any items yet. Look for the <strong>+ My List</strong> button while browsing courses or watching trailers to save them here for quick access.
            </p>
            <Link 
              href="/explore" 
              style={{ 
                background: 'var(--primary, #f26422)', 
                color: '#fff', 
                padding: '12px 28px', 
                borderRadius: '30px', 
                textDecoration: 'none', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.3px'
              }}
            >
              <Compass size={18} /> Explore Catalog
            </Link>
          </div>
        ) : (
          /* Grid of Saved Courses */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {watchlistCourses.map((course: any) => (
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
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Thumbnail Banner */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#020617' }}>
                    <img 
                      src={course.thumbnailUrl || 'https://placehold.co/600x340/111/fff?text=Vyoma+OTT'} 
                      alt={course.title || 'Course thumbnail'} 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                    
                    {/* Access Tier Pill */}
                    {course.accessLevel && (
                      (() => {
                      const lvlUpper = String(course.accessLevel).toUpperCase();
                      const isPlatinum = lvlUpper.startsWith('PLATINUM');
                      const isGold = lvlUpper.startsWith('GOLD');
                      const isFree = lvlUpper === 'FREE';

                      const bg = isPlatinum 
                        ? 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)' 
                        : isGold 
                          ? 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)' 
                          : 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)';

                      const border = isPlatinum
                        ? '1px solid rgba(255,255,255,0.6)'
                        : isGold
                          ? '1px solid rgba(255,235,100,0.6)'
                          : '1px solid rgba(134,239,172,0.7)';

                      const icon = isPlatinum ? '💎' : isGold ? '👑' : '🔓';
                      const label = course.accessLevel.replace(/_/g, ' ');

                      return (
                        <span style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '0.65rem', 
                          fontWeight: 600,
                          background: bg,
                          color: '#000',
                          border: border,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{icon}</span>
                          <span>{label}</span>
                        </span>
                      );
                    })()
                  )}

                    {/* In Watchlist Ribbon */}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#46d369',
                      border: '1px solid rgba(70,211,105,0.4)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>✔</span> In List
                    </span>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {course.category || 'Sanskrit OTT'}
                      </span>
                      <span style={{ color: '#46d369', fontSize: '0.75rem', fontWeight: 600 }}>
                        99% Match
                      </span>
                    </div>

                    <h3 style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: 600, 
                      color: '#f8fafc', 
                      margin: '0 0 8px 0', 
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {course.title ? course.title.replace(/&amp;/g, '&') : ''}
                    </h3>

                    <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 300 }}>
                        {course.contentType || 'VIDEO'}
                      </span>
                      <span style={{ 
                        color: 'var(--primary, #f26422)', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Play size={12} fill="currentColor" /> Watch Now
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
