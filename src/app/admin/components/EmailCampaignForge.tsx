"use client";

import { useState } from 'react';

// Define pre-populated templates for high-fidelity campaigns
const CAMPAIGN_TEMPLATES = {
  FESTIVAL_VASANTO: {
    subject: "🌸 Vasantotsava Blessings: Resurge Your Sanskrit Path (Special 40% Off)",
    bannerUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg",
    body: `<p>Vasantotsava (the festival of spring) represents the resurgence of learning, growth, and divine wisdom.</p>
<p>To celebrate this auspicious cycle, we have provisioned a customized Vasantotsava tier upgrade. Expand your horizons with deep audio chants, grammar simplifications, and epic puranic storytelling streams.</p>
<p><strong>Spring Privilege:</strong> Upgrade to our Gold or Platinum Annual tier today to secure your deep 40% spring discount!</p>`,
    ctaText: "🔑 Secure 40% Vasantotsava Upgrade",
    ctaUrl: "/subscribe"
  },
  NEW_STREAM_LAUNCH: {
    subject: "🚀 Hot Release: Extensive 'Grammar Simplified' Curricular Stream is Now Live!",
    bannerUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg",
    body: `<p>We are delighted to release our newest curated stream: <strong>Grammar Simplified</strong>.</p>
<p>Designed specifically for deep seekers, this course guides learners through Panini's structural keys, fundamental sandhi rules, and rich verb conjugates via high-definition video walkthroughs and interactive quizzes.</p>
<p>Activate your course hub today to experience Sanskrit learning like never before!</p>`,
    ctaText: "📺 Start Chanting & Learning",
    ctaUrl: "/"
  },
  WEEKEND_SPRINT: {
    subject: "⚡ Seeker's Challenge: Unlock Your Free Learning Sprint This Weekend!",
    bannerUrl: "https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg",
    body: `<p>Make this weekend count. We are hosting a 48-hour global seeker challenge across all Sanskrit chanting and audio streams.</p>
<p>Spend 60 minutes streaming your selected chanting playlist or completing grammar exercises to unlock exclusive vouchers, rewards, and free study detours.</p>
<p>Enter the portal now to register your weekend target!</p>`,
    ctaText: "🏆 Enter Weekend Challenge",
    ctaUrl: "/profile"
  },
  CUSTOM_NEWSLETTER: {
    subject: "✍️ Vyoma Sanskrit Chronicles - May 2026 Digest",
    bannerUrl: "",
    body: `<p>Greetings Seeker,</p>\n<p>Enter your custom promotional narrative here. Use standard HTML paragraph tags for structure.</p>`,
    ctaText: "Explore More",
    ctaUrl: "/"
  }
};

type TemplateKey = keyof typeof CAMPAIGN_TEMPLATES;

export default function EmailCampaignForge({
  totalUsersCount,
  dispatchEmailCampaign
}: {
  totalUsersCount: number;
  dispatchEmailCampaign: (fd: FormData) => Promise<{ success: boolean; dispatched: number; error?: string }>
}) {
  const [selectedTheme, setSelectedTheme] = useState<TemplateKey>("FESTIVAL_VASANTO");
  const [subject, setSubject] = useState(CAMPAIGN_TEMPLATES.FESTIVAL_VASANTO.subject);
  const [bannerUrl, setBannerUrl] = useState(CAMPAIGN_TEMPLATES.FESTIVAL_VASANTO.bannerUrl);
  const [body, setBody] = useState(CAMPAIGN_TEMPLATES.FESTIVAL_VASANTO.body);
  const [ctaText, setCtaText] = useState(CAMPAIGN_TEMPLATES.FESTIVAL_VASANTO.ctaText);
  const [ctaUrl, setCtaUrl] = useState(CAMPAIGN_TEMPLATES.FESTIVAL_VASANTO.ctaUrl);

  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedTheme(key);
    const tpl = CAMPAIGN_TEMPLATES[key];
    setSubject(tpl.subject);
    setBannerUrl(tpl.bannerUrl);
    setBody(tpl.body);
    setCtaText(tpl.ctaText);
    setCtaUrl(tpl.ctaUrl);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage("Broadcasting campaign blast across user database... Please wait.");
    setStatusType("");

    const fd = new FormData(e.currentTarget);
    try {
      const res = await dispatchEmailCampaign(fd);
      if (res.success) {
        setStatusMessage(`🎉 Success! Broadcast dispatched to ${res.dispatched} registered users.`);
        setStatusType("success");
      } else {
        setStatusMessage(`⚠️ Dispatch incomplete: ${res.error || 'SMTP Connection Error'}`);
        setStatusType("error");
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error: ${err.message || 'SMTP Connection Failed'}`);
      setStatusType("error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg, #111)', borderRadius: '12px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>📧 In-built Promotional Email Blast</h3>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '2px' }}>Send gorgeous, prebuilt templates or custom HTML campaigns to your entire community.</p>
        </div>
        <div style={{ background: 'rgba(70, 211, 105, 0.1)', border: '1px solid rgba(70, 211, 105, 0.2)', color: '#46d369', padding: '8px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
          👥 {totalUsersCount} Target Seeker Recipients
        </div>
      </div>

      {statusMessage && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          fontSize: '0.9rem',
          fontWeight: 'bold',
          background: statusType === 'success' ? 'rgba(70, 211, 105, 0.1)' : statusType === 'error' ? 'rgba(242, 100, 34, 0.1)' : 'rgba(255,255,255,0.05)',
          border: statusType === 'success' ? '1px solid rgba(70, 211, 105, 0.3)' : statusType === 'error' ? '1px solid rgba(242, 100, 34, 0.3)' : '1px solid #333',
          color: statusType === 'success' ? '#46d369' : statusType === 'error' ? '#f26422' : '#aaa'
        }}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Select Prebuilt Promotional Template</label>
          <select 
            value={selectedTheme} 
            onChange={(e) => handleTemplateChange(e.target.value as TemplateKey)}
            style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}
          >
            <option value="FESTIVAL_VASANTO">🌸 Spring Vasantotsava Chants Festival Campaign</option>
            <option value="NEW_STREAM_LAUNCH">🚀 'Grammar Simplified' New Curricular Stream</option>
            <option value="WEEKEND_SPRINT">🏆 Seeker's 48h Weekend Learning Sprint</option>
            <option value="CUSTOM_NEWSLETTER">✍️ Custom HTML Narrative Newsletter</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Email Subject Line</label>
            <input 
              required 
              type="text" 
              name="subject" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter engaging email subject..." 
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Graphic Banner Image URL</label>
            <input 
              type="url" 
              name="bannerUrl" 
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://image-url.jpg" 
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} 
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Promotional Narrative (HTML/Text Content)</label>
          <textarea 
            required 
            name="body" 
            rows={6} 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write dynamic and inspirational email campaign body copy..." 
            style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>CTA Button Label</label>
            <input 
              type="text" 
              name="ctaText" 
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. Upgrade Now" 
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>CTA Target Link URL</label>
            <input 
              type="text" 
              name="ctaUrl" 
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="e.g. /subscribe" 
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} 
            />
          </div>
        </div>

        <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
              color: '#fff', 
              padding: '16px', 
              borderRadius: '8px', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: 900, 
              cursor: isPending ? 'not-allowed' : 'pointer', 
              boxShadow: '0 10px 35px rgba(242, 100, 34, 0.2)',
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? '⏳ BROADCASTING EMAIL BLAST TO ALL REGISTERED SEEKERS...' : '🚀 IGNITE PROMOTIONAL EMAIL BLAST NOW'}
          </button>
        </div>
      </form>
    </div>
  );
}
