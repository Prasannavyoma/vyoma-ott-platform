"use client";
import { useState } from 'react';

const faqData = [
  {
    question: "How do I log in to my account?",
    answer: "If you already had an account on our previous portal, your account has been seamlessly migrated! Click the 'Login' button at the top right of the navigation bar. Enter your email and password. If you forgot your password, you can easily reset it.",
    image: "/assets/faq-login-guide.png"
  },
  {
    question: "Where can I find my purchased courses and audiobooks?",
    answer: "Once logged in, click on your Profile icon at the top right, and select 'Dashboard' or 'My Courses'. You will see a beautiful grid of all your purchased content. You can also use the 'Explore' page to browse all available courses.",
    image: "/assets/faq-dashboard-guide.png"
  },
  {
    question: "How do I use the Practice Hub?",
    answer: "The Practice Hub is a new feature in OTT 2.0! You can access tools like the Grammar Analyzer and Shloka Memorizer directly from the navigation bar under the 'Practice Hub' menu. These interactive tools are designed to enhance your learning experience."
  },
  {
    question: "Can I watch videos on my mobile device?",
    answer: "Absolutely! Our new OTT 2.0 platform is 100% fully responsive. You can watch videos, listen to audiobooks, and read e-books seamlessly on your smartphone or tablet browser."
  }
];

export default function FAQClient() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {faqData.map((faq, index) => (
        <div key={index} style={{ 
          marginBottom: '20px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <button 
            onClick={() => toggleAccordion(index)}
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {faq.question}
            <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: openIndex === index ? 'rotate(45deg)' : 'rotate(0)' }}>
              +
            </span>
          </button>
          
          <div style={{ 
            maxHeight: openIndex === index ? '1000px' : '0', 
            transition: 'max-height 0.3s ease-in-out',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0 20px 20px', color: '#ccc', lineHeight: '1.6' }}>
              <p>{faq.answer}</p>
              {faq.image && (
                <div style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={faq.image} alt={faq.question} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
