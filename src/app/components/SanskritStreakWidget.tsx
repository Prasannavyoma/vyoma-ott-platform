"use client";

import { useState, useEffect } from 'react';
import { Flame, Award, Gift, Sparkles, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getUserGamificationStats, redeemXpForGiftVoucher } from '@/app/actions/gamification';
import FindMyPlanModal from './FindMyPlanModal';

interface SanskritStreakWidgetProps {
  isEnabled?: boolean;
}

export default function SanskritStreakWidget({ isEnabled = true }: SanskritStreakWidgetProps) {
  const [stats, setStats] = useState({
    streakDays: 1,
    xpPoints: 100,
    scholarRank: "Sanskrit Seeker",
    badgeIcon: "🌱"
  });
  const [showModal, setShowModal] = useState(false);
  const [showFindMyPlan, setShowFindMyPlan] = useState(false);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEnabled) {
      getUserGamificationStats().then(data => {
        if (data) setStats(data);
      });
    }
  }, [isEnabled]);

  if (!isEnabled) return null; // Turn off gracefully when disabled in Admin Dashboard

  const handleRedeem = async () => {
    setLoading(true);
    const res = await redeemXpForGiftVoucher(300);
    setLoading(false);
    if (res.success && res.code) {
      setRedeemedCode(res.code);
      // Refresh XP stats immediately
      getUserGamificationStats().then(data => {
        if (data) setStats(data);
      });
    }
  };

  return (
    <>
      {/* HEADER TOP BAR PILL */}
      <div 
        onClick={() => setShowModal(true)}
        title="View Daily Sanskrit Learning Streak & Scholar Rewards"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(242, 100, 34, 0.2))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          padding: '6px 14px',
          borderRadius: '30px',
          cursor: 'pointer',
          color: '#fbbf24',
          fontSize: '0.85rem',
          fontWeight: 700,
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 0 18px rgba(245, 158, 11, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.15)';
        }}
      >
        <Flame size={16} color="#f59e0b" style={{ animation: 'pulse 1.5s infinite' }} />
        <span>{stats.streakDays}-Day Streak</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ color: '#fff' }}>{stats.xpPoints} XP</span>
        <span style={{ fontSize: '0.9rem' }}>{stats.badgeIcon}</span>
      </div>

      {/* GAMIFICATION & REWARDS MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(2, 6, 14, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #0b1324 0%, #050b14 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            color: '#fff',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
          }}>
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#aaa',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>

            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>{stats.badgeIcon}</div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Daily Sanskrit Scholar Dashboard
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Rank: <strong style={{ color: '#fbbf24' }}>{stats.scholarRank}</strong>
              </p>
            </div>

            {/* STREAK CALENDAR ROW */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} /> 🔥 {stats.streakDays}-Day Active Recitation Streak
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Goal: 7 Days</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const isActive = idx < stats.streakDays;
                  return (
                    <div key={day} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        margin: '0 auto 6px',
                        borderRadius: '50%',
                        background: isActive ? 'linear-gradient(135deg, #f59e0b, #f26422)' : 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        boxShadow: isActive ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none'
                      }}>
                        {isActive ? <CheckCircle2 size={18} /> : (idx + 1)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: isActive ? '#fbbf24' : '#64748b' }}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* XP PROGRESS BAR */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                <span style={{ color: '#fff' }}>Total Scholar XP</span>
                <span style={{ color: '#38bdf8' }}>{stats.xpPoints} / 500 XP</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.xpPoints / 500) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '4px' }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Earn 150 more XP to unlock the <strong>Veda Vyasa Scholar</strong> title & premium discounts!
              </p>
            </div>

            {/* REWARDS REDEMPTION BOX */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(242, 100, 34, 0.3)',
              borderRadius: '16px',
              padding: '18px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Gift color="#f26422" size={18} /> Redeem XP for Gift Voucher Code
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                Exchange 300 XP to claim an exclusive subscription gift code!
              </p>

              {redeemedCode ? (
                <div style={{ background: '#0f172a', border: '1px dashed #22c55e', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>VOUCHER CODE GENERATED:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '1px', margin: '4px 0' }}>{redeemedCode}</div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setShowFindMyPlan(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginTop: '6px'
                    }}
                  >
                    Apply Code in FindMyPlan 🔑
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={loading || stats.xpPoints < 300}
                  style={{
                    background: stats.xpPoints >= 300 ? 'linear-gradient(135deg, #f26422, #d55318)' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: stats.xpPoints >= 300 ? 'pointer' : 'not-allowed',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? 'Generating Code...' : 'Redeem 300 XP Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP FOR FIND MY PLAN */}
      {showFindMyPlan && (
        <FindMyPlanModal isOpen={showFindMyPlan} onClose={() => setShowFindMyPlan(false)} userPlanData={null} />
      )}
    </>
  );
}
