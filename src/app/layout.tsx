import type { Metadata } from "next";
import "./globals.css";
import React from 'react';
import dynamic from 'next/dynamic';

import Script from 'next/script';
import prisma from "@/lib/prisma";
import { getSystemSettingsMap } from "@/lib/settings";
import OneSignalRegistry from "./components/OneSignalRegistry";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GlobalPlayerProvider } from "./components/GlobalPlayerProvider";
import ContactWidget from "./components/ContactWidget";
import CustomEmbedChatbot from "./components/CustomEmbedChatbot";
import CookieConsent from "./components/CookieConsent";

// 🚀 LAZY LOAD AI CHAT WIDGET: This prevents the heavy chatbot logic from blocking the initial page paint globally!
const AiChatWidget = dynamic(() => import('./components/AiChatWidget'));

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vyoma-ott.com'),
  title: {
    default: "Vyoma Sanskrit OTT",
    template: "%s | Vyoma Sanskrit OTT"
  },
  description: "World's Leading Sanskrit Learning Platform. Discover 100+ structured courses, interactive quizzes, and authentic Shastric knowledge.",
  openGraph: {
    title: 'Vyoma Sanskrit OTT',
    description: 'Learn Sanskrit online with structured courses and authentic Shastric knowledge.',
    url: '/',
    siteName: 'Vyoma Sanskrit OTT',
    images: [
      {
        url: '/og-image.jpg', // Placeholder for default OG image
        width: 1200,
        height: 630,
        alt: 'Vyoma Sanskrit OTT Platform',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vyoma Sanskrit OTT',
    description: 'World\'s Leading Sanskrit Learning Platform.',
    images: ['/og-image.jpg'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || "";

  if (pathname !== "/change-password" && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
    const user = await getCurrentUser();
    if (user && user.forcePasswordChange) {
      redirect("/change-password");
    }
  }
  
  let oneSignalAppId = "";
  let chatbotEnabled = true;
  let chatbotMode = "BUILTIN";
  let chatbotCustomEmbedCode = "";
  let contactSettings = {
    widgetEnabled: true,
    phoneEnabled: true,
    phoneNumber: "+919876543210",
    whatsappEnabled: true,
    whatsappNumber: "+919876543210",
    whatsappMessage: "Namaste! I have a question about Vyoma Sanskrit OTT.",
    emailEnabled: true,
    emailAddress: "support@vyomasanskrit.in"
  };

  let themePrimary = '#f26422';
  let themeBg = '#030b17';
  let themeCardBg = '#0f1624';
  let themeFontFamily = 'Futura';
  let themeFontSize = '16px';
  let themeButtonRadius = '8px';

  try {
    const settingsMap = await getSystemSettingsMap();
    oneSignalAppId = settingsMap.get('ONESIGNAL_APP_ID') || "";

    // AI Settings
    if (settingsMap.has('CHATBOT_ENABLED')) {
      chatbotEnabled = settingsMap.get('CHATBOT_ENABLED') !== 'false';
    }
    if (settingsMap.has('CHATBOT_MODE')) {
      chatbotMode = settingsMap.get('CHATBOT_MODE') || 'BUILTIN';
    }
    if (settingsMap.has('CHATBOT_CUSTOM_EMBED_CODE')) {
      chatbotCustomEmbedCode = settingsMap.get('CHATBOT_CUSTOM_EMBED_CODE') || '';
    }

    // Contact Widget Settings
    if (settingsMap.has('CONTACT_WIDGET_ENABLED')) {
      contactSettings.widgetEnabled = settingsMap.get('CONTACT_WIDGET_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_PHONE_ENABLED')) {
      contactSettings.phoneEnabled = settingsMap.get('CONTACT_PHONE_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_PHONE_NUMBER')) {
      contactSettings.phoneNumber = settingsMap.get('CONTACT_PHONE_NUMBER') || "+918023141354";
    }
    if (settingsMap.has('CONTACT_WHATSAPP_ENABLED')) {
      contactSettings.whatsappEnabled = settingsMap.get('CONTACT_WHATSAPP_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_WHATSAPP_NUMBER')) {
      contactSettings.whatsappNumber = settingsMap.get('CONTACT_WHATSAPP_NUMBER') || "";
    }
    if (settingsMap.has('CONTACT_WHATSAPP_MESSAGE')) {
      contactSettings.whatsappMessage = settingsMap.get('CONTACT_WHATSAPP_MESSAGE') || "Namaste! I have a question about Vyoma Sanskrit OTT.";
    }
    if (settingsMap.has('CONTACT_EMAIL_ENABLED')) {
      contactSettings.emailEnabled = settingsMap.get('CONTACT_EMAIL_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_EMAIL_ADDRESS')) {
      contactSettings.emailAddress = settingsMap.get('CONTACT_EMAIL_ADDRESS') || "support@vyomalabs.in";
    }

    if (settingsMap.has('THEME_PRIMARY_COLOR')) themePrimary = settingsMap.get('THEME_PRIMARY_COLOR')!;
    if (settingsMap.has('THEME_BACKGROUND_COLOR')) themeBg = settingsMap.get('THEME_BACKGROUND_COLOR')!;
    if (settingsMap.has('THEME_CARD_BG')) themeCardBg = settingsMap.get('THEME_CARD_BG')!;
    if (settingsMap.has('THEME_FONT_FAMILY')) themeFontFamily = settingsMap.get('THEME_FONT_FAMILY')!;
    if (settingsMap.has('THEME_FONT_SIZE_BASE')) themeFontSize = settingsMap.get('THEME_FONT_SIZE_BASE')!;
    if (settingsMap.has('THEME_BUTTON_RADIUS')) themeButtonRadius = settingsMap.get('THEME_BUTTON_RADIUS')!;

    if (settingsMap.has('ONESIGNAL_APP_ID')) {
      oneSignalAppId = settingsMap.get('ONESIGNAL_APP_ID') || "";
    }
  } catch(e) {}

  // Construct dynamic font URL based on the user's selected font family (Shobhika is bundled locally in /fonts/, Futura pairs with Jost webfont)
  const fontUrl = themeFontFamily === 'Shobhika' 
    ? null 
    : themeFontFamily === 'Futura'
    ? 'https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap'
    : `https://fonts.googleapis.com/css2?family=${themeFontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;

  const dynamicFontFamilyCSS = themeFontFamily === 'Futura'
    ? "'Jost', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Outfit', 'Futura', 'Shobhika', sans-serif"
    : `"${themeFontFamily}", "Shobhika", sans-serif`;

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={themePrimary} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Shobhika-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        {fontUrl && <link href={fontUrl} rel="stylesheet" />}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${themePrimary} !important;
            --background: ${themeBg} !important;
            --card-bg: ${themeCardBg} !important;
            --font-family-dynamic: ${dynamicFontFamilyCSS} !important;
            --font-size-base: ${themeFontSize} !important;
            --button-radius: ${themeButtonRadius} !important;
            --font-sanskrit: "Shobhika", "Shobhika-Full", serif !important;
            --font-futura: 'Jost', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Outfit', 'Futura', sans-serif !important;
          }
          
          body, button, input, select, textarea {
            font-family: var(--font-family-dynamic) !important;
            font-size: var(--font-size-base) !important;
          }

          body {
            background: var(--background) !important;
          }

          /* Global Enforcements */
          button, .btn, a.btn, input[type="submit"] {
            border-radius: var(--button-radius) !important;
          }
        `}} />
      </head>
      <body>
        <GlobalPlayerProvider>
          {children}
          {!pathname.startsWith('/admin') && chatbotEnabled && (
            chatbotMode === 'CUSTOM_EMBED' ? (
              <CustomEmbedChatbot htmlCode={chatbotCustomEmbedCode} />
            ) : (
              <AiChatWidget contactSettings={contactSettings} aiEnabled={true} />
            )
          )}
          {!pathname.startsWith('/admin') && (
            (!chatbotEnabled && contactSettings.widgetEnabled) ||
            (chatbotEnabled && chatbotMode === 'CUSTOM_EMBED' && contactSettings.widgetEnabled)
          ) && (
            <ContactWidget settings={contactSettings} />
          )}
          {oneSignalAppId && <OneSignalRegistry appId={oneSignalAppId} />}
          <Script id="register-sw" strategy="lazyOnload">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('Vyoma SW active');
                }).catch(function(e) {
                  console.error('SW error', e);
                });
              }
            `}
          </Script>
          <CookieConsent />
        </GlobalPlayerProvider>
      </body>
    </html>
  );
}
