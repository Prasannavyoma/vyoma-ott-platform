"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { changePassword } from '../actions/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength logic
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '', percent: 0, isValid: false };
    if (pwd.length < 6) return { label: 'Weak (Too Short)', color: '#ef4444', percent: 25, isValid: false };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score >= 4) return { label: 'Strong Password', color: '#22c55e', percent: 100, isValid: true };
    if (score >= 2) return { label: 'Medium Password', color: '#ffb020', percent: 65, isValid: true };
    return { label: 'Weak Password', color: '#ef4444', percent: 35, isValid: false };
  };

  const strength = getPasswordStrength(password);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!strength.isValid) {
      setError('Please choose a medium or strong password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await changePassword(formData);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
          router.refresh();
        }, 1500);
      } else {
        setError('Failed to update password. Please try again.');
      }
    });
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.95)), url('https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg') center/cover no-repeat`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '460px', 
        backgroundColor: 'rgba(10, 10, 12, 0.85)', 
        borderRadius: '16px', 
        padding: '50px 40px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <img src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '40px', marginBottom: '20px' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Setup New Password</h1>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '8px' }}>This is your first login. To secure your account, please configure a new personal password.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            color: '#ff6b6b', 
            fontSize: '0.85rem', 
            marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ 
            background: 'rgba(34, 197, 94, 0.15)', 
            border: '1px solid rgba(34, 197, 94, 0.4)', 
            borderRadius: '8px', 
            padding: '20px', 
            color: '#4ade80', 
            fontSize: '1rem', 
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            🎉 Password updated successfully! Redirecting you now...
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 600 }}>New Password</label>
              <input 
                type="password" 
                name="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                required
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password strength meter */}
            {password && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: '#aaa' }}>Strength:</span>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'all 0.3s' }}></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 600 }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" 
                required
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isPending || (password !== '' && !strength.isValid)}
              style={{ 
                marginTop: '10px', 
                padding: '15px', 
                justifyContent: 'center', 
                fontSize: '1.05rem', 
                fontWeight: 700,
                cursor: isPending || (password !== '' && !strength.isValid) ? 'not-allowed' : 'pointer',
                opacity: isPending || (password !== '' && !strength.isValid) ? 0.6 : 1,
                boxShadow: '0 8px 24px rgba(242,100,34,0.3)'
              }}
            >
              {isPending ? 'Saving Password...' : 'Save Password & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
