import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Mail, 
  Building, 
  Scale, 
  ArrowLeft,
  UserCheck,
  Database,
  Clock,
  HelpCircle,
  Cookie
} from 'lucide-react';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vyoma Linguistic Labs Foundation',
  description: 'Official Privacy Policy of Vyoma Linguistic Labs Foundation governing data protection, privacy rights, DPDP Act 2023 compliance, and service usage.',
};

export default function PrivacyPolicyPage() {
  const sections = [
    { id: 'section-1', num: '1', title: 'General Principles' },
    { id: 'section-2', num: '2', title: 'Information We Collect' },
    { id: 'section-3', num: '3', title: 'How We Use Your Data' },
    { id: 'section-4', num: '4', title: 'Data Retention' },
    { id: 'section-5', num: '5', title: 'Data Security Measures' },
    { id: 'section-6', num: '6', title: 'Data Sharing & Transfer' },
    { id: 'section-7', num: '7', title: 'Your Rights (DPDP Act, 2023)' },
    { id: 'section-8', num: '8', title: 'Exercising Your Rights' },
    { id: 'section-9', num: '9', title: 'Duties as a Data Principal' },
    { id: 'section-10', num: '10', title: 'Service Providers' },
    { id: 'section-11', num: '11', title: 'Analytics & Remarketing' },
    { id: 'section-12', num: '12', title: 'External Links & Third Parties' },
    { id: 'section-13', num: '13', title: 'General Exceptions' },
    { id: 'section-14', num: '14', title: 'Children’s Privacy' },
    { id: 'section-15', num: '15', title: 'Policy Amendments' },
    { id: 'section-16', num: '16', title: 'Grievance Redressal & DPO' },
    { id: 'section-17', num: '17', title: 'Acceptance of Terms' },
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
              <ShieldCheck size={16} /> Data Protection &amp; Privacy Policy
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '12px'
            }}>
              Privacy Policy
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              maxWidth: '820px',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              Vyoma Linguistic Labs Foundation is fully committed to safeguarding the personal data and privacy of all our users in strict accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023) and Information Technology Act, 2000.
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
                📅 <strong>Effective Date:</strong> 19 July 2025
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                🔄 <strong>Last Updated:</strong> 19 July 2025
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                🛡️ <strong>DPDP Act, 2023 Compliant</strong>
              </span>
              <Link href="/terms-and-conditions" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                📜 Terms & Conditions &rarr;
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

            {/* DPO Highlight Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
                  Designated Data Protection Officer (DPO)
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  Dr. Venkatasubramanian P.
                </div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                  COO, Vyoma Linguistic Labs Foundation
                </div>
              </div>
              <a
                href="mailto:venkat.s@vyomalabs.in"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}
              >
                <Mail size={16} /> venkat.s@vyomalabs.in
              </a>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>1.</span> General Principles
              </h2>
              <p style={{ marginBottom: '14px' }}>
                <strong>Vyoma Linguistic Labs Foundation</strong> (<strong>&ldquo;Vyoma Labs&rdquo; / &ldquo;us&rdquo; / &ldquo;we&rdquo; / &ldquo;our&rdquo;</strong>) is committed to protecting and safeguarding the personal data and privacy of any user who accesses and/or uses (<strong>&ldquo;User&rdquo; / &ldquo;you&rdquo; / &ldquo;your&rdquo;</strong>) our website <Link href="/" style={{ color: '#ff8c53', textDecoration: 'underline' }}>digitalsanskrit.com</Link> and associated progressive web applications (together the <strong>&ldquo;Site&rdquo; / &ldquo;Website&rdquo; / &ldquo;Service&rdquo;</strong>).
              </p>
              <p style={{ marginBottom: '14px' }}>
                Our Privacy Policy (or &ldquo;<strong>this Policy</strong>&rdquo;) governs your visit to our Website and explains how we collect, safeguard, and disclose information resulting from your use of our Service. We have developed this Privacy Policy to protect and safeguard your personal information, in accordance with applicable laws including the <strong>Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act, 2023&rdquo;)</strong>, the <strong>Information Technology Act, 2000 (&ldquo;IT Act, 2000&rdquo;)</strong>, and the applicable Rules thereunder.
              </p>
              <p style={{ marginBottom: '14px' }}>
                By using our Service, you agree to the collection and use of information in accordance with this Policy. Unless otherwise defined in this Privacy Policy, the terms used herein have the same meanings as in our <Link href="/terms-and-conditions" style={{ color: '#ff8c53', textDecoration: 'underline' }}>Terms of Use (&ldquo;Terms&rdquo;)</Link>.
              </p>
              <p style={{ marginBottom: '14px' }}>
                We endeavour to comply with laws of other countries but cannot and do not warrant that we do. We do everything we reasonably can to protect your rights of privacy on systems and the Website controlled by us, but we are not liable for any unauthorized or unlawful disclosures of your Personal Information made by third parties who are not subject to our control (e.g. advertisers and external websites that have links to our Website).
              </p>
              <p style={{ marginBottom: '14px' }}>
                Our Privacy Policy is subject to change at any time. To make sure you are aware of any changes, please review this Policy periodically. For privacy policies of other web properties operated by Vyoma Linguistic Labs Foundation, please visit:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li><a href="https://www.sanskritfromhome.org" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>www.sanskritfromhome.org <ExternalLink size={12} style={{ display: 'inline' }} /></a></li>
                <li><a href="https://vyoma.org" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>www.vyoma.org <ExternalLink size={12} style={{ display: 'inline' }} /></a></li>
                <li><a href="https://digitalsanskritguru.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>www.digitalsanskritguru.com <ExternalLink size={12} style={{ display: 'inline' }} /></a></li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 2 */}
            <section id="section-2" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>2.</span> What Kind of Information Do We Collect (Collectively &ldquo;Data&rdquo;)?
              </h2>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff8c53', margin: '20px 0 10px' }}>
                A. Personal Information / Personal Data
              </h3>
              <p style={{ marginBottom: '12px' }}>
                While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you (<strong>&ldquo;Personal Information&rdquo; / &ldquo;Personal Data&rdquo;</strong>). Personal Data may include:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>Email address</li>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>First name and last name</li>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>Sex / Gender</li>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>Phone / Mobile number</li>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>Date of birth</li>
                <li style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px' }}>Address, State, Postal Code, Country</li>
              </ul>
              <p style={{ marginBottom: '14px' }}>
                We may use your Personal Information to contact you with educational updates, newsletters, and course materials. You may opt out of receiving any of these communications by following the unsubscribe link or by emailing us at <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8' }}>support@vyomalabs.in</a>.
              </p>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff8c53', margin: '20px 0 10px' }}>
                B. Usage Data
              </h3>
              <p style={{ marginBottom: '14px' }}>
                We also collect information that your browser sends whenever you visit our Website or access the Service via mobile devices (<strong>&ldquo;Usage Data&rdquo;</strong>). This may include your IP address, browser type and version, the specific courses or shlokas visited, time and date of visits, time spent on pages, unique device identifiers, and diagnostic telemetry.
              </p>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff8c53', margin: '20px 0 10px' }}>
                C. Location Data
              </h3>
              <p style={{ marginBottom: '14px' }}>
                We may use and store coarse location information (country/state level derived from IP) to provide localized pricing (e.g. INR UPI vs. International USD card billing) and customize our service delivery.
              </p>

              <h3 id="cookies" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff8c53', margin: '20px 0 10px' }}>
                D. Cookies Data
              </h3>
              <p style={{ marginBottom: '14px' }}>
                Cookies are small text files stored on your device to recognize repeat visitors, facilitate session authentication, and preserve user preferences:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li><strong>Session Cookies:</strong> Utilized to maintain secure login sessions and course playback status.</li>
                <li><strong>Preference Cookies:</strong> Used to remember your playback speed, volume, theme, and language choices.</li>
                <li><strong>Security Cookies:</strong> Deployed for authentication, CSRF mitigation, and cyber-security protection.</li>
                <li><strong>Analytics Cookies:</strong> Utilized in aggregate form to measure platform performance and optimize content delivery.</li>
              </ul>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                You may instruct your browser to refuse all cookies or indicate when a cookie is sent. However, without cookies, authentication and personalized learning dashboards will not function properly.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 3 */}
            <section id="section-3" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>3.</span> How Do We Use the Data?
              </h2>
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', borderLeft: '4px solid #22c55e', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginBottom: '18px', color: '#86efac', fontWeight: 600 }}>
                ✓ We do not for any reason whatsoever share, rent, or sell your Data to any third party or otherwise trade on it.
              </div>
              <p style={{ marginBottom: '14px' }}>
                We process your Personal Data with explicit consent for specific and lawful purposes:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li>To provide, maintain, and personalize our OTT Sanskrit learning service;</li>
                <li>To notify you about critical updates, course additions, and platform enhancements;</li>
                <li>To enable interactive features such as practice quizzes, memorizer flashcards, and shloka audio playback;</li>
                <li>To provide dedicated learner customer support and technical troubleshooting;</li>
                <li>To track your progress across courses, playlists, bookmarks, and favorite content;</li>
                <li>To detect, prevent, and remediate technical glitches, unauthorized access, or abusive behavior;</li>
                <li>To fulfill our obligations arising from subscription contracts, billing, and tax invoice generation;</li>
                <li>To provide you with notices about account status, plan renewals, and certificates of completion;</li>
                <li>For any other purpose with your explicit, informed consent.</li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 4 */}
            <section id="section-4" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>4.</span> For How Long Do We Retain Your Data?
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We retain your Data only for as long as necessary to fulfill the educational purposes set out in this Privacy Policy. We will retain and use your Data to the extent necessary to comply with legal obligations (e.g., maintaining billing records for Indian taxation and GST compliance), resolve disputes, and enforce our legal agreements.
              </p>
              <p style={{ marginBottom: '14px' }}>
                Usage Data and learning history are maintained until you submit an account erasure request or delete your account, except where required by law or for fraud prevention and system security.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 5 */}
            <section id="section-5" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>5.</span> How Do We Secure Your Personal Information?
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We consider the confidentiality and security of your Personal Information to be of the utmost importance. We employ industry-standard physical, technical, and administrative security measures:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 700, marginBottom: '6px' }}>
                    <Lock size={18} /> 256-Bit SSL/TLS Encryption
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#94a3b8' }}>
                    All network traffic in transit between your browser and our servers is secured with TLS 1.3 encryption.
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                    <ShieldCheck size={18} /> Strong Password Hashing
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#94a3b8' }}>
                    User passwords and credentials are cryptographically hashed using salted bcrypt / SHA protocols.
                  </p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff8c53', fontWeight: 700, marginBottom: '6px' }}>
                    <Database size={18} /> Role-Based Access Controls
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#94a3b8' }}>
                    Only strictly authorized personnel have compartmentalized administrative access for platform operations.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                While we employ rigorous, commercially reasonable technical protections, please note that no electronic transmission or digital storage method is 100% impenetrable. Never share your password with third parties.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 6 */}
            <section id="section-6" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>6.</span> Data Sharing and Transfer of Data
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Your information may be processed on secure cloud servers located in India and distributed content delivery networks (CDNs). Vyoma Labs takes all steps reasonably necessary to ensure your data is treated securely with adequate contractual safeguards.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 7 */}
            <section id="section-7" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>7.</span> Your Rights as a Data Principal (DPDP Act, 2023)
              </h2>
              <p style={{ marginBottom: '14px' }}>
                In accordance with the <strong>Digital Personal Data Protection Act, 2023</strong>, you enjoy statutory rights as a Data Principal:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#ff8c53' }}>1. Right to Access:</strong> You may request a summary of the Personal Data processed by us.
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#ff8c53' }}>2. Right to Correction &amp; Erasure:</strong> You can rectify inaccurate info or request permanent deletion of your profile.
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#ff8c53' }}>3. Right of Grievance Redressal:</strong> Dedicated officer readily available to remediate any data dispute.
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#ff8c53' }}>4. Right to Nominate:</strong> You may nominate a representative in the unfortunate event of death or incapacity.
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <strong style={{ color: '#ff8c53' }}>5. Right to Withdraw Consent:</strong> You may revoke consent at any time for non-essential communications.
                </div>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 8 & 9 */}
            <section id="section-8" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>8.</span> How Can You Exercise Your Rights?
              </h2>
              <p style={{ marginBottom: '14px' }}>
                To exercise your statutory rights as a Data Principal, submit a written communication to our Data Protection Officer at <a href="mailto:venkat.s@vyomalabs.in" style={{ color: '#38bdf8' }}>venkat.s@vyomalabs.in</a> or our general support portal at <a href="mailto:support@vyomalabs.in" style={{ color: '#38bdf8' }}>support@vyomalabs.in</a>. For verification purposes, we may ask you to authenticate your account ownership before processing erasure or modification requests.
              </p>
            </section>

            <section id="section-9" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>9.</span> Duties as a Data Principal
              </h2>
              <p style={{ marginBottom: '14px' }}>
                In accordance with the DPDP Act, 2023, every Data Principal holds the following responsibilities:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li>To comply with all applicable legal provisions when exercising rights;</li>
                <li>Not to impersonate another person or misrepresent legal identity;</li>
                <li>Not to suppress any material information during registration;</li>
                <li>Not to file false, malicious, or frivolous grievances;</li>
                <li>To furnish only verifiably authentic documentation when requesting corrections or erasure.</li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 10 & 11 */}
            <section id="section-10" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>10.</span> Third-Party Service Providers
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We employ reputable third-party companies and service providers strictly to facilitate our learning platform, host video content, process payments securely, and analyze telemetry. These partners have access to minimal necessary data solely for designated technical operations and are bound by strict non-disclosure obligations.
              </p>
            </section>

            <section id="section-11" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>11.</span> Analytics &amp; Remarketing
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We use privacy-compliant telemetry services to monitor aggregate application health and traffic:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
                <li><strong>Google Analytics:</strong> Analyzes visitor volume and browser technology in aggregate. Review Google privacy policies at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>policies.google.com/privacy <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
                <li><strong>Cloudflare Analytics:</strong> Protects against DDoS attacks and measures edge latency. Review their privacy policy at <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>cloudflare.com/privacypolicy <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
              </ul>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 12 & 13 */}
            <section id="section-12" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>12.</span> External Links &amp; Third-Party Sites
              </h2>
              <p style={{ marginBottom: '14px' }}>
                Our platform may contain links to external scholarly, reference, or charitable sites. Vyoma Labs does not control and bears no responsibility for external content or privacy practices. We urge learners to inspect the privacy terms of any third-party domain visited.
              </p>
            </section>

            <section id="section-13" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>13.</span> General Exceptions &amp; Lawful Disclosures
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We may disclose your Personal Information without prior notice strictly if required to do so by applicable Indian law, court subpoenas, or to prevent fraudulent financial transactions, cyber security attacks, or physical threats to any person.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 14 */}
            <section id="section-14" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>14.</span> Children&rsquo;s Privacy (Sanskrit Kids Academy)
              </h2>
              <div style={{ background: 'rgba(242, 100, 34, 0.08)', border: '1px solid rgba(242, 100, 34, 0.25)', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
                <p style={{ margin: 0, color: '#fed7aa', fontSize: '0.95rem' }}>
                  For minor learners accessing the <strong>Sanskrit Kids Academy</strong>, accounts must be created and supervised by a parent or legal guardian. We do not knowingly collect personal tracking data from children under 18 years without parental consent. If you believe your child has inadvertently provided personal information without consent, contact us immediately for immediate erasure.
                </p>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 15 */}
            <section id="section-15" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>15.</span> Changes &amp; Amendments to this Privacy Policy
              </h2>
              <p style={{ marginBottom: '14px' }}>
                We may periodically update our Privacy Policy to incorporate evolving legal statutory requirements and technical improvements. We notify registered users of material revisions via email or notice banners on the platform. All modifications become effective immediately upon publication.
              </p>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 16 */}
            <section id="section-16" className="legal-section" style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>16.</span> Grievance Redressal Mechanism &amp; Officer Contact
              </h2>
              <p style={{ marginBottom: '16px' }}>
                In compliance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, any complaints, concerns, or inquiries regarding personal data processing should be submitted directly to our designated Grievance Redressal Officer:
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
                    Officer Name &amp; Designation
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    Dr. Venkatasubramanian P.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Chief Operating Officer (COO)
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <a href="mailto:venkat.s@vyomalabs.in" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={15} /> venkat.s@vyomalabs.in
                    </a>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff8c53', marginBottom: '4px' }}>
                    Official Foundation Registered Address
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    <strong>Vyoma Linguistic Labs Foundation</strong><br />
                    #155, 2nd Floor, 4th Cross, GKW Layout,<br />
                    Vijayanagar, Bangalore, Karnataka – 560040, India
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                    ⚡ Resolution Commitment: Within 30 days of formal receipt
                  </div>
                </div>
              </div>
            </section>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '30px 0' }} />

            {/* Section 17 */}
            <section id="section-17" className="legal-section">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}>17.</span> Your Acceptance of These Terms
              </h2>
              <p style={{ marginBottom: '14px' }}>
                By accessing and using this Site or subscribing to any Vyoma service, you signify your full agreement to this Privacy Policy and the accompanying <Link href="/terms-and-conditions" style={{ color: '#ff8c53', textDecoration: 'underline' }}>Terms & Conditions</Link>. If you do not agree with this Privacy Policy, please discontinue using the platform.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
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
                  <Scale size={18} /> View Terms &amp; Conditions
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
                  <FileText size={18} /> View Refund &amp; Cancellation Policy
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
