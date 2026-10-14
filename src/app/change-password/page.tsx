"use client";

import { getPasswordStrength, validatePassword } from '@/lib/passwordValidation';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../actions/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(password);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) {
      setError(pwdCheck.error || 'Password cannot start with a space or be blank.');
      return;
    }
    if (!strength.isValid) {
      setError(strength.error || 'Please choose a medium or strong password.');
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
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.95)), url('/assets/Ayodhyakanda.jpg') center/cover no-repeat`,
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
          <img src="/assets/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '40px', marginBottom: '20px' }} />
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
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={password}
                  onKeyDown={(e) => {
                    if (e.key === ' ' && (e.currentTarget.selectionStart === 0 || password.length === 0)) {
                      e.preventDefault();
                      setError('Password cannot start with a space or be blank.');
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.startsWith(' ')) {
                      val = val.replace(/^\s+/, '');
                      setError('Password cannot start with a space.');
                    } else if (val.includes(' ')) {
                      val = val.replace(/\s+/g, '');
                      setError('Password cannot contain spaces.');
                    } else if (error && (error.includes('space') || error.includes('blank'))) {
                      setError('');
                    }
                    setPassword(val);
                  }}
                  placeholder="Enter password (no spaces)" 
                  required
                  style={{
                    width: '100%',
                    padding: '14px 45px 14px 18px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8f98a9', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
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
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onKeyDown={(e) => {
                    if (e.key === ' ' && (e.currentTarget.selectionStart === 0 || confirmPassword.length === 0)) {
                      e.preventDefault();
                      setError('Confirm password cannot start with a space.');
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.startsWith(' ')) {
                      val = val.replace(/^\s+/, '');
                      setError('Confirm password cannot start with a space.');
                    } else if (val.includes(' ')) {
                      val = val.replace(/\s+/g, '');
                      setError('Confirm password cannot contain spaces.');
                    } else if (error && (error.includes('space') || error.includes('blank'))) {
                      setError('');
                    }
                    setConfirmPassword(val);
                  }}
                  placeholder="Re-enter password" 
                  required
                  style={{
                    width: '100%',
                    padding: '14px 45px 14px 18px',
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8f98a9', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isPending || !password.trim() || !strength.isValid || !confirmPassword.trim() || confirmPassword !== password}
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
