"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader } from 'lucide-react';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
          setLoading(false);
        });
      }).catch(err => {
        console.error('Service Worker registration failed:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const subscribeButtonOnClick = async () => {
    if (!registration) return;
    setLoading(true);

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setSubscription(sub);
      setIsSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      alert('Could not enable push notifications. Please check browser permissions.');
    }
    setLoading(false);
  };

  const unsubscribeButtonOnClick = async () => {
    if (subscription) {
      setLoading(true);
      await subscription.unsubscribe();
      // Note: We should ideally call an API to delete the sub from DB, 
      // but for now, sending a push to an unsubscribed endpoint will automatically clean it up.
      setSubscription(null);
      setIsSubscribed(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
        <Loader className="spin" size={16} /> Loading Notification Status...
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--foreground)' }}>
          {isSubscribed ? <Bell size={18} color="#4ade80" /> : <BellOff size={18} color="#f43f5e" />}
          OS Push Notifications
        </h4>
        <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#888' }}>
          Receive desktop and mobile alerts about expiring plans and new content.
        </p>
      </div>
      <button 
        onClick={isSubscribed ? unsubscribeButtonOnClick : subscribeButtonOnClick}
        disabled={loading}
        style={{ 
          padding: '8px 16px', 
          background: isSubscribed ? 'rgba(244, 63, 94, 0.1)' : 'var(--primary)', 
          color: isSubscribed ? '#f43f5e' : '#fff', 
          border: isSubscribed ? '1px solid rgba(244, 63, 94, 0.3)' : 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
      >
        {isSubscribed ? 'Disable Alerts' : 'Enable Alerts'}
      </button>
    </div>
  );
}
