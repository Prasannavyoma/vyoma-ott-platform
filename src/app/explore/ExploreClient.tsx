"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ExploreClient({ initialCourses }: { initialCourses: any[] }) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<string>('All');
  const [selectedContentType, setSelectedContentType] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('Newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const categories = useMemo(() => {
    const cats = new Set(initialCourses.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [initialCourses]);

  const accessLevels = ['All', 'FREE', 'PAID', 'GOLD', 'PLATINUM'];
  const contentTypes = ['All', 'VIDEO', 'AUDIOBOOK', 'PODCAST', 'GAME', 'EBOOK', 'PROGRAM'];
  const sortOptions = ['Newest', 'Oldest', 'Most Viewed', 'Alphabetical', 'Price Low to High'];

  useEffect(() => {
    if (initialFilter) {
      // If the incoming filter title contains known category keywords
      const upperFilter = initialFilter.toUpperCase();
      const matchCat = categories.find(c => c !== 'All' && upperFilter.includes(c.toUpperCase()));
      if (matchCat) {
        setSelectedCategory(matchCat);
      }
    }
  }, [initialFilter, categories]);

  const filteredCourses = useMemo(() => {
    let result = initialCourses.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedAccess !== 'All' && c.accessLevel !== selectedAccess) return false;
      if (selectedContentType !== 'All' && c.contentType !== selectedContentType) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().replace(/&amp;/g, '&');
        const titleClean = (c.title || '').toLowerCase().replace(/&amp;/g, '&');
        const descClean = (c.description || '').toLowerCase().replace(/&amp;/g, '&');
        const catClean = (c.category || '').toLowerCase().replace(/&amp;/g, '&');
        
        const titleMatch = titleClean.includes(query);
        const descMatch = descClean.includes(query);
        const catMatch = catClean.includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });

    if (selectedSort === 'Oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (selectedSort === 'Alphabetical') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (selectedSort === 'Most Viewed') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedSort === 'Price Low to High') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else { // Newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [initialCourses, selectedCategory, selectedAccess, selectedContentType, selectedSort, searchQuery]);

  return (
    <div style={{ padding: '120px 5% 80px', display: 'flex', gap: '40px', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 950, textShadow: '0 4px 20px rgba(242,100,34,0.3)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px', color: '#fff' }}>
          <span>🧭</span> Explore Hub
        </h1>
        <p style={{ color: '#aaa', fontSize: '1.15rem', marginTop: '10px', maxWidth: '600px', lineHeight: '1.6' }}>Discover our massive library of premium Sanskrit education, epics, audiobooks, and more.</p>
      </div>

      <div className="explore-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* SIDEBAR FILTER PANEL - GLASSMORPHIC */}
        <aside style={{ 
          background: 'rgba(20, 20, 22, 0.7)', 
          backdropFilter: 'blur(20px)',
          padding: '30px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
          position: 'sticky', 
          top: '90px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
               Filters
             </h3>
             {(selectedCategory !== 'All' || selectedAccess !== 'All' || selectedContentType !== 'All' || selectedSort !== 'Newest' || searchQuery.trim() !== '') && (
                <button 
                  onClick={() => { setSelectedCategory('All'); setSelectedAccess('All'); setSelectedContentType('All'); setSelectedSort('Newest'); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: 0.8 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                >
                  Clear All
                </button>
             )}
          </div>
          
          {/* SEARCH INPUT */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Search</h4>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search titles, descriptions..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px 12px 40px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div style={{ marginBottom: '35px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Categories</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{ 
                       background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                       color: isActive ? '#fff' : '#ccc',
                       border: `1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                       padding: '8px 16px',
                       borderRadius: '20px',
                       fontSize: '0.85rem',
                       fontWeight: isActive ? 800 : 500,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       boxShadow: isActive ? '0 4px 15px rgba(242,100,34,0.4)' : 'none'
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    {cat ? cat.replace(/&amp;/g, '&') : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACCESS PILLS */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Access Tier</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {accessLevels.map(lvl => {
                 const isActive = selectedAccess === lvl;
                 let badgeColor = '#fff';
                 if(lvl === 'PLATINUM') badgeColor = '#e5e4e2';
                 if(lvl === 'GOLD') badgeColor = '#ffd700';
                 if(lvl === 'PAID') badgeColor = '#46d369';
                 
                 return (
                  <button
                    key={lvl} 
                    onClick={() => setSelectedAccess(lvl)}
                    style={{ 
                       background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                       color: isActive ? '#fff' : '#aaa',
                       border: '1px solid',
                       borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                       padding: '10px 15px',
                       borderRadius: '8px',
                       fontSize: '0.95rem',
                       fontWeight: isActive ? 700 : 500,
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       transition: 'all 0.2s',
                       textAlign: 'left'
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{lvl}</span>
                    {isActive && <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span>}
                  </button>
                 );
              })}
            </div>
          </div>

          {/* CONTENT TYPE PILLS */}
          <div style={{ marginTop: '35px', marginBottom: '35px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Content Type</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {contentTypes.map(type => {
                const isActive = selectedContentType === type;
                return (
                  <button
                    key={type} 
                    onClick={() => setSelectedContentType(type)}
                    style={{ 
                       background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                       color: isActive ? '#fff' : '#ccc',
                       border: `1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                       padding: '8px 16px',
                       borderRadius: '20px',
                       fontSize: '0.85rem',
                       fontWeight: isActive ? 800 : 500,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       boxShadow: isActive ? '0 4px 15px rgba(242,100,34,0.4)' : 'none'
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

        </aside>

        {/* RESULTS GRID */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              {selectedCategory === 'All' ? 'All Content' : (selectedCategory ? selectedCategory.replace(/&amp;/g, '&') : '')}
              {selectedAccess !== 'All' && <span style={{ opacity: 0.5, fontSize: '1rem', marginLeft: '10px', fontWeight: 500 }}>| {selectedAccess}</span>}
              {selectedContentType !== 'All' && <span style={{ opacity: 0.5, fontSize: '1rem', marginLeft: '10px', fontWeight: 500 }}>| {selectedContentType}</span>}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <select 
                value={selectedSort}
                onChange={e => setSelectedSort(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {sortOptions.map(opt => <option key={opt} value={opt} style={{ background: '#121214' }}>Sort: {opt}</option>)}
              </select>
              <span style={{ background: 'rgba(242,100,34,0.15)', color: 'var(--primary)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                {filteredCourses.length} Titles
              </span>
            </div>
          </div>
          
          {filteredCourses.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '4rem', marginBottom: '20px', display: 'block', opacity: 0.5 }}>🧭</span>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No matches found</h3>
                <p style={{ color: '#777', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Try adjusting your filters to discover more content from our library.</p>
                <button 
                  onClick={() => { setSelectedCategory('All'); setSelectedAccess('All'); setSearchQuery(''); }}
                  style={{ marginTop: '30px', padding: '12px 30px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', boxShadow: '0 5px 20px rgba(242,100,34,0.4)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Clear All Filters
                </button>
             </div>
          ) : (
            <div className="explore-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '35px' }}>
              {filteredCourses.map(course => (
                <Link 
                  href={`/watch/${course.id}`} 
                  key={course.id} 
                  className="poster explore-poster" 
                  style={{ 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    position: 'relative', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    background: '#121214',
                    border: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    display: 'block'
                  }}
                >
                  <img 
                    src={course.thumbnailUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg'} 
                    alt={course.imageAlt || (course.title ? course.title.replace(/&amp;/g, '&') : '')} 
                    className="explore-poster-img"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} 
                  />
                  
                  {/* NEWLY ADDED RIBBON */}
                  {course.showRibbon && (
                     <div className="new-ribbon" style={{ zIndex: 5 }}>Newly Added</div>
                  )}
 
                  {/* Middle Play Icon (Transparent / Glassmorphic) */}
                  <div className="middle-play-btn">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>

                  <div className="poster-overlay" style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '20px',
                    transition: 'opacity 0.3s ease'
                  }}>
                    <div className="poster-title" style={{ fontSize: '1.25rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.9)', marginTop: '10px', letterSpacing: '-0.3px' }}>{course.title ? course.title.replace(/&amp;/g, '&') : ''}</div>
                    <div className="poster-meta" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="poster-tag" style={{ background: course.accessLevel === 'PLATINUM' ? 'linear-gradient(135deg, #e5e4e2, #b0b0b0)' : course.accessLevel === 'GOLD' ? 'linear-gradient(135deg, #ffd700, #b8860b)' : 'rgba(255,255,255,0.15)', color: (course.accessLevel === 'PLATINUM' || course.accessLevel === 'GOLD') ? '#000' : '#fff', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {course.accessLevel}
                      </span>
                      {course.category && (
                        <span style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {course.category ? course.category.replace(/&amp;/g, '&') : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
 
      </div>
      
      {/* Interactive hover scale CSS for posters */}
      <style dangerouslySetInnerHTML={{__html: `
        .explore-poster {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s;
        }
        .explore-poster:hover {
          transform: scale(1.04) translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(242,100,34,0.3);
          border-color: rgba(242,100,34,0.2) !important;
          z-index: 10;
        }
        .explore-poster:hover .explore-poster-img {
          transform: scale(1.08);
        }
        @media (max-width: 900px) {
          .explore-layout {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: static !important;
          }
        }
        @media (max-width: 600px) {
           .explore-grid {
             grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
             gap: 20px !important;
           }
           .explore-poster:hover {
             transform: scale(1.02); /* Less dramatic scaling on mobile */
           }
        }
      `}} />
    </div>
  );
}
