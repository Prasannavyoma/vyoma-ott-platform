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
          <p style={{ fontSize: '1.2rem', color: '#ccc' }}>
            Everything you need to know to get started with the new platform.
          </p>
        </div>
        
        <FAQClient />
        
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '30px', background: 'rgba(255, 215, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: 'var(--primary)' }}>Still need help?</h2>
          <p style={{ color: '#ccc', marginBottom: '20px' }}>Our support team is here to assist you with any questions or issues.</p>
          <a href="mailto:support@vyoma.org" className="btn" style={{ background: 'var(--primary)', color: 'black', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
