'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  PlayCircle, 
  Headphones, 
  Mic, 
  Gamepad2, 
  Award, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  ArrowRight,
  ArrowLeft,
  Monitor,
  GraduationCap,
  Calendar,
  Layers,
  UserCheck,
  Check
} from 'lucide-react';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';

export default function AboutUsPage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const pillars = [
    {
      name: 'Saṁskṛta',
      meaning: 'Knowledge',
      desc: 'The eternal fountainhead of linguistic precision, philosophical inquiry, and spiritual depth.',
      color: '#f26422',
      icon: '📖'
    },
    {
      name: 'Saṁskṛti',
      meaning: 'Culture',
      desc: 'Living traditions, customs, rituals, and artistic expressions preserved unbroken across millennia.',
      color: '#38bdf8',
      icon: '🏛️'
    },
    {
      name: 'Saṁskāra',
      meaning: 'Values',
      desc: 'Moral grounding and ethical principles that refine the intellect and shape meaningful character.',
      color: '#46d369',
      icon: '💎'
    }
  ];

  const learningModes = [
    { title: 'Self-Paced Study', icon: Monitor, desc: 'Learn comfortably at your own schedule with modular video lessons and structured exercises.' },
    { title: 'Live Webinars', icon: Calendar, desc: 'Real-time interactive discourse led by master traditional scholars and modern pedagogues.' },
    { title: 'Blended Learning', icon: Layers, desc: 'Carefully harmonized pre-recorded curriculum paired with periodic expert guidance.' },
    { title: '1-on-1 Sessions', icon: UserCheck, desc: 'Intensive personalized mentoring specifically tuned to individual learning trajectories.' },
    { title: 'Private Batches', icon: Users, desc: 'Targeted cohort group learning fostering peer discussion and shared spiritual focus.' },
    { title: 'Learning Programs', icon: GraduationCap, desc: 'Curricular thematic programs featuring structured assessments and recognized certification.' }
  ];

  const personas = [
    { label: 'Kids', icon: '🧒' },
    { label: 'College Students', icon: '🎓' },
    { label: 'Homemakers', icon: '🏡' },
    { label: 'Working Professionals', icon: '💼' },
    { label: 'Senior Citizens', icon: '🧓' },
    { label: 'Specially-Abled Children', icon: '🌟' },
    { label: 'Spiritual Seekers', icon: '🧘' }
  ];

  const mediaSpectrum = [
    { title: 'E-books', icon: BookOpen, desc: 'Digital editions of shastras and commentaries', color: '#10b981', href: '/genre/E-books' },
    { title: 'Audiobooks', icon: Headphones, desc: 'Immersive recitations with expert explanations', color: '#a855f7', href: '/genre/Audiobook' },
    { title: 'Videos', icon: PlayCircle, desc: 'Cinematic and lecture series from top vidwans', color: '#f26422', href: '/genre/video' },
    { title: 'Podcasts', icon: Mic, desc: 'Insightful discussions, stotras, and daily inspiration', color: '#38bdf8', href: '/genre/Podcast' },
    { title: 'Sanskrit Games', icon: Gamepad2, desc: 'Gamified learning making grammar joyful', color: '#eab308', href: '/genre/Game' }
  ];

  return (
    <>
      <NavBar />
      <main style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(ellipse at top, #141b2d 0%, #080b12 70%)', 
        color: '#fff',
        paddingTop: '140px',
        paddingBottom: '80px'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Back to Home Button */}
          <div style={{ marginBottom: '25px' }}>
            <Link 
              href="/" 
              className="back-btn-pill"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '10px 22px', 
                borderRadius: '30px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                color: '#e2e8f0', 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                textDecoration: 'none', 
                backdropFilter: 'blur(10px)', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.25)' 
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Header Title Section */}
          <div style={{ marginBottom: '35px' }}>
            <h1 style={{ 
              fontSize: 'clamp(2.2rem, 4vw, 3rem)', 
              fontWeight: 800, 
              color: '#fff', 
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              About Us
            </h1>
          </div>

          {/* Cinematic Trailer Video & Poster Showcase */}
          <div style={{ 
            position: 'relative', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(242, 100, 34, 0.15)',
            marginBottom: '65px',
            background: '#090d16'
          }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '45.3%', minHeight: '320px' }}>
              <video
                ref={videoRef}
                src="https://digitalsanskrit.b-cdn.net/Vyoma_Digital_Sanskrit%20v2_Final.mp4"
                poster="https://digitalsanskrit.com/wp-content/uploads/2025/07/final-2.png"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />

              {/* Video Overlay Controls */}
              <div style={{ 
                position: 'absolute', 
                bottom: '20px', 
                right: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute Video" : "Mute Video"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(15, 22, 36, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease'
                  }}
                  className="trailer-control-btn"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause Video" : "Play Video"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '30px',
                    background: 'rgba(242, 100, 34, 0.85)',
                    border: '1px solid rgba(242, 100, 34, 0.4)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(242, 100, 34, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  className="trailer-control-btn"
                >
                  <PlayCircle size={16} />
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: The Story & Roots (Since 2010) */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '24px', 
            padding: '45px 40px', 
            marginBottom: '60px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
          }}>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.9', color: '#e2e8f0', margin: '0 0 24px 0', fontWeight: 400 }}>
              Since 2010, <strong style={{ color: '#fff' }}>Vyoma Linguistic Labs Foundation</strong> (
              <a 
                href="https://vyoma.org/" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--primary, #f26422)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                vyoma.org <ExternalLink size={13} />
              </a>
              ) has been dedicated to preserving and sharing this timeless wisdom through innovative Sanskrit-based digital learning. From interactive games to age-specific learning paths, Vyoma’s offerings are crafted to engage both young minds and mature seekers — delivering what we proudly call the <strong style={{ color: '#f26422' }}>‘Sanskrit Effect’</strong>: immersive, joyful, and transformative learning.
            </p>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '30px', marginTop: '20px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '25px' }}>
                At the heart of Indian life lie <strong style={{ color: '#fff' }}>three eternal pillars</strong>. These threads not only colour our inner lives but also shape a healthier, happier, and more meaningful human experience:
              </p>

              {/* Three Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {pillars.map((pillar, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid rgba(255, 255, 255, 0.06)', 
                      borderRadius: '18px', 
                      padding: '24px',
                      transition: 'all 0.3s ease'
                    }}
                    className="about-feature-card"
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{pillar.icon}</div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: pillar.color }}>
                      {pillar.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '10px' }}>
                      {pillar.meaning}
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: LMS & 6 Learning Modes */}
          <div style={{ marginBottom: '65px' }}>
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, margin: '0 0 12px 0' }}>
                Structured Learning Through 6 Distinct Modes
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
                Through{' '}
                <a 
                  href="https://www.sanskritfromhome.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--primary, #f26422)', textDecoration: 'none', fontWeight: 700 }}
                >
                  www.sanskritfromhome.org
                </a>
                , Vyoma operates a full-fledged Learning Management System (LMS) designed for flexibility and depth:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {learningModes.map((mode, idx) => {
                const Icon = mode.icon;
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '18px',
                      padding: '24px',
                      display: 'flex',
                      gap: '18px',
                      alignItems: 'flex-start',
                      transition: 'all 0.3s ease'
                    }}
                    className="about-feature-card"
                  >
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '12px', 
                      background: 'rgba(242, 100, 34, 0.12)', 
                      border: '1px solid rgba(242, 100, 34, 0.25)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--primary, #f26422)',
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                        {mode.title}
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        {mode.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: 7 Distinct Learner Personas */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.6) 0%, rgba(10, 14, 24, 0.8) 100%)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '24px', 
            padding: '40px', 
            marginBottom: '65px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.25)', 
                color: '#38bdf8', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                <Users size={14} />
                <span>Inclusive Learning for Everyone</span>
              </div>
              <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, margin: '0 0 10px 0', color: '#fff' }}>
                7 Distinct Learner Personas
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '780px', margin: '0 auto', lineHeight: 1.7 }}>
                This flexible approach caters to learners from every walk of life. Pursue <strong style={{ color: '#fff' }}>custom learning paths</strong> tailored to personal aspirations, or follow <strong style={{ color: '#fff' }}>certificate-based thematic programs</strong> with structured assessments:
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {personas.map((persona, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 22px',
                    borderRadius: '30px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  className="persona-pill"
                >
                  <span style={{ fontSize: '1.25rem' }}>{persona.icon}</span>
                  <span>{persona.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: The Digital Sanskrit OTT Platform */}
          <div style={{ marginBottom: '65px' }}>
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                background: 'rgba(242, 100, 34, 0.1)', 
                border: '1px solid rgba(242, 100, 34, 0.25)', 
                color: 'var(--primary, #f26422)', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                <Sparkles size={14} />
                <span>The Latest Innovation</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, margin: '0 0 12px 0' }}>
                Digital Sanskrit OTT Platform
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.7 }}>
                This subscription-based platform brings together the <strong style={{ color: '#fff' }}>entire spectrum of Vyoma’s digital learning resources</strong> in one seamless, cross-device ecosystem. With democratized pricing, cross-device compatibility, and unlimited access to curated knowledge, learners can explore:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {mediaSpectrum.map((media, idx) => {
                const Icon = media.icon;
                return (
                  <Link 
                    key={idx}
                    href={media.href}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '20px',
                      padding: '26px 20px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="about-media-card"
                  >
                    <div style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '50%', 
                      background: `${media.color}18`, 
                      border: `1px solid ${media.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: media.color
                    }}>
                      <Icon size={26} />
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                      {media.title}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                      {media.desc}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div style={{ 
              textAlign: 'center', 
              padding: '24px 30px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '16px', 
              border: '1px dashed rgba(255, 255, 255, 0.09)',
              maxWidth: '850px',
              margin: '0 auto'
            }}>
              <p style={{ fontSize: '1.05rem', color: '#e2e8f0', margin: '0 0 6px 0', fontWeight: 600 }}>
                Anytime, anywhere, on any device — whether at home, commuting, or on a spiritual retreat.
              </p>
              <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                "This isn’t just a platform. It is a gateway to rediscovering yourself through the power of ancient wisdom."
              </p>
            </div>
          </div>

          {/* Section 5: New Content Icons / Content Access Guide */}
          <div style={{ 
            background: 'rgba(15, 22, 36, 0.7)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '24px', 
            padding: '40px', 
            backdropFilter: 'blur(20px)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
            marginBottom: '60px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Sparkles size={22} color="var(--primary, #f26422)" />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                New Content Icons !
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Platinum Tier */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                <img 
                  src="https://digitalsanskrit.com/wp-content/uploads/2025/08/iconplatinum.png" 
                  alt="Platinum Icon" 
                  style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} 
                />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '4px' }}>
                    Platinum
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                    If the content has this icon, it means it is available only for <strong style={{ color: '#fff' }}>Platinum subscribers</strong>.
                  </p>
                </div>
              </div>

              {/* Gold Tier */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                <img 
                  src="https://digitalsanskrit.com/wp-content/uploads/2025/08/G_black.png" 
                  alt="Gold Icon" 
                  style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0, margin: '4px 4px 0 4px' }} 
                />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '4px' }}>
                    Gold
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                    If a content has this icon, it means it is available only for <strong style={{ color: '#fff' }}>Gold subscribers</strong>.
                  </p>
                </div>
              </div>

              {/* Free Tier */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: 'rgba(70, 211, 105, 0.15)', 
                  border: '1px solid rgba(70, 211, 105, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#46d369',
                  flexShrink: 0
                }}>
                  <Check size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#46d369', marginBottom: '4px' }}>
                    Free
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                    If no icon is shown, the content is free for everyone.
                  </p>
                </div>
              </div>

            </div>

            <p style={{ marginTop: '25px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: '20px 0 0' }}>
              Under podcasts and videos, there will be at least one free collection, while other collections may be restricted to Gold or Platinum subscribers as indicated by their respective icons.
            </p>
          </div>

          {/* Call to Action Bar */}
          <div style={{ 
            textAlign: 'center', 
            padding: '50px 30px', 
            background: 'radial-gradient(ellipse at center, rgba(242, 100, 34, 0.15) 0%, rgba(15, 22, 36, 0.4) 70%)',
            borderRadius: '24px', 
            border: '1px solid rgba(242, 100, 34, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '14px', color: '#fff' }}>
              Begin Your Sanskrit Journey Today
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Join thousands of seekers and learners worldwide embracing the transformative wisdom of ancient India.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                href="/explore" 
                className="btn btn-primary premium-glow-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 34px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <span>Explore Catalog</span>
                <ArrowRight size={16} />
              </Link>

              <Link 
                href="/subscribe" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 30px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.25s ease'
                }}
                className="about-secondary-btn"
              >
                <span>View Plans & Tiers</span>
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
