"use client";

import { useState } from 'react';
import { submitTestimonial } from '@/app/actions/testimonials';

export default function SubmitTestimonialClient() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await submitTestimonial(fd);
      setSuccess(true);
      e.currentTarget.reset();
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: 'rgba(70, 211, 105, 0.1)', border: '1px solid rgba(70, 211, 105, 0.3)', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ color: '#46d369', margin: '0 0 10px 0', fontSize: '2rem' }}>🎉 Thank You!</h2>
        <p style={{ color: '#ccc', fontSize: '1.1rem' }}>Your testimonial has been successfully submitted and is pending review by our team.</p>
        <button onClick={() => setSuccess(false)} style={{ marginTop: '20px', padding: '10px 20px', background: 'transparent', border: '1px solid #46d369', color: '#46d369', borderRadius: '8px', cursor: 'pointer' }}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Your Name *</label>
        <input name="name" required placeholder="John Doe" style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '1rem' }} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Your Role / Title</label>
        <input name="role" placeholder="e.g. Sanskrit Student, Engineer, Scholar..." style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '1rem' }} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Your Experience *</label>
        <textarea name="content" required placeholder="Tell us what you loved about learning with Vyoma..." rows={6} style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '1rem' }} />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Rating *</label>
        <select name="rating" required style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '1rem' }}>
          <option value="5">⭐⭐⭐⭐⭐ (5/5) Excellent</option>
          <option value="4">⭐⭐⭐⭐ (4/5) Very Good</option>
          <option value="3">⭐⭐⭐ (3/5) Average</option>
          <option value="2">⭐⭐ (2/5) Poor</option>
          <option value="1">⭐ (1/5) Terrible</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary premium-glow-btn" style={{ width: '100%', padding: '15px', fontSize: '1.2rem', borderRadius: '12px' }}>
        {loading ? 'Submitting...' : 'Submit Testimonial'}
      </button>
    </form>
  );
}
