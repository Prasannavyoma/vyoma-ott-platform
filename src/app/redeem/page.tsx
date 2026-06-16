"use client";

import { useState } from 'react';
import NavBar from '@/app/components/NavBar';
import { redeemVoucherCode } from '@/app/actions/gift';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [redeemedMeta, setRedeemedMeta] = useState<any>(null);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setStatus('idle');
    
    try {
      const res = await redeemVoucherCode(code);
      if (res.success) {
        setStatus('success');
        setRedeemedMeta(res);
      } else {
        setStatus('error');
        setErrorMsg(res.error || "Failed to activate voucher.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg("A connection failure occurred. Please make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <NavBar />

      <div style={{ maxWidth: '550px', margin: '0 auto', padding: '150px 20px 100px' }}>
         
         {status !== 'success' ? (
            <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: '24px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔑</div>
               <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>Activate Your Gift</h1>
               <p style={{ color: '#777', fontSize: '0.95rem', marginBottom: '35px', lineHeight: '1.5' }}>
                  Did a loved one gift you a subscription? Type or paste your unique Activation Key below to unlock premium learning.
               </p>

               <form onSubmit={handleRedeem}>
                  <input 
                    required
                    type="text" 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. GIFT-VYOM-ABCD-1234"
                    style={{
                      width: '100%',
                      background: '#000',
                      border: '2px solid #333',
                      borderRadius: '12px',
                      color: '#fff',
                      padding: '16px',
                      fontSize: '1.2rem',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontWeight: 900,
                      marginBottom: '20px',
                      outline: 'none'
                    }}
                  />

                  {status === 'error' && (
                     <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', padding: '12px', borderRadius: '8px', color: '#ff4444', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 600 }}>
                        🚨 {errorMsg}
                     </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '15px',
                      fontSize: '1rem',
                      fontWeight: 900,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 10px 30px rgba(242,100,34,0.3)'
                    }}
                  >
                     {loading ? '🔍 VALIDATING SECURE KEY...' : '🔓 UNLOCK MY SUBSCRIPTION'}
                  </button>
               </form>
               
               <div style={{ marginTop: '30px', fontSize: '0.8rem', color: '#444' }}>
                  ℹ️ Need help? Verification takes less than 2 seconds. 
                  Ensure you are <a href="/login" style={{ color: '#666' }}>signed in</a> to the account you wish to upgrade.
               </div>
            </div>
         ) : (
            <div style={{ 
              background: 'linear-gradient(135deg, #0d180f 0%, #050505 100%)', 
              border: '3px solid #46d369', 
              borderRadius: '24px', 
              padding: '50px 40px', 
              textAlign: 'center',
              boxShadow: '0 30px 60px rgba(70,211,105,0.15)',
              animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
               <style>{`
                 @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
               `}</style>

               <div style={{ fontSize: '4.5rem', marginBottom: '15px' }}>🎉</div>
               <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#46d369', marginBottom: '10px' }}>Activation Complete!</h2>
               <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', margin: '30px 0' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>UNLOCKED STATUS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '5px' }}>
                     {redeemedMeta?.months} Months {redeemedMeta?.plan} Access
                  </div>
                  {redeemedMeta?.sponsoredBy && (
                     <div style={{ color: '#46d369', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px', fontStyle: 'italic' }}>
                        {redeemedMeta.sponsoredBy}
                     </div>
                  )}
               </div>

               <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '35px' }}>
                  Your account has been successfully elevated to the premium tier! You now have full access to premium courses, games, and certified learning workflows.
               </p>

               <div style={{ display: 'flex', gap: '15px' }}>
                  <a href="/profile" style={{ flex: 1, textDecoration: 'none', background: '#fff', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     📊 VIEW PORTFOLIO
                  </a>
                  <a href="/" style={{ flex: 1, textDecoration: 'none', background: '#46d369', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(70,211,105,0.3)' }}>
                     ▶ START STREAMING
                  </a>
               </div>
            </div>
         )}

      </div>
    </main>
  );
}
