import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import SubmitTestimonialClient from './SubmitTestimonialClient';

export default function SubmitTestimonialPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <NavBar />
      <div style={{ padding: '120px 5% 50px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px' }}>Share Your Vyoma Experience</h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem' }}>We'd love to hear how Vyoma has helped you on your journey to learning Sanskrit!</p>
        </div>
        
        <SubmitTestimonialClient />
      </div>
      <Footer />
    </main>
  );
}
