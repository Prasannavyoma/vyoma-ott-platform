"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import BroadcastButton from './BroadcastButton';
import { handleDeleteCourse } from './actions';

interface CourseItem {
  id: string;
  title: string;
  category: string | null;
  accessLevel: string;
  contentType?: string | null;
  thumbnailUrl: string | null;
  createdAt: Date | string;
  _count: {
    episodes: number;
  };
}

export default function CoursesClientTable({ initialCourses }: { initialCourses: CourseItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('ALL');

  // Extract unique categories for dropdown filter
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    initialCourses.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [initialCourses]);

  // Extract unique access levels for dropdown filter
  const accessLevelsList = useMemo(() => {
    const set = new Set<string>();
    initialCourses.forEach(c => {
      if (c.accessLevel) set.add(c.accessLevel);
    });
    return Array.from(set).sort();
  }, [initialCourses]);

  // Filter courses dynamically based on search query and selected filters
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialCourses.filter(course => {
      // 1. Text search matching title, category, accessLevel, or contentType
      const matchText = !q || (
        course.title.toLowerCase().includes(q) ||
        (course.category && course.category.toLowerCase().includes(q)) ||
        (course.accessLevel && course.accessLevel.toLowerCase().includes(q)) ||
        (course.contentType && course.contentType.toLowerCase().includes(q))
      );

      // 2. Category filter
      const matchCat = selectedCategory === 'ALL' || course.category === selectedCategory;

      // 3. Access Level filter
      const matchAccess = selectedAccessLevel === 'ALL' || course.accessLevel === selectedAccessLevel;

      return matchText && matchCat && matchAccess;
    });
  }, [initialCourses, searchQuery, selectedCategory, selectedAccessLevel]);

  return (
    <div>
      {/* SEARCH & FILTER CONTROLS BAR */}
      <div 
        style={{ 
          background: 'var(--card-bg, #0b121e)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '25px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          
          {/* SEARCH INPUT BAR */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <span 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '1.1rem', 
                color: '#777',
                pointerEvents: 'none'
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, category, access tier..."
              style={{
                width: '100%',
                padding: '12px 40px 12px 42px',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '30px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                transition: 'border-color 0.2s ease'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTER DROPDOWNS */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">📁 All Genres ({initialCourses.length})</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Access Level Filter */}
            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">🛡️ All Access Tiers</option>
              {accessLevelsList.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            {/* Clear All Filters Button */}
            {(searchQuery || selectedCategory !== 'ALL' || selectedAccessLevel !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedAccessLevel('ALL');
                }}
                style={{
                  background: 'rgba(242, 100, 34, 0.15)',
                  border: '1px solid rgba(242, 100, 34, 0.3)',
                  color: 'var(--primary, #f26422)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            )}

          </div>
        </div>

        {/* RESULTS SUMMARY BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#888', paddingTop: '5px' }}>
          <span>
            Showing <strong style={{ color: '#fff' }}>{filteredCourses.length}</strong> of <strong style={{ color: '#fff' }}>{initialCourses.length}</strong> catalog items
          </span>
          {searchQuery && (
            <span>Filtering by query: &ldquo;<strong style={{ color: 'var(--primary, #f26422)' }}>{searchQuery}</strong>&rdquo;</span>
          )}
        </div>
      </div>

      {/* COURSES TABLE */}
      <div style={{ background: 'var(--card-bg, #0b121e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '15px' }}>Thumbnail</th>
              <th style={{ padding: '15px' }}>Title</th>
              <th style={{ padding: '15px' }}>Category</th>
              <th style={{ padding: '15px' }}>Access Tier</th>
              <th style={{ padding: '15px' }}>Modules</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#777' }}>
                  {searchQuery || selectedCategory !== 'ALL' || selectedAccessLevel !== 'ALL' ? (
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔍</div>
                      <div>No courses matching your search criteria.</div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('ALL');
                          setSelectedAccessLevel('ALL');
                        }}
                        style={{ marginTop: '12px', background: 'var(--primary, #f26422)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        Clear Search & Filters
                      </button>
                    </div>
                  ) : (
                    'No course catalog records available.'
                  )}
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '10px 15px' }}>
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt="" style={{ width: '70px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <div style={{ width: '70px', height: '40px', background: '#222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#555' }}>No Banner</div>
                    )}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{course.title}</td>
                  <td style={{ padding: '15px', color: '#aaa' }}>{course.category || 'Uncategorized'}</td>
                  <td style={{ padding: '15px' }}>
                    <span 
                      style={{ 
                        background: course.accessLevel === 'PLATINUM' || course.accessLevel === 'PLATINUM_YEARLY' ? '#e50914' : course.accessLevel === 'GOLD' || course.accessLevel === 'GOLD_YEARLY' ? '#ffd700' : 'var(--primary, #f26422)',
                        color: course.accessLevel === 'GOLD' || course.accessLevel === 'GOLD_YEARLY' ? '#000' : '#fff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {course.accessLevel}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#46d369' }}>{course._count?.episodes || 0}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <BroadcastButton courseId={course.id} courseTitle={course.title} />
                      <Link href={`/admin/courses/${course.id}`} style={{ background: 'rgba(70,211,105,0.1)', border: '1px solid rgba(70,211,105,0.3)', color: '#46d369', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ✎ Edit
                      </Link>
                      
                      <form action={handleDeleteCourse} onSubmit={(e) => {
                        if (!confirm(`Are you sure you want to delete "${course.title}"?`)) {
                          e.preventDefault();
                        }
                      }}>
                          <input type="hidden" name="courseId" value={course.id} />
                          <button style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', color: '#e50914', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }} type="submit">
                            ✕ Trash
                          </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
