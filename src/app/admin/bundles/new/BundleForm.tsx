'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBundle } from '@/app/actions/bundles';

export default function BundleForm({ courses }: { courses: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const validityDaysStr = formData.get('validityDays') as string;
    const validityDays = validityDaysStr ? parseInt(validityDaysStr) : null;

    if (selectedCourses.length === 0) {
      setError('You must select at least one course for the bundle.');
      setLoading(false);
      return;
    }

    const result = await createBundle({
      title,
      description,
      price,
      validityDays,
      courseIds: selectedCourses
    });

    if (result.success) {
      router.push('/admin/bundles');
    } else {
      setError(result.error || 'Failed to create bundle');
      setLoading(false);
    }
  }

  const toggleCourse = (id: string) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
      
      {error && (
        <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#aaa' }}>Bundle Title *</label>
          <input required name="title" type="text" placeholder="E.g., Complete Sanskrit Mastery Bundle" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#aaa' }}>Description *</label>
          <textarea required name="description" rows={4} placeholder="Describe what's included and the benefits..." style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#aaa' }}>Bundle Price (₹) *</label>
            <input required name="price" type="number" step="0.01" min="0" placeholder="999.00" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#aaa' }}>Validity (Days)</label>
            <input name="validityDays" type="number" min="1" placeholder="Leave empty for lifetime access" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '15px', fontWeight: 600, color: '#aaa' }}>Select Included Courses *</label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {courses.map(course => {
              const isSelected = selectedCourses.includes(course.id);
              return (
                <div 
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  style={{
                    background: isSelected ? 'rgba(70,211,105,0.1)' : '#000',
                    border: isSelected ? '1px solid #46d369' : '1px solid #333',
                    padding: '15px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <div style={{ 
                    width: '20px', height: '20px', 
                    borderRadius: '4px', 
                    border: isSelected ? 'none' : '1px solid #555',
                    background: isSelected ? '#46d369' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    {isSelected && <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{course.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#777' }}>₹{course.price || 'Free'} • {course.accessLevel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: loading ? '#555' : 'var(--primary)', 
              color: '#fff', 
              padding: '14px 30px', 
              borderRadius: '8px', 
              fontWeight: 900, 
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Creating...' : 'Create Bundle Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
