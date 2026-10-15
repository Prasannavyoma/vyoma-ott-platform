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
  { key: 'Shishya', label: '🤝 Student / Shishya (शिष्यः)' },
  { key: 'Friend', label: '🤝 Friend (मित्रम्)' },
  { key: 'Teacher', label: '🪔 Guru / Teacher (गुरुः)' },
  { key: 'Others', label: '✏️ Others...' }
];

const OCCASIONS = [
  { key: 'General', label: '✨ Sacred Gift of Wisdom (शुभाशयाः)' },
  { key: 'Birthday', label: '🎂 Birthday Blessing (जन्मोत्सवः)' },
  { key: 'Guru Purnima', label: '🪔 Guru Purnima Honor (गुरुपूर्णिमा)' },
  { key: 'Upanayanam', label: '🧵 Upanayanam / Samskara (उपनयनम्)' },
  { key: 'Diwali', label: '🪔 Diwali & Festivals (दीपावली उत्सवः)' },
  { key: 'Sanskrit Day', label: '📜 Sanskrit Day (संस्कृतदिवसः)' },
  { key: 'Spiritual Growth', label: '🕉️ Spiritual Milestone (साधना)' },
];

const CARD_THEMES = [
  { 
    key: 'SWARNA', 
    name: '👑 Royal Gold (स्वर्णम्)', 
    primary: '#ffd700', 
    secondary: '#ffaa00', 
    bg: 'linear-gradient(135deg, #1c140a 0%, #080a0f 100%)', 
    border: '#ffd700', 
    glow: 'rgba(255,215,0,0.18)', 
    icon: '🪔',
    accentBg: 'rgba(255,215,0,0.1)'
  },
  { 
    key: 'UTSAV', 
    name: '🪔 Festive Diya (उत्सवः)', 
    primary: '#ff7b54', 
    secondary: '#f26422', 
    bg: 'linear-gradient(135deg, #2b0c0c 0%, #0d0608 100%)', 
    border: '#ff7b54', 
    glow: 'rgba(255,123,84,0.22)', 
    icon: '✨',
    accentBg: 'rgba(255,123,84,0.12)'
  },
  { 
    key: 'GURUKULA', 
    name: '📜 Vedic Heritage (गुरुकुलम्)', 
    primary: '#e9c46a', 
    secondary: '#d4a373', 
    bg: 'linear-gradient(135deg, #22190f 0%, #0d0a06 100%)', 
    border: '#d4a373', 
    glow: 'rgba(212,163,115,0.22)', 
    icon: '📜',
    accentBg: 'rgba(233,196,106,0.12)'
  },
  { 
    key: 'PADMA', 
    name: '🌸 Sacred Lotus (पद्मम्)', 
    primary: '#c084fc', 
    secondary: '#e879f9', 
    bg: 'linear-gradient(135deg, #200d2d 0%, #080310 100%)', 
    border: '#c084fc', 
    glow: 'rgba(192,132,252,0.22)', 
    icon: '🌸',
    accentBg: 'rgba(192,132,252,0.12)'
  }
];

const SHLOKA_PRESETS = [
  { label: 'विद्ययाऽमृतमश्नुते', text: 'विद्ययाऽमृतमश्नुते — Through sacred knowledge, one attains immortality.' },
  { label: 'विद्या ददाति विनयं', text: 'विद्या ददाति विनयं विनयाद्याति पात्रताम् — Knowledge bestows true humility, and humility leads to excellence.' },
  { label: 'तमसो मा ज्योतिर्गमय', text: 'तमसो मा ज्योतिर्गमय — Lead me from the darkness of ignorance into the eternal light of wisdom.' },
  { label: 'ज्ञानं परमं बलम्', text: 'ज्ञानं परमं बलम् — Spiritual and linguistic wisdom is the supreme inner strength.' },
];

// Resilient script loader utility to safely inject global Razorpay checkout SDK
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

export default function GiftClientPage({ initialPlans }: { initialPlans: RealPlan[] }) {
  const [step, setStep] = useState<'compose' | 'checkout' | 'success'>('compose');
  const [region, setRegion] = useState<'INDIA' | 'ABROAD'>('INDIA');
  
  // Form States
  const [cardTheme, setCardTheme] = useState<'SWARNA' | 'UTSAV' | 'GURUKULA' | 'PADMA'>('SWARNA');
  const [rel, setRel] = useState('Friend');
  const [customRelInput, setCustomRelInput] = useState('');
  const [occasion, setOccasion] = useState('General');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.');
  
  // Multi-Gifting States
  const [quantity, setQuantity] = useState(1);
  
  // Dynamic Plan States
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultCodes, setResultCodes] = useState<string[]>([]);
  
  // Printable modal state
  const [printCode, setPrintCode] = useState<string | null>(null);

  // 1. REGION DETECTION
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
      desc: `${p.interval === 'YEARLY' ? '1 Full Year' : '1 Month'} of ${p.name} learning.`
    }))
    .sort((a,b) => a.price - b.price);

  useEffect(() => {
    if (giftPackages.length && !selectedPlanId) {
      // Default to 1-Year Platinum or first package
      const defaultPkg = giftPackages.find(p => p.name === 'PLATINUM' && p.interval === 'YEARLY') || giftPackages[0];
      setSelectedPlanId(defaultPkg.id);
    }
  }, [giftPackages]);

  const activePkg = giftPackages.find(p => p.id === selectedPlanId) || giftPackages[0];
  const activeRelationship = rel === 'Others' ? customRelInput : rel;
  const activeOccasionObj = OCCASIONS.find(o => o.key === occasion) || OCCASIONS[0];
  const activeThemeObj = CARD_THEMES.find(t => t.key === cardTheme) || CARD_THEMES[0];
  
  const unitCost = activePkg?.price || 0;
  const totalDue = unitCost * quantity;

  // ============================================================
  // 🚀 RAZORPAY CHECKOUT ENGINE & SUCCESS CAPTURE ORCHESTRATION
  // ============================================================
  async function executeCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!activePkg || totalDue <= 0) return;

    const finalRel = rel === 'Others' ? customRelInput : rel;
    if (!finalRel || !name || !email) {
      alert("Please fulfill recipient details before checking out.");
      return;
    }

    setLoading(true);

    try {
      // 1. Step A: Instantiate Server-side Razorpay Order Token
      const orderPayload = await createRazorpayOrder({
        amount: totalDue,
        currency: currency as 'INR' | 'USD'
      });

      if (!orderPayload.success) {
        throw new Error(orderPayload.error || "Failed to provision Razorpay gateway.");
      }

      // 2. Step B: Inject and Validate Razorpay Client-Side Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to connect to Razorpay secure gateway. Check your internet connection.");
      }

      // 4. Step D: Trigger Official Razorpay Modal
      const options = {
        key: orderPayload.publicKey,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "Vyoma Academy",
        description: `Gifting ${quantity}x ${activePkg.name} Access Bundle (${activeOccasionObj.label})`,
        image: "/assets/logo-200-x-70-px.png",
        order_id: orderPayload.orderId,
        handler: async function (response: any) {
          console.log("💳 Payment Captured Successfully!", response.razorpay_payment_id);
          await finalizeVoucherCreation(finalRel);
        },
        prefill: {
          name: name || "Patron",
          email: email || "gifts@vyoma.com"
        },
        theme: {
          color: activeThemeObj.primary
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (failResponse: any) {
        alert(`❌ Transaction Refused: ${failResponse.error.description}`);
        setLoading(false);
      });

      rzp.open();

    } catch (err: any) {
      console.error("Checkout Orchestrator Error:", err);
      alert(`⚠️ System Failure: ${err.message}`);
      setLoading(false);
    }
  }

  // Atomic Execution wrapper after Razorpay authorizes capture
  async function finalizeVoucherCreation(finalRel: string) {
    try {
      const res = await purchaseGiftVoucher({
        recipientName: name,
        recipientEmail: email,
        relationship: finalRel,
        occasion: activeOccasionObj.label,
        personalMessage: msg || "Wishing you knowledge and spiritual growth.",
        planName: activePkg.name as any,
        months: activePkg.months,
        quantity: quantity,
        amount: totalDue,
        currency: currency,
        cardTheme: cardTheme
      });

      if (res.success) {
        setResultCodes(res.codes || []);
        setStep('success');
      } else {
        alert(`🚨 Database Commit Failure: ${res.error}`);
      }
    } catch (actionErr: any) {
      alert(`🚨 Session Authentication Lost: Please re-authenticate.`);
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

      {/* Embedded dynamic styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        @keyframes floatCard {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .compose-container {
          background: rgba(10, 18, 32, 0.55);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .ecard-preview {
          background: ${activeThemeObj.bg};
          border: 2px solid ${activeThemeObj.border};
          border-radius: 24px;
          padding: 35px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 55px ${activeThemeObj.glow};
          animation: floatCard 6s infinite ease-in-out;
          transition: all 0.4s ease;
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          border: none;
        }
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
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

      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '150px 20px 80px 20px', zIndex: 1, position: 'relative' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
           <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🎁</div>
           <h1 style={{ 
             fontSize: '3.2rem', fontWeight: 900, 
             background: 'linear-gradient(to right, #ffd700, #ffa500)',
             WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
             marginBottom: '15px',
             letterSpacing: '-1.5px'
           }}>Gift Sacred Wisdom</h1>
           <p style={{ color: '#8f98a9', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
             Share the eternal nectar of Sanskrit wisdom. Send interactive digital E-Cards complete with an unboxing reveal and 1-click activation!
           </p>
           <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', padding: '6px 16px', borderRadius: '20px', color: '#ffd700', fontSize: '0.8rem', fontWeight: 800 }}>
                💳 Gateway: Razorpay Checkout ({currency})
              </div>
              <div style={{ background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.25)', padding: '6px 16px', borderRadius: '20px', color: '#46d369', fontSize: '0.8rem', fontWeight: 800 }}>
                ✨ 1-Click Interactive Unboxing Experience
              </div>
           </div>
        </div>

        {step === 'compose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '35px' }}>
            
            {/* STEP A: COMPOSE */}
            <div className="compose-container">
               <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ background: activeThemeObj.primary, color: '#000', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.85rem', fontWeight: 900 }}>1</span>
                 Personalize Your Gift of Wisdom
               </h3>
               
               <form onSubmit={(e) => { e.preventDefault(); setStep('checkout'); }}>
                  
                  {/* 1. CARD THEME SELECTOR */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>🎨 Select Card Theme & Aesthetic</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {CARD_THEMES.map(th => {
                        const isSelected = cardTheme === th.key;
                        return (
                          <button
                            key={th.key}
                            type="button"
                            onClick={() => setCardTheme(th.key as any)}
                            style={{
                              background: isSelected ? th.accentBg : '#0d131f',
                              border: isSelected ? `2px solid ${th.primary}` : '1px solid #1e293b',
                              color: isSelected ? th.primary : '#94a3b8',
                              padding: '10px 12px',
                              borderRadius: '14px',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: isSelected ? `0 4px 15px ${th.glow}` : 'none'
                            }}
                          >
                            <span>{th.icon}</span> {th.name.split(' ')[1]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. OCCASION SELECTOR */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={labelStyle}>Select Occasion / Purpose</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {OCCASIONS.map(occ => (
                        <button
                          key={occ.key} type="button" onClick={() => setOccasion(occ.key)}
                          style={{
                            background: occasion === occ.key ? activeThemeObj.accentBg : '#0d131f',
                            border: `1px solid ${occasion === occ.key ? activeThemeObj.primary : '#1e293b'}`,
                            color: occasion === occ.key ? activeThemeObj.primary : '#94a3b8',
                            padding: '8px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {occ.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. RELATIONSHIP SELECTOR */}
                  <label style={labelStyle}>Who are you honoring with this Gift?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
                     {RELATIONS.map(r => (
                        <button
                           key={r.key} type="button" onClick={() => setRel(r.key)}
                           style={{
                             background: rel === r.key ? 'rgba(242,100,34,0.15)' : '#0d131f',
                             border: `1px solid ${rel === r.key ? '#f26422' : '#1e293b'}`,
                             color: rel === r.key ? '#f26422' : '#94a3b8',
                             padding: '8px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                           }}
                        >
                           {r.label}
                        </button>
                     ))}
                  </div>

                  {rel === 'Others' && (
                     <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>Enter Custom Relationship</label>
                        <input required type="text" value={customRelInput} onChange={e => setCustomRelInput(e.target.value)} placeholder="e.g. Mentor, Cousin..." style={inputStyle} />
                     </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                     <div>
                        <label style={labelStyle}>Recipient Full Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savithri Devi" style={inputStyle} />
                     </div>
                     <div>
                        <label style={labelStyle}>Recipient Email Address</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recipient@example.com" style={inputStyle} />
                     </div>
                  </div>

                  {/* SHLOKA INSPIRATION PRESETS */}
                  <div style={{ marginBottom: '15px' }}>
                     <label style={labelStyle}>Select Auspicious Blessing Quote (Optional)</label>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                       {SHLOKA_PRESETS.map((sh, idx) => (
                         <button
                           key={idx}
                           type="button"
                           onClick={() => setMsg(sh.text)}
                           style={{
                             background: 'rgba(255,255,255,0.03)',
                             border: '1px solid rgba(255,255,255,0.08)',
                             color: '#cbd5e1',
                             padding: '6px 12px',
                             borderRadius: '12px',
                             fontSize: '0.75rem',
                             cursor: 'pointer',
                             fontWeight: 600,
                             transition: 'all 0.2s'
                           }}
                           onMouseEnter={(e) => { e.currentTarget.style.borderColor = activeThemeObj.primary; e.currentTarget.style.color = activeThemeObj.primary; }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
                         >
                           🪔 {sh.label}
                         </button>
                       ))}
                     </div>
                  </div>

                  <div style={{ marginBottom: '35px' }}>
                     <label style={labelStyle}>Personalized Blessing / Greeting Message</label>
                     <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="May this sacred journey into Sanskrit bring peace and wisdom." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'none' }}></textarea>
                  </div>

                  <button type="submit" disabled={!activeRelationship || !name || !email} style={{
                     width: '100%', padding: '16px', background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`,
                     color: '#000', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1rem',
                     cursor: 'pointer', boxShadow: `0 10px 30px ${activeThemeObj.glow}`, opacity: (!activeRelationship || !name || !email) ? 0.6 : 1,
                     transition: 'all 0.3s'
                  }}>
                     CONTINUE TO PACKAGE SELECTION →
                  </button>
               </form>
            </div>
            
            {/* E-CARD LIVE PREVIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div style={{ textAlign: 'center', color: '#8f98a9', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 700 }}>
                 Live E-Card Preview ({activeThemeObj.name.split(' ')[1]})
               </div>
               
               <div className="ecard-preview">
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: `1px solid ${activeThemeObj.primary}`, opacity: 0.1 }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                     <img src="/assets/logo-200-x-70-px.png" alt="Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.65rem', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
                       {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'E-CARD'}
                     </div>
                  </div>
                  <div style={{ minHeight: '130px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>HONORING</div>
                     <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '4px', letterSpacing: '-0.5px' }}>{name || 'Dear Recipient'}</h2>
                     <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>
                       {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionObj.key}</span>
                     </div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.88rem', marginTop: '20px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '15px', lineHeight: '1.6' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px' }}>
                     <div>
                        <div style={{ fontSize: '0.7rem', color: '#8f98a9' }}>SAMPLE ACTIVATION KEY</div>
                        <div style={{ fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 800, fontSize: '1.05rem', letterSpacing: '1px' }}>GIFT-VYOM-XXXX-XXXX</div>
                     </div>
                     <div style={{ fontSize: '2.2rem' }}>{activeThemeObj.icon}</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ maxWidth: '750px', margin: '0 auto', background: 'rgba(10, 18, 32, 0.55)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '40px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => setStep('compose')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer', fontWeight: 'bold', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem' }}>← Edit Details</button>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Choose Gift Package & Quantity</h3>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
                {giftPackages.map(p => {
                  const isPlatinumYearly = p.name === 'PLATINUM' && p.interval === 'YEARLY';
                  const isGoldYearly = p.name === 'GOLD' && p.interval === 'YEARLY';
                  const isSelected = selectedPlanId === p.id;

                  return (
                    <div 
                      key={p.id} onClick={() => setSelectedPlanId(p.id)}
                      style={{
                        background: isSelected ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.015)',
                        border: isSelected ? `2px solid ${activeThemeObj.primary}` : '1px solid rgba(255,255,255,0.08)',
                        padding: '22px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {isPlatinumYearly && (
                        <div style={{ position: 'absolute', top: '-10px', right: '20px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontSize: '0.68rem', fontWeight: 900, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                          ⭐ MOST POPULAR FOR GIFTING
                        </div>
                      )}
                      {isGoldYearly && (
                        <div style={{ position: 'absolute', top: '-10px', right: '20px', background: 'rgba(70,211,105,0.18)', border: '1px solid #46d369', color: '#46d369', fontSize: '0.68rem', fontWeight: 900, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                          BEST VALUE • SAVE 16%
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{p.name} MEMBERSHIP</span>
                            <span style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>{p.interval}</span>
                          </div>
                          <div style={{ color: '#8f98a9', fontSize: '0.85rem', marginTop: '4px' }}>{p.desc}</div>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isSelected ? activeThemeObj.primary : '#fff' }}>
                          {currencySymbol}{p.price}
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.76rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                        <div>✓ Unlimited HD Sanskrit Courses</div>
                        <div>✓ Audiobooks & 30-Day Downloads</div>
                        <div>✓ Interactive Games & Quizzes</div>
                        <div>✓ Verified Certificates & Notes</div>
                      </div>
                    </div>
                  );
                })}
             </div>

             <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '22px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>🔢 Multi-Gifting Counter</h4>
                      <p style={{ color: '#8f98a9', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Specify quantity for bulk gifting to multiple friends, students, or family members.</p>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#000', border: '1px solid #222', borderRadius: '30px', padding: '5px 15px' }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.5rem', cursor: 'pointer', fontWeight: 900 }}>−</button>
                      <span style={{ fontSize: '1.3rem', fontWeight: 900, width: '30px', textAlign: 'center' }}>{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(50, quantity + 1))} style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.5rem', cursor: 'pointer', fontWeight: 900 }}>+</button>
                   </div>
                </div>
             </div>

             <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '22px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#8f98a9' }}>
                   <span>Selected Theme</span>
                   <span style={{ color: activeThemeObj.primary, fontWeight: 700 }}>{activeThemeObj.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#8f98a9' }}>
                   <span>Unit Cost ({activePkg?.name} {activePkg?.interval})</span>
                   <span>{currencySymbol}{unitCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#8f98a9' }}>
                   <span>Quantity</span>
                   <span>× {quantity}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.35rem' }}>
                   <span>Total Due</span>
                   <span style={{ color: activeThemeObj.primary }}>{currencySymbol}{totalDue.toLocaleString()}</span>
                </div>
             </div>

             <form onSubmit={executeCheckout}>
                <button disabled={loading || !activePkg} style={{
                    width: '100%', padding: '16px', background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, color: '#000',
                    border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem',
                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: `0 10px 30px ${activeThemeObj.glow}`,
                    transition: 'all 0.3s'
                }}>
                   {loading ? '⚡ LAUNCHING SECURE RAZORPAY GATEWAY...' : `💳 PAY SECURELY (${currencySymbol}${totalDue.toLocaleString()})`}
                </button>
             </form>
          </div>
        )}

        {step === 'success' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
             <div style={{ background: 'rgba(10,18,32,0.55)', border: `2px solid ${activeThemeObj.primary}`, borderRadius: '30px', padding: '50px 40px', boxShadow: `0 30px 60px ${activeThemeObj.glow}` }}>
                <div style={{ fontSize: '4.5rem', marginBottom: '20px' }}>🏆</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: activeThemeObj.primary, marginBottom: '10px', letterSpacing: '-1px' }}>Wisdom Shared Successfully!</h2>
                
                {/* Email dispatch alert block */}
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '15px 20px', color: '#93c5fd', fontSize: '0.9rem', marginBottom: '35px', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <span style={{ fontSize: '1.3rem' }}>📧</span>
                   <div>
                      <strong>Automated E-Card Sent:</strong> An elegant digital E-Card with 1-click activation has been emailed directly to <strong style={{ color: '#fff' }}>{email}</strong>.
                   </div>
                </div>

                <p style={{ color: '#8f98a9', fontSize: '1.05rem', marginBottom: '25px' }}>
                   Below is your crafted E-Card. Share it instantly via <strong>WhatsApp</strong>, copy the interactive unboxing link, or <strong>Print / Download as PDF</strong>!
                </p>

                {/* VISUAL E-CARD IN SUCCESS STATE */}
                <div style={{ 
                  background: activeThemeObj.bg, 
                  border: `2px solid ${activeThemeObj.primary}`, 
                  borderRadius: '24px', 
                  padding: '35px', 
                  margin: '0 auto 35px auto', 
                  maxWidth: '620px', 
                  textAlign: 'left',
                  boxShadow: `0 20px 55px ${activeThemeObj.glow}`,
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: `1px solid ${activeThemeObj.primary}`, opacity: 0.08 }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                     <img src="/assets/logo-200-x-70-px.png" alt="Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.65rem', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
                       {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'WISDOM E-CARD'}
                     </div>
                  </div>
                  <div style={{ minHeight: '120px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PREPARED EXCLUSIVELY FOR</div>
                     <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginTop: '5px' }}>{name}</h2>
                     <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>
                       {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionObj.key}</span>
                     </div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.9rem', marginTop: '20px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '15px', lineHeight: '1.6' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '35px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <div>
                        <div style={{ fontSize: '0.7rem', color: '#8f98a9', marginBottom: '5px' }}>PRIMARY ACTIVATION KEY</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 900, letterSpacing: '1px' }}>{resultCodes[0] || 'GIFT-VYOM-XXXX-XXXX'}</div>
                     </div>
                     <div style={{ fontSize: '2rem' }}>{activeThemeObj.icon}</div>
                  </div>
                </div>

                {/* DISTRIBUTION CONTROLS */}
                <h4 style={{ textAlign: 'left', fontSize: '1.15rem', fontWeight: 800, marginBottom: '18px' }}>🔑 Gift Key Distribution Center</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                   {resultCodes.map((code, idx) => {
                      const claimUrl = typeof window !== 'undefined' 
                        ? `${window.location.origin}/gift/claim/${code}?theme=${cardTheme}` 
                        : `https://vyoma-ott-platform.vercel.app/gift/claim/${code}?theme=${cardTheme}`;
                      
                      const indWhatsappMsg = `🎁 *Vyoma Gift of Wisdom* 🎁\n\nDear *${name}*,\n\nI have gifted you a *${activePkg.name} Tier* subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT for ${activeOccasionObj.label}!\n\n💬 Message: _"${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"_\n\n🔑 *Activation Key*: *${code}*\n\n👉 *Open Your Gift & Activate*: ${claimUrl}\n\nEnjoy your learning journey! 🪔`;
                      const indWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(indWhatsappMsg)}`;
                      const indEmailSubject = `🎁 Gift of Wisdom: Your Vyoma Sanskrit Subscription Key (${activeOccasionObj.label})!`;
                      const indEmailBody = `Dear ${name},\n\nI have gifted you a ${activePkg.name} Tier subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT for ${activeOccasionObj.label}!\n\nMessage: "${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"\n\nYour Activation Key: ${code}\n\nOpen Your Gift & Activate in 1 Click: ${claimUrl}\n\nEnjoy your learning journey!\n\nVyoma Academy`;
                      const indEmailUrl = `mailto:${email}?subject=${encodeURIComponent(indEmailSubject)}&body=${encodeURIComponent(indEmailBody)}`;
                      
                      return (
                         <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '22px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                               <span style={{ color: activeThemeObj.primary, fontSize: '0.8rem', fontWeight: 800 }}>KEY #{idx + 1} OF {quantity}</span>
                               <span style={{ fontSize: '1.3rem', fontFamily: 'monospace', fontWeight: 900, color: '#fff' }}>{code}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                               <button onClick={() => { navigator.clipboard.writeText(code); alert(`Key #${idx + 1} copied!`); }} className="share-btn" style={{ flex: 1, minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>📋 Copy Key</button>
                               <button onClick={() => { navigator.clipboard.writeText(claimUrl); alert(`Unboxing Claim link copied: ${claimUrl}`); }} className="share-btn" style={{ flex: 1, minWidth: '130px', background: 'rgba(242,100,34,0.15)', color: '#f26422', border: '1px solid rgba(242,100,34,0.3)' }}>🔗 Copy Link</button>
                               <a href={indWhatsappUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '130px', background: '#25D366', color: '#fff' }}>💬 WhatsApp</a>
                               <a href={indEmailUrl} className="share-btn" style={{ flex: 1, minWidth: '110px', background: '#3b82f6', color: '#fff' }}>✉️ Email</a>
                               <button onClick={() => triggerPrintModal(code)} className="share-btn" style={{ flex: 1, minWidth: '140px', background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>🖨️ Print / PDF</button>
                               <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)' }}>👁️ Preview</a>
                            </div>
                         </div>
                      );
                   })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                   <a href="/" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Return Home</a>
                   <button onClick={() => { setStep('compose'); setQuantity(1); setName(''); setEmail(''); setMsg('Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.'); setRel('Friend'); }} style={{ background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, color: '#000', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>🎁 Share Another Gift</button>
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
            padding: '40px',
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

            <div style={{ textAlign: 'center', borderBottom: '2px solid #b8860b', paddingBottom: '15px', marginBottom: '25px' }}>
              <div style={{ fontSize: '1.8rem', color: '#b8860b', fontWeight: 900, letterSpacing: '2px' }}>VYOMA ACADEMY</div>
              <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Sacred Gift of Sanskrit Wisdom</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>THIS SACRED GIFT HONORS</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111', marginTop: '4px' }}>{name}</div>
              <div style={{ fontSize: '0.9rem', color: '#b8860b', fontWeight: 700, marginTop: '4px' }}>
                Presented with love by a generous well-wisher ({activeRelationship} • {activeOccasionObj.label})
              </div>
            </div>

            <div style={{ background: '#fdfbf7', borderLeft: '4px solid #b8860b', padding: '15px 20px', margin: '20px 0', fontStyle: 'italic', color: '#333', lineHeight: '1.6' }}>
              "{msg}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ccc', paddingTop: '20px', marginTop: '25px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>MEMBERSHIP ACCESS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111' }}>{activePkg?.name} Tier ({activePkg?.interval === 'YEARLY' ? '1 Full Year' : '1 Month'})</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Activation Key: <strong style={{ color: '#b8860b', fontFamily: 'monospace' }}>{printCode}</strong></div>
              </div>

              {/* QR Code */}
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/gift/claim/${printCode}?theme=${cardTheme}` : `https://vyoma-ott-platform.vercel.app/gift/claim/${printCode}?theme=${cardTheme}`)}`}
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
                onClick={() => setPrintCode(null)}
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

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#8f98a9', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d131f', border: '1px solid #1e293b', color: '#fff', padding: '14px 18px', borderRadius: '10px', fontSize: '0.95rem', outline: 'none'
};
