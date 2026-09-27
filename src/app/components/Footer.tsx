"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Key, 
  BookOpen, 
  Mic, 
  Gamepad2, 
  PlaySquare, 
  Star, 
  HelpCircle, 
  Gift, 
  Lock, 
  CreditCard, 
  MessageSquare,
  Globe,
  Award
} from 'lucide-react';
import FindMyPlanModal from './FindMyPlanModal';

interface FooterProps {
  userPlanData?: any;
}

export default function Footer({ userPlanData }: FooterProps) {
  const [showFindMyPlan, setShowFindMyPlan] = useState(false);

  return (
    <>
      <footer style={{ 
        marginTop: '80px', 
        borderTop: '1px solid rgba(255,255,255,0.08)', 
        background: 'linear-gradient(180deg, rgba(3, 11, 23, 0.6) 0%, rgba(2, 6, 14, 0.98) 100%)',
        paddingTop: '60px', 
        paddingBottom: '30px', 
        color: '#8f98a9',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        position: 'relative'
      }}>

        {/* TOP BRANDING & CONTENT GRID */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          
          {/* BRAND COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Link href="/">
              <img 
                src="/assets/logo-200-x-70-px.png" 
                alt="Vyoma Sanskrit OTT Logo" 
                style={{ height: '48px', width: 'fit-content', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(242, 100, 34, 0.2))' }} 
              />
            </Link>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0, color: '#8f98a9' }}>
              Vyoma Linguistic Labs Foundation is a non-profit organization pioneering digital Sanskrit education globally. Empowering learners through modern OTT streaming technology.
            </p>
            
            {/* SOCIAL MEDIA CONNECTIONS */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <a href="https://youtube.com/@vyomasanskrit" target="_blank" rel="noopener noreferrer" title="YouTube" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', transition: 'all 0.2s' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://facebook.com/vyomasanskrit" target="_blank" rel="noopener noreferrer" title="Facebook" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1877f2', transition: 'all 0.2s' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com/vyomasanskrit" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e4405f', transition: 'all 0.2s' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com/vyomasanskrit" target="_blank" rel="noopener noreferrer" title="Twitter / X" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.2s' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/company/vyoma-sanskrit" target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a66c2', transition: 'all 0.2s' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://t.me/sanskritfromvyoma" target="_blank" rel="noopener noreferrer" title="Telegram" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#229ed9', transition: 'all 0.2s' }}>
                <MessageSquare size={16} />
              </a>
            </div>
          </div>

          {/* COLUMN 1: LEARN & EXPLORE */}
          <div>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '1rem', 
              fontWeight: 800, 
              marginBottom: '18px', 
              borderBottom: '2px solid rgba(242,100,34,0.4)',
              paddingBottom: '6px',
              display: 'inline-block'
            }}>
              Learn &amp; Explore
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/explore" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} color="var(--primary)" /> Explore Hub
              </Link>
              <Link href="/ebook" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={14} color="#38bdf8" /> Sanskrit E-Books
              </Link>
              <Link href="/podcast" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={14} color="#a855f7" /> Audiobooks &amp; Podcasts
              </Link>
              <Link href="/game" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 size={14} color="#22c55e" /> Interactive Games
              </Link>
              <Link href="/shorts" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlaySquare size={14} color="#ff4d4d" /> Shorts Clips
              </Link>
            </div>
          </div>

          {/* COLUMN 2: MEMBERSHIP & ACCOUNT */}
          <div>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '1rem', 
              fontWeight: 800, 
              marginBottom: '18px', 
              borderBottom: '2px solid rgba(242,100,34,0.4)',
              paddingBottom: '6px',
              display: 'inline-block'
            }}>
              Membership &amp; Account
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => setShowFindMyPlan(true)} 
                style={{ background: 'transparent', border: 'none', color: '#ff8c53', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 800, padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ShieldCheck size={14} /> Find My Plan &amp; Pricing
              </button>
              <button 
                onClick={() => setShowFindMyPlan(true)} 
                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Key size={14} color="#ffd700" /> Redeem Gift Voucher 🔑
              </button>
              <Link href="/gift" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gift size={14} color="#f43f5e" /> Gift Subscriptions
              </Link>
              <Link href="/certificate/verify" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={14} color="#fbbf24" /> Verify Certificates
              </Link>
              <Link href="/register" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={14} color="#22c55e" /> Create Free Account
              </Link>
            </div>
          </div>

          {/* COLUMN 3: FOUNDATION & LEGAL */}
          <div>
            <h3 style={{ 
              color: '#fff', 
              fontSize: '1rem', 
              fontWeight: 800, 
              marginBottom: '18px', 
              borderBottom: '2px solid rgba(242,100,34,0.4)',
              paddingBottom: '6px',
              display: 'inline-block'
            }}>
              Foundation &amp; Legal
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/about-us" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem' }}>
                About Vyoma Foundation
              </Link>
              <a href="https://www.digitalsanskrit.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem' }}>
                Terms &amp; Conditions
              </a>
              <a href="https://www.digitalsanskrit.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem' }}>
                Privacy Policy
              </a>
              <Link href="/faq" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} color="#38bdf8" /> Help &amp; Support FAQ
              </Link>
              <Link href="/testimonials" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.88rem' }}>
                Community Testimonials
              </Link>
            </div>
          </div>

        </div>

        {/* TRUST BADGES & PAYMENT SECURITY BAR */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.4)',
          padding: '16px 24px'
        }}>
          <div style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.8rem',
            color: '#8f98a9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} color="#22c55e" />
              <span>256-Bit SSL Encrypted &amp; PCI-DSS Secure Transactions</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ccc' }}>
                <CreditCard size={15} /> Verified Payment Gateway:
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', color: '#ff8c53', fontWeight: 800 }}>
                🇮🇳 UPI / RuPay (INR)
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', color: '#60a5fa', fontWeight: 800 }}>
                🌍 Visa / Mastercard ($ USD)
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', color: '#a855f7', fontWeight: 800 }}>
                Razorpay GEO Billing
              </span>
            </div>
          </div>
        </div>

        {/* COPYRIGHT & COMPLIANCE BAR */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '24px 24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          <div>
            © 2026 Vyoma Linguistic Labs Foundation. All rights reserved. <a href="https://www.digitalsanskrit.com" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'underline' }}>digitalsanskrit.com</a>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <a href="https://www.digitalsanskrit.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Privacy Policy
            </a>
            <a href="https://www.digitalsanskrit.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Terms of Service
            </a>
            <Link href="/faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Refund Policy
            </Link>
          </div>
        </div>
      </footer>

      {/* Embedded FindMyPlan Modal Toggle */}
      <FindMyPlanModal
        isOpen={showFindMyPlan}
        onClose={() => setShowFindMyPlan(false)}
        userPlanData={userPlanData || null}
      />
    </>
  );
}
