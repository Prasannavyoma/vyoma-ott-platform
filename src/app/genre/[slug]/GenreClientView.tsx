"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  PlayCircle,
  Headphones,
  Mic,
  Layers,
  ChevronDown,
  RotateCcw,
  Check
} from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  contentType?: string;
  accessLevel?: string;
  _count?: {
    episodes?: number;
  };
}

interface GenreClientViewProps {
  categoryName: string;
  slug: string;
  courses: CourseItem[];
}

export default function GenreClientView({ categoryName, slug, courses }: GenreClientViewProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const slugUpper = (slug || '').toUpperCase().trim();
  const isMediaSection = [
    'AUDIOBOOK',
    'AUDIOBOOKS',
    'PODCAST',
    'PODCASTS',
    'VIDEO',
    'VIDEOS',
    'GAME',
    'GAMES',
    'LEARNING-PROGRAM',
    'LEARNING-PROGRAMS',
    'PROGRAM',
    'PROGRAMS',
    'EBOOK',
    'EBOOKS',
    'E-BOOK',
    'E-BOOKS'
  ].includes(slugUpper);

  // Classification helpers for diverse database representations
  const isAudiobook = (c: CourseItem) => {
    const type = c.contentType?.toUpperCase() || '';
    const cat = (c.category || '').toLowerCase();
    return type === 'AUDIOBOOK' || cat.includes('audiobook');
  };

  const isPodcast = (c: CourseItem) => {
    const type = c.contentType?.toUpperCase() || '';
    const cat = (c.category || '').toLowerCase();
    return ['PODCAST', 'AUDIO'].includes(type) || cat.includes('podcast');
  };

  const isEbook = (c: CourseItem) => {
    const type = c.contentType?.toUpperCase() || '';
    const cat = (c.category || '').toLowerCase();
    return ['EBOOK', 'E-BOOK'].includes(type) || cat.includes('ebook') || cat.includes('e-book');
  };

  const isVideo = (c: CourseItem) => {
    const type = c.contentType?.toUpperCase() || '';
    return (!type || type === 'VIDEO') && !isAudiobook(c) && !isPodcast(c) && !isEbook(c);
  };

  // Pre-calculated individual totals
  const totalCount = courses.length;
  const videoCount = useMemo(() => courses.filter(isVideo).length, [courses]);
  const audiobookCount = useMemo(() => courses.filter(isAudiobook).length, [courses]);
  const podcastCount = useMemo(() => courses.filter(isPodcast).length, [courses]);
  const ebookCount = useMemo(() => courses.filter(isEbook).length, [courses]);

  // Media options list (includes E-books permanently)
  const mediaOptions = [
    { id: 'ALL', label: 'All Media', count: totalCount, icon: Layers, color: '#f26422' },
    { id: 'VIDEO', label: 'Videos', count: videoCount, icon: PlayCircle, color: '#f26422' },
    { id: 'AUDIOBOOK', label: 'Audiobooks', count: audiobookCount, icon: Headphones, color: '#a855f7' },
    { id: 'PODCAST', label: 'Podcasts', count: podcastCount, icon: Mic, color: '#38bdf8' },
    { id: 'EBOOK', label: 'E-books', count: ebookCount, icon: BookOpen, color: '#10b981' },
  ];

  const currentOption = mediaOptions.find(o => o.id === selectedType) || mediaOptions[0];
  const CurrentIcon = currentOption.icon;

  // Filtered dataset based on dropdown selection
  const filteredCourses = useMemo(() => {
    if (selectedType === 'VIDEO') return courses.filter(isVideo);
    if (selectedType === 'AUDIOBOOK') return courses.filter(isAudiobook);
    if (selectedType === 'PODCAST') return courses.filter(isPodcast);
    if (selectedType === 'EBOOK') return courses.filter(isEbook);
    return courses;
  }, [courses, selectedType]);

  // Dynamic counter label, value, and badge styling
  let activeCount = totalCount;
  let activeLabel = 'Total';
  let activeUnit = totalCount === 1 ? 'Title' : 'Titles';
  let activeIcon = (
    <span
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: totalCount > 0 ? '#46d369' : '#f26422',
        boxShadow: totalCount > 0 ? '0 0 10px #46d369' : '0 0 10px rgba(242, 100, 34, 0.6)'
      }}
    />
  );

  if (selectedType === 'VIDEO') {
    activeCount = videoCount;
    activeLabel = 'Videos';
    activeUnit = videoCount === 1 ? 'Video' : 'Videos';
    activeIcon = <PlayCircle size={15} color="#f26422" />;
  } else if (selectedType === 'AUDIOBOOK') {
    activeCount = audiobookCount;
    activeLabel = 'Audiobooks';
    activeUnit = audiobookCount === 1 ? 'Audiobook' : 'Audiobooks';
    activeIcon = <Headphones size={15} color="#a855f7" />;
  } else if (selectedType === 'PODCAST') {
    activeCount = podcastCount;
    activeLabel = 'Podcasts';
    activeUnit = podcastCount === 1 ? 'Podcast' : 'Podcasts';
    activeIcon = <Mic size={15} color="#38bdf8" />;
  } else if (selectedType === 'EBOOK') {
    activeCount = ebookCount;
    activeLabel = 'E-books';
    activeUnit = ebookCount === 1 ? 'E-book' : 'E-books';
    activeIcon = <BookOpen size={15} color="#10b981" />;
  }

  return (
    <main style={{
      padding: '160px 5% 80px',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #141b2d 0%, #080b12 70%)',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Top Navigation Row: Back Button on Left, Dropdown Filter + Dynamic Count on Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '35px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          {/* Back to Home Button */}
          <Link
            href="/"
            className="back-btn-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '30px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              fontWeight: 700,
              textDecoration: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          {/* Right Controls: Media Dropdown Selector (for Genre pages only) + Count Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Custom Glassmorphic Media Dropdown: Only shown for Genre pages, hidden for Media section pages */}
            {!isMediaSection && (
              <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  type="button"
                  id="genre-media-dropdown-btn"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="listbox"
                  className="genre-dropdown-trigger"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 18px',
                    borderRadius: '30px',
                    background: dropdownOpen ? 'rgba(242, 100, 34, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    border: dropdownOpen ? '1px solid rgba(242, 100, 34, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    backdropFilter: 'blur(12px)',
                    boxShadow: dropdownOpen ? '0 0 20px rgba(242, 100, 34, 0.25)' : '0 4px 15px rgba(0,0,0,0.2)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <CurrentIcon size={15} color={currentOption.color} />
                  <span>{currentOption.label}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: '#94a3b8',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>

                {/* Custom Glass Popover Menu */}
                {dropdownOpen && (
                  <div
                    role="listbox"
                    className="genre-dropdown-popover"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      minWidth: '200px',
                      background: 'rgba(11, 16, 28, 0.96)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '16px',
                      padding: '6px',
                      boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(242, 100, 34, 0.15)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    {mediaOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = selectedType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedType(opt.id);
                            setDropdownOpen(false);
                          }}
                          className={`genre-dropdown-item ${isSelected ? 'active' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(242, 100, 34, 0.14)' : 'transparent',
                            border: isSelected ? '1px solid rgba(242, 100, 34, 0.35)' : '1px solid transparent',
                            color: isSelected ? '#fff' : '#cbd5e1',
                            fontSize: '0.85rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon size={15} color={opt.color} />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <Check size={14} color="#f26422" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Total / Dynamic Count Display Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                fontSize: '0.85rem',
                minWidth: '130px',
                justifyContent: 'center',
                transition: 'all 0.25s ease'
              }}
            >
              {isMediaSection ? (
                <>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: totalCount > 0 ? '#46d369' : '#f26422',
                      boxShadow: totalCount > 0 ? '0 0 10px #46d369' : '0 0 10px rgba(242, 100, 34, 0.6)'
                    }}
                  />
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>Total:</span>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{totalCount}</span>
                  <span style={{ color: '#cbd5e1' }}>{totalCount === 1 ? 'Title' : 'Titles'}</span>
                </>
              ) : (
                <>
                  {activeIcon}
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>{activeLabel}:</span>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{activeCount}</span>
                  <span style={{ color: '#cbd5e1' }}>{activeUnit}</span>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Header Title Section */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            {categoryName}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, maxWidth: '700px' }}>
            Explore authentic courses, audiobooks, and learning materials under {categoryName}.
          </p>
        </div>

        {/* Courses Grid or Empty State */}
        {courses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            maxWidth: '600px',
            margin: '40px auto'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(242, 100, 34, 0.1)',
              border: '1px solid rgba(242, 100, 34, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--primary, #f26422)'
            }}>
              <BookOpen size={32} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px', color: '#fff' }}>
              No content in this category yet
            </h3>
            <p style={{ color: '#8f98a9', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '25px' }}>
              We are actively curating more content for {categoryName}. In the meantime, browse our extensive catalog of courses!
            </p>
            <Link
              href="/explore"
              className="btn btn-primary premium-glow-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '0.95rem'
              }}
            >
              <Compass size={18} />
              <span>Explore All Courses</span>
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            maxWidth: '550px',
            margin: '40px auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px', color: '#fff' }}>
              No {activeLabel.toLowerCase()} found
            </h3>
            <p style={{ color: '#8f98a9', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
              There are no {activeLabel.toLowerCase()} currently available under {categoryName}.
            </p>
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '30px',
                background: 'rgba(242, 100, 34, 0.15)',
                border: '1px solid rgba(242, 100, 34, 0.4)',
                color: '#f26422',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              <span>Show All Content ({totalCount})</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '25px'
          }}>
            {filteredCourses.map((course) => (
              <Link
                href={`/watch/${course.id}`}
                key={course.id}
                className="poster"
                style={{
                  width: '100%',
                  height: '200px',
                  position: 'relative',
                  display: 'block',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
              >
                <img
                  src={course.thumbnailUrl || '/images/default-course.jpg'}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  className="poster-overlay"
                  style={{
                    opacity: 1,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px'
                  }}
                >
                  <div className="poster-title" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                    {course.title}
                  </div>
                  <div className="poster-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#46d369', fontWeight: 700 }}>{course.accessLevel || 'FREE'}</span>
                    {course.contentType && (
                      <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {course.contentType}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
