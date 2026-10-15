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
];

const CARD_THEMES = [
  { 
    key: 'SWARNA', 
    name: '👑 Gold (स्वर्णम्)', 
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
    name: '🪔 Utsav (उत्सवः)', 
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
    name: '📜 Vedic (गुरुकुलम्)', 
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
    name: '🌸 Lotus (पद्मम्)', 
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

      <style dangerouslySetInnerHTML={{__html: `
        .compose-container {
          background: rgba(10, 18, 32, 0.6);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.35);
        }
        .ecard-preview {
          background: ${activeThemeObj.bg};
          border: 2px solid ${activeThemeObj.border};
          border-radius: 20px;
          padding: 22px 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 45px ${activeThemeObj.glow};
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
          max-width: 1360px;
          margin: 0 auto;
          padding: 145px 24px 40px 24px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .gift-page-wrapper {
            padding: 125px 16px 40px 16px;
          }
        }
        @media (max-width: 960px) {
          .gift-main-grid {
            grid-template-columns: 1fr !important;
          }
          .gift-sticky-col {
            position: static !important;
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
        
        {/* COMPACT EXECUTIVE HEADER BAR */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '14px', 
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.1rem', 
              fontWeight: 900, 
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>🎁</span>
              <span>
                Gift Sacred <span style={{ color: '#ffd700', textShadow: '0 0 25px rgba(255,215,0,0.3)' }}>Wisdom</span>
              </span>
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.92rem', lineHeight: '1.4' }}>
              Personalize a Vedic digital E-card with 1-click unboxing and instant course access.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', padding: '6px 14px', borderRadius: '20px', color: '#ffd700', fontSize: '0.76rem', fontWeight: 800 }}>
              💳 Razorpay ({currency})
            </span>
            <span style={{ background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.25)', padding: '6px 14px', borderRadius: '20px', color: '#46d369', fontSize: '0.76rem', fontWeight: 800 }}>
              ✨ 1-Click Unboxing
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '20px', color: '#cbd5e1', fontSize: '0.76rem', fontWeight: 800 }}>
              📄 Printable PDF
            </span>
          </div>
        </div>

        {step === 'compose' && (
          <div className="gift-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '26px', alignItems: 'start' }}>
            
            {/* STEP A: COMPOSE */}
            <div className="compose-container">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                 <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span style={{ background: activeThemeObj.primary, color: '#000', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 900 }}>1</span>
                   Personalize Your Gift
                 </h3>
                 <span style={{ fontSize: '0.75rem', color: '#8f98a9', fontWeight: 700 }}>Step 1 of 2</span>
               </div>
               
               <form onSubmit={(e) => { e.preventDefault(); setStep('checkout'); }}>
                  
                  {/* 1. CARD THEME SELECTOR */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>🎨 1. Select Card Theme & Aesthetic</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
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
                              padding: '8px 6px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              boxShadow: isSelected ? `0 2px 10px ${th.glow}` : 'none'
                            }}
                          >
                            <span>{th.icon}</span> {th.name.split(' ')[1]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. OCCASION SELECTOR */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>✨ 2. Select Occasion / Purpose</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {OCCASIONS.map(occ => (
                        <button
                          key={occ.key} type="button" onClick={() => setOccasion(occ.key)}
                          style={{
                            background: occasion === occ.key ? activeThemeObj.accentBg : '#0d131f',
                            border: `1px solid ${occasion === occ.key ? activeThemeObj.primary : '#1e293b'}`,
                            color: occasion === occ.key ? activeThemeObj.primary : '#94a3b8',
                            padding: '5px 10px', borderRadius: '16px', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {occ.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. RELATIONSHIP SELECTOR */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>👥 3. Honoring Relationship</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {RELATIONS.map(r => (
                        <button
                          key={r.key} type="button" onClick={() => setRel(r.key)}
                          style={{
                            background: rel === r.key ? 'rgba(242,100,34,0.15)' : '#0d131f',
                            border: `1px solid ${rel === r.key ? '#f26422' : '#1e293b'}`,
                            color: rel === r.key ? '#f26422' : '#94a3b8',
                            padding: '5px 10px', borderRadius: '16px', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {rel === 'Others' && (
                     <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Custom Relationship</label>
                        <input required type="text" value={customRelInput} onChange={e => setCustomRelInput(e.target.value)} placeholder="e.g. Mentor, Cousin..." style={inputStyle} />
                     </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                     <div>
                        <label style={labelStyle}>Recipient Full Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savithri Devi" style={inputStyle} />
                     </div>
                     <div>
                        <label style={labelStyle}>Recipient Email Address</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recipient@example.com" style={inputStyle} />
                     </div>
                  </div>

                  {/* AUSPICIOUS BLESSING QUOTE OR CUSTOM QUOTE */}
                  <div style={{ marginBottom: '18px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <label style={{ ...labelStyle, marginBottom: 0 }}>🪔 Auspicious Blessing Quote (Optional)</label>
                       <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pick a shloka or write your own</span>
                     </div>

                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
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
                               padding: '5px 11px',
                               borderRadius: '10px',
                               fontSize: '0.74rem',
                               cursor: 'pointer',
                               fontWeight: isSelected ? 800 : 600,
                               transition: 'all 0.2s',
                               display: 'inline-flex',
                               alignItems: 'center',
                               gap: '5px'
                             }}
                             title={sh.text}
                           >
                             <span>🪔</span> {sh.label}
                           </button>
                         );
                       })}

                       {/* WRITE YOUR OWN OPTION */}
                       <button
                         type="button"
                         onClick={() => {
                           const isPreset = SHLOKA_PRESETS.some(sh => sh.text === msg);
                           if (isPreset) {
                             setMsg('');
                           }
                           const inputEl = document.getElementById('gift-custom-blessing-input');
                           if (inputEl) inputEl.focus();
                         }}
                         style={{
                           background: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                           border: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? '1px solid #ffd700' : '1px dashed rgba(255,255,255,0.2)',
                           color: (!SHLOKA_PRESETS.some(sh => sh.text === msg)) ? '#ffd700' : '#cbd5e1',
                           padding: '5px 12px',
                           borderRadius: '10px',
                           fontSize: '0.74rem',
                           cursor: 'pointer',
                           fontWeight: 800,
                           transition: 'all 0.2s',
                           display: 'inline-flex',
                           alignItems: 'center',
                           gap: '5px'
                         }}
                       >
                         <span>✍️</span> Write Your Own Quote
                       </button>

                       {msg && (
                         <button
                           type="button"
                           onClick={() => setMsg('')}
                           style={{
                             background: 'transparent',
                             border: 'none',
                             color: '#64748b',
                             fontSize: '0.7rem',
                             cursor: 'pointer',
                             padding: '4px 6px',
                             textDecoration: 'underline'
                           }}
                           title="Clear quote"
                         >
                           Clear
                         </button>
                       )}
                     </div>

                     <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                           <label htmlFor="gift-custom-blessing-input" style={{ ...labelStyle, marginBottom: 0 }}>
                             {!SHLOKA_PRESETS.some(sh => sh.text === msg) 
                               ? '✍️ Your Custom Blessing Quote / Message' 
                               : 'Selected Blessing Quote (Editable below)'}
                           </label>
                           <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{msg.length} / 300 characters</span>
                        </div>
                        <textarea 
                          id="gift-custom-blessing-input"
                          value={msg} 
                          onChange={e => setMsg(e.target.value.slice(0, 300))} 
                          rows={2} 
                          placeholder="Type your own Sanskrit quote, blessing, or heartfelt message for the card..." 
                          style={{ 
                            ...inputStyle, 
                            fontFamily: 'inherit', 
                            resize: 'none',
                            lineHeight: '1.5',
                            borderColor: (!SHLOKA_PRESETS.some(sh => sh.text === msg) && msg.length > 0) ? 'rgba(255,215,0,0.4)' : '#1e293b'
                          }}
                        />
                     </div>
                  </div>

                  <button type="submit" disabled={!activeRelationship || !name || !email} style={{
                     width: '100%', padding: '13px', background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`,
                     color: '#000', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '0.95rem',
                     cursor: 'pointer', boxShadow: `0 8px 25px ${activeThemeObj.glow}`, opacity: (!activeRelationship || !name || !email) ? 0.6 : 1,
                     transition: 'all 0.3s'
                  }}>
                     CONTINUE TO PACKAGE SELECTION →
                  </button>
               </form>
            </div>
            
            {/* E-CARD LIVE PREVIEW COLUMN */}
            <div className="gift-sticky-col" style={{ position: 'sticky', top: '135px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <div style={{ color: '#8f98a9', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                   Live E-Card Preview
                 </div>
                 <div style={{ fontSize: '0.72rem', color: activeThemeObj.primary, fontWeight: 800 }}>
                   {activeThemeObj.name}
                 </div>
               </div>
               
               <div className="ecard-preview">
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', border: `1px solid ${activeThemeObj.primary}`, opacity: 0.1 }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                     <img src="/assets/logo-200-x-70-px.png" alt="Logo" style={{ height: '26px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '16px', letterSpacing: '0.8px' }}>
                       {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'E-CARD'}
                     </div>
                  </div>
                  <div style={{ minHeight: '110px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px' }}>HONORING</div>
                     <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '2px 0 4px 0', letterSpacing: '-0.3px' }}>{name || 'Dear Recipient'}</h2>
                     <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.8rem', marginTop: '2px' }}>
                       {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionObj.key}</span>
                     </div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.82rem', marginTop: '14px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '12px', lineHeight: '1.5', margin: '14px 0 0 0' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: '#8f98a9', marginBottom: '2px' }}>ACTIVATION KEY</div>
                        <div style={{ fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.95rem', letterSpacing: '1px' }}>GIFT-VYOM-XXXX-XXXX</div>
                     </div>
                     <div style={{ fontSize: '1.8rem' }}>{activeThemeObj.icon}</div>
                  </div>
               </div>

               <div style={{ textAlign: 'center', marginTop: '10px', color: '#64748b', fontSize: '0.72rem' }}>
                 ✨ Automatically delivered with 1-click unboxing ceremony
               </div>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ maxWidth: '820px', margin: '0 auto', background: 'rgba(10, 18, 32, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '28px 32px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '22px' }}>
                <button onClick={() => setStep('compose')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer', fontWeight: 'bold', padding: '6px 14px', borderRadius: '16px', fontSize: '0.8rem' }}>← Edit Details</button>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Choose Gift Package & Quantity</h3>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
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
                        padding: '18px 22px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {isPlatinumYearly && (
                        <div style={{ position: 'absolute', top: '-9px', right: '18px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                          ⭐ MOST POPULAR FOR GIFTING
                        </div>
                      )}
                      {isGoldYearly && (
                        <div style={{ position: 'absolute', top: '-9px', right: '18px', background: 'rgba(70,211,105,0.18)', border: '1px solid #46d369', color: '#46d369', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                          BEST VALUE • SAVE 16%
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{p.name} MEMBERSHIP</span>
                            <span style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>{p.interval}</span>
                          </div>
                          <div style={{ color: '#8f98a9', fontSize: '0.8rem', marginTop: '3px' }}>{p.desc}</div>
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isSelected ? activeThemeObj.primary : '#fff' }}>
                          {currencySymbol}{p.price}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '4px', fontSize: '0.74rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                        <div>✓ Unlimited HD Sanskrit Courses</div>
                        <div>✓ Audiobooks & Offline Storage</div>
                        <div>✓ Interactive Games & Quizzes</div>
                        <div>✓ Verified Certificates & Notes</div>
                      </div>
                    </div>
                  );
                })}
             </div>

             <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px 20px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>🔢 Multi-Gifting Counter</h4>
                      <p style={{ color: '#8f98a9', fontSize: '0.76rem', margin: '2px 0 0 0' }}>Specify quantity for bulk gifting to multiple friends or students.</p>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', border: '1px solid #222', borderRadius: '25px', padding: '4px 12px' }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.3rem', cursor: 'pointer', fontWeight: 900 }}>−</button>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, width: '25px', textAlign: 'center' }}>{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(50, quantity + 1))} style={{ background: 'none', border: 'none', color: activeThemeObj.primary, fontSize: '1.3rem', cursor: 'pointer', fontWeight: 900 }}>+</button>
                   </div>
                </div>
             </div>

             <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#8f98a9' }}>
                   <span>Selected Theme</span>
                   <span style={{ color: activeThemeObj.primary, fontWeight: 700 }}>{activeThemeObj.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#8f98a9' }}>
                   <span>Unit Cost ({activePkg?.name} {activePkg?.interval})</span>
                   <span>{currencySymbol}{unitCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#8f98a9' }}>
                   <span>Quantity</span>
                   <span>× {quantity}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.25rem' }}>
                   <span>Total Due</span>
                   <span style={{ color: activeThemeObj.primary }}>{currencySymbol}{totalDue.toLocaleString()}</span>
                </div>
             </div>

             <form onSubmit={executeCheckout}>
                <button disabled={loading || !activePkg} style={{
                    width: '100%', padding: '14px', background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, color: '#000',
                    border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '1.02rem',
                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: `0 8px 25px ${activeThemeObj.glow}`,
                    transition: 'all 0.3s'
                }}>
                   {loading ? '⚡ LAUNCHING SECURE RAZORPAY GATEWAY...' : `💳 PAY SECURELY (${currencySymbol}${totalDue.toLocaleString()})`}
                </button>
             </form>
          </div>
        )}

        {step === 'success' && (
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
             <div style={{ background: 'rgba(10,18,32,0.6)', border: `2px solid ${activeThemeObj.primary}`, borderRadius: '24px', padding: '35px 30px', boxShadow: `0 25px 50px ${activeThemeObj.glow}` }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏆</div>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: activeThemeObj.primary, marginBottom: '6px', letterSpacing: '-0.8px' }}>Wisdom Shared Successfully!</h2>
                
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '12px 16px', color: '#93c5fd', fontSize: '0.86rem', marginBottom: '25px', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center' }}>
                   <span style={{ fontSize: '1.2rem' }}>📧</span>
                   <div>
                      <strong>Automated E-Card Sent:</strong> Delivered to <strong style={{ color: '#fff' }}>{email}</strong> with 1-click unboxing.
                   </div>
                </div>

                {/* VISUAL E-CARD IN SUCCESS STATE */}
                <div style={{ 
                  background: activeThemeObj.bg, 
                  border: `2px solid ${activeThemeObj.primary}`, 
                  borderRadius: '20px', 
                  padding: '25px 28px', 
                  margin: '0 auto 25px auto', 
                  maxWidth: '580px', 
                  textAlign: 'left',
                  boxShadow: `0 15px 40px ${activeThemeObj.glow}`,
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                     <img src="/assets/logo-200-x-70-px.png" alt="Logo" style={{ height: '26px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: activeThemeObj.accentBg, color: activeThemeObj.primary, border: `1px solid ${activeThemeObj.primary}`, fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '16px', letterSpacing: '0.8px' }}>
                       {activeOccasionObj.label.split(' ')[0]} {activeOccasionObj.label.split(' ')[1] || 'WISDOM E-CARD'}
                     </div>
                  </div>
                  <div style={{ minHeight: '100px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PREPARED EXCLUSIVELY FOR</div>
                     <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '2px 0 4px 0' }}>{name}</h2>
                     <div style={{ color: activeThemeObj.primary, fontWeight: 800, fontSize: '0.8rem' }}>
                       {activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'} • <span style={{ color: '#fff', opacity: 0.85 }}>{activeOccasionObj.key}</span>
                     </div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.85rem', marginTop: '14px', borderLeft: `3px solid ${activeThemeObj.primary}`, paddingLeft: '12px', lineHeight: '1.5' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '22px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: '#8f98a9', marginBottom: '2px' }}>PRIMARY ACTIVATION KEY</div>
                        <div style={{ fontSize: '1.35rem', fontFamily: 'monospace', color: activeThemeObj.primary, fontWeight: 900, letterSpacing: '1px' }}>{resultCodes[0] || 'GIFT-VYOM-XXXX-XXXX'}</div>
                     </div>
                     <div style={{ fontSize: '1.8rem' }}>{activeThemeObj.icon}</div>
                  </div>
                </div>

                {/* DISTRIBUTION CONTROLS */}
                <h4 style={{ textAlign: 'left', fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px' }}>🔑 Gift Key Distribution Center</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
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
                         <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                               <span style={{ color: activeThemeObj.primary, fontSize: '0.75rem', fontWeight: 800 }}>KEY #{idx + 1} OF {quantity}</span>
                               <span style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 900, color: '#fff' }}>{code}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                               <button onClick={() => { navigator.clipboard.writeText(code); alert(`Key #${idx + 1} copied!`); }} className="share-btn" style={{ flex: 1, minWidth: '90px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>📋 Copy Key</button>
                               <button onClick={() => { navigator.clipboard.writeText(claimUrl); alert(`Unboxing Claim link copied: ${claimUrl}`); }} className="share-btn" style={{ flex: 1, minWidth: '110px', background: 'rgba(242,100,34,0.15)', color: '#f26422', border: '1px solid rgba(242,100,34,0.3)' }}>🔗 Copy Link</button>
                               <a href={indWhatsappUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '110px', background: '#25D366', color: '#fff' }}>💬 WhatsApp</a>
                               <a href={indEmailUrl} className="share-btn" style={{ flex: 1, minWidth: '90px', background: '#3b82f6', color: '#fff' }}>✉️ Email</a>
                               <button onClick={() => triggerPrintModal(code)} className="share-btn" style={{ flex: 1, minWidth: '120px', background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>🖨️ Print PDF</button>
                               <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)' }}>👁️ Preview</a>
                            </div>
                         </div>
                      );
                   })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                   <a href="/" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '0.88rem' }}>Return Home</a>
                   <button onClick={() => { setStep('compose'); setQuantity(1); setName(''); setEmail(''); setMsg('Wishing you peace, enlightenment, and joyful Sanskrit learning on this auspicious path.'); setRel('Friend'); }} style={{ background: `linear-gradient(135deg, ${activeThemeObj.primary}, ${activeThemeObj.secondary})`, color: '#000', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}>🎁 Share Another Gift</button>
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
                Presented with love by a generous well-wisher ({activeRelationship} • {activeOccasionObj.label})
              </div>
            </div>

            <div style={{ background: '#fdfbf7', borderLeft: '4px solid #b8860b', padding: '14px 18px', margin: '18px 0', fontStyle: 'italic', color: '#333', lineHeight: '1.6', fontSize: '0.92rem' }}>
              "{msg}"
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #ccc', paddingTop: '18px', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#666' }}>MEMBERSHIP ACCESS</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111' }}>{activePkg?.name} Tier ({activePkg?.interval === 'YEARLY' ? '1 Full Year' : '1 Month'})</div>
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
  display: 'block', color: '#8f98a9', fontSize: '0.72rem', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d131f', border: '1px solid #1e293b', color: '#fff', padding: '9px 14px', borderRadius: '10px', fontSize: '0.88rem', outline: 'none'
};
