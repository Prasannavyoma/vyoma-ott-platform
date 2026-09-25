"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Crown, CheckCircle2, Sparkles, AlertTriangle, ArrowRight, X, CreditCard, RefreshCw, Layers } from 'lucide-react';

interface FindMyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlanData: {
    isLoggedIn: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      plan: string;
      planInterval: string;
      planStartedAt: string | null;
      planExpiresAt: string | null;
      daysRemaining: number | null;
      coins: number;
    } | null;
  } | null;
}

export default function FindMyPlanModal({ isOpen, onClose, userPlanData }: FindMyPlanModalProps) {
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  if (!isOpen) return null;

  const user = userPlanData?.user;
  const isLoggedIn = userPlanData?.isLoggedIn;
  const currentPlan = (user?.plan || 'FREE').toUpperCase();
  const daysRemaining = user?.daysRemaining ?? null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 14;

  const formatExpiryDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      padding: '20px',
      animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #0e1424 0%, #050811 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(242, 100, 34, 0.15)',
        padding: '36px',
        color: '#fff'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(242, 100, 34, 0.15)',
            border: '1px solid rgba(242, 100, 34, 0.3)',
            color: 'var(--primary)',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={14} /> FIND MY PLAN &amp; PRICING SHEET
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.8px', margin: 0 }}>
            Your Membership &amp; Plan Intelligence
          </h2>
          <p style={{ color: '#aaa', fontSize: '1rem', marginTop: '8px', margin: '8px 0 0' }}>
            Check your current active plan, expiration status, or upgrade to unlock premium features.
          </p>
        </div>

        {/* ACTIVE PLAN TELEMETRY BAR */}
        {isLoggedIn && user ? (
          <div style={{
            background: isExpiringSoon
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(239, 68, 68, 0.18) 100%)'
              : 'linear-gradient(135deg, rgba(242, 100, 34, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: `1px solid ${isExpiringSoon ? 'rgba(245, 158, 11, 0.4)' : 'rgba(242, 100, 34, 0.3)'}`,
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: currentPlan === 'PLATINUM' ? '#e5e4e2' : currentPlan === 'GOLD' ? '#ffd700' : 'rgba(255,255,255,0.1)',
                  color: (currentPlan === 'PLATINUM' || currentPlan === 'GOLD') ? '#000' : '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 900
                }}>
                  {currentPlan === 'FREE' ? 'FREE TIER' : `${currentPlan} ACTIVE`}
                </span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                  {user.email}
                </span>
              </div>

              {currentPlan !== 'FREE' && user.planExpiresAt && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.85rem', color: '#ccc' }}>
                  <span>Expires on: <strong>{formatExpiryDate(user.planExpiresAt)}</strong></span>
                  {daysRemaining !== null && (
                    <span style={{ color: isExpiringSoon ? '#f87171' : '#46d369', fontWeight: 800 }}>
                      ({daysRemaining} Days Remaining)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* EXPIRING SOON RENEW PROMPT */}
            {isExpiringSoon ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Expiring Soon!
                </span>
                <Link
                  href="/subscribe"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 800, borderRadius: '12px', textDecoration: 'none' }}
                >
                  <RefreshCw size={14} style={{ marginRight: '4px' }} /> Renew Plan Now
                </Link>
              </div>
            ) : currentPlan !== 'FREE' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#46d369', fontSize: '0.85rem', fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span>Subscription Active &amp; Synced</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                Upgrade below to unlock full OTT access.
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#aaa'
          }}>
            🔐 <Link href="/login" onClick={onClose} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Sign In</Link> to view your active subscription expiration &amp; auto-renewal telemetry.
          </div>
        )}

        {/* BILLING INTERVAL SWITCHER */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '30px',
            padding: '4px',
            display: 'inline-flex',
            gap: '4px'
          }}>
            <button
              onClick={() => setBillingInterval('MONTHLY')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingInterval === 'MONTHLY' ? 'var(--primary)' : 'transparent',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('YEARLY')}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                border: 'none',
                background: billingInterval === 'YEARLY' ? 'var(--primary)' : 'transparent',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Yearly Billing</span>
              <span style={{ background: '#22c55e', color: '#000', padding: '1px 6px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* PRICING PLANS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px'
        }}>
          {/* TIER 1: FREE */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${currentPlan === 'FREE' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Starter</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px', margin: '4px 0 10px' }}>Free Tier</h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>₹0 <span style={{ fontSize: '0.85rem', color: '#888' }}>/ forever</span></div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }}></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#ccc' }}>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#888" /> Free preview video modules</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#888" /> Daily Subhashita quotes</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#888" /> Community discussion access</li>
              </ul>
            </div>

            <button
              disabled
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#888',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'not-allowed'
              }}
            >
              {currentPlan === 'FREE' ? 'Current Tier' : 'Included'}
            </button>
          </div>

          {/* TIER 2: GOLD */}
          <div style={{
            background: currentPlan === 'GOLD' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${currentPlan === 'GOLD' ? '#ffd700' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
            position: 'relative'
          }}>
            {currentPlan === 'GOLD' && (
              <span style={{ position: 'absolute', top: '-12px', right: '20px', background: '#ffd700', color: '#000', padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900 }}>
                YOUR ACTIVE PLAN
              </span>
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={14} /> Popular Choice
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px', margin: '4px 0 10px' }}>Gold Membership</h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {billingInterval === 'MONTHLY' ? '₹499' : '₹4,999'}{' '}
                <span style={{ fontSize: '0.85rem', color: '#888' }}>/ {billingInterval.toLowerCase()}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }}></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#ccc' }}>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> Full HD Video Lectures</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> Sanskrit Audiobooks &amp; Podcasts</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> Subhashita Wisdom Library</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="#ffd700" /> Coin Wallet Gamification Rewards</li>
              </ul>
            </div>

            {currentPlan === 'GOLD' ? (
              isExpiringSoon ? (
                <Link
                  href="/subscribe"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none' }}
                >
                  Renew Gold Plan
                </Link>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #ffd700',
                    background: 'rgba(255, 215, 0, 0.15)',
                    color: '#ffd700',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'not-allowed'
                  }}
                >
                  Active Subscribed Plan
                </button>
              )
            ) : currentPlan === 'PLATINUM' ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#888',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'not-allowed'
                }}
              >
                Included in Platinum
              </button>
            ) : (
              <Link
                href="/subscribe"
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none' }}
              >
                Subscribe Gold
              </Link>
            )}
          </div>

          {/* TIER 3: PLATINUM VIP */}
          <div style={{
            background: currentPlan === 'PLATINUM' ? 'rgba(59, 130, 246, 0.15)' : 'linear-gradient(135deg, rgba(242, 100, 34, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: `1px solid ${currentPlan === 'PLATINUM' ? '#e5e4e2' : 'var(--primary)'}`,
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
            position: 'relative'
          }}>
            <span style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--primary)', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900 }}>
              {currentPlan === 'PLATINUM' ? 'YOUR ACTIVE VIP PLAN' : 'RECOMMENDED UPGRADE'}
            </span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> Ultimate VIP Access
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px', margin: '4px 0 10px' }}>Platinum VIP</h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {billingInterval === 'MONTHLY' ? '₹999' : '₹9,999'}{' '}
                <span style={{ fontSize: '0.85rem', color: '#888' }}>/ {billingInterval.toLowerCase()}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }}></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#ccc' }}>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="var(--primary)" /> Everything in Gold Plan</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="var(--primary)" /> Interactive Games &amp; Quizzes</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="var(--primary)" /> 1-on-1 Sanskrit AI Tutor</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="var(--primary)" /> Offline Video Downloads</li>
                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={16} color="var(--primary)" /> Verified Course Certificates</li>
              </ul>
            </div>

            {currentPlan === 'PLATINUM' ? (
              isExpiringSoon ? (
                <Link
                  href="/subscribe"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none' }}
                >
                  Renew Platinum VIP
                </Link>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #e5e4e2',
                    background: 'rgba(229, 228, 226, 0.2)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'not-allowed'
                  }}
                >
                  Active VIP Subscribed Plan
                </button>
              )
            ) : (
              <Link
                href="/subscribe"
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 20px rgba(242, 100, 34, 0.4)' }}
              >
                {currentPlan === 'GOLD' ? 'Upgrade to Platinum VIP 🚀' : 'Subscribe Platinum VIP'}
              </Link>
            )}
          </div>
        </div>

        {/* Modal Footer Links */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: '#888' }}>
          <Link href="/profile" onClick={onClose} style={{ color: '#aaa', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} /> View Billing Invoices &amp; History
          </Link>
          <span>Auto-Renewal powered by Razorpay Secure</span>
        </div>
      </div>
    </div>
  );
}
