'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { sendWelcomeEmail } from '@/lib/mail';
import { setSessionUser, getCurrentUser } from '@/lib/auth';
import { validateSpamVectors } from '@/lib/spam-guard';
import { hashPassword } from '@/lib/hash';

export async function registerUser(formData: FormData) {
  // 🛡️ Run Inbuilt Spam & Spambot Audit
  const check = validateSpamVectors(formData);
  if (check.isSpam) {
    // Quietly reject bots without letting them know exactly how they failed
    redirect('/?error=verification_failed');
  }

  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;
  const referrerId = formData.get('referrerId') as string || '';
  
  if (!email) return { error: 'Email is required' };
  
  try {
    const allowPasswordSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_PASSWORD' } });
    if (allowPasswordSetting && allowPasswordSetting.value === 'false') {
      return { error: 'Password-based registration is currently disabled. Please use Google Sign-In.' };
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: 'already_registered' };
    }
    
    const hashedPassword = password ? hashPassword(password) : null;

    await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        plan: 'FREE',
        planInterval: 'YEARLY',
        password: hashedPassword,
        forcePasswordChange: false
      }
    });

    // 🎁 Process Referral Rewards if a referrer is present
    if (referrerId) {
      try {
        const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
        if (referrer) {
          // 1. Log the referral connection
          await prisma.referral.create({
            data: {
              referrerId: referrerId,
              referredEmail: email
            }
          });

          // 2. Award +10 coins instantly to the referrer
          await prisma.user.update({
            where: { id: referrerId },
            data: { coins: { increment: 10 } }
          });

          // 3. Check referrer's cumulative referral totals
          const referralCount = await prisma.referral.count({
            where: { referrerId: referrerId }
          });

          // 4. Trigger administrative delivery alert if a milestone reward is reached
          const tier = await prisma.referralTier.findUnique({
            where: { referralsRequired: referralCount }
          });

          if (tier) {
            await prisma.referralReward.create({
              data: {
                userId: referrerId,
                rewardName: tier.rewardName,
                referralCount: referralCount,
                status: 'PENDING'
              }
            });
          }
        }
      } catch (err) {
        console.error("Referral award execution failure:", err);
      }
    }

    // 🔑 Set session cookie to log the user in instantly
    await setSessionUser(email);

    // Trigger fire-and-forget welcome email execution pipeline
    sendWelcomeEmail(email, name || email.split('@')[0]).catch(e => {});
    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: 'Registration failed' };
  }
}

export async function loginUser(formData: FormData) {
  // 🛡️ Run Integrated Anti-Spam Safeguard
  const spamCheck = validateSpamVectors(formData);
  if (spamCheck.isSpam) {
    return { error: 'spam_detected' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' };
  }

  try {
    const allowPasswordSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_PASSWORD' } });
    if (allowPasswordSetting && allowPasswordSetting.value === 'false') {
      return { error: 'Password-based login is currently disabled. Please sign in using Google.' };
    }
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Auto-register FREE user with password if entered
      const hashedPassword = password ? hashPassword(password) : null;
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          plan: 'FREE',
          planInterval: 'YEARLY',
          password: hashedPassword,
          coins: 0
        }
      });
    } else {
      // Verify password if one is set in DB
      if (user.password) {
        if (!password || hashPassword(password) !== user.password) {
          return { error: 'Incorrect password' };
        }
      } else if (password) {
        // Automatically save password if none was previously set (migration helper)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashPassword(password) }
        });
      }
    }

    await setSessionUser(email);
    return { 
      success: true, 
      forcePasswordChange: user.forcePasswordChange 
    };
  } catch (err) {
    console.error("Login failure:", err);
    return { error: 'Login failed. Please try again.' };
  }
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const password = formData.get('password') as string;
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    await prisma.user.update({
      where: { email: user.email },
      data: {
        password: hashPassword(password),
        forcePasswordChange: false
      }
    });

    return { success: true };
  } catch (e) {
    console.error("Password update error:", e);
    return { error: 'Failed to update password.' };
  }
}

export async function loginWithGoogleAction(idToken: string, referrerId?: string) {
  // Check if Google Sign-In is enabled in settings
  const allowGoogle = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_GOOGLE' } });
  if (!allowGoogle || allowGoogle.value !== 'true') {
    return { error: 'Google login is not enabled.' };
  }

  const clientIdSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_GOOGLE_CLIENT_ID' } });
  const configuredClientId = clientIdSetting?.value || '';

  try {
    // 1. Call Google tokeninfo endpoint to verify token authenticity
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      return { error: 'Invalid Google ID Token.' };
    }
    const tokenInfo = await response.json();

    // Verify audience (matches client ID) if configured
    if (configuredClientId && tokenInfo.aud !== configuredClientId) {
       return { error: 'Audience mismatch. Client ID is invalid.' };
    }

    const email = tokenInfo.email;
    const name = tokenInfo.name || email.split('@')[0];
    const picture = tokenInfo.picture || '';

    if (!email) {
      return { error: 'Email could not be retrieved from Google account.' };
    }

    // Look up user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Auto-register the Google user
      user = await prisma.user.create({
        data: {
          email,
          name,
          plan: 'FREE',
          planInterval: 'YEARLY',
          avatarUrl: picture,
          forcePasswordChange: false
        }
      });

      // Handle referral rewards just like register
      if (referrerId) {
        try {
          const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
          if (referrer) {
            await prisma.referral.create({
              data: {
                referrerId: referrerId,
                referredEmail: email
              }
            });
            await prisma.user.update({
              where: { id: referrerId },
              data: { coins: { increment: 10 } }
            });
            const referralCount = await prisma.referral.count({ where: { referrerId } });
            const tier = await prisma.referralTier.findUnique({
              where: { referralsRequired: referralCount }
            });

            if (tier) {
              await prisma.referralReward.create({
                data: {
                  userId: referrerId,
                  rewardName: tier.rewardName,
                  referralCount,
                  status: 'PENDING'
                }
              });
            }
          }
        } catch (e) {
          console.error("Google login referral failure:", e);
        }
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(email, name);
      } catch (e) {
        console.error("Google register welcome email failure:", e);
      }
    }

    // Log the user in
    await setSessionUser(email);
    return { success: true };
  } catch (e: any) {
    console.error("Google token authentication failure:", e);
    return { error: 'Authentication failed: ' + e.message };
  }
}

export async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    return { isLoggedIn: !!user };
  } catch (e) {
    return { isLoggedIn: false };
  }
}
