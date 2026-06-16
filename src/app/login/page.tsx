import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import LoginFormClient from './LoginFormClient';

export default async function LoginPage() {
  let allowPassword = true;
  let allowGoogle = false;
  let googleClientId = "";

  try {
    const pSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_PASSWORD' } });
    if (pSetting) allowPassword = pSetting.value !== 'false';

    const gSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_GOOGLE' } });
    if (gSetting) allowGoogle = gSetting.value === 'true';

    const idSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_GOOGLE_CLIENT_ID' } });
    if (idSetting) googleClientId = idSetting.value;
  } catch (e) {}

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Loading...
      </div>
    }>
      <LoginFormClient 
        allowPassword={allowPassword} 
        allowGoogle={allowGoogle} 
        googleClientId={googleClientId} 
      />
    </Suspense>
  );
}
