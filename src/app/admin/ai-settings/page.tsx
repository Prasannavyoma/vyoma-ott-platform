'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAiSettings, 
  updateAiSettings, 
  getAiFaqs, 
  createAiFaq, 
  updateAiFaq, 
  deleteAiFaq,
  getContactSettings,
  updateContactSettings
} from '@/app/actions/ai-settings';
import Link from 'next/link';

interface AiFaqType {
  id: string;
  question: string;
  answer: string;
}

export default function AiSettingsPage() {
  // Core AI Config State
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [customDirective, setCustomDirective] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [chatbotMode, setChatbotMode] = useState('BUILTIN');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customEmbedCode, setCustomEmbedCode] = useState('');
  
  // Contact Widget Config State
  const [contactWidgetEnabled, setContactWidgetEnabled] = useState(true);
  const [contactPhoneEnabled, setContactPhoneEnabled] = useState(true);
  const [contactPhoneNumber, setContactPhoneNumber] = useState('');
  const [contactWhatsappEnabled, setContactWhatsappEnabled] = useState(true);
  const [contactWhatsappNumber, setContactWhatsappNumber] = useState('');
  const [contactWhatsappMessage, setContactWhatsappMessage] = useState('');
  const [contactEmailEnabled, setContactEmailEnabled] = useState(true);
  const [contactEmailAddress, setContactEmailAddress] = useState('');
  const [isSavingContactConfig, setIsSavingContactConfig] = useState(false);
  const [contactConfigMessage, setContactConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Custom FAQs State
  const [faqs, setFaqs] = useState<AiFaqType[]>([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // General Page States
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingFaq, setIsSavingFaq] = useState(false);
  
  // Feedback Messages
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [faqMessage, setFaqMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadAllData() {
      try {
        const configData = await getAiSettings();
        setEnabled(configData.enabled);
        setApiKey(configData.apiKey);
        setCustomDirective(configData.customDirective);
        setChatbotMode(configData.chatbotMode);
        setCustomApiUrl(configData.customApiUrl);
        setCustomApiKey(configData.customApiKey);
        setCustomEmbedCode(configData.customEmbedCode);

        const contactData = await getContactSettings();
        setContactWidgetEnabled(contactData.widgetEnabled);
        setContactPhoneEnabled(contactData.phoneEnabled);
        setContactPhoneNumber(contactData.phoneNumber);
        setContactWhatsappEnabled(contactData.whatsappEnabled);
        setContactWhatsappNumber(contactData.whatsappNumber);
        setContactWhatsappMessage(contactData.whatsappMessage);
        setContactEmailEnabled(contactData.emailEnabled);
        setContactEmailAddress(contactData.emailAddress);

        const faqsData = await getAiFaqs();
        setFaqs(faqsData);
        
        setIsSuperAdmin(true);
      } catch (err: any) {
        console.error(err);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMessage(null);
    try {
      await updateAiSettings(enabled, apiKey, customDirective, chatbotMode, customApiUrl, customApiKey, customEmbedCode);
      setConfigMessage({ type: 'success', text: 'AI configuration and custom directives successfully saved!' });
    } catch (err: any) {
      console.error(err);
      setConfigMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveContactConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContactConfig(true);
    setContactConfigMessage(null);
    try {
      await updateContactSettings({
        widgetEnabled: contactWidgetEnabled,
        phoneEnabled: contactPhoneEnabled,
        phoneNumber: contactPhoneNumber,
        whatsappEnabled: contactWhatsappEnabled,
        whatsappNumber: contactWhatsappNumber,
        whatsappMessage: contactWhatsappMessage,
        emailEnabled: contactEmailEnabled,
        emailAddress: contactEmailAddress
      });
      setContactConfigMessage({ type: 'success', text: 'Quick Contact Widget settings successfully saved!' });
    } catch (err: any) {
      console.error(err);
      setContactConfigMessage({ type: 'error', text: err.message || 'Failed to update contact settings.' });
    } finally {
      setIsSavingContactConfig(false);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    
    setIsSavingFaq(true);
    setFaqMessage(null);
    try {
      if (editingFaqId) {
        await updateAiFaq(editingFaqId, faqQuestion, faqAnswer);
        setFaqs(prev => prev.map(f => f.id === editingFaqId ? { ...f, question: faqQuestion, answer: faqAnswer } : f));
        setFaqMessage({ type: 'success', text: 'FAQ successfully updated!' });
      } else {
        const newFaq = await createAiFaq(faqQuestion, faqAnswer);
        setFaqs(prev => [newFaq, ...prev]);
        setFaqMessage({ type: 'success', text: 'New FAQ successfully added to knowledge base!' });
      }
      
      // Reset Form fields
      setFaqQuestion('');
      setFaqAnswer('');
      setEditingFaqId(null);
    } catch (err: any) {
      console.error(err);
      setFaqMessage({ type: 'error', text: err.message || 'Failed to save FAQ.' });
    } finally {
      setIsSavingFaq(false);
    }
  };

  const handleEditFaqClick = (faq: AiFaqType) => {
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setEditingFaqId(faq.id);
    setFaqMessage(null);
  };

  const handleCancelEdit = () => {
    setFaqQuestion('');
    setFaqAnswer('');
    setEditingFaqId(null);
    setFaqMessage(null);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ from the chatbot\'s knowledge base?')) return;
    try {
      await deleteAiFaq(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
      setFaqMessage({ type: 'success', text: 'FAQ successfully deleted!' });
    } catch (err: any) {
      console.error(err);
      setFaqMessage({ type: 'error', text: err.message || 'Failed to delete FAQ.' });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(242, 100, 34, 0.1)', borderTopColor: '#f26422', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
          <span>Verifying Authorization & Loading Data...</span>
        </div>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2 style={{ color: '#ef4444', marginTop: '20px', fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: '#94a3b8', margin: '15px 0 30px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          This administrative configuration panel is strictly reserved for **SUPER_ADMIN** roles. General admins and managers are unauthorized to view or modify AI configurations.
        </p>
        <Link href="/admin" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, display: 'inline-block', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          Return to Overview
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'var(--font-geist-sans), sans-serif', color: '#fff' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(242, 100, 34, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(242, 100, 34, 0.2)' }}>
          🤖
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>AI Agent Customization Console</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Super Admin exclusive controls to configure behavior directives and custom knowledge base FAQs.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* Section 1: Core Configuration & Custom Directives */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 25px',
            background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>AI Orchestrator & Directives</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure status, key, and behavior instructions.</span>
          </div>

          <form onSubmit={handleSaveConfig} style={{ padding: '25px' }}>
            {configMessage && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                background: configMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: configMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: configMessage.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600
              }}>
                {configMessage.type === 'success' ? '✅ ' : '⚠️ '} {configMessage.text}
              </div>
            )}

            {/* Toggle Status */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '25px'
            }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }} htmlFor="chatbot-toggle">
                  Enable AI Chatbot Widget
                </label>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px', display: 'block' }}>
                  When enabled, users will see the floating "Vyoma Guru" chatbot in the bottom right corner of all pages.
                </span>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  id="chatbot-toggle"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ opacity: 0, width: '50px', height: '26px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                />
                <div style={{
                  width: '50px', height: '26px',
                  background: enabled ? 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '13px', transition: 'all 0.3s ease',
                  boxShadow: enabled ? '0 0 10px rgba(242, 100, 34, 0.4)' : 'none'
                }}>
                  <div style={{
                    width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                    position: 'absolute', top: '4px', left: enabled ? '28px' : '4px',
                    transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                  }} />
                </div>
              </div>
            </div>

            {/* Chatbot Mode Selector */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                Chatbot Technology / Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setChatbotMode('BUILTIN')}
                  style={{
                    background: chatbotMode === 'BUILTIN' ? 'linear-gradient(135deg, rgba(242, 100, 34, 0.25) 0%, rgba(255, 140, 0, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                    border: chatbotMode === 'BUILTIN' ? '1px solid #f26422' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  <span>Built-in Gemini</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setChatbotMode('CUSTOM_API')}
                  style={{
                    background: chatbotMode === 'CUSTOM_API' ? 'linear-gradient(135deg, rgba(242, 100, 34, 0.25) 0%, rgba(255, 140, 0, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                    border: chatbotMode === 'CUSTOM_API' ? '1px solid #f26422' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🔌</span>
                  <span>Custom Agent API</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatbotMode('CUSTOM_EMBED')}
                  style={{
                    background: chatbotMode === 'CUSTOM_EMBED' ? 'linear-gradient(135deg, rgba(242, 100, 34, 0.25) 0%, rgba(255, 140, 0, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                    border: chatbotMode === 'CUSTOM_EMBED' ? '1px solid #f26422' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📦</span>
                  <span>Custom Embed Script</span>
                </button>
              </div>
            </div>

            {/* Built-in Gemini Form Section */}
            {chatbotMode === 'BUILTIN' && (
              <>
                {/* API Key */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                    Google Gemini API Key
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter Gemini API Key..."
                      style={{
                        width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px', padding: '10px 45px 10px 14px', color: '#fff', fontSize: '0.88rem', outline: 'none',
                        letterSpacing: showKey ? 'normal' : '4px'
                      }}
                      onFocus={e => e.target.style.borderColor = '#f26422'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                      {showKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Custom API Form Section */}
            {chatbotMode === 'CUSTOM_API' && (
              <>
                {/* Custom API URL */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                    Custom Chatbot Webhook / API URL
                  </label>
                  <input
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://your-custom-ai-backend.com/chat"
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '0.88rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>

                {/* Custom API Authorization Key */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                    API Authorization Token / Secret (Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter custom Bearer Token (optional)..."
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '0.88rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
              </>
            )}

            {/* Custom Embed Script Form Section */}
            {chatbotMode === 'CUSTOM_EMBED' && (
              <>
                {/* Custom Embed Code */}
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                    Custom Chatbot Script / HTML Embed Code
                  </label>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
                    Paste third-party script integrations here (e.g., Voiceflow, Chatbase, custom iframe code).
                  </span>
                  <textarea
                    value={customEmbedCode}
                    onChange={(e) => setCustomEmbedCode(e.target.value)}
                    placeholder="<!-- Example: Voiceflow Widget -->&#10;<script type='text/javascript'>&#10;  (function(d, t) { ... })(document, 'script');&#10;</script>"
                    rows={6}
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                      lineHeight: '1.4', fontFamily: 'monospace'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
              </>
            )}

            {/* Custom Directive (Render for BUILTIN and CUSTOM_API modes) */}
            {chatbotMode !== 'CUSTOM_EMBED' && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                  Custom Prompt Directives & Agent Personality
                </label>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>
                  Define specific rules for the AI Agent (e.g. *"Answer Sanskrit inquiries in Devanagari script"*, *"Prioritize promoting the newly launched Bhagavad Gita course"*, or *"Greet users with Harih Om! 🙏"*).
                </span>
                <textarea
                  value={customDirective}
                  onChange={(e) => setCustomDirective(e.target.value)}
                  placeholder="Examples:&#10;- Always start responses with a respectful Sanskrit greeting like 'Harih Om! 🙏'.&#10;- Keep responses polite, structured, and under 3 paragraphs.&#10;- Highly recommend the Gita course (/watch/srimadbhagavadgita_2) if they ask about scripture learning."
                  rows={5}
                  style={{
                    width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '#fff', outline: 'none', resize: 'vertical',
                    lineHeight: '1.5', fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#f26422'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px' }}>
              <button
                type="submit"
                disabled={isSavingConfig}
                style={{
                  background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', color: '#fff', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: isSavingConfig ? 'default' : 'pointer',
                  boxShadow: '0 4px 15px rgba(242, 100, 34, 0.25)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {isSavingConfig ? 'Saving Configurations...' : 'Save AI Configurations'}
              </button>
            </div>
          </form>
        </div>

        {/* Section: Quick Contact Widget Configurations */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 25px',
            background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Quick Contact Widget Configurations</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure public communication toggles, phone numbers, and support email.</span>
          </div>

          <form onSubmit={handleSaveContactConfig} style={{ padding: '25px' }}>
            {contactConfigMessage && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                background: contactConfigMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: contactConfigMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: contactConfigMessage.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600
              }}>
                {contactConfigMessage.type === 'success' ? '✅ ' : '⚠️ '} {contactConfigMessage.text}
              </div>
            )}

            {/* Master Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '25px'
            }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }} htmlFor="contact-master-toggle">
                  Enable Quick Contact Widget
                </label>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px', display: 'block' }}>
                  When enabled, users will see the floating support dialer stack on the right side of the screen.
                </span>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input
                  id="contact-master-toggle"
                  type="checkbox"
                  checked={contactWidgetEnabled}
                  onChange={(e) => setContactWidgetEnabled(e.target.checked)}
                  style={{ opacity: 0, width: '50px', height: '26px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                />
                <div style={{
                  width: '50px', height: '26px',
                  background: contactWidgetEnabled ? 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '13px', transition: 'all 0.3s ease',
                  boxShadow: contactWidgetEnabled ? '0 0 10px rgba(242, 100, 34, 0.4)' : 'none'
                }}>
                  <div style={{
                    width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                    position: 'absolute', top: '4px', left: contactWidgetEnabled ? '28px' : '4px',
                    transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                  }} />
                </div>
              </div>
            </div>

            {/* Individual Channels toggles and fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px', opacity: contactWidgetEnabled ? 1 : 0.5, pointerEvents: contactWidgetEnabled ? 'auto' : 'none', transition: 'all 0.2s' }}>
              
              {/* Phone Channel */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📞</span>
                    <label style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Phone Call (tel:)</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={contactPhoneEnabled}
                      onChange={(e) => setContactPhoneEnabled(e.target.checked)}
                      style={{ opacity: 0, width: '40px', height: '22px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                    />
                    <div style={{
                      width: '40px', height: '22px',
                      background: contactPhoneEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '11px', transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: '14px', height: '14px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '4px', left: contactPhoneEnabled ? '22px' : '4px',
                        transition: 'all 0.3s'
                      }} />
                    </div>
                  </div>
                </div>
                {contactPhoneEnabled && (
                  <input
                    type="text"
                    value={contactPhoneNumber}
                    onChange={(e) => setContactPhoneNumber(e.target.value)}
                    placeholder="e.g., +919876543210"
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                )}
              </div>

              {/* WhatsApp Channel */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💬</span>
                    <label style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>WhatsApp Message (wa.me)</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={contactWhatsappEnabled}
                      onChange={(e) => setContactWhatsappEnabled(e.target.checked)}
                      style={{ opacity: 0, width: '40px', height: '22px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                    />
                    <div style={{
                      width: '40px', height: '22px',
                      background: contactWhatsappEnabled ? '#25d366' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '11px', transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: '14px', height: '14px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '4px', left: contactWhatsappEnabled ? '22px' : '4px',
                        transition: 'all 0.3s'
                      }} />
                    </div>
                  </div>
                </div>
                {contactWhatsappEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      value={contactWhatsappNumber}
                      onChange={(e) => setContactWhatsappNumber(e.target.value)}
                      placeholder="WhatsApp Phone Number (e.g., +919876543210)"
                      style={{
                        width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = '#f26422'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    />
                    <input
                      type="text"
                      value={contactWhatsappMessage}
                      onChange={(e) => setContactWhatsappMessage(e.target.value)}
                      placeholder="Pre-filled template message..."
                      style={{
                        width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = '#f26422'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                    />
                  </div>
                )}
              </div>

              {/* Email Channel */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>✉️</span>
                    <label style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Email Support (mailto:)</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={contactEmailEnabled}
                      onChange={(e) => setContactEmailEnabled(e.target.checked)}
                      style={{ opacity: 0, width: '40px', height: '22px', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                    />
                    <div style={{
                      width: '40px', height: '22px',
                      background: contactEmailEnabled ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '11px', transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: '14px', height: '14px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '4px', left: contactEmailEnabled ? '22px' : '4px',
                        transition: 'all 0.3s'
                      }} />
                    </div>
                  </div>
                </div>
                {contactEmailEnabled && (
                  <input
                    type="email"
                    value={contactEmailAddress}
                    onChange={(e) => setContactEmailAddress(e.target.value)}
                    placeholder="Support Email Address (e.g., support@vyomasanskrit.in)"
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px' }}>
              <button
                type="submit"
                disabled={isSavingContactConfig}
                style={{
                  background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', color: '#fff', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: isSavingContactConfig ? 'default' : 'pointer',
                  boxShadow: '0 4px 15px rgba(242, 100, 34, 0.25)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {isSavingContactConfig ? 'Saving Configurations...' : 'Save Contact Configurations'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Custom FAQ Manager */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 25px',
            background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.08) 0%, rgba(0, 0, 0, 0) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Custom FAQ Manager</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Provide custom question & answer pairs to acts as the chatbot's knowledge base.</span>
          </div>

          <div style={{ padding: '25px' }}>
            {faqMessage && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
                background: faqMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: faqMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: faqMessage.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600
              }}>
                {faqMessage.type === 'success' ? '✅ ' : '⚠️ '} {faqMessage.text}
              </div>
            )}

            {/* Add / Edit FAQ Form */}
            <form onSubmit={handleSaveFaq} style={{
              background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '16px', padding: '20px', marginBottom: '30px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', fontWeight: 700, color: editingFaqId ? '#ff8c00' : '#fff' }}>
                {editingFaqId ? '✏️ Edit Knowledge FAQ' : '➕ Add Knowledge FAQ'}
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 600 }}>
                    Question / Keyword Anchor
                  </label>
                  <input
                    type="text"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="e.g., How long do I have access to courses?"
                    required
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 600 }}>
                    Answer Description
                  </label>
                  <textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="e.g., You will get lifetime access to all purchased courses. Subscription courses are active as long as your Gold or Platinum plan is active."
                    required
                    rows={3}
                    style={{
                      width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                      lineHeight: '1.4', fontFamily: 'inherit'
                    }}
                    onFocus={e => e.target.style.borderColor = '#f26422'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {editingFaqId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                      padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingFaq || !faqQuestion.trim() || !faqAnswer.trim()}
                  style={{
                    background: editingFaqId ? 'linear-gradient(135deg, #ff8c00 0%, #f26422 100%)' : 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)',
                    color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                    cursor: (isSavingFaq || !faqQuestion.trim() || !faqAnswer.trim()) ? 'default' : 'pointer',
                    boxShadow: '0 4px 10px rgba(242, 100, 34, 0.2)'
                  }}
                >
                  {isSavingFaq ? 'Saving...' : (editingFaqId ? 'Update FAQ' : 'Add to Knowledge Base')}
                </button>
              </div>
            </form>

            {/* List of Existing FAQs */}
            <div>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', fontWeight: 700 }}>📚 Custom Knowledge Base ({faqs.length} entries)</h4>
              
              {faqs.length === 0 ? (
                <div style={{ padding: '30px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No custom FAQs defined. Add your first question above!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      style={{
                        padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: '6px' }}>Q: {faq.question}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>A: {faq.answer}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleEditFaqClick(faq)}
                          style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', padding: '6px 12px',
                            borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,100,34,0.15)'; e.currentTarget.style.color = '#f26422'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', padding: '6px 12px',
                            borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
