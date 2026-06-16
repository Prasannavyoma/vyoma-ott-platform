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
  { key: 'Mother', label: '👩‍👦 Mother' },
  { key: 'Father', label: '👨‍👦 Father' },
  { key: 'Sister', label: '👭 Sister' },
  { key: 'Son/Daughter', label: '🧑‍🎓 Child' },
  { key: 'Shishya', label: '🤝 Shishya' },
  { key: 'Friend', label: '🤝 Friend' },
  { key: 'Teacher', label: '🪔 Guru' },
  { key: 'Others', label: '✏️ Others...' }
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
  const [rel, setRel] = useState('');
  const [customRelInput, setCustomRelInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  
  // Multi-Gifting States
  const [quantity, setQuantity] = useState(1);
  
  // Dynamic Plan States
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultCodes, setResultCodes] = useState<string[]>([]);

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
      setSelectedPlanId(giftPackages[0].id);
    }
  }, [giftPackages]);

  const activePkg = giftPackages.find(p => p.id === selectedPlanId) || giftPackages[0];
  const activeRelationship = rel === 'Others' ? customRelInput : rel;
  
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
        description: `Gifting ${quantity}x ${activePkg.name} Access Bundle`,
        image: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png",
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
          color: "#ffd700" // Brand-aligned Gold
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
        personalMessage: msg || "Wishing you knowledge and spiritual growth.",
        planName: activePkg.name as any,
        months: activePkg.months,
        quantity: quantity
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
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .compose-container {
          background: rgba(10, 18, 32, 0.55);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .ecard-preview {
          background: linear-gradient(135deg, #1f160a 0%, #07090e 100%);
          border: 2px solid rgba(255,215,0,0.25);
          border-radius: 24px;
          padding: 35px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 55px rgba(255,215,0,0.08);
          animation: floatCard 6s infinite ease-in-out;
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          border: none;
        }
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
      `}} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 20px 80px 20px', zIndex: 1, position: 'relative' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
           <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🎁</div>
           <h1 style={{ 
             fontSize: '3.2rem', fontWeight: 900, 
             background: 'linear-gradient(to right, #ffd700, #ffa500)',
             WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
             marginBottom: '15px',
             letterSpacing: '-1.5px'
           }}>Gift Wisdom</h1>
           <p style={{ color: '#8f98a9', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
             Share the eternal nectar of Sanskrit wisdom. Send instant digital E-Cards complete with secure Razorpay activations!
           </p>
           <div style={{ marginTop: '15px', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)', display: 'inline-block', padding: '6px 18px', borderRadius: '20px', color: '#ffd700', fontSize: '0.8rem', fontWeight: 700 }}>
              💳 Gateway: **Razorpay Direct Checkout** ({currency})
           </div>
        </div>

        {step === 'compose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '40px' }}>
            
            {/* STEP A: COMPOSE */}
            <div className="compose-container">
               <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ background: '#ffd700', color: '#000', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 'bold' }}>1</span>
                 Personalize Your Gift E-Card
               </h3>
               <form onSubmit={(e) => { e.preventDefault(); setStep('checkout'); }}>
                  <label style={labelStyle}>Who are you honoring with this Gift?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
                     {RELATIONS.map(r => (
                        <button
                           key={r.key} type="button" onClick={() => setRel(r.key)}
                           style={{
                             background: rel === r.key ? 'rgba(255,215,0,0.1)' : '#0d131f',
                             border: `1px solid ${rel === r.key ? '#ffd700' : '#1e293b'}`,
                             color: rel === r.key ? '#ffd700' : '#94a3b8',
                             padding: '10px 18px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                           }}
                        >
                           {r.label}
                        </button>
                     ))}
                  </div>
                  {rel === 'Others' && (
                     <div style={{ marginBottom: '25px' }}>
                        <label style={labelStyle}>Enter Custom Relationship</label>
                        <input required type="text" value={customRelInput} onChange={e => setCustomRelInput(e.target.value)} placeholder="e.g. Cousin, Student..." style={inputStyle} />
                     </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                     <div>
                        <label style={labelStyle}>Recipient Display Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savithri Devi" style={inputStyle} />
                     </div>
                     <div>
                        <label style={labelStyle}>Recipient Email Address</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="for code delivery" style={inputStyle} />
                     </div>
                  </div>
                  <div style={{ marginBottom: '35px' }}>
                     <label style={labelStyle}>Greeting Message (Optional)</label>
                     <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="May this journey into Sanskrit bring peace and inner joy." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'none' }}></textarea>
                  </div>
                  <button type="submit" disabled={!activeRelationship || !name || !email} style={{
                     width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                     color: '#000', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1rem',
                     cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,215,0,0.25)', opacity: (!activeRelationship || !name || !email) ? 0.6 : 1,
                     transition: 'all 0.3s'
                  }}>
                     CONTINUE TO PACKAGE SELECTION →
                  </button>
               </form>
            </div>
            
            {/* E-CARD PREVIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div className="ecard-preview">
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(255,215,0,0.04)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                     <img src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" alt="Logo" style={{ height: '30px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '0.65rem', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px' }}>WISDOM E-CARD</div>
                  </div>
                  <div style={{ minHeight: '120px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PREPARED EXCLUSIVELY FOR</div>
                     <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '5px', letterSpacing: '-0.5px' }}>{name || 'Dear Recipient'}</h2>
                     <div style={{ color: '#ffd700', fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>{activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'}</div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.9rem', marginTop: '25px', borderLeft: '3px solid #ffd700', paddingLeft: '15px', lineHeight: '1.5' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                     <div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>ACTIVATION KEY</div>
                        <div style={{ fontFamily: 'monospace', color: '#ffd700', fontWeight: 700 }}>GIFT-VYOM-XXXX-XXXX</div>
                     </div>
                     <div style={{ fontSize: '2rem' }}>🪔</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', background: 'rgba(10, 18, 32, 0.55)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => setStep('compose')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer', fontWeight: 'bold', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem' }}>← Edit Details</button>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Choose Package & Quantity</h3>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                {giftPackages.map(p => (
                   <div 
                     key={p.id} onClick={() => setSelectedPlanId(p.id)}
                     style={{
                       background: selectedPlanId === p.id ? 'rgba(255,215,0,0.03)' : 'transparent',
                       border: selectedPlanId === p.id ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.08)',
                       padding: '20px', borderRadius: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                     }}
                   >
                      <div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{p.name} GIFT</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>{p.interval}</span>
                         </div>
                         <div style={{ color: '#8f98a9', fontSize: '0.85rem', marginTop: '5px' }}>{p.desc}</div>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedPlanId === p.id ? '#ffd700' : '#fff' }}>
                        {currencySymbol}{p.price}
                      </div>
                   </div>
                ))}
             </div>

             <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '25px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>🔢 Multi-Gifting Counter</h4>
                      <p style={{ color: '#8f98a9', fontSize: '0.8rem', margin: '5px 0 0 0' }}>Specify quantity for bulk gifting.</p>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#000', border: '1px solid #222', borderRadius: '30px', padding: '5px 15px' }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 900 }}>−</button>
                      <span style={{ fontSize: '1.3rem', fontWeight: 900, width: '30px', textAlign: 'center' }}>{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(50, quantity + 1))} style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 900 }}>+</button>
                   </div>
                </div>
             </div>

             <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#8f98a9' }}>
                   <span>Unit Cost</span>
                   <span>{currencySymbol}{unitCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#8f98a9' }}>
                   <span>Quantity</span>
                   <span>× {quantity}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.3rem' }}>
                   <span>Total Due</span>
                   <span style={{ color: '#ffd700' }}>{currencySymbol}{totalDue.toLocaleString()}</span>
                </div>
             </div>

             <form onSubmit={executeCheckout}>
                <button disabled={loading || !activePkg} style={{
                    width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#000',
                    border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem',
                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(255,215,0,0.3)',
                    transition: 'all 0.3s'
                }}>
                   {loading ? '⚡ LAUNCHING SECURE RAZORPAY GATEWAY...' : `💳 PAY SECURELY (${currencySymbol}\${totalDue.toLocaleString()})`}
                </button>
             </form>
          </div>
        )}

        {step === 'success' && (
          <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center' }}>
             <div style={{ background: 'rgba(10,18,32,0.55)', border: '2px solid #ffd700', borderRadius: '30px', padding: '50px 40px', boxShadow: '0 30px 60px rgba(255,215,0,0.15)' }}>
                <div style={{ fontSize: '4.5rem', marginBottom: '20px' }}>🏆</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffd700', marginBottom: '10px', letterSpacing: '-1px' }}>Wisdom Shared Successfully!</h2>
                
                {/* Email dispatch alert block */}
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '15px 20px', color: '#93c5fd', fontSize: '0.9rem', marginBottom: '35px', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <span style={{ fontSize: '1.3rem' }}>📧</span>
                   <div>
                      <strong>System Automations Triggered:</strong> An elegant digital E-Card template containing these Activation Keys has been successfully dispatched to the recipient's email address: <strong style={{ color: '#fff' }}>{email}</strong>.
                   </div>
                </div>

                <p style={{ color: '#8f98a9', fontSize: '1.05rem', marginBottom: '25px' }}>
                   Below is your crafted E-Card. Use the buttons to instantly share it with **{name}** via **WhatsApp** or copy the individual keys.
                </p>

                {/* VISUAL E-CARD */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #1c140a 0%, #080a0f 100%)', 
                  border: '2px solid #ffd700', 
                  borderRadius: '24px', 
                  padding: '35px', 
                  margin: '0 auto 35px auto', 
                  maxWidth: '600px', 
                  textAlign: 'left',
                  boxShadow: '0 20px 55px rgba(255,215,0,0.15)',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(255,215,0,0.03)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                     <img src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" alt="Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
                     <div style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '0.65rem', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px' }}>WISDOM E-CARD</div>
                  </div>
                  <div style={{ minHeight: '120px' }}>
                     <div style={{ color: '#8f98a9', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PREPARED EXCLUSIVELY FOR</div>
                     <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '5px' }}>{name}</h2>
                     <div style={{ color: '#ffd700', fontWeight: 800, fontSize: '0.85rem', marginTop: '4px' }}>{activeRelationship ? `Relationship: ${activeRelationship}` : 'Honored Loved One'}</div>
                     <p style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.9rem', marginTop: '25px', borderLeft: '3px solid #ffd700', paddingLeft: '15px', lineHeight: '1.5' }}>
                        "{msg || 'Wishing you knowledge, peace, and spiritual growth through the eternal nectar of Sanskrit.'}"
                     </p>
                  </div>
                  <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                     <div style={{ fontSize: '0.7rem', color: '#8f98a9', marginBottom: '5px' }}>PRIMARY ACTIVATION KEY</div>
                     <div style={{ fontSize: '1.6rem', fontFamily: 'monospace', color: '#ffd700', fontWeight: 900, letterSpacing: '1px' }}>{resultCodes[0] || 'GIFT-VYOM-XXXX-XXXX'}</div>
                  </div>
                </div>

                {/* SHARING CONTROLS FOR EACH GENERATED KEY */}
                <h4 style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px' }}>🔑 Gift Key Distribution Center</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                   {resultCodes.map((code, idx) => {
                      const indWhatsappMsg = `🎁 *Vyoma Gift of Wisdom* 🎁\n\nDear *${name}*,\n\nI have gifted you a *${activePkg.name} Tier* subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT!\n\n💬 Message: _"${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"_\n\n🔑 *Activation Key*: *${code}*\n\n👉 *Redeem here*: http://localhost:3000/redeem\n\nEnjoy your learning journey! 🪔`;
                      const indWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(indWhatsappMsg)}`;
                      const indEmailSubject = `🎁 Gift Wisdom: Your Vyoma Sanskrit Subscription Key!`;
                      const indEmailBody = `Dear ${name},\n\nI have gifted you a ${activePkg.name} Tier subscription (${activePkg.months} Months) to Vyoma Sanskrit OTT!\n\nMessage: "${msg || 'Wishing you knowledge, peace, and spiritual growth.'}"\n\nYour Activation Key: ${code}\n\nRedeem here: http://localhost:3000/redeem\n\nEnjoy your learning journey!\n\nVyoma Academy`;
                      const indEmailUrl = `mailto:${email}?subject=${encodeURIComponent(indEmailSubject)}&body=${encodeURIComponent(indEmailBody)}`;
                      return (
                         <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                               <span style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 800 }}>KEY #{idx + 1} OF {quantity}</span>
                               <span style={{ fontSize: '1.3rem', fontFamily: 'monospace', fontWeight: 900, color: '#fff' }}>{code}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                               <button onClick={() => { navigator.clipboard.writeText(code); alert(`Key #${idx + 1} copied!`); }} className="share-btn" style={{ flex: 1, minWidth: '100px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Copy Key</button>
                               <a href={indWhatsappUrl} target="_blank" rel="noopener noreferrer" className="share-btn" style={{ flex: 1, minWidth: '140px', background: '#25D366', color: '#fff' }}>💬 Share WhatsApp</a>
                               <a href={indEmailUrl} className="share-btn" style={{ flex: 1, minWidth: '140px', background: '#3b82f6', color: '#fff' }}>✉️ Share Email</a>
                            </div>
                         </div>
                      );
                   })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                   <a href="/" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Return Home</a>
                   <button onClick={() => { setStep('compose'); setQuantity(1); setName(''); setEmail(''); setMsg(''); setRel(''); }} style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#000', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>🎁 Share Another Gift</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#8f98a9', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d131f', border: '1px solid #1e293b', color: '#fff', padding: '14px 18px', borderRadius: '10px', fontSize: '0.95rem', outline: 'none'
};
