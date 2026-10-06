"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Crown, CheckCircle2, Sparkles, AlertTriangle, X, CreditCard, RefreshCw, Globe, MapPin, ArrowLeft, Key } from 'lucide-react';
import { createRazorpaySubscription } from '@/app/actions/razorpay';
import { activateSubscription } from '@/app/actions/plans';
import { redeemVoucherCode } from '@/app/actions/gift';
import RazorpayCheckoutButton from '@/app/components/RazorpayCheckoutButton';

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
      country?: string | null;
    } | null;
  } | null;
}

export default function FindMyPlanModal({ isOpen, onClose, userPlanData }: FindMyPlanModalProps) {
  const [isAbroad, setIsAbroad] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    planName: 'GOLD' | 'PLATINUM';
    interval: 'MONTHLY' | 'YEARLY';
    currency: 'INR' | 'USD';
    amount: number;
    subData: any;
  } | null>(null);

  // 🔑 Gift Code / Voucher Redemption State
  const [showGiftInput, setShowGiftInput] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftStatus, setGiftStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string; meta?: any }>({ type: 'idle' });

  const user = userPlanData?.user;
  const isLoggedIn = userPlanData?.isLoggedIn;

  useEffect(() => {
    if (user?.country && user.country !== 'IN') {
      setIsAbroad(true);
      return;
    }

    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (response.country_code && response.country_code !== 'IN') {
          setIsAbroad(true);
        }
      } catch (e) {
        setIsAbroad(false);
      }
    }
    detectLocation();
  }, [user]);

  if (!isOpen) return null;

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

  const handleCheckout = async (planName: 'GOLD' | 'PLATINUM', interval: 'MONTHLY' | 'YEARLY', overrideAbroad?: boolean) => {
    if (!isLoggedIn || !user) {
      window.location.href = '/login?callbackUrl=/';
      return;
    }

    const useAbroad = overrideAbroad !== undefined ? overrideAbroad : isAbroad;
    const currency = useAbroad ? 'USD' : 'INR';

    setIsInitializing(true);
    let amount = 0;
    if (planName === 'GOLD') {
      amount = useAbroad ? (interval === 'MONTHLY' ? 3 : 25) : (interval === 'MONTHLY' ? 39 : 390);
    } else {
      amount = useAbroad ? (interval === 'MONTHLY' ? 5 : 50) : (interval === 'MONTHLY' ? 49 : 490);
    }

    const totalCount = interval === 'MONTHLY' ? 120 : 10;

    try {
      const res = await createRazorpaySubscription({
        name: `Vyoma ${planName} Tier`,
        description: `Auto-renewing ${interval} mandate`,
        amount: amount,
        currency: currency,
        interval: interval.toLowerCase(),
        totalCount: totalCount
      });

      if (res.success) {
        setCheckoutData({
          planName,
          interval,
          currency,
          amount,
          subData: res
        });
      } else {
        alert("Unable to initialize secure session. Please try again.");
      }
    } catch (e: any) {
      alert(e.message || "Subscription initialization failed.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSuccess = async (response: any) => {
    if (!checkoutData || !user) return;
    await activateSubscription(
      user.id,
      checkoutData.planName,
      checkoutData.interval,
      response.razorpay_subscription_id || checkoutData.subData.subscriptionId
    );
    setCheckoutData(null);
    window.location.reload();
  };

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;

    setGiftLoading(true);
    setGiftStatus({ type: 'idle' });

    try {
      const res = await redeemVoucherCode(giftCode);
      if (res.success) {
        setGiftStatus({ type: 'success', meta: res });
        setGiftCode('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setGiftStatus({ type: 'error', message: res.error || "Failed to activate voucher." });
      }
    } catch (err: any) {
      setGiftStatus({ type: 'error', message: "Connection error. Make sure you are logged in." });
    } finally {
      setGiftLoading(false);
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
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(16px)',
      padding: '60px 20px 20px 20px',
      animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1020px',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #0e1424 0%, #050811 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(242, 100, 34, 0.15)',
        padding: '50px 36px 36px 36px',
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
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '15px' }}>
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
            <ShieldCheck size={14} /> FIND MY PLAN &amp; DIRECT CHECKOUT
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.8px', margin: 0, paddingTop: '6px' }}>
            Your Membership &amp; Pricing Telemetry
          </h2>
          <p style={{ color: '#aaa', fontSize: '1rem', marginTop: '8px', margin: '8px 0 0' }}>
            Both Monthly &amp; Yearly options displayed together on each plan. Zero page redirects.
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
            marginBottom: '20px',
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
                <button
                  onClick={() => handleCheckout(currentPlan as any, 'MONTHLY')}
                  disabled={isInitializing}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 800, borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                >
                  <RefreshCw size={14} style={{ marginRight: '4px' }} /> Renew Plan Now
                </button>
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
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#aaa'
          }}>
            🔐 <Link href="/login" onClick={onClose} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Sign In</Link> to view active plan telemetry &amp; authorize direct subscriptions.
          </div>
        )}

        {/* 🔑 HAVE A GIFT CODE / VOUCHER REDEMPTION BOX */}
        <div style={{
          background: 'rgba(242, 100, 34, 0.07)',
          border: '1px solid rgba(242, 100, 34, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <div 
            onClick={() => setShowGiftInput(!showGiftInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
              <Key size={18} color="#ff8c53" />
              <span>🔑 Have a Gift Code?</span>
              <span style={{ fontSize: '0.75rem', color: '#ff8c53', background: 'rgba(242,100,34,0.15)', border: '1px solid rgba(242,100,34,0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                Redeem Voucher
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#ff8c53', fontWeight: 800 }}>
              {showGiftInput ? '▲ Hide' : '▼ Activate Key Now'}
            </span>
          </div>

          {showGiftInput && (
            <form onSubmit={handleRedeemGift} style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  required
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  placeholder="e.g. GIFT-VYOM-ABCD-1234"
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    background: '#050a14',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={giftLoading}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: giftLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 15px rgba(242,100,34,0.3)'
                  }}
                >
                  {giftLoading ? 'VALIDATING...' : 'UNLOCK MEMBERSHIP 🔓'}
                </button>
              </div>

              {giftStatus.type === 'error' && (
                <div style={{ marginTop: '12px', color: '#f87171', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                  🚨 {giftStatus.message}
                </div>
              )}

              {giftStatus.type === 'success' && (
                <div style={{ marginTop: '12px', color: '#46d369', fontSize: '0.9rem', fontWeight: 900, background: 'rgba(70, 211, 105, 0.1)', border: '1px solid rgba(70, 211, 105, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                  🎉 Voucher Activated! Unlocked {giftStatus.meta?.months} Months {giftStatus.meta?.plan} Access! Reloading...
                </div>
              )}
            </form>
          )}
        </div>

        {/* INTERACTIVE CHECKOUT OVERLAY (INSIDE POPUP ONLY - NO EXTRA PAGE) */}
        {checkoutData ? (
          <div style={{
            background: 'rgba(10, 18, 32, 0.95)',
            border: '1px solid rgba(242, 100, 34, 0.3)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => setCheckoutData(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Back to Plans
              </button>
              <span style={{ fontSize: '0.8rem', color: '#ff8c53', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                SECURE CHECKOUT POPUP
              </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 6px 0' }}>
                Confirm {checkoutData.planName} Membership Mandate
              </h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                {checkoutData.currency === 'INR' ? '🇮🇳 Local Domestic' : '🌍 International Abroad'} ({checkoutData.interval} Billing)
              </p>
              <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fff', margin: '16px 0 8px 0' }}>
                {checkoutData.currency === 'INR' ? '₹' : '$'}{checkoutData.amount}
              </div>
            </div>

            <RazorpayCheckoutButton
              amount={checkoutData.amount}
              currency={checkoutData.currency}
              name={`Vyoma ${checkoutData.planName} Tier`}
              description={`Auto-renewing ${checkoutData.interval} mandate`}
              subscriptionId={checkoutData.subData.subscriptionId}
              publicKey={checkoutData.subData.publicKey}
              onSuccess={handleSuccess}
              onError={(err: any) => console.error("Payment failed", err)}
              buttonText={`CONFIRM MANDATE & SUBSCRIBE (${checkoutData.currency === 'INR' ? '₹' : '$'}${checkoutData.amount})`}
            />
          </div>
        ) : (
          <>
            {/* AUTOMATIC GEO LOCATION BANNER WITH STRICT ANTI-EVASION LOCK */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                borderRadius: '30px',
                border: isAbroad ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(242,100,34,0.4)',
                background: isAbroad ? 'rgba(59,130,246,0.1)' : 'rgba(242,100,34,0.1)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                {user?.country && user.country !== 'IN' ? (
                  <>
                    <Globe size={16} color="#60a5fa" />
                    <span>🔒 Currency locked to USD ($) based on your international profile ({user.country})</span>
                  </>
                ) : isAbroad ? (
                  <>
                    <Globe size={16} color="#60a5fa" />
                    <span>Abroad Region Detected: Displaying USD ($) Pricing</span>
                    <button
                      onClick={() => setIsAbroad(false)}
                      style={{ background: 'transparent', border: 'none', color: '#93c5fd', textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px', fontSize: '0.8rem', fontWeight: 800 }}
                    >
                      (Switch to INR ₹)
                    </button>
                  </>
                ) : (
                  <>
                    <MapPin size={16} color="#ff8c53" />
                    <span>Local Region Detected: Displaying India (INR ₹) Pricing</span>
                    <button
                      onClick={() => setIsAbroad(true)}
                      style={{ background: 'transparent', border: 'none', color: '#ff8c53', textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px', fontSize: '0.8rem', fontWeight: 800 }}
                    >
                      (Switch to USD $)
                    </button>
                  </>
                )}
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
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                    {isAbroad ? '$0' : '₹0'} <span style={{ fontSize: '0.85rem', color: '#888' }}>/ forever</span>
                  </div>
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
                  
                  {/* BOTH MONTHLY & YEARLY PRICES DISPLAYED TOGETHER (NO SWITCH NEEDED) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Monthly:</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        {isAbroad ? '$3' : '₹39'} <span style={{ fontSize: '0.75rem', color: '#888' }}>/ mo</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 700 }}>Yearly (Save 15%):</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22c55e' }}>
                        {isAbroad ? '$25' : '₹390'} <span style={{ fontSize: '0.75rem', color: '#888' }}>/ yr</span>
                      </span>
                    </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleCheckout('GOLD', 'MONTHLY')}
                      disabled={isInitializing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #f26422',
                        background: 'linear-gradient(135deg, rgba(242,100,34,0.2) 0%, rgba(242,100,34,0.05) 100%)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Subscribe Monthly ({isAbroad ? '$3' : '₹39'})
                    </button>
                    <button
                      onClick={() => handleCheckout('GOLD', 'YEARLY')}
                      disabled={isInitializing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(242, 100, 34, 0.3)'
                      }}
                    >
                      Subscribe Yearly ({isAbroad ? '$25' : '₹390'}) 🎁
                    </button>
                  </div>
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
                  
                  {/* BOTH MONTHLY & YEARLY PRICES DISPLAYED TOGETHER (NO SWITCH NEEDED) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Monthly:</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        {isAbroad ? '$5' : '₹49'} <span style={{ fontSize: '0.75rem', color: '#888' }}>/ mo</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 700 }}>Yearly (Save 15%):</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22c55e' }}>
                        {isAbroad ? '$50' : '₹490'} <span style={{ fontSize: '0.75rem', color: '#888' }}>/ yr</span>
                      </span>
                    </div>
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
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleCheckout('PLATINUM', 'MONTHLY')}
                      disabled={isInitializing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #c084fc',
                        background: 'linear-gradient(135deg, rgba(192,132,252,0.2) 0%, rgba(192,132,252,0.05) 100%)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Subscribe Monthly ({isAbroad ? '$5' : '₹49'})
                    </button>
                    <button
                      onClick={() => handleCheckout('PLATINUM', 'YEARLY')}
                      disabled={isInitializing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(242, 100, 34, 0.4)'
                      }}
                    >
                      Subscribe Yearly ({isAbroad ? '$50' : '₹490'}) 🚀
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal Footer Links */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: '#888' }}>
          <Link href="/profile" onClick={onClose} style={{ color: '#aaa', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} /> View Billing Invoices &amp; History
          </Link>
          <span>Direct In-Popup Mandates &amp; Voucher Activation powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
}
