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
            const redirectUrl = searchParams.get('redirect') || '/profile';
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
          const redirectUrl = searchParams.get('redirect') || '/profile';
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
      position: 'relative'
    }}>
      {/* Load Google Identity Services SDK */}
      {allowGoogle && googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      )}

      <div style={{ position: 'absolute', top: '30px', left: '5%' }}>
         <Link href="/"><img src="/assets/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '45px' }} /></Link>
      </div>
      
      <div style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '450px', 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        borderRadius: '10px', 
        padding: '60px 68px 40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        margin: '20px'
      }}>
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
              type="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or phone number" 
              required
              style={{
                padding: '16px 20px',
                backgroundColor: '#333',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            
            {/* Honeypot */}
            <input 
              type="text" 
              name="website_verify" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ display: 'none', opacity: 0, position: 'absolute', zIndex: -999 }} 
            />
            
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required
              style={{
                padding: '16px 20px',
                backgroundColor: '#333',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isPending}
              style={{ 
                marginTop: '20px', 
                padding: '16px', 
                justifyContent: 'center', 
                fontSize: '1.1rem', 
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1
              }}
            >
              {isPending ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#b3b3b3' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="rememberMe" defaultChecked /> Remember me
              </label>
              <a href="#" style={{ color: '#b3b3b3', textDecoration: 'none' }}>Need help?</a>
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
