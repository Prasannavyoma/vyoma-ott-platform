"use client";

import { useState, useEffect } from 'react';
import NavBar from '@/app/components/NavBar';
import { purchaseGiftVoucher } from '@/app/actions/gift';
import { createRazorpayOrder } from '@/app/actions/razorpay';

interface RealPlan {
  id?: string;
  name: string;
  interval: string;
  priceINR: number;
  priceUSD: number;
}

const RELATIONS = [
  { key: 'Mother', label: '👩‍👦 Mother (माता)' },
  { key: 'Father', label: '👨‍👦 Father (पिता)' },
  { key: 'Sister', label: '👭 Sister (भगिनी)' },
  { key: 'Brother', label: '👬 Brother (भ्राता)' },
  { key: 'Son/Daughter', label: '🧑‍🎓 Child (पुत्रः/पुत्री)' },
  { key: 'Shishya', label: '🤝 Student (शिष्यः)' },
  { key: 'Friend', label: '🤝 Friend (मित्रम्)' },
  { key: 'Teacher', label: '🪔 Guru (गुरुः)' },
  { key: 'Others', label: '✏️ Others...' }
];

const OCCASIONS = [
  { key: 'General', label: '✨ Sacred Gift (शुभाशयाः)' },
  { key: 'Birthday', label: '🎂 Birthday (जन्मोत्सवः)' },
  { key: 'Guru Purnima', label: '🪔 Guru Purnima (गुरुपूर्णिमा)' },
  { key: 'Upanayanam', label: '🧵 Upanayanam (उपनयनम्)' },
  { key: 'Diwali', label: '🪔 Diwali (दीपावली)' },
  { key: 'Sanskrit Day', label: '📜 Sanskrit Day (संस्कृतदिवसः)' },
  { key: 'Spiritual Growth', label: '🕉️ Sadhana (साधना)' },
  { key: 'Others', label: '✏️ Others (Custom Event)' }
];

const CARD_THEMES = [
  { 
    key: 'SWARNA', 
    name: '👑 Gold (स्वर्णम्)', 
    primary: '#ffd700', 
    secondary: '#ffaa00', 
    bg: 'linear-gradient(135deg, #1c140a 0%, #080a0f 100%)', 
    border: '#ffd700', 
    glow: 'rgba(255,215,0,0.22)', 
    icon: '🪔',
    accentBg: 'rgba(255,215,0,0.1)'
  },
  { 
    key: 'UTSAV', 
    name: '🪔 Utsav (उत्सवः)', 
    primary: '#ff7b54', 
    secondary: '#f26422', 
    bg: 'linear-gradient(135deg, #2b0c0c 0%, #0d0608 100%)', 
    border: '#ff7b54', 
    glow: 'rgba(255,123,84,0.25)', 
    icon: '✨',
    accentBg: 'rgba(255,123,84,0.12)'
  },
  { 
    key: 'GURUKULA', 
    name: '📜 Vedic (गुरुकुलम्)', 
    primary: '#e9c46a', 
    secondary: '#d4a373', 
    bg: 'linear-gradient(135deg, #22190f 0%, #0d0a06 100%)', 
    border: '#d4a373', 
    glow: 'rgba(212,163,115,0.25)', 
    icon: '📜',
    accentBg: 'rgba(233,196,106,0.12)'
  },
  { 
    key: 'PADMA', 
    name: '🌸 Lotus (पद्मम्)', 
    primary: '#c084fc', 
    secondary: '#e879f9', 
    bg: 'linear-gradient(135deg, #200d2d 0%, #080310 100%)', 
    border: '#c084fc', 
    glow: 'rgba(192,132,252,0.25)', 
    icon: '🌸',
    accentBg: 'rgba(192,132,252,0.12)'
  }
];

const SHLOKA_PRESETS = [
  { label: 'विद्ययाऽमृतमश्नुते', text: 'विद्ययाऽमृतमश्नुते — Through sacred knowledge, one attains immortality.' },
  { label: 'विद्या ददाति विनयं', text: 'विद्या ददाति विनयं — Knowledge bestows true humility and character.' },
  { label: 'तमसो मा ज्योतिर्गमय', text: 'तमसो मा ज्योतिर्गमय — Lead me from ignorance into eternal light.' },
  { label: 'ज्ञानं परमं बलम्', text: 'ज्ञानं परमं बलम् — Spiritual and linguistic wisdom is the supreme inner strength.' },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function GiftClientPage({ 
  initialPlans, 
  currentUser 
}: { 
  initialPlans: RealPlan[];
  currentUser?: { id: string; name: string; email: string };
}) {
  const [step, setStep] = useState<'compose' | 'checkout' | 'success'>('compose');
  const [region, setRegion] = useState<'INDIA' | 'ABROAD'>('INDIA');
  
  // Gifter Identity State
  const [senderName, setSenderName] = useState(
    currentUser?.name?.trim() || (currentUser?.email ? currentUser.email.split('@')[0] : 'A Well-Wisher')
  );

  // Form States
  const [cardTheme, setCardTheme] = useState<'SWARNA' | 'UTSAV' | 'GURUKULA' | 'PADMA' | 'CUSTOM'>('SWARNA');
  const [customColor, setCustomColor] = useState('#f59e0b');
  const [rel, setRel] = useState('Friend');
  const [customRelInput, setCustomRelInput] = useState('');
  const [occasion, setOccasion] = useState('General');
  const [customOccasionInput, setCustomOccasionInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.');
  
  // Multi-Gifting States
  const [quantity, setQuantity] = useState(1);
  
  // Dynamic Plan States
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [resultCodes, setResultCodes] = useState<string[]>([]);
  
  // Printable modal state
  const [printCode, setPrintCode] = useState<string | null>(null);

  useEffect(() => {
    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (response.country_code === 'IN') setRegion('INDIA');
        else if (response.country_code) setRegion('ABROAD');
      } catch (e) { setRegion('INDIA'); }
    }
    detectLocation();
  }, []);

  const currency = region === 'INDIA' ? 'INR' : 'USD';
  const currencySymbol = region === 'INDIA' ? '₹' : '$';
  const priceField = region === 'INDIA' ? 'priceINR' : 'priceUSD';

  const giftPackages = initialPlans
    .filter(p => p.name !== 'FREE')
    .map(p => ({
      id: `${p.name}_${p.interval}`,
      name: p.name,
      interval: p.interval,
      months: p.interval === 'YEARLY' ? 12 : 1,
      price: (p as any)[priceField] || 0,
      desc: `${p.interval === 'YEARLY' ? '1 Full Year' : '1 Month'} of uninterrupted ${p.name} Sanskrit learning.`
    }))
    .sort((a,b) => {
      // Prioritize Platinum Yearly first, then Gold Yearly, then Monthly
      if (a.interval === 'YEARLY' && b.interval !== 'YEARLY') return -1;
      if (b.interval === 'YEARLY' && a.interval !== 'YEARLY') return 1;
      return b.price - a.price;
    });

  useEffect(() => {
    if (giftPackages.length && !selectedPlanId) {
      const defaultPkg = giftPackages.find(p => p.name === 'PLATINUM' && p.interval === 'YEARLY') || giftPackages[0];
      setSelectedPlanId(defaultPkg.id);
    }
  }, [giftPackages]);

  const activePkg = giftPackages.find(p => p.id === selectedPlanId) || giftPackages[0];
  const activeRelationship = rel === 'Others' ? (customRelInput.trim() || 'Honored Loved One') : rel;
  const activeOccasionObj = OCCASIONS.find(o => o.key === occasion) || OCCASIONS[0];
  const activeOccasionLabel = occasion === 'Others' 
    ? (customOccasionInput.trim() || 'Special Occasion') 
    : (activeOccasionObj?.label || 'Sacred Gift');

  const activeThemeObj = cardTheme === 'CUSTOM' ? {
    key: 'CUSTOM',
    name: '🎨 Custom Palette',
    primary: customColor,
    secondary: customColor,
    bg: `linear-gradient(135deg, ${customColor}22 0%, #080a0f 100%)`,
    border: customColor,
    glow: `${customColor}40`,
    icon: '🎨',
    accentBg: `${customColor}20`
  } : (CARD_THEMES.find(t => t.key === cardTheme) || CARD_THEMES[0]);
  
  const unitCost = activePkg?.price || 0;
  const totalDue = unitCost * quantity;

  // Instant refresh / reset function when changing plans, quantity, or recovering from cancellation
  const resetPaymentState = () => {
    setLoading(false);
    setPaymentCancelled(false);
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    resetPaymentState();
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    resetPaymentState();
  };

  async function executeCheckout(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activePkg || totalDue <= 0) return;

    const finalRel = rel === 'Others' ? customRelInput : rel;
    if (!finalRel || !name || !email) {
      alert("Please fulfill recipient details before checking out.");
      setStep('compose');
      return;
    }

    setLoading(true);
    setPaymentCancelled(false);

    try {
      const orderPayload = await createRazorpayOrder({
        amount: totalDue,
        currency: currency as 'INR' | 'USD'
      });

      if (!orderPayload.success) {
        throw new Error(orderPayload.error || "Failed to provision Razorpay gateway.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to connect to Razorpay secure gateway. Check your internet connection.");
      }

      const options = {
        key: orderPayload.publicKey,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "Vyoma Academy",
        description: `Gifting ${quantity}x ${activePkg.name} Access (${activeOccasionLabel})`,
        image: "/assets/logo-200-x-70-px.png",
        order_id: orderPayload.orderId,
        handler: async function (response: any) {
          console.log("💳 Payment Captured Successfully!", response.razorpay_payment_id);
          await finalizeVoucherCreation(finalRel);
        },
        prefill: {
          name: currentUser?.name || senderName || "Patron",
          email: currentUser?.email || "gifts@vyoma.org"
        },
        theme: {
          color: activeThemeObj.primary
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout modal closed/cancelled by user.");
            setLoading(false);
            setPaymentCancelled(true);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (failResponse: any) {
        console.error("Payment failed event:", failResponse);
        alert(`❌ Payment Refused: ${failResponse.error?.description || 'Transaction was declined.'}`);
        setLoading(false);
        setPaymentCancelled(true);
      });

      rzp.open();

    } catch (err: any) {
      console.error("Checkout Orchestrator Error:", err);
      alert(`⚠️ Payment Gateway Notice: ${err.message}`);
      setLoading(false);
      setPaymentCancelled(true);
    }
  }

  async function finalizeVoucherCreation(finalRel: string) {
    try {
      const res = await purchaseGiftVoucher({
        recipientName: name,
        recipientEmail: email,
        relationship: finalRel,
        occasion: activeOccasionLabel,
        personalMessage: msg || "Wishing you knowledge and spiritual growth.",
        planName: activePkg.name as any,
        months: activePkg.months,
        quantity: quantity,
        amount: totalDue,
        currency: currency,
        cardTheme: cardTheme === 'CUSTOM' ? customColor : cardTheme,
        senderDisplayName: senderName
      });

      if (res.success) {
        setResultCodes(res.codes || []);
        setStep('success');
      } else {
        alert(`🚨 Database Commit Failure: ${res.error}`);
      }
    } catch (actionErr: any) {
      if (actionErr?.message?.includes("AUTHENTICATION_REQUIRED")) {
        alert("Please sign in or register to finalize and track your gift order.");
        window.location.href = `/login?redirect=${encodeURIComponent('/gift')}`;
        return;
      }
      alert(`🚨 Session Error: ${actionErr.message}`);
    } finally {
      setLoading(false);
    }
  }

  const triggerPrintModal = (code: string) => {
    setPrintCode(code);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const isFormValid = Boolean(
    senderName.trim() &&
    name.trim() && 
    email.trim() && 
    activeRelationship && 
    (occasion !== 'Others' || customOccasionInput.trim()) &&
    (rel !== 'Others' || customRelInput.trim())
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#020710', 
      color: '#fff', 
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <NavBar />

      <style dangerouslySetInnerHTML={{__html: `
        .studio-card {
          background: rgba(10, 18, 32, 0.7);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: clamp(18px, 2.5vw, 28px);
          box-shadow: 0 20px 45px rgba(0,0,0,0.45);
        }
        .ecard-preview {
          background: ${activeThemeObj.bg};
          border: 2px solid ${activeThemeObj.border};
          border-radius: 22px;
          padding: clamp(18px, 2vw, 26px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px ${activeThemeObj.glow};
          transition: all 0.35s ease;
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
          border: none;
        }
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.3);
        }
        .gift-page-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 135px 24px 60px 24px;
          position: relative;
          z-index: 1;
        }
        .theme-card-btn {
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #1e293b;
          background: #0d131f;
          text-align: left;
          white-space: nowrap;
        }
        .theme-card-btn:hover {
          transform: translateY(-1px);
        }
        .chip-button {
          padding: 5px 11px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.74rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #1e293b;
          background: #0d131f;
          white-space: nowrap;
        }
        .chip-button:hover {
          border-color: rgba(255,255,255,0.25);
        }
        .step-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .step-pill {
            flex: 1;
            justify-content: center;
            font-size: 0.75rem;
            padding: 8px 10px;
          }
        }
        @media (max-width: 960px) {
          .gift-main-grid {
            grid-template-columns: 1fr !important;
          }
          .gift-sticky-col {
            position: static !important;
            margin-top: 24px;
          }
        }
        @media print {
          body * { visibility: hidden !important; }
          #printable-card-modal, #printable-card-modal * { visibility: visible !important; }
          #printable-card-modal {
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

      <div className="gift-page-wrapper">
        
        {/* EXECUTIVE HERO HEADER */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '28px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '22px'
        }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255,215,0,0.1)', 
              border: '1px solid rgba(255,215,0,0.3)', 
              color: '#ffd700', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 900, 
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              <span>🎁</span> Sacred Gifting Studio
            </div>
            <h1 style={{ 
              fontSize: '2.4rem', 
              fontWeight: 900, 
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.8px'
            }}>
              Gift Sacred <span style={{ color: activeThemeObj.primary, textShadow: `0 0 30px ${activeThemeObj.glow}` }}>Wisdom</span>
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.96rem', lineHeight: '1.5', maxWidth: '650px' }}>
              Personalize a Vedic digital E-Card with 1-click unboxing ceremony, blessed shloka, and full course streaming membership for your loved ones.
            </p>
          </div>

          {/* TRUST BADGES */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.25)', padding: '5px 12px', borderRadius: '20px', color: '#46d369', fontSize: '0.74rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <span>✨</span> 1-Click Unboxing
            </span>
            <span style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', padding: '5px 12px', borderRadius: '20px', color: '#ffd700', fontSize: '0.74rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <span>📜</span> Certified Membership
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '20px', color: '#cbd5e1', fontSize: '0.74rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <span>🔒</span> Encrypted Checkout
            </span>
          </div>
        </div>

        {/* INTERACTIVE 2-STEP BREADCRUMB */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStep('compose')}
              className="step-pill"
              style={{
                background: step === 'compose' ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: step === 'compose' ? `1.5px solid ${activeThemeObj.primary}` : '1px solid rgba(255,255,255,0.1)',
                color: step === 'compose' ? '#fff' : '#64748b'
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step === 'compose' ? activeThemeObj.primary : (isFormValid ? '#22c55e' : '#334155'),
                color: step === 'compose' ? '#000' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                {isFormValid && step === 'checkout' ? '✓' : '1'}
              </span>
              <span>1. Personalize E-Card</span>
            </button>

            <span style={{ color: '#475569', fontSize: '1rem' }}>→</span>

            <button
              type="button"
              onClick={() => {
                if (isFormValid) {
                  setStep('checkout');
                } else {
                  alert("Please enter Recipient Full Name and Email Address in Step 1 first.");
                }
              }}
              className="step-pill"
              style={{
                background: step === 'checkout' ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: step === 'checkout' ? `1.5px solid ${activeThemeObj.primary}` : '1px solid rgba(255,255,255,0.1)',
                color: step === 'checkout' ? '#fff' : '#64748b',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                opacity: isFormValid ? 1 : 0.6
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step === 'checkout' ? activeThemeObj.primary : '#334155',
                color: step === 'checkout' ? '#000' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                2
              </span>
              <span>2. Choose Plan & Gift</span>
            </button>
          </div>
        )}

        {/* MAIN 2-COLUMN LUXURY STUDIO LAYOUT (SHARED ACROSS STEP 1 & 2) */}
        {step !== 'success' && (
          <div className="gift-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: '32px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: ACTIVE WORKFLOW (STEP 1 COMPOSE OR STEP 2 CHECKOUT) */}
            <div>
              {step === 'compose' ? (
                <div className="studio-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: activeThemeObj.primary, color: '#000', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900 }}>1</span>
                      Personalize Sacred E-Card
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Step 1 of 2</span>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); setStep('checkout'); }}>
                    
                    {/* SENDER IDENTITY (VERIFIED BUYER) */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,170,0,0.02) 100%)',
                      border: '1px solid rgba(255,215,0,0.22)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      marginBottom: '22px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>🪔</span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffd700' }}>
                            Gifter (You) • Verified Account
                          </span>
                          <span style={{ 
                            background: 'rgba(70,211,105,0.15)', 
                            color: '#46d369', 
                            border: '1px solid rgba(70,211,105,0.3)', 
                            borderRadius: '20px', 
                            padding: '2px 8px', 
                            fontSize: '0.68rem', 
                            fontWeight: 800 
                          }}>
                            ✓ Logged In
                          </span>
                        </div>
                        {currentUser?.email && (
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            Account: <strong style={{ color: '#e2e8f0' }}>{currentUser.email}</strong>
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: '0.76rem', color: '#f1f5f9', marginBottom: '6px' }}>
                          Your Name on Gift Card & Email (Signature) *
                        </label>
                        <input
                          required
                          type="text"
                          value={senderName}
                          onChange={e => setSenderName(e.target.value)}
                          placeholder="e.g. Grandma & Grandpa, Ravi Sharma, Your Loving Brother..."
                          style={{
                            ...inputStyle,
                            background: 'rgba(5, 10, 20, 0.85)',
                            borderColor: senderName.trim() ? '#ffd700' : '#ef4444'
                          }}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '5px' }}>
                          💡 This signature will be featured on the recipient's digital E-Card, claim unboxing page, and activation notification email.
                        </div>
                      </div>
                    </div>

                    {/* 1. CARD THEME SELECTOR */}
                    <div style={{ marginBottom: '22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>🎨 1. Select Card Theme & Aesthetic</label>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Presets or Custom Color</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        {CARD_THEMES.map(th => {
                          const isSelected = cardTheme === th.key;
                          return (
                            <button
                              key={th.key}
                              type="button"
                              onClick={() => setCardTheme(th.key as any)}
                              className="theme-card-btn"
                              style={{
                                background: isSelected ? th.accentBg : '#090e17',
                                borderColor: isSelected ? th.primary : '#1e293b',
                                color: isSelected ? th.primary : '#94a3b8',
                                boxShadow: isSelected ? `0 4px 18px ${th.glow}` : 'none'
                              }}
                            >
                              <span style={{ 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%', 
                                background: th.primary, 
                                display: 'inline-block',
                                flexShrink: 0,
                                boxShadow: `0 0 10px ${th.primary}`
                              }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {th.name.split(' ')[1]}
                              </span>
                            </button>
                          );
                        })}

                        {/* CUSTOM COLOR PALETTE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setCardTheme('CUSTOM')}
                          className="theme-card-btn"
                          style={{
                            background: cardTheme === 'CUSTOM' ? `${customColor}25` : '#090e17',
                            borderColor: cardTheme === 'CUSTOM' ? customColor : '#1e293b',
                            color: cardTheme === 'CUSTOM' ? customColor : '#94a3b8',
                            boxShadow: cardTheme === 'CUSTOM' ? `0 4px 18px ${customColor}40` : 'none'
                          }}
                        >
                          <span style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            background: customColor, 
                            display: 'inline-block',
                            flexShrink: 0,
                            boxShadow: `0 0 10px ${customColor}`
                          }} />
                          <span>Custom Color</span>
                        </button>
                      </div>

                      {/* EXPANDABLE COLOR PICKER & SWATCHES */}
                      {cardTheme === 'CUSTOM' && (
                        <div style={{
                          marginTop: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '14px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>Choose Color:</label>
                            <input 
                              type="color" 
                              value={customColor} 
                              onChange={e => setCustomColor(e.target.value)} 
                              style={{
                                width: '38px',
                                height: '32px',
                                padding: 0,
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: 'transparent'
                              }} 
                            />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: customColor }}>{customColor.toUpperCase()}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Swatches:</span>
                            {[
                              { color: '#f26422', name: 'Saffron' },
                              { color: '#ffd700', name: 'Gold' },
                              { color: '#06b6d4', name: 'Teal' },
                              { color: '#3b82f6', name: 'Sapphire' },
                              { color: '#a855f7', name: 'Amethyst' },
                              { color: '#f43f5e', name: 'Ruby' },
                              { color: '#10b981', name: 'Emerald' }
                            ].map(sw => (
                              <button
                                key={sw.color}
                                type="button"
                                onClick={() => setCustomColor(sw.color)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: sw.color,
                                  border: customColor.toLowerCase() === sw.color.toLowerCase() ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'transform 0.15s',
                                  transform: customColor.toLowerCase() === sw.color.toLowerCase() ? 'scale(1.25)' : 'scale(1)'
                                }}
                                title={sw.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. OCCASION SELECTOR */}
                    <div style={{ marginBottom: '22px' }}>
                      <label style={labelStyle}>✨ 2. Select Occasion / Purpose</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {OCCASIONS.map(occ => {
                          const isSelected = occasion === occ.key;
                          return (
                            <button
                              key={occ.key}
                              type="button"
                              onClick={() => setOccasion(occ.key)}
                              className="chip-button"
                              style={{
                                background: isSelected ? activeThemeObj.accentBg : '#090e17',
                                borderColor: isSelected ? activeThemeObj.primary : '#1e293b',
                                color: isSelected ? activeThemeObj.primary : '#94a3b8',
                                boxShadow: isSelected ? `0 2px 10px ${activeThemeObj.glow}` : 'none'
                              }}
                            >
                              {occ.label}
                            </button>
                          );
                        })}
                      </div>

                      {occasion === 'Others' && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={labelStyle}>Specify Custom Occasion / Event Name</label>
                          <input 
                            required 
                            type="text" 
                            value={customOccasionInput} 
                            onChange={e => setCustomOccasionInput(e.target.value)} 
                            placeholder="e.g. Upanayanam, Shashti Poorthi, Griha Pravesham, Arangetram..." 
                            style={inputStyle} 
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. RELATIONSHIP SELECTOR */}
                    <div style={{ marginBottom: '22px' }}>
                      <label style={labelStyle}>👥 3. Honoring Relationship</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {RELATIONS.map(r => {
                          const isSelected = rel === r.key;
                          return (
                            <button
                              key={r.key}
                              type="button"
                              onClick={() => setRel(r.key)}
                              className="chip-button"
                              style={{
                                background: isSelected ? 'rgba(242,100,34,0.15)' : '#090e17',
                                borderColor: isSelected ? '#f26422' : '#1e293b',
                                color: isSelected ? '#f26422' : '#94a3b8'
                              }}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>

                      {rel === 'Others' && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={labelStyle}>Specify Custom Relationship</label>
                          <input 
                            required 
                            type="text" 
                            value={customRelInput} 
                            onChange={e => setCustomRelInput(e.target.value)} 
                            placeholder="e.g. Mentor, Cousin, Colleague, Grandparent..." 
                            style={inputStyle} 
                          />
                        </div>
                      )}
                    </div>

                    {/* 4. AUSPICIOUS BLESSING QUOTE */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>🪔 4. Auspicious Blessing Quote / Message</label>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sacred Shlokas or custom prayer</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {SHLOKA_PRESETS.map((sh, idx) => {
                          const isSelected = msg === sh.text;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setMsg(sh.text)}
                              style={{
                                background: isSelected ? activeThemeObj.primary : 'rgba(255,255,255,0.04)',
                                border: isSelected ? `1px solid ${activeThemeObj.primary}` : '1px solid rgba(255,255,255,0.08)',
                                color: isSelected ? '#000' : '#cbd5e1',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                fontWeight: isSelected ? 800 : 600,
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title={sh.text}
                            >
                              <span>🪔</span> {sh.label}
                            </button>
                          );
                        })}

                        {/* WRITE YOUR OWN QUOTE BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            const isPreset = SHLOKA_PRESETS.some(sh => sh.text === msg);
                            if (isPreset) setMsg('');
                            const inputEl = document.getElementById('gift-custom-blessing-input');
                            if (inputEl) inputEl.focus();
                          }}
                          style={{
                            background: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                            border: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? '1px solid #ffd700' : '1px dashed rgba(255,255,255,0.2)',
                            color: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? '#ffd700' : '#cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            fontWeight: 800,
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>✍️</span> Write Custom Blessing
                        </button>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {!SHLOKA_PRESETS.some(sh => sh.text === msg) 
                              ? '✍️ Your Custom Blessing (Rendered on card):' 
                              : 'Selected Blessing Text (Editable):'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{msg.length} / 300</span>
                        </div>
                        <textarea 
                          id="gift-custom-blessing-input"
                          value={msg} 
                          onChange={e => setMsg(e.target.value.slice(0, 300))} 
                          rows={2} 
                          placeholder="Type your personal Sanskrit blessing or heartfelt note for the recipient..." 
                          style={{ 
                            ...inputStyle, 
                            fontFamily: 'inherit', 
                            resize: 'none',
                            lineHeight: '1.6',
                            borderColor: (!SHLOKA_PRESETS.some(sh => sh.text === msg) && msg.length > 0) ? activeThemeObj.primary : '#1e293b'
                          }}
                        />
                      </div>
                    </div>

                    {/* 5. HIGHLIGHTED RECIPIENT DELIVERY DETAILS */}
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                      border: `1.5px solid ${name && email ? activeThemeObj.primary : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: '18px',
                      padding: '18px 20px',
                      marginBottom: '24px',
                      boxShadow: name && email ? `0 6px 25px ${activeThemeObj.glow}` : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <label style={{ ...labelStyle, color: activeThemeObj.primary, fontSize: '0.82rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎯</span> 5. Recipient Delivery Details
                        </label>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Instant digital delivery to recipient
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <div>
                          <label style={{ ...labelStyle, color: '#f1f5f9' }}>Recipient Full Name *</label>
                          <input 
                            required 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g. Savithri Devi" 
                            style={{ 
                              ...inputStyle, 
                              background: 'rgba(5, 10, 20, 0.85)', 
                              borderColor: name ? activeThemeObj.primary : '#334155' 
                            }} 
                          />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: '#f1f5f9' }}>Recipient Email Address *</label>
                          <input 
                            required 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="recipient@example.com" 
                            style={{ 
                              ...inputStyle, 
                              background: 'rgba(5, 10, 20, 0.85)', 
                              borderColor: email ? activeThemeObj.primary : '#334155' 
                            }} 
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '10px' }}>
                        ✨ The recipient will receive their interactive E-Card with 1-click unboxing ceremony at this email address.
                      </div>
                    </div>

                    {/* CONTINUE BUTTON */}
                    <button 
                      type="submit" 
                      disabled={!isFormValid} 
                      style={{
                        width: '100%', 
                        padding: '16px', 
                        background: isFormValid 
                          ? `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})` 
                          : '#1e293b',
                        color: isFormValid ? '#000' : '#64748b', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 900, 
                        fontSize: '1rem',
                        cursor: isFormValid ? 'pointer' : 'not-allowed', 
                        boxShadow: isFormValid ? `0 10px 30px ${activeThemeObj.glow}` : 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      {isFormValid ? 'CONTINUE TO PACKAGE SELECTION →' : 'FILL RECIPIENT DETAILS TO CONTINUE →'}
                    </button>
                  </form>
                </div>
              ) : (
                /* STEP 2: CHECKOUT STUDIO */
                <div className="studio-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        type="button" 
                        onClick={() => setStep('compose')} 
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          color: '#cbd5e1', 
                          cursor: 'pointer', 
                          fontWeight: 700, 
                          padding: '7px 14px', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ← Edit Card
                      </button>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                        Select Membership Package
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Step 2 of 2</span>
                  </div>

                  {/* PACKAGE LIST */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                    {giftPackages.map(p => {
                      const isPlatinumYearly = p.name === 'PLATINUM' && p.interval === 'YEARLY';
                      const isGoldYearly = p.name === 'GOLD' && p.interval === 'YEARLY';
                      const isSelected = selectedPlanId === p.id;

                      return (
                        <div 
                          key={p.id} 
                          onClick={() => handleSelectPlan(p.id)}
                          style={{
                            background: isSelected ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.015)',
                            border: isSelected ? `2px solid ${activeThemeObj.primary}` : '1px solid rgba(255,255,255,0.08)',
                            padding: '18px 22px', 
                            borderRadius: '16px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px', 
                            transition: 'all 0.2s',
                            position: 'relative',
                            boxShadow: isSelected ? `0 6px 25px ${activeThemeObj.glow}` : 'none'
                          }}
                        >
                          {isPlatinumYearly && (
                            <div style={{ position: 'absolute', top: '-10px', right: '18px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                              ⭐ MOST POPULAR FOR GIFTING
                            </div>
                          )}
                          {isGoldYearly && (
                            <div style={{ position: 'absolute', top: '-10px', right: '18px', background: 'rgba(70,211,105,0.18)', border: '1px solid #46d369', color: '#46d369', fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                              BEST VALUE • SAVE 16%
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>{p.name} MEMBERSHIP</span>
                                <span style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>{p.interval}</span>
                              </div>
                              <div style={{ color: '#8f98a9', fontSize: '0.82rem', marginTop: '4px' }}>{p.desc}</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: isSelected ? activeThemeObj.primary : '#fff' }}>
                              {currencySymbol}{p.price.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                            <div>✓ Unlimited HD Sanskrit Streams</div>
                            <div>✓ Audiobooks & Chanting Decks</div>
                            <div>✓ Interactive Games & Quizzes</div>
                            <div>✓ Verified Digital Certificate</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* MULTI-GIFTING QUANTITY COUNTER */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 20px', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Number of Recipients (Gift Quantity)</h4>
                        <p style={{ color: '#8f98a9', fontSize: '0.78rem', margin: '3px 0 0 0' }}>Gift to multiple friends or students with individual activation keys.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#000', border: '1px solid #222', borderRadius: '30px', padding: '6px 14px' }}>
                        <button 
                          type="button" 
                          onClick={() => handleQuantityChange(Math.max(1, quantity - 1))} 
                          style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.4rem', cursor: 'pointer', fontWeight: 900 }}
                        >
                          −
                        </button>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, minWidth: '28px', textAlign: 'center' }}>{quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => handleQuantityChange(Math.min(50, quantity + 1))} 
                          style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.4rem', cursor: 'pointer', fontWeight: 900 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ORDER SUMMARY */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px 22px', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#8f98a9' }}>
                      <span>Gifter (From)</span>
                      <span style={{ color: '#ffd700', fontWeight: 700 }}>{senderName} {currentUser?.email ? `(${currentUser.email})` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#8f98a9' }}>
                      <span>Recipient (To)</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{name} ({email})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#8f98a9' }}>
                      <span>Selected Plan</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{activePkg?.name} ({activePkg?.interval})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#8f98a9' }}>
                      <span>Unit Cost</span>
                      <span>{currencySymbol}{unitCost.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#8f98a9' }}>
                      <span>Quantity</span>
                      <span>× {quantity}</span>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total Investment</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 950, color: activeThemeObj.primary }}>
                        {currencySymbol}{totalDue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT METHODS & GATEWAY BADGE */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    borderRadius: '14px', 
                    padding: '12px 18px', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <span>🔒</span>
                      <span><strong>Secure Gateway:</strong> UPI (GPay, PhonePe), Cards & NetBanking</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>256-bit SSL</span>
                  </div>

                  {/* CANCELLATION NOTICE & INSTANT REFRESH BANNER (Fixes Defect 2) */}
                  {paymentCancelled && (
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.35)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ fontSize: '0.82rem', color: '#fef08a' }}>
                        <span>ℹ️</span> Payment session was closed. You can switch packages or click to pay again.
                      </div>
                      <button
                        type="button"
                        onClick={resetPaymentState}
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.25)',
                          color: '#fff',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🔄</span> Instant Refresh
                      </button>
                    </div>
                  )}

                  {/* SUBMIT BUTTON WITH INSTANT REFRESH & DISMISSAL HANDLING */}
                  <form onSubmit={executeCheckout}>
                    <button 
                      type="submit"
                      disabled={loading || !activePkg || totalDue <= 0} 
                      style={{
                        width: '100%', 
                        padding: '16px', 
                        background: loading 
                          ? '#1e293b' 
                          : `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, 
                        color: loading ? '#94a3b8' : '#000',
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 900, 
                        fontSize: '1.05rem',
                        cursor: loading ? 'wait' : 'pointer', 
                        boxShadow: loading ? 'none' : `0 10px 30px ${activeThemeObj.glow}`,
                        transition: 'all 0.3s'
                      }}
                    >
                      {loading 
                        ? '⚡ LAUNCHING SECURE GATEWAY...' 
                        : `💳 PAY SECURELY (${currencySymbol}${totalDue.toLocaleString()})`
                      }
                    </button>
                  </form>

                  {/* SAFETY RESET LINK */}
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={resetPaymentState}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Payment window closed or stuck? Click here to refresh and try again
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* RIGHT COLUMN: PERMANENT LIVE E-CARD PREVIEW (VISIBLE IN BOTH STEP 1 & 2) */}
            <div className="gift-sticky-col" style={{ position: 'sticky', top: '135px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  Live E-Card Preview
                </div>
                <div style={{ fontSize: '0.75rem', color: activeThemeObj.primary, fontWeight: 800 }}>
                  {activeThemeObj.name}
                </div>
              </div>
              
              <div className="ecard-preview">
                {/* AMBIENT GLOW ORB */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: `1px solid ${activeThemeObj.primary}`, opacity: 0.15 }}></div>
                
                {/* CARD TOP BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <img src="/assets/logo-200-x-70-px.png" alt="Vyoma Logo" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
                  <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.64rem', fontWeight: 900, padding: '4px 10px', borderRadius: '18px', letterSpacing: '0.8px' }}>
                    {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'E-CARD'}
                  </div>
                </div>

                {/* CARD BODY */}
                <div style={{ minHeight: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ color: '#8f98a9', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>HONORING</div>
                    <div style={{ color: '#8f98a9', fontSize: '0.7rem', fontWeight: 750 }}>
                      FROM: <span style={{ color: activeThemeObj.primary }}>{senderName || 'Well-Wisher'}</span>
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', margin: '2px 0 6px 0', letterSpacing: '-0.3px', wordBreak: 'break-word' }}>
                    {name || 'Dear Recipient'}
                  </h2>
                  <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.82rem', marginTop: '2px' }}>
                    {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionLabel}</span>
                  </div>
                  <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.86rem', marginTop: '14px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '14px', lineHeight: '1.6', margin: '14px 0 0 0' }}>
                    "{msg || 'Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.'}"
                  </p>
                  <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.76rem', color: '#94a3b8' }}>
                    — With Blessings, <strong style={{ color: '#fff' }}>{senderName || 'Well-Wisher'}</strong>
                  </div>
                </div>

                {/* CARD FOOTER WITH SELECTED PLAN (INCLUDED IN PREVIEW) */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#8f98a9', marginBottom: '2px' }}>
                      INCLUDES {activePkg?.name} MEMBERSHIP ({activePkg?.interval === 'YEARLY' ? '1 YEAR' : '1 MONTH'})
                    </div>
                    <div style={{ fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 900, fontSize: '1rem', letterSpacing: '1px' }}>
                      GIFT-VYOM-XXXX-XXXX
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem' }}>{activeThemeObj.icon}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '12px', color: '#64748b', fontSize: '0.75rem' }}>
                ✨ Consecrated digital delivery with 1-click unboxing ceremony
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'success' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ background: 'rgba(10,18,32,0.7)', border: `2px solid ${activeThemeObj.primary}`, borderRadius: '24px', padding: '40px 32px', boxShadow: `0 25px 60px ${activeThemeObj.glow}` }}>
              <div style={{ fontSize: '3.8rem', marginBottom: '14px' }}>🏆</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: activeThemeObj.primary, marginBottom: '8px', letterSpacing: '-0.8px' }}>
                Wisdom Shared Successfully!
              </h2>
              
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '14px 18px', color: '#93c5fd', fontSize: '0.88rem', marginBottom: '26px', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>📧</span>
                <div>
                  <strong>Automated E-Card Sent:</strong> Delivered to <strong style={{ color: '#fff' }}>{email}</strong> from <strong style={{ color: '#ffd700' }}>{senderName}</strong> with 1-click unboxing ceremony. Order logged under your account ({currentUser?.email ? <strong style={{ color: '#fff' }}>{currentUser.email}</strong> : 'Verified Gifter'}).
                </div>
              </div>

              {/* VISUAL E-CARD IN SUCCESS STATE */}
              <div style={{ 
                background: activeThemeObj.bg, 
                border: `2px solid ${activeThemeObj.primary}`, 
                borderRadius: '22px', 
                padding: '28px 30px', 
                margin: '0 auto 28px auto', 
                maxWidth: '600px', 
                textAlign: 'left',
                boxShadow: `0 18px 45px ${activeThemeObj.glow}`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <img src="/assets/logo-200-x-70-px.png" alt="Logo" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
                  <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.64rem', fontWeight: 900, padding: '4px 10px', borderRadius: '18px', letterSpacing: '0.8px' }}>
                    {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'WISDOM E-CARD'}
                  </div>
                </div>
                <div style={{ minHeight: '110px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#8f98a9', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PREPARED EXCLUSIVELY FOR</div>
                    <div style={{ color: '#8f98a9', fontSize: '0.7rem', fontWeight: 750 }}>
                      FROM: <span style={{ color: activeThemeObj.primary }}>{senderName}</span>
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: '3px 0 6px 0' }}>{name}</h2>
                  <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.84rem' }}>
                    {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionLabel}</span>
                  </div>
                  <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.88rem', marginTop: '14px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '14px', lineHeight: '1.6' }}>
                    "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                  </p>
                  <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                    — With Blessings, <strong style={{ color: '#fff' }}>{senderName}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#8f98a9', marginBottom: '2px' }}>PRIMARY ACTIVATION KEY</div>
                    <div style={{ fontSize: '1.4rem', fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 900, letterSpacing: '1px' }}>
                      {resultCodes[0] || 'GIFT-VYOM-XXXX-XXXX'}
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem' }}>{activeThemeObj.icon}</div>
                </div>
              </div>

              {/* DISTRIBUTION CONTROLS */}
              <h4 style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>🔑 Gift Key Distribution Center</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
                {resultCodes.map((code, idx) => {
                  const claimUrl = typeof window !== 'undefined' 
                    ? `${window.location.origin}/gift/claim/${code}?theme=${cardTheme}` 
                    : `https://vyoma-ott-platform.vercel.app/gift/claim/${code}?theme=${cardTheme}`;
                  
                  const indWhatsappMsg = `🎁 *Vyoma Gift of Wisdom* 🎁\n\nDear *${name}*,\n\nI (*${senderName}*) have gifted you a *${activePkg.name} Plan* subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT for ${activeOccasionLabel}!\n\n💬 Message: _"${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"_\n\n🔑 *Activation Key*: *${code}*\n\n👉 *Open Your Gift & Activate*: ${claimUrl}\n\nEnjoy your learning journey! 🪔`;
                  const indWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(indWhatsappMsg)}`;
                  const indEmailSubject = `🎁 Gift of Wisdom from ${senderName}: Your Vyoma Sanskrit Subscription Key (${activeOccasionLabel})!`;
                  const indEmailBody = `Dear ${name},\n\nI (${senderName}) have gifted you a ${activePkg.name} Plan subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT for ${activeOccasionLabel}!\n\nMessage: "${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"\n\nYour Activation Key: ${code}\n\nOpen Your Gift & Activate in 1 Click: ${claimUrl}\n\nEnjoy your learning journey!\n\nWith love,\n${senderName}\nVyoma Academy`;
                  const indEmailUrl = `mailto:${email}?subject=${encodeURIComponent(indEmailSubject)}&body=${encodeURIComponent(indEmailBody)}`;
                  
                  return (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', padding: '18px 22px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ color: activeThemeObj.primary, fontSize: '0.78rem', fontWeight: 800 }}>KEY #{idx + 1} OF {quantity}</span>
                        <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 900, color: '#fff' }}>{code}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => { navigator.clipboard.writeText(code); alert(`Key #${idx + 1} copied!`); }} className="share-btn" style={{ flex: 1, minWidth: '95px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>📋 Copy Key</button>
                        <button onClick={() => { navigator.clipboard.writeText(claimUrl); alert(`Unboxing Claim link copied: ${claimUrl}`); }} className="share-btn" style={{ flex: 1, minWidth: '115px', background: 'rgba(242,100,34,0.15)', color: '#f26422', border: '1px solid rgba(242,100,34,0.3)' }}>🔗 Copy Link</button>
                        <a href={indWhatsappUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '110px', background: '#25D366', color: '#fff' }}>💬 WhatsApp</a>
                        <a href={indEmailUrl} className="share-btn" style={{ flex: 1, minWidth: '95px', background: '#3b82f6', color: '#fff' }}>✉️ Email</a>
                        <button onClick={() => triggerPrintModal(code)} className="share-btn" style={{ flex: 1, minWidth: '120px', background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>🖨️ Print PDF</button>
                        <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)' }}>👁️ Preview</a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px', display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 26px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '0.9rem' }}>Return Home</a>
                <button onClick={() => { setStep('compose'); setQuantity(1); setName(''); setEmail(''); setMsg('Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.'); setRel('Friend'); }} style={{ background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, color: '#000', border: 'none', padding: '12px 26px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>🎁 Share Another Gift</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE MODAL */}
      {printCode && (
        <div 
          id="printable-card-modal"
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
            padding: '35px',
            border: '6px double #b8860b',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => setPrintCode(null)}
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

            <div style={{ textAlign: 'center', borderBottom: '2px solid #b8860b', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.7rem', color: '#b8860b', fontWeight: 900, letterSpacing: '2px' }}>VYOMA ACADEMY</div>
              <div style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Sacred Gift of Sanskrit Wisdom</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>THIS SACRED GIFT HONORS</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#111', marginTop: '4px' }}>{name}</div>
              <div style={{ fontSize: '0.85rem', color: '#b8860b', fontWeight: 700, marginTop: '4px' }}>
                Presented with love by {senderName} ({activeRelationship} • {activeOccasionLabel})
              </div>
            </div>

            <div style={{ background: '#fdfbf7', borderLeft: '4px solid #b8860b', padding: '14px 18px', margin: '18px 0', fontStyle: 'italic', color: '#333', lineHeight: '1.6', fontSize: '0.92rem' }}>
              "{msg}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ccc', paddingTop: '18px', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#666' }}>MEMBERSHIP ACCESS</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111' }}>{activePkg?.name} Plan ({activePkg?.interval === 'YEARLY' ? '1 Full Year' : '1 Month'})</div>
                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>Activation Key: <strong style={{ color: '#b8860b', fontFamily: 'monospace' }}>{printCode}</strong></div>
              </div>

              {/* QR Code */}
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/gift/claim/${printCode}?theme=${cardTheme}` : `https://vyoma-ott-platform.vercel.app/gift/claim/${printCode}?theme=${cardTheme}`)}`}
                  alt="Scan QR to Claim"
                  style={{ width: '85px', height: '85px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <div style={{ fontSize: '0.62rem', color: '#666', marginTop: '4px' }}>Scan with camera to claim</div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.print()}
                style={{ background: '#b8860b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🖨️ Print Now
              </button>
              <button 
                onClick={() => setPrintCode(null)}
                style={{ background: '#eee', color: '#333', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
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

const labelStyle: React.CSSProperties = {
  display: 'block', 
  color: '#8f98a9', 
  fontSize: '0.74rem', 
  marginBottom: '8px', 
  fontWeight: 800, 
  textTransform: 'uppercase', 
  letterSpacing: '0.6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%', 
  background: '#090e17', 
  border: '1px solid #1e293b', 
  color: '#fff', 
  padding: '11px 16px', 
  borderRadius: '12px', 
  fontSize: '0.9rem', 
  outline: 'none',
  transition: 'border-color 0.2s'
};
