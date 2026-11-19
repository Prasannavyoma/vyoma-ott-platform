import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  RotateCcw, 
  Truck, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  ArrowLeft,
  ShieldCheck,
  FileText
} from 'lucide-react';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Shipping, Cancellation & Refund Policy | Vyoma Linguistic Labs Foundation',
  description: 'Official Shipping, Delivery, Cancellation, and Refund Policy of Vyoma Linguistic Labs Foundation for Sanskrit digital learning resources.',
};

export default function ShippingAndRefundPolicyPage() {
  return (
    <>
      <NavBar />
      <style>{`
        .back-btn-pill:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateX(-3px);
          color: #fff !important;
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #141b2d 0%, #080b12 70%)',
        color: '#e2e8f0',
        paddingTop: '130px',
        paddingBottom: '80px',
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Back Navigation */}
          <div style={{ marginBottom: '24px' }}>
            <Link 
              href="/" 
              className="back-btn-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '0.88rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          {/* Header Banner */}
          <header style={{
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8) 0%, rgba(10, 15, 28, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '36px 32px',
            marginBottom: '40px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              <RotateCcw size={16} /> Fulfillment &amp; Satisfaction Policy
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '12px'
            }}>
              Shipping, Cancellation &amp; Refund Policy
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              maxWidth: '820px',
              lineHeight: 1.6,
              margin: 0
            }}>
              At Vyoma Linguistic Labs Foundation, we are committed to delivering high-quality digital Sanskrit resources and ensuring a transparent, smooth experience for every learner.
            </p>
          </header>

          {/* Document Content */}
          <article style={{
            background: 'rgba(10, 15, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '40px 36px',
            fontSize: '1rem',
            lineHeight: 1.8,
            color: '#cbd5e1'
          }}>

            {/* Delivery Policy */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={22} color="#38bdf8" /> Delivery Policy (Digital Content &amp; Media)
              </h2>
              <p style={{ marginBottom: '14px' }}>
                All products and subscriptions hosted on our platform are <strong>100% digital</strong>, including flipbooks, e-books, audios, video discourses, multimedia software, audiobooks, and interactive games.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Instantaneous Digital Access
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#94a3b8' }}>
                    Upon successful payment, access to your purchased courses and media is unlocked immediately (or within 24 hours at latest) directly inside your user account dashboard.
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Zero Shipping Charges
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#94a3b8' }}>
                    Since all educational materials are delivered electronically via cloud streaming and online readers, absolutely no physical shipping or logistics fees apply.
                  </p>
                </div>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Cancellation Policy */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} color="#f26422" /> Cancellation Policy (Digital Content)
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Due to the immediate access nature of digital goods, cancellations are generally not permitted once access has been activated. However, we understand that accidental duplicate purchases can occasionally occur.
              </p>
              <div style={{ background: 'rgba(242, 100, 34, 0.08)', border: '1px solid rgba(242, 100, 34, 0.25)', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
                <ul style={{ paddingLeft: '20px', margin: 0, color: '#fed7aa' }}>
                  <li style={{ marginBottom: '8px' }}>You must submit a cancellation request within <strong>12 hours of purchase</strong> and <strong>before accessing or downloading</strong> any content.</li>
                  <li style={{ marginBottom: '8px' }}>Requests made after playback, streaming, reading, or login activity will not be eligible for cancellation.</li>
                  <li>All cancellation requests are reviewed on a case-by-case basis by our administrative team.</li>
                </ul>
              </div>
              <p style={{ margin: 0 }}>
                To initiate a cancellation, please email our support team at <a href="mailto:support@vyomalabs.in" style={{ color: '#ff8c53', fontWeight: 700 }}>support@vyomalabs.in</a> with your registered email and order reference number.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Refund Policy */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={22} color="#22c55e" /> Refund Policy
              </h2>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80', marginBottom: '10px' }}>
                  ★ 30-Day Full Refund Guarantee for Annual Subscriptions
                </h3>
                <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.7 }}>
                  Any registered paid User may request a refund of their entire subscription fees within <strong>30 (Thirty) days</strong> from the date of the first subscription if not satisfied with the Service. Email <a href="mailto:support@vyomalabs.in" style={{ color: '#4ade80', fontWeight: 700 }}>support@vyomalabs.in</a> and our team will initiate the reversal.
                </p>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                When Refunds Are Considered:
              </h3>
              <ul style={{ paddingLeft: '24px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>There is an unresolvable technical fault preventing access to content that cannot be fixed within a reasonable time.</li>
                <li style={{ marginBottom: '8px' }}>You were charged multiple times for the exact same digital resource due to payment gateway timeout.</li>
                <li style={{ marginBottom: '8px' }}>The content delivered was demonstrably materially different from its product description and no replacement is feasible (claims must be lodged within 7 days of order).</li>
              </ul>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                When Refunds Are Not Issued:
              </h3>
              <ul style={{ paddingLeft: '24px', marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Change of mind after streaming or downloading study material;</li>
                <li style={{ marginBottom: '8px' }}>Lack of usage or personal inability to finish a course;</li>
                <li style={{ marginBottom: '8px' }}>Incompatibility with unsupported personal devices where our system requirements were documented.</li>
              </ul>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Refund Processing Timeline</div>
                <p style={{ fontSize: '0.9rem', margin: 0, color: '#94a3b8' }}>
                  Approved refunds are processed within <strong>10 working days</strong> and returned directly to your original payment method (Credit/Debit Card, UPI, Netbanking). Reflect timelines depend on your issuing bank&rsquo;s standard clearing cycle.
                </p>
              </div>
            </section>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '30px' }}>
              <Link
                href="/terms-and-conditions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--primary, #f26422)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <FileText size={18} /> View Terms &amp; Conditions
              </Link>
              <Link
                href="/privacy-policy"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <ShieldCheck size={18} /> View Privacy Policy
              </Link>
            </div>

          </article>

        </div>
      </main>

      <Footer />
    </>
  );
}
