import NavBar from '../components/NavBar';
import FAQClient from './FAQClient';
import Link from 'next/link';

export const metadata = {
  title: 'FAQ & User Guide | Vyoma OTT',
  description: 'Learn how to use the new Vyoma OTT 2.0 platform, access your courses, and more.',
};

export default function FAQPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <div style={{ padding: '120px 5% 50px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            OTT 2.0 User Guide
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '20px' }}>
            Everything you need to know to get started with the new platform.
          </p>
          <div style={{
            background: 'linear-gradient(90deg, #1a1c29, #ffd70033)',
            padding: '12px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,215,0,0.2)',
            display: 'inline-block'
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>
              🎉 Welcome to the new Vyoma OTT 2.0! Migrating from the old portal? 
              <Link href="/faq" style={{ color: '#ffd700', marginLeft: '10px', fontWeight: 'bold', textDecoration: 'underline' }}>
                Read the guide below
              </Link>
            </p>
          </div>
        </div>
        
        <FAQClient />
        
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '30px', background: 'rgba(255, 215, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: 'var(--primary)' }}>Still need help?</h2>
          <p style={{ color: '#ccc', marginBottom: '20px' }}>Our support team is here to assist you with any questions or issues.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#25D366', color: 'white', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.475 1.332 4.989L2 22l5.141-1.349a9.92 9.92 0 004.87 1.28c5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.059 14.156c-.247.696-1.203 1.272-1.657 1.346-.419.068-.962.115-2.822-.615-2.378-.934-3.909-3.344-4.028-3.502-.119-.158-.968-1.286-.968-2.453 0-1.168.614-1.741.832-1.979.217-.238.475-.297.633-.297.158 0 .317.001.455.008.143.007.337-.054.524.396.198.485.673 1.643.732 1.762.059.119.099.257.02.416-.079.158-.119.257-.238.396-.119.139-.247.309-.356.416-.119.119-.244.248-.105.485.139.238.619 1.018 1.327 1.647.91.812 1.674 1.064 1.912 1.182.238.119.376.099.455-.02.079-.119.337-.396.426-.534.09-.139.178-.119.297-.079.119.04.752.356.88.421.129.065.218.099.247.148.03.05.03.287-.069.983z"/>
              </svg>
              WhatsApp
            </a>
            <a href="tel:+919876543210" className="btn" style={{ background: '#10b981', color: 'white', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.01-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Call Us
            </a>
            <a href="mailto:support@vyoma.org" className="btn" style={{ background: '#3b82f6', color: 'white', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Email
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
