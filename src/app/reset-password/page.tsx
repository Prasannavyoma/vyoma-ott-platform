'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordWithToken } from '@/app/actions/auth';
import Link from 'next/link';

import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    formData.append('token', token || '');

    startTransition(async () => {
      const res = await resetPasswordWithToken(formData);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)', color: '#fff', padding: '20px' }}>
      <div className="auth-container" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '20px', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Set New Password
        </h1>

        {success ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <strong>Success!</strong>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Your password has been reset successfully. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>New Password</label>
              <input 
                type="password" 
                name="password" 
                required
                disabled={!token}
                style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Confirm New Password</label>
              <input 
                type="password" 
                name="confirm" 
                required
                disabled={!token}
                style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isPending || !token}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', cursor: (isPending || !token) ? 'not-allowed' : 'pointer', opacity: (isPending || !token) ? 0.7 : 1, transition: 'all 0.3s ease', marginTop: '10px' }}
            >
              {isPending ? 'Updating...' : 'Set Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#090A0F', color: '#fff' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
