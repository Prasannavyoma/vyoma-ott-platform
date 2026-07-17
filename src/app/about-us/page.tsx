import React from 'react';
import Link from 'next/link';
import { Target, Eye } from 'lucide-react';

export const metadata = {
  title: "About Us - Vyoma 2.0",
  description: "Learn about the mission and vision behind Vyoma Sanskrit."
};

export default function AboutUsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Cinematic Hero Section */}
      <section style={{ 
        position: 'relative', 
        height: '60vh',
        minHeight: '400px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: `linear-gradient(to bottom, rgba(0,0,0,0.3), var(--background)), url('/assets/Ayodhyakanda.jpg') center/cover no-repeat`
      }}>
        <div style={{ textAlign: 'center', zIndex: 1, padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '15px', color: '#fff', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            Reviving the Language of the Gods
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#e0e0e0', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            Welcome to the new era of Sanskrit education. At Vyoma, our mission is to make the ancient wisdom of Sanskrit accessible, engaging, and transformational for the modern world.
          </p>
        </div>
      </section>

      {/* Mission & Vision Layout */}
      <section style={{ padding: '80px 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          {/* Card 1 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '24px', 
            padding: '40px',
            transition: 'transform 0.3s' 
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}><Target size={48} /></div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '15px', color: '#fff' }}>Our Mission</h2>
            <p style={{ color: '#aaa', lineHeight: '1.8', fontSize: '1.05rem' }}>
              To curate and distribute high-quality, structured Sanskrit education across the globe. We aim to break down language barriers and bring the profound literary, philosophical, and scientific heritage of India to your fingertips.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '24px', 
            padding: '40px',
            transition: 'transform 0.3s' 
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👁️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '15px', color: '#fff' }}>Our Vision</h2>
            <p style={{ color: '#aaa', lineHeight: '1.8', fontSize: '1.05rem' }}>
              A world where the timeless values and wisdom embedded in Sanskrit literature are lived and experienced globally, fostering a deeply connected, ethically grounded, and intellectually vibrant society.
            </p>
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section style={{ padding: '60px 5% 100px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '30px', color: '#fff' }}>The OTT 2.0 Revolution</h2>
          <p style={{ color: '#bbb', fontSize: '1.15rem', lineHeight: '1.9', marginBottom: '20px' }}>
            What started as a simple passion project on WordPress has evolved into a fully-fledged, cinematic learning experience. The Vyoma 2.0 platform was rebuilt from the ground up to provide a seamless, high-performance, and deeply interactive environment for our students.
          </p>
          <p style={{ color: '#bbb', fontSize: '1.15rem', lineHeight: '1.9', marginBottom: '40px' }}>
            With interactive study notes, real-time course progress tracking, gamified learning, and a massive library of audiobooks, podcasts, and video courses, we are setting a new standard for how ancient knowledge is consumed in the digital age.
          </p>
          <Link href="/explore" className="btn btn-primary premium-glow-btn" style={{ fontSize: '1.1rem', padding: '16px 40px', borderRadius: '30px', textDecoration: 'none' }}>
            Explore Our Catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
