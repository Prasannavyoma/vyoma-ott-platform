"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { loginUser, loginWithGoogleAction } from '../actions/auth';

interface LoginFormClientProps {
  allowPassword: boolean;
  allowGoogle: boolean;
  googleClientId: string;
}

export default function LoginFormClient({ allowPassword, allowGoogle, googleClientId }: LoginFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sync email from query string if available
  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  // Bind Google Credential Callback to global window object
  useEffect(() => {
    if (allowGoogle && typeof window !== 'undefined') {
      (window as any).handleGoogleCredential = async (response: any) => {
        const idToken = response.credential;
        startTransition(async () => {
          const referrerId = searchParams.get('ref') || undefined;
          const res = await loginWithGoogleAction(idToken, referrerId);
          if (res && res.error) {
            setError(res.error);
          } else if (res && res.success) {
            const redirectUrl = searchParams.get('redirect') || '/';
            router.push(redirectUrl);
            router.refresh();
          } else {
            setError('Google Sign-in failed.');
          }
        });
      };
    }
  }, [allowGoogle, searchParams, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    
    if (!allowPassword) {
      setError('Password-based login is disabled.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginUser(formData);
      if (res && res.error) {
        if (res.error === 'force_password_change') {
          setError('Welcome to Vyoma 2.0! We have migrated your account. For security, please click "Forgot Password" below to set a new password.');
        } else {
          setError(res.error);
        }
      } else if (res && res.success) {
        if (res.forcePasswordChange) {
          router.push('/change-password');
        } else {
          const redirectUrl = searchParams.get('redirect') || '/';
          router.push(redirectUrl);
        }
        router.refresh();
      } else {
        setError('Login failed. Please try again.');
      }
    });
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url('/assets/Ayodhyakanda.jpg') center/cover no-repeat`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'inherit',
      color: 'white',
      position: 'relative',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Load Google Identity Services SDK */}
      {allowGoogle && googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      )}

      <div style={{ position: 'absolute', top: '30px', left: '5%' }}>
         <Link href="/"><img src="/assets/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '45px' }} /></Link>
      </div>
      
      <div className="login-card" style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '450px', 
        background: 'rgba(20, 20, 22, 0.75)', 
        borderRadius: '16px', 
        padding: '50px 50px 40px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
        margin: '20px',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.5 }}></div>

        {/* Close Icon */}
        <Link href="/" style={{ 
          position: 'absolute', right: '20px', top: '20px', 
          color: '#fff', fontSize: '1.2rem', textDecoration: 'none', 
          width: '32px', height: '32px', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s',
          fontWeight: 'bold'
        }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>✕</Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '30px' }}>Sign In</h1>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '6px', 
            padding: '12px 16px', 
            color: '#ff6b6b', 
            fontSize: '0.9rem', 
            marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Standard Password Login Form */}
        {allowPassword ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="text" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Username" 
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.3s ease'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              required
            />
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                name="password" 
                placeholder="Password" 
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.3s ease'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '5px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            
            {/* Honeypot */}
            <input 
              type="text" 
              name="website_verify" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ display: 'none', opacity: 0, position: 'absolute', zIndex: -999 }} 
            />
            
            <button 
              type="submit" 
              className="btn btn-primary premium-glow-btn" 
              disabled={isPending}
              style={{ 
                marginTop: '20px', 
                padding: '16px', 
                justifyContent: 'center', 
                fontSize: '1.1rem', 
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                border: 'none'
              }}
            >
              {isPending ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#b3b3b3' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="rememberMe" defaultChecked /> Remember me
              </label>
              <Link href="/forgot-password" style={{ color: '#b3b3b3', textDecoration: 'none' }}>Need help?</Link>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#aaa', fontSize: '0.95rem' }}>
            Password sign-in has been disabled by the administrator. Please authenticate using Google below.
          </div>
        )}

        {/* Google SSO Login */}
        {allowGoogle && googleClientId && (
          <>
            {allowPassword && (
              <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>OR</div>
                <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <div id="g_id_onload"
                   data-client_id={googleClientId}
                   data-context="signin"
                   data-ux_mode="popup"
                   data-callback="handleGoogleCredential"
                   data-auto_prompt="false">
              </div>
              <div className="g_id_signin"
                   data-type="standard"
                   data-shape="rectangular"
                   data-theme="filled_blue"
                   data-text="continue_with"
                   data-size="large"
                   data-logo_alignment="left"
                   data-width="314">
              </div>
            </div>
          </>
        )}
        
        <div style={{ marginTop: '40px', color: '#737373', fontSize: '0.95rem' }}>
          New to Vyoma? <Link href="/register" style={{ color: 'white', textDecoration: 'none' }}>Sign up now.</Link>
        </div>
      </div>
    </div>
  );
}
