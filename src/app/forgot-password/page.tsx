'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)', color: '#fff', padding: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '50px', borderRadius: '24px', maxWidth: '450px', width: '100%', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '20px', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Recover Password
        </h1>
        <p style={{ color: '#8f98a9', marginBottom: '30px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Enter the email address associated with your account and we'll send you a secure link to reset your password.
        </p>

        {success ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <strong>Email Sent!</strong>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>If an account exists with that email, a password reset link has been dispatched.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Email Address</label>
              <input 
                type="email" 
                name="email" 
                required
                style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isPending}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, transition: 'all 0.3s ease', marginTop: '10px' }}
            >
              {isPending ? 'Sending...' : 'Send Recovery Link'}
            </button>
          </form>
        )}
        
        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <Link href="/login" style={{ color: '#8f98a9', textDecoration: 'none', fontSize: '0.95rem' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
