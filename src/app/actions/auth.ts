'use server';

import { validatePassword } from '@/lib/passwordValidation';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/mail';
import { setSessionUser, getCurrentUser, clearSession } from '@/lib/auth';
import { validateSpamVectors } from '@/lib/spam-guard';
import { hashPassword, verifyPassword } from '@/lib/hash';
import crypto from 'crypto';

// In-memory brute-force rate limiter: email -> { count: number, firstAttempt: number }
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 7;
  
  const record = loginAttempts.get(key);
  if (!record) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (now - record.firstAttempt > windowMs) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count += 1;
  return true;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function logoutUser() {
  await clearSession();
  redirect('/login');
}

export async function registerUser(formData: FormData) {
  // 🛡️ Run Inbuilt Spam & Spambot Audit
  const check = validateSpamVectors(formData);
  if (check.isSpam) {
    // Quietly reject bots without letting them know exactly how they failed
    redirect('/?error=verification_failed');
  }

  const rawEmail = (formData.get('email') as string || '').trim();
  const name = (formData.get('name') as string || '').trim();
  const password = formData.get('password') as string;
  const referrerId = (formData.get('referrerId') as string || '').trim();
  
  if (!rawEmail) return { error: 'Email address is required.' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawEmail)) {
    return { error: 'Please enter a valid Email address.' };
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.error || 'Password cannot start with a space or be blank.' };
  }

  const normalizedEmail = rawEmail.toLowerCase();

  try {
    const allowPasswordSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_PASSWORD' } });
    if (allowPasswordSetting && allowPasswordSetting.value === 'false') {
      return { error: 'Password-based registration is currently disabled. Please use Google Sign-In.' };
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    });

    if (existing) {
      return { error: 'already_registered' };
    }
    
    const hashedPassword = password ? hashPassword(password) : null;

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        plan: 'FREE',
        planInterval: 'YEARLY',
        password: hashedPassword,
        forcePasswordChange: false
      }
    });

    // 🎁 Process Referral Rewards if a referrer is present (Bug #54 fix: Anti-farming caps)
    if (referrerId) {
      try {
        const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
        if (referrer && referrer.email.toLowerCase() !== normalizedEmail) {
          // 1. Log the referral connection
          await prisma.referral.create({
            data: {
              referrerId: referrerId,
              referredEmail: normalizedEmail
            }
          });

          // 2. Cap referral coin awards: max 10 coin awards per calendar month to prevent bot farming
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const monthlyReferralCount = await prisma.referral.count({
            where: {
              referrerId: referrerId,
              createdAt: { gte: startOfMonth }
            }
          });

          if (monthlyReferralCount <= 10) {
            await prisma.user.update({
              where: { id: referrerId },
              data: { coins: { increment: 10 } }
            });
          }

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

    let rememberMe = false;
    if (formData.get('rememberMe') === 'on' || formData.get('rememberMe') === 'true') {
      rememberMe = true;
    }

    // 🔑 Set session cookie to log the user in instantly
    await setSessionUser(normalizedEmail, rememberMe);

    // Trigger fire-and-forget welcome email execution pipeline
    sendWelcomeEmail(normalizedEmail, name || normalizedEmail.split('@')[0]).catch(e => {});
    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: `Registration failed: ${error?.message || String(error)}` };
  }
}

export async function loginUser(formData: FormData) {
  // 🛡️ Run Integrated Anti-Spam Safeguard
  const spamCheck = validateSpamVectors(formData);
  if (spamCheck.isSpam) {
    return { error: 'spam_detected' };
  }

  const rawEmail = (formData.get('email') as string || '').trim();
  const password = formData.get('password') as string;
  if (!rawEmail) {
    return { error: 'Email or Username is required.' };
  }

  const normalizedEmail = rawEmail.toLowerCase();

  // Validate format if input is an email address
  if (rawEmail.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return { error: 'The email address entered is invalid.' };
    }
  }

  try {
    const allowPasswordSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTH_ALLOW_PASSWORD' } });
    if (allowPasswordSetting && allowPasswordSetting.value === 'false') {
      return { error: 'Password-based login is currently disabled. Please sign in using Google.' };
    }

    if (!checkRateLimit(normalizedEmail)) {
      return { error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' };
    }

    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: normalizedEmail, mode: 'insensitive' }
      } 
    });

    if (!user) {
      return { error: 'Email address is invalid / not registered.' };
    }

    // If migrated user from WordPress, intercept login to force reset
    if (user.forcePasswordChange) {
      return { error: 'force_password_change' };
    }

    // Check if account has a password set
    if (!user.password) {
      return { error: 'This account was created via Google Sign-In or has no password set. Please sign in with Google or use "Forgot Password".' };
    }

    // Verify salted / legacy password
    if (!password || !verifyPassword(password, user.password)) {
      return { error: 'Incorrect password.' };
    }

    // Successful login: clear failed attempts
    clearRateLimit(normalizedEmail);

    // Transparently upgrade legacy unsalted SHA-256 hashes to modern salted scrypt
    if (!user.password.startsWith('s2$')) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) }
      }).catch(() => {});
    }

    let rememberMe = false;
    if (formData.get('rememberMe') === 'on' || formData.get('rememberMe') === 'true') {
      rememberMe = true;
    }

    await setSessionUser(user.email, rememberMe);
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
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.error || 'Password cannot start with a space or be blank.' };
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

    // Verify configured client ID and audience
    if (!configuredClientId) {
      return { error: 'Google Sign-In is not fully configured (missing Client ID). Please contact administrator.' };
    }
    if (tokenInfo.aud !== configuredClientId) {
      return { error: 'Google authentication audience mismatch.' };
    }

    // Verify Google email verification status
    if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true) {
      return { error: 'Your Google account email is not verified by Google.' };
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

export async function requestPasswordReset(formData: FormData) {
  const rawEmail = (formData.get('email') as string || '').trim();
  if (!rawEmail) return { error: 'Email address is required.' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawEmail)) {
    return { error: 'Please enter a valid Email address.' };
  }

  const normalizedEmail = rawEmail.toLowerCase();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    });

    if (!user) {
      return { error: 'No account found with this email address. Please check for typos or register.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour token validity

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires }
    });

    // Dynamically resolve base URL for reset link with strict host validation against header poisoning
    let origin = process.env.NEXT_PUBLIC_BASE_URL || '';
    if (!origin) {
      try {
        const { headers } = await import('next/headers');
        const headerList = await headers();
        const host = (headerList.get('host') || '').toLowerCase().trim();
        const proto = headerList.get('x-forwarded-proto') || 'https';
        
        // Allowed hosts whitelist preventing Host header injection / poisoning
        const allowedHosts = [
          'digitalsanskrit.com',
          'www.digitalsanskrit.com',
          'new.digitalsanskrit.com',
          'vyoma-ott-platform.vercel.app',
          'localhost:3000'
        ];
        
        if (allowedHosts.includes(host) || host.endsWith('.amplifyapp.com') || host.endsWith('.vercel.app')) {
          origin = `${proto}://${host}`;
        }
      } catch (e) {}
    }
    if (!origin) origin = 'https://new.digitalsanskrit.com';

    const resetUrl = `${origin}/reset-password?token=${resetToken}`;
    
    const mailResult = await sendPasswordResetEmail(user.email, resetUrl);
    
    if (mailResult && !mailResult.success) {
      console.error("Password reset mail error:", mailResult.reason);
      if (mailResult.reason?.includes('SMTP')) {
        return { error: 'Mail gateway is not configured. Please contact admin to set up SMTP settings in Admin Panel.' };
      }
      return { error: `Failed to dispatch recovery email: ${mailResult.reason}` };
    }

    return { success: true };
  } catch (e: any) {
    console.error("Failed to request password reset:", e);
    return { error: 'Failed to request password reset. Please try again.' };
  }
}

export async function resetPasswordWithToken(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  if (!token) return { error: 'Missing reset token.' };
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.error || 'Password cannot start with a space or be blank.' };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return { error: 'Invalid or expired password reset token' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword(password),
        resetToken: null,
        resetTokenExpires: null,
        forcePasswordChange: false
      }
    });

    return { success: true };
  } catch (e) {
    console.error("Failed to reset password", e);
    return { error: 'Failed to reset password' };
  }
}

