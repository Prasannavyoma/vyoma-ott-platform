"use client";

import { useState } from 'react';
import Link from 'next/link';
import NavBar from '@/app/components/NavBar';
import { redeemVoucherCode } from '@/app/actions/gift';

export interface VoucherClaimDetails {
  success: boolean;
  code: string;
  plan: 'GOLD' | 'PLATINUM';
  months: number;
  isUsed: boolean;
  usedById: string | null;
  createdAt: string | Date;
  senderName: string;
  recipientName: string;
  relationship: string;
  occasion: string;
  personalMessage: string;
  cardTheme: 'SWARNA' | 'UTSAV' | 'GURUKULA' | 'PADMA';
  isLoggedIn: boolean;
  currentUserEmail: string | null;
  currentUserName: string | null;
}

export const THEME_CONFIG: Record<string, {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  border: string;
  glow: string;
  icon: string;
  accentBg: string;
}> = {
  SWARNA: {
    name: 'Royal Gold (स्वर्णम्)',
    primary: '#ffd700',
    secondary: '#ffaa00',
    background: 'linear-gradient(135deg, #1c140a 0%, #080a0f 100%)',
    border: '2px solid #ffd700',
    glow: 'rgba(255,215,0,0.18)',
    icon: '🪔',
    accentBg: 'rgba(255,215,0,0.1)'
  },
  UTSAV: {
    name: 'Festive Diya (उत्सवः)',
    primary: '#ff7b54',
    secondary: '#f26422',
    background: 'linear-gradient(135deg, #2b0c0c 0%, #0d0608 100%)',
    border: '2px solid #ff7b54',
    glow: 'rgba(255,123,84,0.22)',
    icon: '✨',
    accentBg: 'rgba(255,123,84,0.12)'
  },
  GURUKULA: {
    name: 'Vedic Heritage (गुरुकुलम्)',
    primary: '#e9c46a',
    secondary: '#d4a373',
    background: 'linear-gradient(135deg, #22190f 0%, #0d0a06 100%)',
    border: '2px solid #d4a373',
    glow: 'rgba(212,163,115,0.22)',
    icon: '📜',
    accentBg: 'rgba(233,196,106,0.12)'
  },
  PADMA: {
    name: 'Sacred Lotus (पद्मम्)',
    primary: '#c084fc',
    secondary: '#e879f9',
    background: 'linear-gradient(135deg, #200d2d 0%, #080310 100%)',
    border: '2px solid #c084fc',
    glow: 'rgba(192,132,252,0.22)',
    icon: '🌸',
    accentBg: 'rgba(192,132,252,0.12)'
  }
};

// Subtle Web Audio chime synthesizer for unboxing ceremony
function playAuspiciousChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Sacred harmonic chime)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
    });
  } catch (e) {}
}

export default function ClaimClientPage({ initialData }: { initialData: VoucherClaimDetails }) {
  const [isOpen, setIsOpen] = useState(initialData.isUsed);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const isCustomHex = initialData.cardTheme?.startsWith('#');
  const theme = isCustomHex ? {
    name: 'Custom Theme',
    primary: initialData.cardTheme,
    secondary: initialData.cardTheme,
    background: `linear-gradient(135deg, ${initialData.cardTheme}22 0%, #080a0f 100%)`,
    border: `2px solid ${initialData.cardTheme}`,
    glow: `${initialData.cardTheme}35`,
    icon: '🎨',
    accentBg: `${initialData.cardTheme}18`
  } : (THEME_CONFIG[initialData.cardTheme || 'SWARNA'] || THEME_CONFIG.SWARNA);
  const durationText = initialData.months >= 12 ? '1 Full Year' : `${initialData.months} Month${initialData.months > 1 ? 's' : ''}`;

  const handleOpenEnvelope = () => {
    setIsOpen(true);
    playAuspiciousChime();
  };

  const handleClaim = async () => {
    if (!initialData.isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/gift/claim/${initialData.code}`)}`;
      return;
    }

    setClaiming(true);
    setClaimError(null);

    try {
      const res = await redeemVoucherCode(initialData.code);
      if (res.success) {
        setClaimSuccess(true);
        playAuspiciousChime();
      } else {
        setClaimError(res.error || 'Failed to activate voucher. Please verify your session.');
      }
    } catch (err: any) {
      setClaimError(err.message || 'Network error occurred while activating gift.');
    } finally {
      setClaiming(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020710', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif", position: 'relative', overflowX: 'hidden' }}>
      <NavBar />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes envelopePulse {
          0% { transform: scale(1); box-shadow: 0 10px 40px ${theme.glow}; }
          50% { transform: scale(1.02); box-shadow: 0 20px 60px ${theme.glow}; }
          100% { transform: scale(1); box-shadow: 0 10px 40px ${theme.glow}; }
        }
        @keyframes floatSeal {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(4deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes cardUnfold {
          0% { opacity: 0; transform: translateY(30px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #printable-card-area, #printable-card-area * { visibility: visible !important; }
          #printable-card-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            padding: 30px !important;
            border: 4px double #b8860b !important;
          }
        }
      `}} />

      <main style={{ maxWidth: '850px', margin: '0 auto', padding: '150px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* TOP STATUS HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{theme.icon}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.accentBg, border: `1px solid ${theme.primary}`, padding: '6px 16px', borderRadius: '20px', color: theme.primary, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
            Sacred Gift of Wisdom
          </div>
          <h1 style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 10px 0', background: `linear-gradient(to right, #fff, ${theme.primary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isOpen ? `Honoring ${initialData.recipientName}` : `A Gift from ${initialData.senderName}`}
          </h1>
          <p style={{ color: '#8f98a9', fontSize: '1.05rem', margin: 0, maxWidth: '600px', marginInline: 'auto', lineHeight: '1.5' }}>
            {isOpen 
              ? `${initialData.senderName} has blessed you with ${durationText} of ${initialData.plan} Plan Sanskrit learning on Vyoma OTT.`
              : `Tap the ceremonial gift envelope below to unwrap your personalized blessing.`}
          </p>
        </div>

        {/* 1. CLOSED ENVELOPE CEREMONY (IF NOT YET OPENED) */}
        {!isOpen && !initialData.isUsed && (
          <div 
            onClick={handleOpenEnvelope}
            style={{
              maxWidth: '560px',
              margin: '0 auto 40px auto',
              background: 'linear-gradient(145deg, #131b2e 0%, #070c17 100%)',
              border: `2px solid ${theme.primary}`,
              borderRadius: '24px',
              padding: '50px 30px',
              textAlign: 'center',
              cursor: 'pointer',
              animation: 'envelopePulse 3s infinite ease-in-out',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top decorative flap */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '35px',
              background: `linear-gradient(to bottom, ${theme.primary}, transparent)`,
              opacity: 0.15,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
            }} />

            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
              margin: '0 auto 20px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              boxShadow: `0 10px 25px ${theme.glow}`,
              animation: 'floatSeal 4s infinite ease-in-out'
            }}>
              🪔
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '0 0 8px 0' }}>
              Special Gift for {initialData.recipientName}
            </h3>
            <div style={{ color: theme.primary, fontWeight: 700, fontSize: '0.9rem', marginBottom: '25px' }}>
              From {initialData.senderName} • {initialData.occasion}
            </div>

            <button
              type="button"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                color: '#000',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '30px',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: `0 8px 25px ${theme.glow}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>✨</span> OPEN YOUR GIFT OF WISDOM
            </button>
            <div style={{ marginTop: '16px', color: '#64748b', fontSize: '0.8rem' }}>
              Click anywhere to unbox your card
            </div>
          </div>
        )}

        {/* 2. REVEALED E-CARD (WHEN OPENED) */}
        {isOpen && (
          <div style={{ animation: 'cardUnfold 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* LUXURY E-CARD */}
            <div style={{
              background: theme.background,
              border: theme.border,
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '680px',
              margin: '0 auto 30px auto',
              boxShadow: `0 25px 60px ${theme.glow}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Corner Ornaments */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', borderRadius: '50%', border: `1px solid ${theme.primary}`, opacity: 0.15 }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '130px', height: '130px', borderRadius: '50%', border: `1px solid ${theme.primary}`, opacity: 0.15 }} />

              {/* CARD HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/assets/logo-200-x-70-px.png" alt="Vyoma Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
                </div>
                <div style={{ background: theme.accentBg, color: theme.primary, border: `1px solid ${theme.primary}`, fontSize: '0.72rem', fontWeight: 800, padding: '5px 12px', borderRadius: '20px', letterSpacing: '1px' }}>
                  {initialData.occasion}
                </div>
              </div>

              {/* RECIPIENT & SENDER */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                  HONORING
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '4px 0 8px 0', letterSpacing: '-0.5px' }}>
                  {initialData.recipientName}
                </h2>
                <div style={{ color: theme.primary, fontWeight: 800, fontSize: '0.9rem' }}>
                  From: <strong>{initialData.senderName}</strong> ({initialData.relationship})
                </div>
              </div>

              {/* PERSONAL BLESSING MESSAGE */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                borderLeft: `4px solid ${theme.primary}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ fontSize: '0.7rem', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '6px' }}>
                  BLESSING MESSAGE
                </div>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.7' }}>
                  "{initialData.personalMessage}"
                </p>
              </div>

              {/* PLAN & ACTIVATION CODE */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#8f98a9', textTransform: 'uppercase' }}>MEMBERSHIP ACCESS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                    {initialData.plan} Plan • {durationText}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#8f98a9', textTransform: 'uppercase' }}>ACTIVATION KEY</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 900, color: theme.primary, letterSpacing: '1px' }}>
                    {initialData.code}
                  </div>
                </div>
              </div>
            </div>

            {/* CLAIM ACTIONS SECTION */}
            <div style={{
              maxWidth: '680px',
              margin: '0 auto',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '30px',
              textAlign: 'center'
            }}>
              {claimSuccess ? (
                <div>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#46d369', marginBottom: '8px' }}>
                    Access Successfully Activated!
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
                    Your account has been elevated to <strong>{initialData.plan} Membership</strong> ({durationText}). All premium video lectures, audiobooks, and interactive games are unlocked for you.
                  </p>
                  <Link
                    href="/explore"
                    style={{
                      background: 'linear-gradient(135deg, #46d369 0%, #22c55e 100%)',
                      color: '#000',
                      padding: '14px 32px',
                      borderRadius: '30px',
                      fontWeight: 900,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    📺 START LEARNING NOW →
                  </Link>
                </div>
              ) : initialData.isUsed ? (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', marginBottom: '8px' }}>
                    This Gift Has Already Been Redeemed
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                    The activation code <code>{initialData.code}</code> was previously activated and applied to an account.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Link href="/watch" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 22px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
                      Browse Library
                    </Link>
                    <Link href="/login" style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#000', padding: '10px 22px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  {claimError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 600 }}>
                      ⚠️ {claimError}
                    </div>
                  )}

                  {initialData.isLoggedIn ? (
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Logged in as <strong style={{ color: '#fff' }}>{initialData.currentUserEmail}</strong>. Click below to instantly link this gift to your account.
                      </p>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={handleClaim}
                          disabled={claiming}
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                            color: '#000',
                            border: 'none',
                            padding: '16px 36px',
                            borderRadius: '30px',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            cursor: claiming ? 'not-allowed' : 'pointer',
                            boxShadow: `0 8px 25px ${theme.glow}`
                          }}
                        >
                          {claiming ? '⚡ ACTIVATING MEMBERSHIP...' : '🎁 CLAIM & ACTIVATE ACCESS NOW'}
                        </button>

                        <button
                          onClick={handlePrint}
                          type="button"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.15)',
                            padding: '16px 24px',
                            borderRadius: '30px',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: 'pointer'
                          }}
                        >
                          🖨️ Print / Save PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.6' }}>
                        To link this subscription to your personal profile and track your learning progress, please sign in or create a free account.
                      </p>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/gift/claim/${initialData.code}`)}`}
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                            color: '#000',
                            padding: '14px 30px',
                            borderRadius: '30px',
                            fontWeight: 900,
                            textDecoration: 'none',
                            fontSize: '0.95rem'
                          }}
                        >
                          🔑 SIGN IN TO CLAIM
                        </Link>
                        <Link
                          href={`/register?redirect=${encodeURIComponent(`/gift/claim/${initialData.code}`)}`}
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '14px 30px',
                            borderRadius: '30px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            fontSize: '0.95rem'
                          }}
                        >
                          ✨ CREATE FREE ACCOUNT
                        </Link>
                        <button
                          onClick={handlePrint}
                          type="button"
                          style={{
                            background: 'transparent',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255,255,255,0.15)',
                            padding: '14px 20px',
                            borderRadius: '30px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                          }}
                        >
                          🖨️ Print Card
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* 3. PRINTABLE GIFT CERTIFICATE MODAL / VIEW */}
      {showPrintModal && (
        <div 
          id="printable-card-area"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{
            background: '#fff',
            color: '#111',
            maxWidth: '650px',
            width: '100%',
            borderRadius: '16px',
            padding: '40px',
            border: '6px double #b8860b',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPrintModal(false)}
              className="no-print"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#eee',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontWeight: 900
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #b8860b', paddingBottom: '15px', marginBottom: '25px' }}>
              <div style={{ fontSize: '1.8rem', color: '#b8860b', fontWeight: 900, letterSpacing: '2px' }}>VYOMA ACADEMY</div>
              <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Sacred Gift of Sanskrit Wisdom</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>THIS SACRED GIFT HONORS</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111', marginTop: '4px' }}>{initialData.recipientName}</div>
              <div style={{ fontSize: '0.9rem', color: '#b8860b', fontWeight: 700, marginTop: '4px' }}>
                Presented with love by {initialData.senderName} ({initialData.relationship} • {initialData.occasion})
              </div>
            </div>

            <div style={{ background: '#fdfbf7', borderLeft: '4px solid #b8860b', padding: '15px 20px', margin: '20px 0', fontStyle: 'italic', color: '#333', lineHeight: '1.6' }}>
              "{initialData.personalMessage}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ccc', paddingTop: '20px', marginTop: '25px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>MEMBERSHIP ACCESS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111' }}>{initialData.plan} Plan ({durationText})</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Activation Key: <strong style={{ color: '#b8860b', fontFamily: 'monospace' }}>{initialData.code}</strong></div>
              </div>

              {/* QR Code pointing to claim URL */}
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/gift/claim/${initialData.code}` : `https://vyoma-ott-platform.vercel.app/gift/claim/${initialData.code}`)}`}
                  alt="Scan QR to Claim"
                  style={{ width: '90px', height: '90px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>Scan with camera to claim</div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.print()}
                style={{ background: '#b8860b', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                🖨️ Print Now
              </button>
              <button 
                onClick={() => setShowPrintModal(false)}
                style={{ background: '#eee', color: '#333', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
