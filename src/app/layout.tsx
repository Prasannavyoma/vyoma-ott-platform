import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from 'react';
import dynamic from 'next/dynamic';

import Script from 'next/script';
import prisma from "@/lib/prisma";
import OneSignalRegistry from "./components/OneSignalRegistry";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GlobalPlayerProvider } from "./components/GlobalPlayerProvider";
import ContactWidget from "./components/ContactWidget";
import CustomEmbedChatbot from "./components/CustomEmbedChatbot";

// 🚀 LAZY LOAD AI CHAT WIDGET: This prevents the heavy chatbot logic from blocking the initial page paint globally!
const AiChatWidget = dynamic(() => import('./components/AiChatWidget'));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vyoma Sanskrit OTT",
  description: "World's Leading Sanskrit Learning Platform",
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
  let chatbotEnabled = false;
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

  try {
    const res = await prisma.systemSetting.findUnique({ where: { key: 'ONESIGNAL_APP_ID' } });
    oneSignalAppId = res?.value || "";

    const cbSetting = await prisma.systemSetting.findUnique({
      where: { key: 'CHATBOT_ENABLED' }
    });
    chatbotEnabled = cbSetting?.value === 'true';

    const modeSetting = await prisma.systemSetting.findUnique({
      where: { key: 'CHATBOT_MODE' }
    });
    chatbotMode = modeSetting?.value || 'BUILTIN';

    const embedSetting = await prisma.systemSetting.findUnique({
      where: { key: 'CHATBOT_CUSTOM_EMBED_CODE' }
    });
    chatbotCustomEmbedCode = embedSetting?.value || '';

    const settingsList = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'CONTACT_WIDGET_ENABLED',
            'CONTACT_PHONE_ENABLED',
            'CONTACT_PHONE_NUMBER',
            'CONTACT_WHATSAPP_ENABLED',
            'CONTACT_WHATSAPP_NUMBER',
            'CONTACT_WHATSAPP_MESSAGE',
            'CONTACT_EMAIL_ENABLED',
            'CONTACT_EMAIL_ADDRESS'
          ]
        }
      }
    });

    const settingsMap = new Map(settingsList.map(s => [s.key, s.value]));
    if (settingsMap.has('CONTACT_WIDGET_ENABLED')) {
      contactSettings.widgetEnabled = settingsMap.get('CONTACT_WIDGET_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_PHONE_ENABLED')) {
      contactSettings.phoneEnabled = settingsMap.get('CONTACT_PHONE_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_PHONE_NUMBER')) {
      contactSettings.phoneNumber = settingsMap.get('CONTACT_PHONE_NUMBER') || "+919876543210";
    }
    if (settingsMap.has('CONTACT_WHATSAPP_ENABLED')) {
      contactSettings.whatsappEnabled = settingsMap.get('CONTACT_WHATSAPP_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_WHATSAPP_NUMBER')) {
      contactSettings.whatsappNumber = settingsMap.get('CONTACT_WHATSAPP_NUMBER') || "+919876543210";
    }
    if (settingsMap.has('CONTACT_WHATSAPP_MESSAGE')) {
      contactSettings.whatsappMessage = settingsMap.get('CONTACT_WHATSAPP_MESSAGE') || "Namaste! I have a question about Vyoma Sanskrit OTT.";
    }
    if (settingsMap.has('CONTACT_EMAIL_ENABLED')) {
      contactSettings.emailEnabled = settingsMap.get('CONTACT_EMAIL_ENABLED') === 'true';
    }
    if (settingsMap.has('CONTACT_EMAIL_ADDRESS')) {
      contactSettings.emailAddress = settingsMap.get('CONTACT_EMAIL_ADDRESS') || "support@vyomasanskrit.in";
    }
    let themePrimary = '#f26422';
    let themeBg = '#030b17';
    let themeCardBg = '#0f1624';
    let themeFontFamily = 'Outfit';
    let themeFontSize = '16px';
    let themeButtonRadius = '8px';

    if (settingsMap.has('THEME_PRIMARY_COLOR')) themePrimary = settingsMap.get('THEME_PRIMARY_COLOR')!;
    if (settingsMap.has('THEME_BACKGROUND_COLOR')) themeBg = settingsMap.get('THEME_BACKGROUND_COLOR')!;
    if (settingsMap.has('THEME_CARD_BG')) themeCardBg = settingsMap.get('THEME_CARD_BG')!;
    if (settingsMap.has('THEME_FONT_FAMILY')) themeFontFamily = settingsMap.get('THEME_FONT_FAMILY')!;
    if (settingsMap.has('THEME_FONT_SIZE_BASE')) themeFontSize = settingsMap.get('THEME_FONT_SIZE_BASE')!;
    if (settingsMap.has('THEME_BUTTON_RADIUS')) themeButtonRadius = settingsMap.get('THEME_BUTTON_RADIUS')!;
  } catch(e) {}

  // Construct dynamic font URL based on the user's selected font family
  const fontUrl = `https://fonts.googleapis.com/css2?family=${themeFontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={themePrimary} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontUrl} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${themePrimary} !important;
            --background: ${themeBg} !important;
            --card-bg: ${themeCardBg} !important;
            --font-family-dynamic: "${themeFontFamily}", sans-serif !important;
            --font-size-base: ${themeFontSize} !important;
            --button-radius: ${themeButtonRadius} !important;
          }
          
          body {
            font-family: var(--font-family-dynamic) !important;
            font-size: var(--font-size-base) !important;
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
        </GlobalPlayerProvider>
      </body>
    </html>
  );
}
