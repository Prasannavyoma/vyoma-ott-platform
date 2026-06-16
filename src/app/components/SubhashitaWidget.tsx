'use client';

import React, { useState, useEffect } from 'react';
import { getSanskritSettings } from '@/app/actions/sanskrit-settings';
import { getSubhashitaOfTheDay } from '@/app/actions/subhashitas';

interface QuoteWord {
  word: string;
  meaning: string;
}

interface Subhashita {
  sanskrit: string;
  transliteration: string;
  translation: string;
  words: QuoteWord[];
  source: string;
}

const SUBHASHITAS: Subhashita[] = [
  {
    sanskrit: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।\nन हि सुप्तस्य सिंहस्य प्रविशन्ति मुखे मृगाः॥",
    transliteration: "Udyamena hi sidhyanti kāryāṇi na manorathaiḥ |\nNa hi suptasya siṁhasya praviśanti mukhe mṛgāḥ ||",
    translation: "Indeed, tasks are accomplished by effort and hard work, and not by mere wishes. A deer does not enter the mouth of a sleeping lion on its own.",
    source: "Hitopadesha",
    words: [
      { word: "उद्यमेन", meaning: "by effort / hard work" },
      { word: "हि", meaning: "indeed / surely" },
      { word: "सिध्यन्ति", meaning: "succeed / are accomplished" },
      { word: "कार्याणि", meaning: "works / tasks" },
      { word: "न", meaning: "not" },
      { word: "मनोरथैः", meaning: "by mere wishes / desires" },
      { word: "सुप्तस्य", meaning: "of sleeping" },
      { word: "सिंहस्य", meaning: "of a lion" },
      { word: "प्रविशन्ति", meaning: "enter" },
      { word: "मुखे", meaning: "in the mouth" },
      { word: "मृगाः", meaning: "deer / animals" }
    ]
  },
  {
    sanskrit: "विद्या ददाति विनयं विनयाद्याति पात्रताम्।\nपात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम्॥",
    transliteration: "Vidyā dadāti vinayaṁ vinayādyāti pātratām |\nPātratvāddhanamāpnoti dhanāddharmaṁ tataḥ sukham ||",
    translation: "Knowledge gives humility; humility leads to capability/worthiness; capability brings wealth; wealth enables righteousness (Dharma), and from righteousness flows true happiness.",
    source: "Hitopadesha",
    words: [
      { word: "विद्या", meaning: "knowledge" },
      { word: "ददाति", meaning: "gives" },
      { word: "विनयम्", meaning: "humility / discipline" },
      { word: "विनयात्", meaning: "from humility" },
      { word: "याति", meaning: "attains / goes to" },
      { word: "पात्रताम्", meaning: "worthiness / capability" },
      { word: "पात्रत्वात्", meaning: "from worthiness" },
      { word: "धनम्", meaning: "wealth" },
      { word: "आप्नोति", meaning: "attains / gets" },
      { word: "धनात्", meaning: "from wealth" },
      { word: "धर्मम्", meaning: "righteousness / duty" },
      { word: "ततः", meaning: "from that" },
      { word: "सुखम्", meaning: "happiness / peace" }
    ]
  },
  {
    sanskrit: "क्षणशः कणशश्चैव विद्यामर्थं च चिन्तयेत्।\nक्षणे नष्टे कुतो विद्या कणे नष्टे कुतो धनम्॥",
    transliteration: "Kṣaṇaśaḥ kaṇaśaścaiva vidyāmarthaṁ ca cintayet |\nKṣaṇe naṣṭe kuto vidyā kaṇe naṣṭe kuto dhanam ||",
    translation: "One should seek knowledge moment by moment, and wealth grain by grain. If a moment is wasted, where is knowledge? If a grain is wasted, where is wealth?",
    source: "Chanakya Niti",
    words: [
      { word: "क्षणशः", meaning: "moment by moment" },
      { word: "कणशः", meaning: "particle by particle / grain by grain" },
      { word: "च एव", meaning: "and also" },
      { word: "विद्याम्", meaning: "knowledge" },
      { word: "अर्थम्", meaning: "wealth" },
      { word: "च", meaning: "and" },
      { word: "चिन्तयेत्", meaning: "one should think of / pursue" },
      { word: "क्षणे नष्टे", meaning: "if a moment is wasted" },
      { word: "कुतः", meaning: "where is" },
      { word: "विद्या", meaning: "knowledge" },
      { word: "कणे नष्टे", meaning: "if a particle is wasted" },
      { word: "धनम्", meaning: "wealth" }
    ]
  },
  {
    sanskrit: "न देवो वर्तते काष्ठे न पाषाणे न मृण्मये।\nभावे हि वर्तते देवस्तस्माद्भावो हि कारणम्॥",
    transliteration: "Na devo vartate kāṣṭhe na pāṣāṇe na mṛṇmaye |\nBhāve hi vartate devastasmādbhāvo hi kāraṇam ||",
    translation: "God resides neither in wood, nor in stone, nor in clay. God resides indeed in one's pure feelings/devotion; therefore, devotion is the primary cause.",
    source: "Chanakya Niti",
    words: [
      { word: "न", meaning: "not" },
      { word: "देवः", meaning: "divine / god" },
      { word: "वर्तते", meaning: "exists / resides" },
      { word: "काष्ठे", meaning: "in wood" },
      { word: "पाषाणे", meaning: "in stone" },
      { word: "मृण्मये", meaning: "in clay" },
      { word: "भावे", meaning: "in feelings / devotion" },
      { word: "हि", meaning: "indeed" },
      { word: "तस्मात्", meaning: "therefore" },
      { word: "भावः", meaning: "devotion / inner state" },
      { word: "कारणम्", meaning: "cause / reason" }
    ]
  }
];

export default function SubhashitaWidget() {
  const [currentQuote, setCurrentQuote] = useState<Subhashita>(SUBHASHITAS[0]);
  const [showSplits, setShowSplits] = useState(false);
  const [settingsEnabled, setSettingsEnabled] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Load settings and dynamic quote
    async function loadQuoteAndSettings() {
      try {
        const settings = await getSanskritSettings();
        if (!settings.hubEnabled || !settings.subhashitaEnabled) {
          setSettingsEnabled(false);
        }

        const dbQuote = await getSubhashitaOfTheDay();
        if (dbQuote) {
          let parsedWords: QuoteWord[] = [];
          try {
            parsedWords = JSON.parse(dbQuote.wordsJson);
          } catch (e) {}

          setCurrentQuote({
            sanskrit: dbQuote.sanskrit,
            transliteration: dbQuote.transliteration,
            translation: dbQuote.translation,
            source: dbQuote.source,
            words: parsedWords
          });
        } else {
          // Fallback if uploader is empty
          const day = new Date().getDate();
          setCurrentQuote(SUBHASHITAS[day % SUBHASHITAS.length]);
        }
      } catch (e) {
        console.error("Failed to load Sanskrit settings or dynamic quote for widget", e);
        const day = new Date().getDate();
        setCurrentQuote(SUBHASHITAS[day % SUBHASHITAS.length]);
      }
    }
    loadQuoteAndSettings();

    // Check banner preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vyoma_show_subhashita') !== 'false';
      setVisible(saved);

      const handleToggle = (e: Event) => {
        const customEvent = e as CustomEvent;
        setVisible(customEvent.detail);
      };
      window.addEventListener('vyoma_toggle_subhashita', handleToggle);
      return () => window.removeEventListener('vyoma_toggle_subhashita', handleToggle);
    }
  }, []);


  if (!settingsEnabled || !visible) return null;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(16px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '24px 30px',
      margin: '40px 0',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255,255,255,0.05)',
      fontFamily: 'var(--font-geist-sans), sans-serif',
      color: '#fff',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .subhashita-action-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .subhashita-action-btn:hover {
          transform: scale(1.04) !important;
          background: rgba(242, 100, 34, 0.15) !important;
          border-color: rgba(242, 100, 34, 0.3) !important;
        }
        .subhashita-split-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 10px 14px;
          transition: all 0.2s;
        }
        .subhashita-split-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🪔</span>
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#f26422', fontWeight: 800 }}>
            Subhashita of the Day
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
          Source: {currentQuote.source}
        </span>
      </div>

      {/* Quote Display */}
      <div style={{ textAlign: 'center', margin: '20px 0 25px 0' }}>
        <h2 style={{
          fontSize: '1.6rem',
          lineHeight: '1.7',
          fontWeight: 700,
          color: '#ffd700',
          whiteSpace: 'pre-line',
          margin: '0 0 12px 0',
          textShadow: '0 4px 12px rgba(255, 215, 0, 0.15)'
        }}>
          {currentQuote.sanskrit}
        </h2>
        <p style={{
          fontSize: '0.92rem',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.5)',
          whiteSpace: 'pre-line',
          margin: 0,
          lineHeight: '1.5'
        }}>
          {currentQuote.transliteration}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      {/* Translation */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>English Translation</h4>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)' }}>
          {currentQuote.translation}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>

        <button
          onClick={() => setShowSplits(!showSplits)}
          className="subhashita-action-btn"
          style={{
            background: showSplits ? 'rgba(242, 100, 34, 0.15)' : 'rgba(255,255,255,0.04)',
            border: showSplits ? '1px solid #f26422' : '1px solid rgba(255,255,255,0.08)',
            color: showSplits ? '#f26422' : '#fff',
            padding: '8px 18px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            outline: 'none'
          }}
        >
          <span>📖</span> {showSplits ? "Hide Word Meanings" : "Split Word Meanings"}
        </button>
      </div>

      {/* Word splits dropdown grid */}
      {showSplits && (
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          animation: 'subhashitaFadeIn 0.3s ease'
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes subhashitaFadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
          {currentQuote.words.map((item, index) => (
            <div key={index} className="subhashita-split-item">
              <div style={{ fontWeight: 700, color: '#ffd700', fontSize: '0.88rem', marginBottom: '3px' }}>
                {item.word}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                {item.meaning}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
