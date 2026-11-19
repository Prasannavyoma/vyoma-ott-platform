"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BackToHomeButtonProps {
  label?: string;
  defaultHref?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function BackToHomeButton({
  label = "← Back to Home",
  defaultHref = "/",
  style
}: BackToHomeButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If there is a section anchor to return to
    if (from && typeof window !== 'undefined') {
      sessionStorage.setItem('vyoma_last_section', from);
    }

    // Try browser history back if we have prior navigation history from this site
    if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      const fallbackUrl = from ? `/#${from}` : defaultHref;
      router.push(fallbackUrl);
    }
  };

  const targetUrl = from ? `/#${from}` : defaultHref;

  const defaultStyle: React.CSSProperties = {
    color: 'var(--primary, #f26422)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '20px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    ...style
  };

  return (
    <a 
      href={targetUrl}
      onClick={handleClick}
      style={defaultStyle}
    >
      {label}
    </a>
  );
}
