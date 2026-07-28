'use client';

import React, { useState, useRef, useEffect } from 'react';
import { askAiAgent, ChatMessage } from '@/app/actions/ai-agent';
import { getSanskritSettings } from '@/app/actions/sanskrit-settings';
import { Bot, Phone, Flower2 } from 'lucide-react';

interface ContactSettings {
  widgetEnabled: boolean;
  phoneEnabled: boolean;
  phoneNumber: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  emailEnabled: boolean;
  emailAddress: string;
}

export default function AiChatWidget({ contactSettings, aiEnabled = true }: { contactSettings?: ContactSettings, aiEnabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'contact' | 'sanskrit'>(aiEnabled ? 'chat' : 'contact');
  const [sanskritConfig, setSanskritConfig] = useState<{
    hubEnabled: boolean;
    subhashitaEnabled: boolean;
    grammarEnabled: boolean;
    memorizerEnabled: boolean;
    coachEnabled: boolean;
    coachThreshold: number;
    sanskritGeminiKey: string;
  } | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  // Load Sanskrit configurations and user preference on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getSanskritSettings();
        setSanskritConfig(data);
      } catch (e) {
        console.error("Failed to load Sanskrit settings in chatbot", e);
      }
    }
    loadConfig();

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyoma_show_subhashita') !== 'false';
      setShowBanner(saved);
    }
  }, []);

  const handleToggleBanner = (val: boolean) => {
    setShowBanner(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vyoma_show_subhashita', val ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('vyoma_toggle_subhashita', { detail: val }));
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Namaste! 🙏 I am **Vyoma AI Bot**, your guide for the Vyoma Sanskrit OTT platform.\n\nAsk me about our Sanskrit courses, subscription plans, earnable certificates, rewards coins, study rooms, or how to navigate the site!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent) return;

    if (!textToSend) {
      setInput('');
    }

    // Add user message to state
    const userMsg: ChatMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Send message to server action with context history
      // Keep only last 10 messages for token context efficiency
      const historyContext = messages.slice(-10);
      const reply = await askAiAgent(messageContent, historyContext);
      
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: 'I failed to reach the server. Please verify your internet connection and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const suggestions = [
    { label: '📚 List Courses', text: 'What Sanskrit courses do you have?' },
    { label: '🔑 Subscriptions', text: 'How do subscription tiers work and what are the prices?' },
    { label: '🏆 Certificates', text: 'How can I pass quizzes and get certificates?' },
    { label: '🪙 Sanskrit Coins', text: 'How do I earn Sanskrit Coins?' }
  ];

  // Helper to parse markdown-like bold/pills/links
  const renderMessageContent = (text: string) => {
    // Process bullet lists
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      
      // Parse markdown links [Label](URL)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <a 
            key={match.index} 
            href={match[2]} 
            style={{ color: '#ff8c00', textDecoration: 'underline', fontWeight: 600 }}
          >
            {match[1]}
          </a>
        );
        lastIndex = linkRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      // Check if it's a bullet point
      const isBullet = content.trim().startsWith('- ');
      const cleanText = isBullet ? content.replace(/^\s*-\s+/, '') : content;

      // Bold processing (**text**)
      const renderTextWithBolds = (txt: React.ReactNode): React.ReactNode => {
        if (typeof txt !== 'string') return txt;
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const boldParts = [];
        let bLastIdx = 0;
        let bMatch;
        while ((bMatch = boldRegex.exec(txt)) !== null) {
          if (bMatch.index > bLastIdx) {
            boldParts.push(txt.substring(bLastIdx, bMatch.index));
          }
          boldParts.push(<strong key={bMatch.index} style={{ fontWeight: 700, color: '#fff' }}>{bMatch[1]}</strong>);
          bLastIdx = boldRegex.lastIndex;
        }
        if (bLastIdx < txt.length) {
          boldParts.push(txt.substring(bLastIdx));
        }
        return boldParts.length > 0 ? boldParts : txt;
      };

      const finalContent = parts.length > 0 
        ? parts.map(p => renderTextWithBolds(p)) 
        : renderTextWithBolds(cleanText);

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: '15px', marginBottom: '6px', listStyleType: 'disc' }}>
            {finalContent}
          </li>
        );
      }

      return (
        <p key={idx} style={{ margin: '0 0 10px 0', lineHeight: 1.5 }}>
          {finalContent}
        </p>
      );
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
      
      {/* Expanding Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: 0,
          width: '380px',
          height: '520px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 40px rgba(242, 100, 34, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'vyomaChatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.2) 0%, rgba(255, 140, 0, 0.05) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(242, 100, 34, 0.3)' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '10px',
                  height: '10px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '2px solid rgba(15, 23, 42, 1)',
                  boxShadow: '0 0 8px #10b981'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.5px' }}>Vyoma AI Bot</h4>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>Online Guide</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#94a3b8',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>✕</span>
            </button>
          </div>

          {/* Tab Switcher (Visible if contact settings are enabled or Sanskrit Hub is enabled) */}
          {((contactSettings && contactSettings.widgetEnabled && (contactSettings.phoneEnabled || contactSettings.whatsappEnabled || contactSettings.emailEnabled)) || (sanskritConfig && sanskritConfig.hubEnabled)) && (
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.15)',
            }}>
              {aiEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'chat' ? '2.5px solid #f26422' : '2.5px solid transparent',
                    color: activeTab === 'chat' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Bot size={16} /> Chat
                </button>
              )}
              
              {contactSettings && contactSettings.widgetEnabled && (contactSettings.phoneEnabled || contactSettings.whatsappEnabled || contactSettings.emailEnabled) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'contact' ? '2.5px solid #f26422' : '2.5px solid transparent',
                    color: activeTab === 'contact' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  <Phone size={16} /> Contact
                </button>
              )}

              {sanskritConfig && sanskritConfig.hubEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab('sanskrit')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'sanskrit' ? '2.5px solid #f26422' : '2.5px solid transparent',
                    color: activeTab === 'sanskrit' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  <Flower2 size={16} /> Practice
                </button>
              )}
            </div>
          )}

          {/* Chat Tab View */}
          {activeTab === 'chat' ? (
            <>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            className="vyoma-chat-messages"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #f26422 0%, #d84b0b 100%)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  color: msg.role === 'user' ? '#fff' : 'rgba(255, 255, 255, 0.95)',
                  fontSize: '0.88rem',
                  boxShadow: msg.role === 'user' 
                    ? '0 4px 15px rgba(242, 100, 34, 0.2)' 
                    : '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <div style={{
                  padding: '14px 20px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#f26422', borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out' }}></div>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#f26422', borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out 0.2s' }}></div>
                  <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#f26422', borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out 0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions chips */}
          <div style={{
            padding: '10px 16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.2)',
          }} className="vyoma-suggestion-scroll">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug.text)}
                disabled={isLoading}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(242, 100, 34, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(242, 100, 34, 0.3)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(10, 15, 30, 0.9)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              placeholder="Ask Vyoma AI Bot..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '10px 16px',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#f26422'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: input.trim() ? '#f26422' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: input.trim() ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: input.trim() ? '0 4px 12px rgba(242, 100, 34, 0.3)' : 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </>
      ) : activeTab === 'contact' ? (
        /* Contact Tab View */
            <div style={{
              flex: 1,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
            }} className="vyoma-chat-messages">
              <div style={{ marginBottom: '6px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Connect with Support</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.4 }}>
                  Need direct human assistance? Get in touch with our team via any of these channels.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contactSettings?.phoneEnabled && (
                  <a
                    href={`tel:${contactSettings.phoneNumber}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.2s',
                    }}
                    className="vyoma-contact-option-btn"
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                      flexShrink: 0
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.01-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Call Support</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{contactSettings.phoneNumber}</div>
                    </div>
                  </a>
                )}

                {contactSettings?.whatsappEnabled && (
                  <a
                    href={`https://wa.me/${contactSettings.whatsappNumber.replace(/\+/g, '').trim()}?text=${encodeURIComponent(contactSettings.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.2s',
                    }}
                    className="vyoma-contact-option-btn"
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.475 1.332 4.989L2 22l5.141-1.349a9.92 9.92 0 004.87 1.28c5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.059 14.156c-.247.696-1.203 1.272-1.657 1.346-.419.068-.962.115-2.822-.615-2.378-.934-3.909-3.344-4.028-3.502-.119-.158-.968-1.286-.968-2.453 0-1.168.614-1.741.832-1.979.217-.238.475-.297.633-.297.158 0 .317.001.455.008.143.007.337-.054.524.396.198.485.673 1.643.732 1.762.059.119.099.257.02.416-.079.158-.119.257-.238.396-.119.139-.247.309-.356.416-.119.119-.244.248-.105.485.139.238.619 1.018 1.327 1.647.91.812 1.674 1.064 1.912 1.182.238.119.376.099.455-.02.079-.119.337-.396.426-.534.09-.139.178-.119.297-.079.119.04.752.356.88.421.129.065.218.099.247.148.03.05.03.287-.069.983z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>WhatsApp Chat</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{contactSettings?.whatsappNumber}</div>
                    </div>
                  </a>
                )}

                {contactSettings?.emailEnabled && (
                  <a
                    href={`mailto:${contactSettings.emailAddress}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.2s',
                    }}
                    className="vyoma-contact-option-btn"
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)',
                      flexShrink: 0
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Send Email</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{contactSettings.emailAddress}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          ) : activeTab === 'sanskrit' ? (
            /* Sanskrit Hub Tab View */
            <div style={{
              flex: 1,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
            }} className="vyoma-chat-messages">
              <div style={{ marginBottom: '6px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Sanskrit Practice Hub</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.4 }}>
                  Enhance your learning with interactive tools and widgets.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Daily Subhashita Toggle preference */}
                {sanskritConfig?.subhashitaEnabled && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>Daily Subhashita Banner</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Show banner on homepage</div>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={showBanner}
                        onChange={(e) => handleToggleBanner(e.target.checked)}
                        style={{ opacity: 0, width: '40px', height: '22px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                      />
                      <div style={{
                        width: '40px', height: '22px',
                        background: showBanner ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '11px', transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '14px', height: '14px', background: '#fff', borderRadius: '50%',
                          position: 'absolute', top: '4px', left: showBanner ? '22px' : '4px',
                          transition: 'all 0.3s'
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Grammar Analyzer */}
                {sanskritConfig?.grammarEnabled && (
                  <a
                    href="/tools/grammar-analyzer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.2s',
                    }}
                    className="vyoma-contact-option-btn"
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(242, 100, 34, 0.2)',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>🔌</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Grammar & Sandhi Analyzer</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>Analyze case endings & split compounds</div>
                    </div>
                  </a>
                )}

                {/* Shloka Memorizer */}
                {sanskritConfig?.memorizerEnabled && (
                  <a
                    href="/tools/shloka-memorizer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.2s',
                    }}
                    className="vyoma-contact-option-btn"
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(56, 189, 248, 0.2)',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>🎮</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Shloka Memorizer Game</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>Interactive shuffled word puzzle game</div>
                    </div>
                  </a>
                )}

              </div>            </div>
          ) : null}

        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: '0 8px 25px rgba(242, 100, 34, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(242, 100, 34, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(242, 100, 34, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)';
        }}
      >
        {isOpen ? '✕' : (
          <Bot size={32} color="#ffffff" className="bot-avatar" />
        )}
      </button>

      {/* Embed Keyframe Animations & Style Overrides */}
      <style jsx global>{`
        @keyframes botFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.05); }
        }
        .bot-avatar {
          animation: botFloat 3s ease-in-out infinite;
          
        }
        @keyframes vyomaChatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        .vyoma-chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .vyoma-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .vyoma-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .vyoma-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .vyoma-suggestion-scroll::-webkit-scrollbar {
          height: 0px;
        }
        .vyoma-contact-option-btn {
          transition: background 0.2s, border-color 0.2s, transform 0.2s !important;
        }
        .vyoma-contact-option-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-2px) !important;
        }
      `}</style>

    </div>
  );
}
