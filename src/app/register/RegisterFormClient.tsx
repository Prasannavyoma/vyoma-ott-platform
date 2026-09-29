"use client";

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Eye, EyeOff } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Per-field error messages
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const isValidEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(val.trim());
  };

  // Must start with a letter; supports unicode letters, dots (e.g. initials), spaces, hyphens and apostrophes
  const isValidName = (val: string) => /^[\p{L}][\p{L}\s'.-]*$/u.test(val.trim());

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

    // Reset field errors before re-validating
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!name.trim()) {
      setNameError('Please enter your full name.');
      hasError = true;
    } else if (!isValidName(name)) {
      setNameError('Name can only contain letters, dots, spaces, apostrophes or hyphens.');
      hasError = true;
    }

    if (!email) {
      setEmailError('Please enter your email address.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter a password.');
      hasError = true;
    } else if (!strength.isValid) {
      setPasswordError('Please choose a medium or strong password.');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      hasError = true;
    } else if (password && confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setError('');
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    
    startTransition(async () => {
      const res = await registerUser(formData);
      if (res && res.error) {
        setError(res.error);
      } else if (res && res.success) {
        const redirectUrl = searchParams.get('redirect') || '/?registered=true';
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError('Something went wrong. Please try again.');
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
      padding: '40px 16px',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Load Google SDK */}
      {allowGoogle && googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      )}

      {/* Top Left Vyoma Brand Logo - exactly matching Home & Sign-In */}
      <div style={{ position: 'absolute', top: '30px', left: '5%', zIndex: 10 }}>
        <Link href="/">
          <img src="/assets/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '45px' }} />
        </Link>
      </div>

      <div className="auth-container" style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: '480px', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '16px', 
        padding: '50px 45px 35px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
        margin: '20px auto',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        boxSizing: 'border-box'
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
          fontWeight: 'bold', zIndex: 10
        }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>✕</Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '28px', textAlign: 'center', color: '#fff' }}>Sign up</h1>
        
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
          <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="hidden" name="referrerId" value={refCode} />
            
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input 
                type="text" 
                name="name" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim() && isValidName(e.target.value)) setNameError('');
                }}
                placeholder="Full Name" 
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: nameError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = nameError ? '#ef4444' : 'rgba(255,255,255,0.1)'}
              />
              {nameError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>{nameError}</span>
                       </div></div>

            {/* Honeypot */}
            <input 
              type="text" 
              name="website_verify" 
              tabIndex={-1} 
              autoComplete="off" 
              style={{ display: 'none', opacity: 0, position: 'absolute', zIndex: -999 }} 
            />
            
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input 
                type="email" 
                name="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value && isValidEmail(e.target.value)) setEmailError('');
                }}
                placeholder="Email Address" 
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: emailError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = emailError ? '#ef4444' : 'rgba(255,255,255,0.1)'}
              />
              {emailError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>{emailError}</span>
              )}
            </div>
            
            {/* Password with Eye Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value && getPasswordStrength(e.target.value).isValid) setPasswordError('');
                  }}
                  placeholder="Create Password" 
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 16px',
                    borderRadius: '10px',
                    border: passwordError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = passwordError ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#999', cursor: 'pointer',
                    padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {passwordError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>{passwordError}</span>
              )}
              {/* Password strength UI */}
              {password && (
                <div style={{ marginTop: '4px' }}>
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

            {/* Confirm Password with Eye Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value && e.target.value === password) setConfirmPasswordError('');
                  }}
                  placeholder="Confirm Password" 
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 16px',
                    borderRadius: '10px',
                    border: confirmPasswordError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = confirmPasswordError ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#999', cursor: 'pointer',
                    padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {confirmPasswordError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'left' }}>{confirmPasswordError}</span>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary premium-glow-btn" 
              disabled={isPending}
              style={{ 
                marginTop: '10px', 
                padding: '16px', 
                justifyContent: 'center', 
                fontSize: '1.05rem', 
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                borderRadius: '10px',
                border: 'none',
                background: '#0080ff',
                color: '#fff',
                letterSpacing: '0.5px'
              }}
            >
              {isPending ? 'Signing up...' : 'Sign up'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#b3b3b3', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" name="rememberMe" defaultChecked style={{ accentColor: '#0080ff' }} /> Remember me
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
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ color: '#777', fontSize: '0.8rem' }}>OR</div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
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
        
        <div style={{ marginTop: '28px', textAlign: 'center', color: '#8c8c8c', fontSize: '0.95rem' }}>
          Already using Vyoma? <Link href="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>
        
        <p style={{ marginTop: '16px', color: '#737373', fontSize: '0.78rem', textAlign: 'center', lineHeight: '1.4' }}>
          By continuing, you agree to digitalsanskrit.com <Link href="/terms" style={{ color: '#fff', textDecoration: 'underline' }}>Terms & Conditions</Link> and <Link href="/privacy" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}