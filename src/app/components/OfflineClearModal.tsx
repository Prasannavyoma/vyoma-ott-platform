"use client";

import type { ReactNode } from 'react';

interface OfflineClearModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation modal for clearing offline downloads.
 * Used by the per-video DownloadButton, Profile > Offline Library and the /offline hub
 * so every "clear download" prompt looks and reads the same.
 */
export default function OfflineClearModal({
  open,
  title,
  message,
  confirmText = 'Yes, Clear',
  onConfirm,
  onCancel,
}: OfflineClearModalProps) {
  if (!open) return null;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(3, 11, 23, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => { stop(e); onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          background: '#0b121e',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '25px 30px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 30px rgba(229,9,20,0.2)',
          textAlign: 'center',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Close Button */}
        <button
          onClick={(e) => { stop(e); onCancel(); }}
          title="Close"
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#f26422',
            border: '2px solid #ffffff',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(242,100,34,0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#f26422';
          }}
        >
          ✕
        </button>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '10px' }}>
          {title}
        </h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '25px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={(e) => { stop(e); onCancel(); }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              flex: 1,
              transition: 'background 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={(e) => { stop(e); onConfirm(); }}
            style={{
              background: '#e50914',
              border: 'none',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              flex: 1,
              boxShadow: '0 4px 15px rgba(229,9,20,0.4)',
              transition: 'transform 0.1s'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Standard message for clearing a single download, matching the per-video prompt. */
export function singleClearMessage(title?: string): ReactNode {
  return (
    <>
      You are about to clear this offline downloaded content
      {title ? <strong style={{ color: '#fff' }}> &ldquo;{title}&rdquo;</strong> : ''}. Are you sure?
    </>
  );
}

/** Standard message for clearing every download on the device. */
export function clearAllMessage(count: number): ReactNode {
  return (
    <>
      You are about to clear all <strong style={{ color: '#fff' }}>{count}</strong> offline downloaded{' '}
      {count === 1 ? 'item' : 'items'} from this device. Are you sure?
    </>
  );
}
