"use client";
import { useState } from 'react';

const faqData = [
  {
    question: "What is Vyoma OTT (digitalsanskrit.com)?",
    answer: "World's first online platform for Sanskrit E-Learning Resources in Over The Top (OTT) format. It is a subscription-based digital learning platform that provides one-stop access to Vyoma's suite of digital learning resources including flipbooks, audiobooks, video, multimedia, and gaming resources."
  },
  {
    question: "Why should I take a subscription?",
    answer: "A subscription gives you unlimited access to premium, structured Sanskrit learning content, expertly curated courses, interactive practice tools, and exclusive member-only media across all your devices."
  },
  {
    question: "How do I log in to my account?",
    answer: "If you already had an account on our previous portal, your account has been seamlessly migrated! Click the 'Login' button at the top right of the navigation bar. Enter your email and password.",
    image: "/assets/faq-login-guide.png"
  },
  {
    question: "How do I reset / change my password?",
    answer: "On the Login page, click the 'Forgot Password' link. Enter your registered email address, and we will send you a secure link to reset and create a new password."
  },
  {
    question: "I'm unable to log in. What should I do?",
    answer: "First, ensure you are using the correct email address associated with your account. If you migrated from the old portal and your password isn't working, simply use the 'Forgot Password' option to reset it. If the issue persists, please contact our support team."
  },
  {
    question: "How can I register on the website?",
    answer: "Click the 'Free Register' button on the top right of the homepage. Fill in your basic details (Name, Email, Password) to instantly create your free account and start exploring."
  },
  {
    question: "Where can I find my purchased courses and audiobooks?",
    answer: "Once logged in, click on your Profile icon at the top right, and select 'Dashboard' or 'My Courses'. You will see a beautiful grid of all your purchased content. You can also use the 'Explore' page to browse all available courses.",
    image: "/assets/faq-dashboard-guide.png"
  },
  {
    question: "What devices can be used for accessing?",
    answer: "You can access the platform on any modern web browser across Desktop computers (Windows/Mac), Laptops, Tablets (iPad/Android), and all Smartphones."
  },
  {
    question: "Can I access the app on my mobile?",
    answer: "Absolutely! Our new OTT 2.0 platform is 100% fully responsive. You can watch videos, listen to audiobooks, and read e-books seamlessly on your smartphone's browser without needing to download a separate app."
  },
  {
    question: "Is it accessible outside India?",
    answer: "Yes, our platform is globally accessible. Learners from anywhere in the world can register, subscribe, and access our content 24/7."
  },
  {
    question: "How do people outside India make the payment?",
    answer: "International users can easily make payments using international Credit Cards, Debit Cards, or PayPal through our secure international payment gateway during checkout."
  },
  {
    question: "Do you offer refunds?",
    answer: "Refunds are processed according to our standard terms of service. Generally, subscription fees are non-refundable once content has been accessed, but please contact our support team for specific billing inquiries."
  },
  {
    question: "How can I access the E-Books?",
    answer: "You can find all E-Books by navigating to the 'Media' menu at the top and clicking on 'E-books'. Once you purchase or subscribe to an E-book, it will appear in your Dashboard where you can read it directly in your browser."
  },
  {
    question: "How do I use the Practice Hub?",
    answer: "The Practice Hub is a new feature in OTT 2.0! You can access tools like the Grammar Analyzer and Shloka Memorizer directly from the navigation bar under the 'Practice Hub' menu. These interactive tools are designed to enhance your learning experience."
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
