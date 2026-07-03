"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createRazorpaySubscription } from '@/app/actions/razorpay';
import { activateSubscription } from '@/app/actions/plans';
import RazorpayCheckoutButton from '@/app/components/RazorpayCheckoutButton';

interface Plan {
  id?: string;
  name: string;
  interval: string;
  priceINR: number;
  priceUSD: number;
}

export default function SubscribeClientPage({ initialPlans, currentUser, paidCourses = [] }: { initialPlans: Plan[], currentUser?: any, paidCourses?: any[] }) {
  const [region, setRegion] = useState<'INDIA' | 'ABROAD'>('INDIA');
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  
  // UPGRADE CALCULATION MATRIX STATE
  const [isCalculating, setIsCalculating] = useState(false);
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [subData, setSubData] = useState<any>(null);
  
  // DYNAMIC CYCLE LOCK ENGINE
  const calculateDaysUsed = () => {
    if (!currentUser?.planStartedAt) return 0;
    const start = new Date(currentUser.planStartedAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysUsedSimulation = calculateDaysUsed();
  
  useEffect(() => {
    // If the registered profile country is abroad, bypass IP check and lock to ABROAD (prevents VPN bypass)
    if (currentUser?.country && currentUser.country !== 'IN') {
      setRegion('ABROAD');
      return;
    }

    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (response.country_code === 'IN') setRegion('INDIA');
        else if (response.country_code) setRegion('ABROAD');
      } catch (e) { setRegion('INDIA'); }
    }
    detectLocation();
  }, [currentUser]);

  const currentTier = currentUser?.plan || 'FREE';
  const currentInterval = currentUser?.planInterval || 'YEARLY';

  const monthlyGold = initialPlans.find(p => p.name === 'GOLD' && p.interval === 'MONTHLY');
  const yearlyGold = initialPlans.find(p => p.name === 'GOLD' && p.interval === 'YEARLY');
  const monthlyPlatinum = initialPlans.find(p => p.name === 'PLATINUM' && p.interval === 'MONTHLY');
  const yearlyPlatinum = initialPlans.find(p => p.name === 'PLATINUM' && p.interval === 'YEARLY');

  const currency = region === 'INDIA' ? '₹' : '$';
  const priceField = region === 'INDIA' ? 'priceINR' : 'priceUSD';

  const getP = (plan: any) => plan ? (plan as any)[priceField] : 0;

  const getCurrentPlanPrice = () => {
    const match = initialPlans.find(p => p.name === currentTier && p.interval === currentInterval);
    return match ? getP(match) : 0;
  };

  // DYNAMIC PRORATION ENGINE
  const calculateProration = () => {
    if (!targetPlan) return { unusedCredit: 0, remainingCost: 0, netDue: 0 };
    
    const totalDays = currentInterval === 'YEARLY' ? 365 : 30;
    const oldPrice = getCurrentPlanPrice();
    const newPrice = getP(targetPlan);
    
    const remainingDays = totalDays - daysUsedSimulation;
    
    const dailyOld = oldPrice / totalDays;
    const dailyNew = newPrice / totalDays;
    
    const unusedCredit = dailyOld * remainingDays;
    const newProRatedCost = dailyNew * remainingDays;
    
    const netDue = Math.max(0, newProRatedCost - unusedCredit);
    
    return {
      unusedCredit: unusedCredit.toFixed(2),
      newProRatedCost: newProRatedCost.toFixed(2),
      netDue: netDue.toFixed(2),
      dailyOld: dailyOld.toFixed(2),
      dailyNew: dailyNew.toFixed(2),
      remainingDays
    };
  };

  const startUpgradeFlow = (p: Plan) => {
    setTargetPlan(p);
    setIsCalculating(true);
  };

  const calc = calculateProration();

  const handleAuthorize = async () => {
    if (!targetPlan || !currentUser) return;
    setIsInitializing(true);
    
    const amountToCharge = parseFloat(calc.netDue.toString()) > 0 ? parseFloat(calc.netDue.toString()) : 1;
    
    const res = await createRazorpaySubscription({
       name: `Vyoma ${targetPlan.name} Tier`,
       description: `Auto-renewing ${targetPlan.interval} mandate`,
       amount: amountToCharge,
       currency: region === 'INDIA' ? 'INR' : 'USD',
       interval: targetPlan.interval.toLowerCase() as 'monthly' | 'yearly',
       totalCount: targetPlan.interval === 'YEARLY' ? 10 : 120
    });
    
    setSubData(res);
    setIsInitializing(false);
  };

  const handleSuccess = async (response: any) => {
     if (!targetPlan || !currentUser) return;
     await activateSubscription(
       currentUser.id,
       targetPlan.name,
       targetPlan.interval,
       response.razorpay_subscription_id || subData.subscriptionId
     );
     window.location.href='/profile';
  };

  // Determine active plans based on toggle state
  const selectedGold = billingPeriod === 'YEARLY' ? yearlyGold : monthlyGold;
  const selectedPlatinum = billingPeriod === 'YEARLY' ? yearlyPlatinum : monthlyPlatinum;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#020710', 
      color: '#fff', 
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* Dynamic Sanskrit Aura styles & micro-interactions */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbFloat1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -70px) scale(1.15); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes orbFloat2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, 50px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatBadge {
          0% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-6px); }
          100% { transform: translateX(-50%) translateY(0px); }
        }
        @keyframes scalePop {
          0% { transform: scale(0.85); opacity: 0.5; }
          50% { transform: scale(1.06); text-shadow: 0 0 20px rgba(242,100,34,0.6); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        @keyframes borderPulse {
          0% { border-color: rgba(242, 100, 34, 0.4); box-shadow: 0 20px 45px rgba(242, 100, 34, 0.15); }
          50% { border-color: rgba(255, 140, 83, 0.85); box-shadow: 0 20px 45px rgba(255, 140, 83, 0.35); }
          100% { border-color: rgba(242, 100, 34, 0.4); box-shadow: 0 20px 45px rgba(242, 100, 34, 0.15); }
        }
        
        .sub-card {
          position: relative;
          background: rgba(10, 18, 32, 0.55);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 45px 35px;
          display: flex;
          flex-direction: column;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          /* Remove overflow:hidden to allow floating elements like RECOMMENDED to stand outside */
          overflow: visible;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .sub-card:hover {
          transform: translateY(-12px);
          border-color: rgba(242,100,34,0.3);
          box-shadow: 0 30px 60px rgba(242,100,34,0.12), 0 10px 20px rgba(0,0,0,0.4);
        }

        /* Inner container clipping the shimmer effect safely */
        .card-shimmer-overlay {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 24px;
          pointer-events: none;
          z-index: 1;
        }
        .card-shimmer-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-30deg);
        }
        .sub-card:hover .card-shimmer-overlay::before {
          animation: shimmer 1.6s ease-in-out infinite;
        }
        
        /* Premium Platinum dynamic border animations */
        .sub-card.recommended {
          border: 2px solid rgba(242, 100, 34, 0.4);
          background: linear-gradient(180deg, rgba(12, 22, 38, 0.85) 0%, rgba(3, 11, 23, 0.95) 100%);
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both, borderPulse 5s infinite ease-in-out;
        }
        .sub-card.recommended:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 60px rgba(242, 100, 34, 0.25), 0 10px 20px rgba(0,0,0,0.4);
        }

        .toggle-btn {
          background: transparent;
          border: none;
          color: #8f98a9;
          padding: 12px 30px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        .toggle-btn.active {
          background: linear-gradient(135deg, #f26422 0%, #ff8c53 100%);
          color: #fff;
          box-shadow: 0 6px 20px rgba(242,100,34,0.4);
        }
        .price-text {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: -2px;
          margin: 15px 0;
          color: #fff;
          line-height: 1;
        }
        .price-sub {
          font-size: 0.9rem;
          color: #8f98a9;
          margin-bottom: 25px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          color: #cbd5e1;
          margin-bottom: 14px;
          text-align: left;
          transition: all 0.25s ease;
        }
        .sub-card:hover .feature-item {
          transform: translateX(4px);
          color: #fff;
        }
        .feature-icon {
          color: #22c55e;
          flex-shrink: 0;
          font-weight: bold;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 40px;
          font-size: 0.95rem;
          text-align: left;
        }
        .matrix-table th {
          padding: 20px 24px;
          border-bottom: 2px solid rgba(255,255,255,0.06);
          color: #fff;
          font-weight: 700;
        }
        .matrix-table td {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #cbd5e1;
        }
        .matrix-table tr:hover td {
          background: rgba(255,255,255,0.015);
        }
      `}} />

      {/* Interactive Background Glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(242,100,34,0.07) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'orbFloat1 22s infinite ease-in-out'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,9,20,0.06) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'orbFloat2 28s infinite ease-in-out'
      }}></div>

      {/* Global Sleek Navigation Header */}
      <nav style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '20px 6%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(2, 7, 16, 0.75)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <Link href="/">
          <img src="/assets/logo-200-x-70-px.png" alt="Vyoma" style={{ height: '42px', objectFit: 'contain' }} />
        </Link>
        <Link href="/" style={{ 
          color: '#fff', 
          textDecoration: 'none', 
          fontSize: '0.9rem', 
          fontWeight: 700,
          background: 'rgba(255,255,255,0.04)',
          padding: '8px 22px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          ← Back Home
        </Link>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '70px 24px', zIndex: 1, position: 'relative' }}>
        
        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '50px', animation: 'fadeIn 0.8s ease' }}>
          <span style={{
            background: 'rgba(242, 100, 34, 0.1)',
            color: '#f26422',
            padding: '6px 18px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            display: 'inline-block',
            marginBottom: '15px',
            border: '1px solid rgba(242, 100, 34, 0.15)'
          }}>
            Vyoma Sanskrit OTT Premium
          </span>
          
          <h1 style={{ 
            fontSize: '3.6rem', 
            fontWeight: 900, 
            marginBottom: '15px', 
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #fff 30%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15
          }}>
            Choose Your Learning Path
          </h1>
          <p style={{ color: '#8f98a9', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6', fontSize: '1.1rem' }}>
            Unlock unlimited access to Sanskrit E-books, Interactive Quizzes, Podcast streams, HD Video Lectures, and immersive Educational Games.
          </p>
          
          <div style={{ 
            marginTop: '25px', 
            color: '#cbd5e1', 
            fontSize: '0.85rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px',
            background: 'rgba(15, 22, 36, 0.5)',
            padding: '8px 20px',
            borderRadius: '25px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            {currentUser?.country && currentUser.country !== 'IN' ? (
              <span>🔒 Currency locked to USD (International) based on your billing profile country ({currentUser.country})</span>
            ) : (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
                <span>Geo-Location status: {region === 'INDIA' ? 'Domestic Profile Loaded' : 'Abroad Profile Loaded'}</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Billing Slider/Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '55px' }}>
          <div style={{ 
            display: 'flex', 
            background: 'rgba(15, 22, 36, 0.4)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            padding: '5px', 
            borderRadius: '35px', 
            width: 'fit-content',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}>
             <button 
               onClick={() => setBillingPeriod('MONTHLY')} 
               className={`toggle-btn ${billingPeriod === 'MONTHLY' ? 'active' : ''}`}
             >
               Monthly
             </button>
             <button 
               onClick={() => setBillingPeriod('YEARLY')} 
               className={`toggle-btn ${billingPeriod === 'YEARLY' ? 'active' : ''}`}
             >
               Yearly <span style={{ fontSize: '0.75rem', opacity: 0.9, background: 'rgba(0,0,0,0.15)', padding: '2px 8px', borderRadius: '10px', marginLeft: '5px', fontWeight: 800 }}>Save 15%</span>
             </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
          gap: '30px', 
          alignItems: 'stretch',
          marginBottom: '80px'
        }}>
          
          {/* CARD 1: FREE TRIAL */}
          <div className="sub-card" style={{ animationDelay: '0.1s' }}>
            <div className="card-shimmer-overlay"></div>
            
            <div style={{ textAlign: 'left', marginBottom: '25px', zIndex: 2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#8f98a9', letterSpacing: '1.5px' }}>Starter Access</div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '5px', color: '#fff' }}>Free Path</h3>
            </div>
            
            <div className="price-text" key={`free-${billingPeriod}`} style={{ animation: 'scalePop 0.4s ease-out', zIndex: 2 }}>
              {currency}0
            </div>
            <div className="price-sub" style={{ zIndex: 2 }}>Free Lifetime Tier</div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0 0 25px 0', zIndex: 2 }}></div>

            <div style={{ flex: 1, marginBottom: '35px', zIndex: 2 }}>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Select introductory video lectures</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Basic Sanskrit vocabulary games</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Public podcast streams</span>
              </div>
              <div className="feature-item" style={{ opacity: 0.4 }}>
                <span style={{ color: '#ef4444', marginRight: '6px' }}>✗</span>
                <span>Advanced Grammarian tracks</span>
              </div>
            </div>

            <Link href="/register" style={{ 
              display: 'block', 
              padding: '16px', 
              border: '1px solid rgba(255,255,255,0.12)', 
              color: '#fff', 
              borderRadius: '12px', 
              textDecoration: 'none', 
              fontWeight: 700,
              fontSize: '1rem',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              zIndex: 2
            }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
              Get Started Free
            </Link>
          </div>

          {/* CARD 2: GOLD TIER */}
          <div className="sub-card" style={{ animationDelay: '0.2s' }}>
            <div className="card-shimmer-overlay"></div>
            
            <div style={{ textAlign: 'left', marginBottom: '25px', zIndex: 2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#f26422', letterSpacing: '1.5px' }}>Intermediate Mastery</div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '5px', color: '#f26422' }}>Gold Tier</h3>
            </div>
            
            <div className="price-text" key={`gold-${billingPeriod}`} style={{ animation: 'scalePop 0.4s ease-out', zIndex: 2 }}>
              {currency}{selectedGold ? getP(selectedGold) : '0'}
            </div>
            <div className="price-sub" style={{ zIndex: 2 }}>
              Billed {billingPeriod === 'YEARLY' ? 'Annually' : 'Monthly'}
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0 0 25px 0', zIndex: 2 }}></div>

            <div style={{ flex: 1, marginBottom: '35px', zIndex: 2 }}>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Full access to curated standard video library</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Comprehensive Sanskrit E-book catalog</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Guided audio lessons & interactive quizzes</span>
              </div>
              <div className="feature-item" style={{ opacity: 0.4 }}>
                <span style={{ color: '#ef4444', marginRight: '6px' }}>✗</span>
                <span>Premium Live Masterclasses & Certifications</span>
              </div>
            </div>

            <button 
              onClick={() => selectedGold && startUpgradeFlow(selectedGold)}
              style={{ 
                width: '100%',
                display: 'block', 
                padding: '16px', 
                border: '1px solid #f26422', 
                borderRadius: '12px', 
                fontWeight: 700,
                fontSize: '1rem',
                background: 'transparent',
                color: '#f26422',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                zIndex: 2
              }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f26422'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(242,100,34,0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f26422'; e.currentTarget.style.boxShadow = 'none'; }}>
              Subscribe to Gold
            </button>
          </div>

          {/* CARD 3: PLATINUM TIER */}
          <div className="sub-card recommended" style={{ animationDelay: '0.3s' }}>
            <div className="card-shimmer-overlay"></div>
            
            <div style={{ 
              position: 'absolute', 
              top: '-15px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
              padding: '6px 24px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 900,
              letterSpacing: '1.5px',
              animation: 'floatBadge 4s infinite ease-in-out',
              boxShadow: '0 8px 20px rgba(242,100,34,0.45)',
              zIndex: 10
            }}>
              RECOMMENDED
            </div>
            
            <div style={{ textAlign: 'left', marginBottom: '25px', zIndex: 2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff8c53', letterSpacing: '1.5px' }}>Unlimited Authority</div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '5px', color: '#ff8c53' }}>Platinum Tier</h3>
            </div>
            
            <div className="price-text" key={`plat-${billingPeriod}`} style={{ animation: 'scalePop 0.4s ease-out', textShadow: '0 0 20px rgba(242,100,34,0.2)', zIndex: 2 }}>
              {currency}{selectedPlatinum ? getP(selectedPlatinum) : '0'}
            </div>
            <div className="price-sub" style={{ zIndex: 2 }}>
              Billed {billingPeriod === 'YEARLY' ? 'Annually' : 'Monthly'}
            </div>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0 0 25px 0', zIndex: 2 }}></div>

            <div style={{ flex: 1, marginBottom: '35px', zIndex: 2 }}>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <strong style={{ color: '#fff' }}>All-access catalog (Every Video, Audio, Book)</strong>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Interactive Sandhi & Grammar Game-Engines</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Authentic Course Completion Certificates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Priority 1-on-1 Sanskrit Tutor consultation</span>
              </div>
            </div>

            <button 
              onClick={() => selectedPlatinum && startUpgradeFlow(selectedPlatinum)}
              style={{ 
                width: '100%',
                display: 'block', 
                padding: '17px', 
                border: 'none', 
                color: '#fff', 
                borderRadius: '12px', 
                fontWeight: 800,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                boxShadow: '0 5px 15px rgba(242,100,34,0.3)',
                zIndex: 2
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(242,100,34,0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(242,100,34,0.3)' }}>
              Subscribe to Platinum
            </button>
          </div>

        </div>

        {/* Individual Paid Products Section */}
        {paidCourses.length > 0 && (
          <div style={{ marginTop: '80px', animation: 'fadeIn 1s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '45px' }}>
              <span style={{
                background: 'rgba(242, 100, 34, 0.1)',
                color: '#f26422',
                padding: '6px 18px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                display: 'inline-block',
                marginBottom: '15px',
                border: '1px solid rgba(242, 100, 34, 0.15)'
              }}>
                Exclusive Learning Material
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '10px' }}>
                Paid Products & Bundles
              </h2>
              <p style={{ color: '#8f98a9', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
                Get absolute lifetime access to these specific flagship courses. Secure purchase once, watch forever.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '25px',
              marginBottom: '40px'
            }}>
              {paidCourses.map((course) => {
                const isOwned = currentUser?.purchases?.some((p: any) => p.courseId === course.id) || false;
                const price = course.price || 299;
                const priceStr = region === 'INDIA' ? `₹${price}` : `$${(price / 80).toFixed(0)}`;

                return (
                  <div key={course.id} className="sub-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={course.thumbnailUrl || '/assets/Ayodhyakanda.jpg'} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#f26422', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                        PAID PRODUCT
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '8px', wordBreak: 'break-word' }}>{course.title}</h3>
                    <p style={{ color: '#8f98a9', fontSize: '0.9rem', lineHeight: '1.5', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Exclusive deep-dive course module with detailed lectures, chanting books, and completion certificates.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#8f98a9' }}>One-time Buy</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{priceStr}</div>
                      </div>
                      
                      {isOwned ? (
                        <Link href={`/watch/${course.id}`} style={{ background: '#22c55e', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
                          Stream Now
                        </Link>
                      ) : (
                        <Link href={`/checkout/${course.id}`} style={{ background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(242,100,34,0.3)' }}>
                          Buy Lifetime
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature Comparison Matrix Table */}
        <div style={{ 
          marginTop: '90px', 
          textAlign: 'center',
          animation: 'fadeIn 1s ease'
        }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '15px', letterSpacing: '-1px' }}>Feature Comparison</h2>
          <p style={{ color: '#8f98a9', marginBottom: '45px', fontSize: '1.05rem' }}>Deep dive into details to pick the perfect plan tailored for your learning pace.</p>
          
          <div style={{ 
            background: 'rgba(10, 18, 32, 0.4)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '20px', 
            overflowX: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Features & Capabilities</th>
                  <th>Free Path</th>
                  <th style={{ color: '#f26422', fontWeight: 800 }}>Gold Tier</th>
                  <th style={{ color: '#ff8c53', fontWeight: 800 }}>Platinum Tier</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sanskrit Video Lectures</td>
                  <td>Introductory clips only</td>
                  <td>Standard Syllabus (Curated)</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>All videos & masterclass archives</td>
                </tr>
                <tr>
                  <td>E-books & Chanting manuals</td>
                  <td>✗ None</td>
                  <td>✓ Over 50+ books</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>✓ Unlimited catalog access</td>
                </tr>
                <tr>
                  <td>Grammar Game Engines</td>
                  <td>Basic levels</td>
                  <td>Standard mode</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>✓ Sandbox Simulator & Arcade modes</td>
                </tr>
                <tr>
                  <td>Graded Quizzes & Metrics</td>
                  <td>✗ None</td>
                  <td>✓ Standard dashboard metrics</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>✓ Comprehensive Syllabus Analytics</td>
                </tr>
                <tr>
                  <td>Completion Certificates</td>
                  <td>✗ None</td>
                  <td>✗ None</td>
                  <td style={{ fontWeight: 'bold', color: '#22c55e' }}>✓ Verified digital credentials</td>
                </tr>
                <tr>
                  <td>Priority Consultation</td>
                  <td>✗ None</td>
                  <td>✗ None</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>✓ Priority Helpdesk & Tutor Chat</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================ */}
        {/* INTERACTIVE PRORATION CALCULATOR MODAL      */}
        {/* ============================================ */}
        {isCalculating && targetPlan && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(2, 7, 16, 0.85)', backdropFilter: 'blur(12px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
          }}>
            <div style={{ 
              background: '#0a1220', 
              width: '90%', 
              maxWidth: '560px', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.08)', 
              padding: '35px', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)', 
              animation: 'slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                 <h2 style={{ fontSize: '1.6rem', fontWeight: 900, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Confirm Your Upgrade</h2>
                 <button onClick={() => setIsCalculating(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem', padding: '6px 12px', borderRadius: '50%' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>✕</button>
              </div>

              <div style={{ background: 'rgba(242,100,34,0.05)', padding: '18px', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(242,100,34,0.15)' }}>
                 <div style={{ fontSize: '0.75rem', color: '#ff8c53', fontWeight: 800, letterSpacing: '1.5px' }}>PRORATED ACCOUNT ALIGNMENT</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px', fontSize: '1.25rem', fontWeight: 800 }}>
                    <span style={{ color: '#8f98a9' }}>{currentTier}</span> 
                    <span style={{ color: '#444' }}>→</span> 
                    <span style={{ color: '#f26422' }}>{targetPlan.name} ({targetPlan.interval})</span>
                 </div>
              </div>

              {/* Progress lifecycle simulation */}
              <div style={{ marginBottom: '30px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#8f98a9', marginBottom: '10px' }}>
                    <span>Active Plan Days Consumed:</span>
                    <strong style={{ color: '#22c55e' }}>{daysUsedSimulation} Days</strong>
                 </div>
                 
                 <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                       height: '100%', 
                       width: `${Math.min(100, (daysUsedSimulation / (currentInterval === 'YEARLY' ? 365 : 30)) * 100)}%`,
                       background: 'linear-gradient(90deg, #f26422, #ff8c53)',
                       borderRadius: '10px'
                    }}></div>
                 </div>
              </div>

              {/* Numerical breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.25)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <h4 style={{ fontSize: '0.75rem', color: '#8f98a9', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Adjustment Ledger</h4>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#8f98a9' }}>New Plan Rate</span>
                    <span>{currency}{calc.dailyNew} / day</span>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#8f98a9' }}>Remaining Cycle Duration</span>
                    <span>{calc.remainingDays} days</span>
                 </div>

                 <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}></div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#8f98a9' }}>New Cycle Share</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{currency}{calc.newProRatedCost}</span>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#22c55e' }}>Unused Balance Credit (refunded)</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>- {currency}{calc.unusedCredit}</span>
                 </div>

                 <div style={{ 
                   marginTop: '10px', 
                   padding: '16px', 
                   background: 'linear-gradient(135deg, rgba(242,100,34,0.15) 0%, rgba(255,140,83,0.05) 100%)', 
                   borderRadius: '12px', 
                   border: '1px solid rgba(242,100,34,0.25)', 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center' 
                 }}>
                    <div>
                       <div style={{ fontSize: '0.8rem', color: '#8f98a9', fontWeight: 600 }}>Net Charge Due</div>
                       <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Immediate payment</div>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{currency}{calc.netDue}</div>
                 </div>
              </div>

              {subData && subData.success ? (
                 <div style={{ marginTop: '25px' }}>
                   <RazorpayCheckoutButton 
                     amount={parseFloat(calc.netDue.toString()) > 0 ? parseFloat(calc.netDue.toString()) : 1}
                     currency={region === 'INDIA' ? 'INR' : 'USD'}
                     name={`Vyoma ${targetPlan.name} Tier`}
                     description={`Auto-renewing ${targetPlan.interval} mandate`}
                     subscriptionId={subData.subscriptionId}
                     publicKey={subData.publicKey as string}
                     onSuccess={handleSuccess}
                     onError={(err: any) => console.error("Payment failed", err)}
                     buttonText={`CONFIRM MANDATE & ACTIVATE (${currency}${calc.netDue})`}
                   />
                 </div>
              ) : (
                 <button onClick={handleAuthorize} disabled={isInitializing} style={{ width: '100%', marginTop: '25px', padding: '16px', background: isInitializing ? '#374151' : 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1.05rem', cursor: isInitializing ? 'wait' : 'pointer', boxShadow: '0 8px 25px rgba(242,100,34,0.2)', transition: 'all 0.3s' }}>
                   {isInitializing ? 'INITIATING SECURE SESSION...' : `AUTHORIZE DIRECT DEBIT (${currency}${calc.netDue})`}
                 </button>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
