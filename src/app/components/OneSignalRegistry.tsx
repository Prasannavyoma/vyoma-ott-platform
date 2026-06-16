"use client";

import { useEffect } from 'react';

export default function OneSignalRegistry({ appId }: { appId: string }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !appId) return;
    
    // Inject OneSignal Script Dynamically
    const script = document.createElement('script');
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.OneSignal = window.OneSignal || [];
      // @ts-ignore
      window.OneSignal.push(async function() {
        // @ts-ignore
        await window.OneSignal.init({
          appId: appId,
          safari_web_id: "",
          notifyButton: {
            enable: true,
          },
        });
      });
    };
  }, [appId]);

  return null; // Pure functionality mount
}
