"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { registerUser, loginWithGoogleAction } from '../actions/auth';

interface RegisterFormClientProps {
  allowPassword: boolean;
  allowGoogle: boolean;
  googleClientId: string;
}

export default function RegisterFormClient({ allowPassword, allowGoogle, googleClientId }: RegisterFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  // Bind Google OAuth Callback to window object
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
            setError('Google Sign-up failed.');
          }
        });
      };
    }
  }, [allowGoogle, searchParams, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allowPassword) {
      setError('Password-based registration is disabled.');
      return;
    }

    if (!strength.isValid) {
      setError('Please choose a medium or strong password.');
      return;
    }

    setError('');
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await registerUser(formData);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success) {
        router.push('/?registered=true');
      } else {
        setError('Something went wrong. Please try again.');
      }
    });
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url('https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg') center/cover no-repeat`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'inherit',
      color: 'white',
      position: 'relative'
    }}>
      {/* Load Google SDK */}
      {allowGoogle && googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      )}

      <div style={{ position: 'absolute', top: '30px', left: '5%' }}>
         <Link href="/"><img src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '45px' }} /></Link>
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

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '30px' }}>Join Vyoma</h1>
        
        {/* Error Messages */}
        {error === 'already_registered' ? (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '6px', 
            padding: '12px 16px', 
            color: '#ff6b6b', 
            fontSize: '0.9rem', 
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            Already registered! Please <Link href={`/login?email=${encodeURIComponent(email)}`} style={{ color: '#fff', textDecoration: 'underline', fontWeight: 'bold' }}>Login</Link> and access the content.
          </div>
        ) : error ? (
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
        ) : null}

        {/* Password Registration Form */}
        {allowPassword ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="hidden" name="referrerId" value={refCode} />
            
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
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
              type="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address" 
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="password" 
                name="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Password" 
                required
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '1rem',
                  width: '100%'
                }}
              />
              {/* Password strength UI */}
              {password && (
                <div style={{ marginTop: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: strength.color, fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Strength: {strength.label}</span>
                    {!strength.isValid && <span style={{ opacity: 0.8 }}>Not Accepted</span>}
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isPending || (password !== '' && !strength.isValid)}
              style={{ 
                marginTop: '10px', 
                padding: '16px', 
                justifyContent: 'center', 
                fontSize: '1.1rem', 
                fontWeight: 700,
                cursor: (isPending || (password !== '' && !strength.isValid)) ? 'not-allowed' : 'pointer',
                opacity: (isPending || (password !== '' && !strength.isValid)) ? 0.7 : 1
              }}
            >
              {isPending ? 'Registering...' : 'Complete Registration'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#b3b3b3' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="rememberMe" defaultChecked /> Remember me
              </label>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#aaa', fontSize: '0.95rem' }}>
            Credentials registration is disabled. Please create your account instantly using Google below.
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
                   data-context="signup"
                   data-ux_mode="popup"
                   data-callback="handleGoogleCredential"
                   data-auto_prompt="false">
              </div>
              <div className="g_id_signin"
                   data-type="standard"
                   data-shape="rectangular"
                   data-theme="filled_blue"
                   data-text="signup_with"
                   data-size="large"
                   data-logo_alignment="left"
                   data-width="314">
              </div>
            </div>
          </>
        )}
        
        <div style={{ marginTop: '30px', color: '#737373', fontSize: '0.95rem' }}>
          Already using Vyoma? <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>Sign In</Link>
        </div>
        
        <p style={{ marginTop: '20px', color: '#8c8c8c', fontSize: '0.8rem' }}>
          By signing up, you agree to receive Sanskrit educational updates.
        </p>
      </div>
    </div>
  );
}
