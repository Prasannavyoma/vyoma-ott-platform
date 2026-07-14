"use client";

import { useState } from 'react';
import { adminCreateTestimonial, updateTestimonialStatus, deleteTestimonial } from '@/app/actions/testimonials';

export default function TestimonialsClient({ testimonials }: { testimonials: any[] }) {
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  async function handleStatus(id: string, status: string) {
    setLoading(true);
    try {
      await updateTestimonialStatus(id, status);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if(!confirm('Delete this testimonial permanently?')) return;
    setLoading(true);
    try {
      await deleteTestimonial(id);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await adminCreateTestimonial(fd);
      setIsAdding(false);
      e.currentTarget.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 'bold' }}>
          {isAdding ? 'Cancel' : '+ Add Testimonial Manually'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} style={{ background: '#111', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Upload New Testimonial</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input name="name" placeholder="Author Name" required className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
            <input name="role" placeholder="Role (e.g., Student)" className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
          </div>
          <textarea name="content" placeholder="Testimonial Content..." required rows={4} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px', marginBottom: '15px' }} />
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label>Rating:</label>
            <input type="number" name="rating" min="1" max="5" defaultValue="5" required style={{ padding: '5px', background: '#222', color: 'white', border: '1px solid #444', width: '60px' }} />
            <select name="status" style={{ padding: '5px', background: '#222', color: 'white', border: '1px solid #444' }}>
              <option value="APPROVED">APPROVED (Live)</option>
              <option value="PENDING">PENDING</option>
            </select>
            <button type="submit" disabled={loading} style={{ marginLeft: 'auto', padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Save Testimonial'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {testimonials.length === 0 && <p style={{ color: '#666' }}>No testimonials found.</p>}
        {testimonials.map(t => (
          <div key={t.id} style={{ 
            background: 'linear-gradient(to right, #0f1624, #070b14)', 
            border: t.status === 'APPROVED' ? '1px solid rgba(70, 211, 105, 0.4)' : t.status === 'PENDING' ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid #333',
            padding: '20px', 
            borderRadius: '12px',
            display: 'flex',
            gap: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.1rem' }}>{t.name}</strong>
                {t.role && <span style={{ color: '#888', fontSize: '0.9rem' }}>- {t.role}</span>}
                <span style={{ color: '#ffd700' }}>{'★'.repeat(t.rating)}</span>
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.75rem', 
                  padding: '3px 8px', 
                  borderRadius: '10px',
                  background: t.status === 'APPROVED' ? 'rgba(70,211,105,0.1)' : t.status === 'PENDING' ? 'rgba(255,193,7,0.1)' : 'rgba(255,0,0,0.1)',
                  color: t.status === 'APPROVED' ? '#46d369' : t.status === 'PENDING' ? '#ffc107' : '#ff4d4f',
                  fontWeight: 'bold'
                }}>
                  {t.status}
                </span>
              </div>
              <p style={{ color: '#ccc', fontStyle: 'italic', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>"{t.content}"</p>
              <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '10px' }}>
                Submitted: {new Date(t.createdAt).toLocaleString()} {t.userId ? `| User ID: ${t.userId}` : ''}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
              {t.status !== 'APPROVED' && (
                <button onClick={() => handleStatus(t.id, 'APPROVED')} disabled={loading} style={{ padding: '6px', background: 'rgba(70,211,105,0.1)', color: '#46d369', border: '1px solid rgba(70,211,105,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  ✓ Approve
                </button>
              )}
              {t.status !== 'REJECTED' && t.status !== 'PENDING' && (
                <button onClick={() => handleStatus(t.id, 'PENDING')} disabled={loading} style={{ padding: '6px', background: 'rgba(255,193,7,0.1)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Set Pending
                </button>
              )}
              <button onClick={() => handleDelete(t.id)} disabled={loading} style={{ padding: '6px', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', marginTop: 'auto' }}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
