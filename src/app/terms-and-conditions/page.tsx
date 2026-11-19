import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Scale, 
  ShieldCheck, 
  RotateCcw, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Mail, 
  Building, 
  ArrowLeft,
  UserCheck,
  CreditCard,
  Lock,
  Gavel,
  BookOpen
} from 'lucide-react';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Vyoma Linguistic Labs Foundation',
  description: 'Official Terms & Conditions governing the use of Vyoma Linguistic Labs Foundation learning platforms, subscription tiers, and OTT digital content.',
};

export default function TermsAndConditionsPage() {
  const sections = [
    { id: 'section-1', num: '1', title: 'Introduction' },
    { id: 'section-2', num: '2', title: 'Our License to You' },
    { id: 'section-3', num: '3', title: 'User Account' },
    { id: 'section-4', num: '4', title: 'Contests & Promotions' },
    { id: 'section-5', num: '5', title: 'Subscription Plans & Charges' },
    { id: 'section-6', num: '6', title: '30-Day Refund Policy' },
    { id: 'section-7', num: '7', title: 'User Content' },
    { id: 'section-8', num: '8', title: 'Distribution & Reuse' },
    { id: 'section-9', num: '9', title: 'Acceptable Use Policy' },
    { id: 'section-10', num: '10', title: 'Use by Minors' },
    { id: 'section-11', num: '11', title: 'Intellectual Property Policy' },
    { id: 'section-12', num: '12', title: 'Cookies Policy' },
    { id: 'section-13', num: '13', title: 'Grievance Redressal & Copyright' },
    { id: 'section-14', num: '14', title: 'Error Reporting & Feedback' },
    { id: 'section-15', num: '15', title: 'Links to Other Websites' },
    { id: 'section-16', num: '16', title: 'Disclaimer of Warranty' },
    { id: 'section-17', num: '17', title: 'Limitation of Liability' },
    { id: 'section-18', num: '18', title: 'Termination & Survival' },
    { id: 'section-19', num: '19', title: 'Indemnification' },
    { id: 'section-20', num: '20', title: 'Entire Agreement' },
    { id: 'section-21', num: '21', title: 'Waiver & Severability' },
    { id: 'section-22', num: '22', title: 'Changes to Service' },
    { id: 'section-23', num: '23', title: 'Amendments to Terms' },
    { id: 'section-24', num: '24', title: 'Communications' },
    { id: 'section-25', num: '25', title: 'Governing Law & Arbitration' },
    { id: 'section-26', num: '26', title: 'Acknowledgement' },
    { id: 'section-27', num: '27', title: 'Contact Us' },
  ];

  return (
    <>
      <NavBar />
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        .legal-section {
          scroll-margin-top: 100px;
        }
        .toc-pill:hover {
          background: rgba(242, 100, 34, 0.15) !important;
          border-color: rgba(242, 100, 34, 0.5) !important;
          color: #ff8c53 !important;
        }
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          
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
            <div style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(242, 100, 34, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(242, 100, 34, 0.12)', border: '1px solid rgba(242, 100, 34, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#ff8c53', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              <Scale size={16} /> Terms &amp; Conditions
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '12px'
            }}>
              Terms &amp; Conditions
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              maxWidth: '820px',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Welcome to <strong>Vyoma Linguistic Labs Foundation</strong>. These Terms &amp; Conditions govern your access to and use of our digital platforms, streaming OTT resources, courses, e-books, multimedia subscriptions, and interactive tools.
            </p>

            {/* Metadata Badges */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.85rem',
              color: '#cbd5e1'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                ⚖️ <strong>Governing Law:</strong> Republic of India
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                🏛️ <strong>Arbitration Seat:</strong> Bengaluru, Karnataka
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                🔄 <strong>30-Day Refund Policy</strong>
              </span>
              <Link href="/privacy-policy" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                🛡️ Privacy Policy &rarr;
              </Link>
            </div>
          </header>

          {/* Quick Jump Navigation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '40px'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#f26422" /> Quick Navigation — Table of Contents
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="toc-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ color: '#f26422', fontWeight: 800 }}>{s.num}.</span> {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* LEGAL DOCUMENT BODY */}
          <article style={{
            background: 'rgba(10, 15, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '40px 36px',
            fontSize: '1rem',
            lineHeight: 1.8,
            color: '#cbd5e1'
          }}>

            {/* Section 1 */}
            <section id="section-1" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>1.</span> Introduction &amp; Acceptance
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Welcome to <strong>Vyoma Linguistic Labs Foundation</strong> (<strong>&ldquo;Company&rdquo; / &ldquo;Vyoma Labs&rdquo; / &ldquo;we&rdquo; / &ldquo;our&rdquo; / &ldquo;us&rdquo;</strong>). These Terms &amp; Conditions (<strong>&ldquo;Terms&rdquo; / &ldquo;Terms &amp; Conditions&rdquo;</strong>) govern your access to and use of our web pages and application located at <Link href="/" style={{ color: '#ff8c53', textDecoration: 'underline' }}>digitalsanskrit.com</Link> and associated progressive web applications (together the <strong>&ldquo;Website&rdquo; / &ldquo;Service&rdquo;</strong>) operated by Vyoma Labs.
              </p>
              <p style={{ marginBottom: '14px' }}>
                These Terms have to be read along with our policies governing the use of the Website, including the <Link href="/privacy-policy" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Privacy Policy</Link>, <strong><a href="#section-11" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Intellectual Property Policy</a></strong>, and <strong><a href="#section-6" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Refund Policy</a></strong>. These Terms apply to all visitors, registered users, subscribers, and others who wish to access or use our Service (<strong>&ldquo;User&rdquo; / &ldquo;Users&rdquo;</strong>).
              </p>
              <p style={{ marginBottom: '14px' }}>
                Your agreement with us includes these Terms, the Intellectual Property Policy, Refund Policy, and our Privacy Policy (collectively the <strong>&ldquo;Agreements&rdquo;</strong>). You acknowledge that you have read and understood the Terms and Agreements, and agree to be bound by them. If you do not want to be bound by the Terms and Agreements, you must not subscribe to or use the Service.
              </p>
              <p style={{ marginBottom: '14px' }}>
                These Terms, Agreements, and various other policies are binding as per the provisions of applicable Indian laws, including the <strong>Information Technology Act of 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Digital Personal Data Protection Act, 2023</strong>.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 2 */}
            <section id="section-2" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>2.</span> Our License to You
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Subject to these Terms and all Agreements, we grant you a limited, personal, non-exclusive, non-transferable, non-sublicensable, and revocable license to access and use our Service. Using our Service does not give you ownership of any intellectual property rights in our Service or the Sanskrit content you access.
              </p>
              <p style={{ marginBottom: '12px' }}>
                You agree that you shall NOT:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li>Republish material from this Website (including republication or replication on another website or YouTube);</li>
                <li>Sell, rent, sub-license, or commercially monetize material from the Website;</li>
                <li>Show any media material from the Website in public without prior written authorization;</li>
                <li>Reproduce, duplicate, copy, or otherwise exploit material on this Website for commercial purposes;</li>
                <li>Edit, alter, modify, decompile, reverse-engineer, or adapt any material or software on the Website.</li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 3 */}
            <section id="section-3" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>3.</span> User Account &amp; Security
              </h2>
              <p style={{ marginBottom: '14px' }}>
                In order to use our Service, you will need to register for a personal account (<strong>&ldquo;User Account&rdquo;</strong>) by providing an email address and a secure, unique password.
              </p>
              <p style={{ marginBottom: '14px' }}>
                You agree that you will never divulge or share access to your User Account with any third party for any reason. You also agree that you will create, use, and/or access only one User Account and that you will not use any User Account other than your own.
              </p>
              <p style={{ marginBottom: '14px' }}>
                You shall not impersonate any person or misrepresent your identity, including another person&rsquo;s username, password, email address, or name. You also agree to promptly notify us of any unauthorized use of your account or any other breach of site security. You are responsible for maintaining the confidentiality of your credentials.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 4 */}
            <section id="section-4" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>4.</span> Contests &amp; Promotions
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Any contests, quizzes, hackathons, or promotional learning events (collectively, <strong>&ldquo;Promotions&rdquo;</strong>) made available through our Website may be governed by specific guidelines separate from these Terms. If you participate in any Promotions, please review the applicable competition rules as well as our Privacy Policy.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 5 */}
            <section id="section-5" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>5.</span> Subscription Plans &amp; Charges
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Vyoma OTT provides three types of subscription access tiers (<strong>&ldquo;Plan/s&rdquo;</strong>):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Free Plan</div>
                  <p style={{ fontSize: '0.9rem', margin: 0, color: '#94a3b8' }}>
                    Zero subscription fees for trial access to selected introductory shlokas, courses, and sample media.
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Gold Plan</div>
                  <p style={{ fontSize: '0.9rem', margin: 0, color: '#94a3b8' }}>
                    Structured access to specialized categories, grammar lessons, and selected multimedia suites.
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Platinum Plan</div>
                  <p style={{ fontSize: '0.9rem', margin: 0, color: '#94a3b8' }}>
                    Unlimited, full-catalog access to the complete digital Sanskrit repository, epics, audiobooks, and interactive tools.
                  </p>
                </div>
              </div>
              <p style={{ marginBottom: '14px' }}>
                The term of subscription is <strong>1 (one) year</strong>. At the end of the term, you have the option of renewing your subscription. If you choose not to renew, you will cease to have access to exclusive paid subscriber content.
              </p>
              <p style={{ marginBottom: '14px' }}>
                There is <strong>no auto-debit / auto-subscription lock-in</strong>. You maintain complete control over renewals. Vyoma Labs may revise subscription fees for new billing cycles with prior email notification.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 6 - REFUND */}
            <section id="section-6" className="legal-section" style={{ marginBottom: '36px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '16px',
                padding: '28px',
                position: 'relative'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>
                  <RotateCcw size={14} /> Learner Guarantee
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#4ade80' }}>6.</span> 30-Day Full Refund Policy
                </h2>
                <p style={{ fontSize: '1.05rem', color: '#f0fdf4', lineHeight: 1.7, marginBottom: '14px' }}>
                  Any registered paid User may request a refund of their entire subscription fees within <strong>30 (Thirty) days</strong> from the date of their first subscription if the User is not satisfied with the Service.
                </p>
                <p style={{ color: '#cbd5e1', marginBottom: '14px' }}>
                  While we sincerely hope that no such situation arises, a request for full refund may be made by sending an email with your order details to <a href="mailto:support@vyomalabs.in" style={{ color: '#4ade80', fontWeight: 700, textDecoration: 'underline' }}>support@vyomalabs.in</a>.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
                  Vyoma Labs will review and process the refund request within <strong>10 working days</strong> of receipt and initiate a credit to your original method of payment. The exact time taken to reflect depends on your card issuer or banking partner. No subscription refunds (except as required by law) will be issued after a lapse of 30 days from the original date of subscription.
                </p>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 7 & 8 */}
            <section id="section-7" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>7.</span> User Content &amp; Submissions
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Our Service may allow you to post, link, store, share, or submit text, quiz answers, forum questions, or testimonials (<strong>&ldquo;Content&rdquo;</strong>). You represent and warrant that you own or have the lawful rights to post such Content, and that your submissions do not infringe on copyrights, privacy, or trademark rights.
              </p>
              <p style={{ marginBottom: '14px' }}>
                Vyoma Labs reserves the right, but is not obligated, to monitor, review, or remove user content that violates community guidelines or Indian law.
              </p>
            </section>

            <section id="section-8" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>8.</span> Distribution &amp; Reuse
              </h2>
              <p style={{ marginBottom: '14px' }}>
                This Website and all Sanskrit resources hosted herein are the exclusive intellectual property of Vyoma Labs and its recognized contributing scholars. You may not modify, transmit, download, rip, distribute, repost, or exploit the content, whether in whole or in part, without express prior written permission.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 9 - ACCEPTABLE USE */}
            <section id="section-9" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>9.</span> Acceptable Use Policy &amp; Prohibitions
              </h2>
              <p style={{ marginBottom: '12px' }}>
                You may use our Service strictly for lawful, educational, and devotional purposes. You explicitly agree NOT to:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li>Violate any applicable Indian or international law or regulation;</li>
                <li>Conduct any systematic or automated data collection (including scraping, screen scraping, data harvesting, or bots);</li>
                <li>Transmit spam, unauthorized advertising, or promotional solicitations;</li>
                <li>Impersonate Vyoma Labs, its scholars, or another registered user;</li>
                <li>Interfere with, disable, overburden, or impair server connectivity and streaming delivery;</li>
                <li>Introduce any malware, virus, Trojan horse, worms, or malicious code;</li>
                <li>Attempt unauthorized access to our database, API endpoints, or user profiles;</li>
                <li>Launch Denial-of-Service (DoS) or Distributed Denial-of-Service (DDoS) attacks against our infrastructure.</li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 10 & 11 */}
            <section id="section-10" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>10.</span> Use by Minors
              </h2>
              <p style={{ marginBottom: '14px' }}>
                By using the Service, you warrant that you are at least 18 years of age or possess legal capacity under Indian law. For minor children using educational modules (e.g., Sanskrit Kids Academy), the User Account must be created, authorized, and supervised by a parent or legal guardian.
              </p>
            </section>

            <section id="section-11" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>11.</span> Intellectual Property Policy
              </h2>
              <p style={{ marginBottom: '14px' }}>
                The Website, including its software architecture, pedagogical structuring, proprietary Sanskrit audio recordings, animations, digital typography, and brand marks, remains the exclusive property of Vyoma Linguistic Labs Foundation.
              </p>
              <p style={{ marginBottom: '14px' }}>
                The trademarks, logos, and service marks displayed on the Service are registered and unregistered marks of Vyoma Labs. Nothing contained on this Website shall be construed as granting any license to use any trademark without express written permission.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 12 & 13 */}
            <section id="section-12" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>12.</span> Cookies Policy
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Our Service uses cookies and local session tokens to facilitate seamless login, audio progress resumption, and playback stability. For exhaustive details, please consult our <Link href="/privacy-policy#cookies" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Cookies Policy</Link>.
              </p>
            </section>

            <section id="section-13" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>13.</span> Grievance Redressal Mechanism &amp; Copyright Infringement
              </h2>
              <p style={{ marginBottom: '14px' }}>
                In compliance with the Information Technology Act, 2000 and the Rules thereunder, Vyoma Labs has instituted a dedicated Grievance Redressal Mechanism. Copyright owners or users with disputes may contact:
              </p>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, color: '#fff' }}>Sri Venkatasubramanian P.</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chief Operating Officer (COO) &amp; Grievance Redressal Officer</div>
                <div style={{ marginTop: '8px' }}>
                  <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> support@vyomalabs.in
                  </a>
                </div>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Sections 14 - 17 */}
            <section id="section-14" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>14.</span> Error Reporting &amp; User Feedback
              </h2>
              <p style={{ marginBottom: '14px' }}>
                You may submit bug reports, suggestions, or pedagogical feedback to <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8' }}>support@vyomalabs.in</a>. Any feedback submitted grants Vyoma Labs a royalty-free, perpetual license to implement and commercialize such improvements without obligation of confidentiality.
              </p>
            </section>

            <section id="section-15" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>15.</span> Links to Other Websites
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Our Service may contain links to third-party websites not owned by Vyoma Labs. We bear no liability for content, privacy policies, or practices of external domains.
              </p>
            </section>

            <section id="section-16" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>16.</span> Disclaimer of Warranty
              </h2>
              <p style={{ marginBottom: '14px' }}>
                The Service is provided by the Company on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without express or implied warranties regarding uninterrupted streaming or defect-free server uptime.
              </p>
            </section>

            <section id="section-17" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>17.</span> Limitation of Liability
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Except as prohibited by law, you will hold Vyoma Labs and its officers, scholars, content creators, and directors harmless for any indirect, punitive, or consequential damages. In all circumstances, total liability shall not exceed the actual amount paid by you for the specific Service in question.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Sections 18 - 23 */}
            <section id="section-18" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>18.</span> Termination &amp; Survival Clauses
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We may terminate or suspend access to your User Account immediately, without prior notice, in our sole discretion for any breach of these Terms. Provisions regarding intellectual property, indemnification, warranty disclaimers, and dispute resolution shall survive account termination.
              </p>
            </section>

            <section id="section-19" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>19.</span> Indemnification
              </h2>
              <p style={{ marginBottom: '14px' }}>
                You agree to defend, indemnify, and hold harmless Vyoma Labs, its trustees, managing committee, scholars, and staff from any third-party claims, liabilities, or legal expenses arising from your misuse of the platform or violation of these Terms.
              </p>
            </section>

            <section id="section-20" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>20.</span> Entire Agreement
              </h2>
              <p style={{ marginBottom: '14px' }}>
                These Terms, together with the Privacy Policy and Refund Policy, constitute the complete agreement between you and Vyoma Labs concerning this Website.
              </p>
            </section>

            <section id="section-21" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>21.</span> Waiver &amp; Severability
              </h2>
              <p style={{ marginBottom: '14px' }}>
                If any provision of these Terms is held to be invalid or unenforceable, that provision will be modified to the minimum extent necessary to make it valid, and remaining provisions will remain in full force.
              </p>
            </section>

            <section id="section-22" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>22.</span> Changes to Service
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We reserve the right to withdraw, enhance, or amend our Service and media catalog at our sole discretion without notice.
              </p>
            </section>

            <section id="section-23" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>23.</span> Amendments to Terms
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Vyoma Labs may revise these Terms periodically. Revised Terms will apply immediately from the date of publication on this page.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Sections 24 - 27 */}
            <section id="section-24" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>24.</span> Communications &amp; Opt-Out
              </h2>
              <p style={{ marginBottom: '14px' }}>
                By creating an account, you agree to receive essential transactional notifications and educational updates. You may opt out of promotional newsletters at any time by emailing <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8' }}>support@vyomalabs.in</a>.
              </p>
            </section>

            <section id="section-25" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>25.</span> Governing Law &amp; Dispute Resolution
              </h2>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px', marginBottom: '14px' }}>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li style={{ marginBottom: '8px' }}>These Terms shall be governed exclusively by the laws of the <strong>Republic of India</strong>.</li>
                  <li style={{ marginBottom: '8px' }}>Any dispute shall first be addressed amicably through informal mediation with the management of Vyoma Labs for a period of not less than 30 days.</li>
                  <li style={{ marginBottom: '8px' }}>Failing mediation, disputes shall be finally resolved by an arbitration panel of three (3) arbitrators conducted in accordance with the <strong>Indian Arbitration and Conciliation Act, 1996</strong>.</li>
                  <li>The legal seat and jurisdiction of arbitration shall be <strong>Bengaluru (Karnataka), India</strong>. Proceedings shall be conducted in the English language.</li>
                </ul>
              </div>
            </section>

            <section id="section-26" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>26.</span> Acknowledgement
              </h2>
              <p style={{ marginBottom: '14px' }}>
                By using our Service, you acknowledge that you have read these Terms, the Privacy Policy, and all associated policies, and agree to be fully bound by them.
              </p>
            </section>

            <section id="section-27" className="legal-section">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>27.</span> Contact Us
              </h2>
              <p style={{ marginBottom: '16px' }}>
                For inquiries regarding these Terms, technical questions, or subscription support, please contact our team:
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff8c53', marginBottom: '4px' }}>
                    Email Support
                  </div>
                  <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={18} /> support@vyomalabs.in
                  </a>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '6px' }}>
                    Dedicated support response within 24-48 business hours.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff8c53', marginBottom: '4px' }}>
                    Registered Headquarters
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    <strong>Vyoma Linguistic Labs Foundation</strong><br />
                    #155, 2nd Floor, 4th Cross, GKW Layout,<br />
                    Vijayanagar, Bangalore, Karnataka – 560040, India
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '28px' }}>
                <Link
                  href="/privacy-policy"
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
                  <ShieldCheck size={18} /> View Privacy Policy
                </Link>
                <Link
                  href="/shipping-and-cancellation-and-refund-policy"
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
                  <RotateCcw size={18} /> View Refund Policy
                </Link>
              </div>
            </section>

          </article>

        </div>
      </main>

      <Footer />
    </>
  );
}
