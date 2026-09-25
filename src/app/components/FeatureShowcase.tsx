"use client";

import { Tv, DownloadCloud, Globe, Laptop, Smartphone, Tablet, Cast, Gamepad2, Sparkles, CheckCircle, Wifi } from 'lucide-react';

export default function FeatureShowcase() {
  const features = [
    {
      id: 'tv',
      title: 'Enjoy on your TV',
      description: 'Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.',
      icon: <Tv size={36} color="var(--primary)" />,
      badge: 'SMART TV & CASTING',
      gradient: 'linear-gradient(135deg, rgba(242, 100, 34, 0.15) 0%, rgba(10, 14, 23, 0.9) 100%)',
      borderColor: 'rgba(242, 100, 34, 0.3)',
      deviceIcons: [<Tv key="1" size={20} />, <Cast key="2" size={20} />, <Gamepad2 key="3" size={20} />]
    },
    {
      id: 'offline',
      title: 'Download your shows to watch offline',
      description: 'Save your favourites easily and always have something to watch.',
      icon: <DownloadCloud size={36} color="#34d399" />,
      badge: 'OFFLINE SYNC & DOWNLOADS',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(10, 14, 23, 0.9) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      deviceIcons: [<Smartphone key="1" size={20} />, <DownloadCloud key="2" size={20} />, <CheckCircle key="3" size={20} />]
    },
    {
      id: 'everywhere',
      title: 'Watch everywhere',
      description: 'Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV',
      icon: <Globe size={36} color="#60a5fa" />,
      badge: 'CROSS-PLATFORM STREAMING',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(10, 14, 23, 0.9) 100%)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      deviceIcons: [<Smartphone key="1" size={20} />, <Tablet key="2" size={20} />, <Laptop key="3" size={20} />, <Tv key="4" size={20} />]
    }
  ];

  return (
    <section style={{ margin: '70px 0', padding: '0 4%' }}>
      <div style={{
        maxWidth: '1350px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(242, 100, 34, 0.12)',
            border: '1px solid rgba(242, 100, 34, 0.3)',
            color: 'var(--primary)',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '15px'
          }}>
            <Sparkles size={14} /> UNLIMITED ENTERTAINMENT &amp; LEARNING
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
            Stream Anywhere, On Any Device
          </h2>
          <p style={{ color: '#aaa', fontSize: '1.1rem', marginTop: '12px', lineHeight: '1.6' }}>
            Experience seamless high-definition video, offline playback, and smart TV integration built for modern audiences.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {features.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.gradient,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: `1px solid ${item.borderColor}`,
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
                cursor: 'pointer'
              }}
              className="feature-showcase-card"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'inline-flex'
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#888',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Supported Device Badges */}
              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#777', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Supported Hardware
                </span>
                <div style={{ display: 'flex', gap: '10px', color: '#ccc' }}>
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
          transform: translateY(-6px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15) !important;
        }
      `}} />
    </section>
  );
}
