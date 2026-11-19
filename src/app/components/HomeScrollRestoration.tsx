"use client";

import { useEffect } from 'react';

export default function HomeScrollRestoration() {
  useEffect(() => {
    // 1. Check URL Hash first (e.g., /#section-sanskrit-kids-academy)
    if (typeof window === 'undefined') return;

    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const savedSection = sessionStorage.getItem('vyoma_last_section');
    const savedScrollY = sessionStorage.getItem('vyoma_scroll_y');

    const targetId = hash || savedSection;

    if (!targetId && !savedScrollY) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;

    const performScroll = () => {
      attempts++;

      // Priority A: Target by section element ID
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          // Clear storage once successfully anchored
          sessionStorage.removeItem('vyoma_last_section');
          sessionStorage.removeItem('vyoma_scroll_y');
          return true;
        }
      }

      // Priority B: Target by exact scroll Y position
      if (savedScrollY) {
        const y = parseInt(savedScrollY, 10);
        if (!isNaN(y) && y > 0) {
          window.scrollTo({ top: y, behavior: 'instant' });
          if (attempts >= 3) {
            sessionStorage.removeItem('vyoma_last_section');
            sessionStorage.removeItem('vyoma_scroll_y');
          }
          return true;
        }
      }

      return false;
    };

    // Run immediately
    performScroll();

    // Re-check across short intervals to account for images, sliders and async row hydration
    const intervalId = setInterval(() => {
      const done = performScroll();
      if (done && attempts >= 4) {
        clearInterval(intervalId);
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        sessionStorage.removeItem('vyoma_last_section');
        sessionStorage.removeItem('vyoma_scroll_y');
      }
    }, 80);

    return () => clearInterval(intervalId);
  }, []);

  return null;
}
