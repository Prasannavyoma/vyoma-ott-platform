'use client';

import React, { useEffect, useRef } from 'react';

export default function CustomEmbedChatbot({ htmlCode }: { htmlCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !htmlCode) return;

    // Clear previous elements
    containerRef.current.innerHTML = '';

    // Create a temporary container to parse HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlCode;

    // Append non-script elements (e.g., iframes, style blocks, divs)
    const nonScripts = tempDiv.querySelectorAll('div, iframe, style, link');
    nonScripts.forEach(el => {
      containerRef.current?.appendChild(el.cloneNode(true));
    });

    // Parse and run script tags dynamically
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy inline content if present
      if (script.innerHTML) {
        newScript.innerHTML = script.innerHTML;
      }
      
      document.body.appendChild(newScript);
    });
  }, [htmlCode]);

  return <div ref={containerRef} />;
}
