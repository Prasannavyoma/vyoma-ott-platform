"use client";

import { Tv, DownloadCloud, Globe, Laptop, Smartphone, Tablet, Cast, Gamepad2, Sparkles, CheckCircle } from 'lucide-react';

export default function FeatureShowcase() {
  const features = [
    {
      id: 'tv',
      title: 'Enjoy on your TV',
      description: 'Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.',
      icon: <Tv size={26} color="var(--primary)" />,
      badge: 'SMART TV & CASTING',
      gradient: 'linear-gradient(135deg, rgba(242, 100, 34, 0.12) 0%, rgba(10, 14, 23, 0.85) 100%)',
      borderColor: 'rgba(242, 100, 34, 0.25)',
      deviceIcons: [<Tv key="1" size={16} />, <Cast key="2" size={16} />, <Gamepad2 key="3" size={16} />]
    },
    {
      id: 'offline',
      title: 'Download your shows to watch offline',
      description: 'Save your favourites easily and always have something to watch.',
      icon: <DownloadCloud size={26} color="#34d399" />,
      badge: 'OFFLINE SYNC & DOWNLOADS',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(10, 14, 23, 0.85) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      deviceIcons: [<Smartphone key="1" size={16} />, <DownloadCloud key="2" size={16} />, <CheckCircle key="3" size={16} />]
    },
    {
      id: 'everywhere',
      title: 'Watch everywhere',
      description: 'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV',
      icon: <Globe size={26} color="#60a5fa" />,
      badge: 'CROSS-PLATFORM STREAMING',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(10, 14, 23, 0.85) 100%)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      deviceIcons: [<Smartphone key="1" size={16} />, <Tablet key="2" size={16} />, <Laptop key="3" size={16} />, <Tv key="4" size={16} />]
    }
  ];

  return (
    <section style={{ margin: '40px 0', padding: '0 4%' }}>
      <div style={{
        maxWidth: '1250px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(242, 100, 34, 0.1)',
            border: '1px solid rgba(242, 100, 34, 0.25)',
            color: 'var(--primary)',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            <Sparkles size={12} /> UNLIMITED ENTERTAINMENT &amp; LEARNING
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Stream Anywhere, On Any Device
          </h2>
          <p style={{ color: '#aaa', fontSize: '0.95rem', marginTop: '8px', lineHeight: '1.5' }}>
            Experience seamless high-definition video, offline playback, and smart TV integration built for modern audiences.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {features.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.gradient,
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                border: `1px solid ${item.borderColor}`,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              className="feature-showcase-card"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'inline-flex'
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: '#888',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.3, marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Supported Device Badges */}
              <div style={{
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Supported Hardware
                </span>
                <div style={{ display: 'flex', gap: '8px', color: '#bbb' }}>
                  {item.deviceIcons.map((ic, i) => (
                    <span key={i} style={{ opacity: 0.8 }}>{ic}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .feature-showcase-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .feature-showcase-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }
      `}} />
    </section>
  );
}
