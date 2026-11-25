import Razorpay from 'razorpay';
import prisma from './prisma';

/**
 * Direct runtime-resilient fetch helper bypassing Prisma model caching
 */
async function getSafeSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || "";
  } catch (e) {
    return "";
  }
}

/**
 * Dynamically instantiates the Razorpay SDK using the current active
 * keys loaded from the Admin configuration table in the Database,
 * enabling live hot-swapping of production environments without redeploy.
 */
export async function getRazorpayClient() {
  const key_id = (await getSafeSetting('RAZORPAY_KEY_ID')) || process.env.RAZORPAY_KEY_ID;
  const key_secret = (await getSafeSetting('RAZORPAY_KEY_SECRET')) || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials missing. Please configure via Admin Payment Orchestration console.");
  }

  return new Razorpay({
    key_id,
    key_secret
  });
}

/**
 * Helper to retrieve just the public-facing key for standard client-side checkout injection.
 */
export async function getRazorpayPublicKey() {
  return (await getSafeSetting('RAZORPAY_KEY_ID')) || process.env.RAZORPAY_KEY_ID || "";
}

/**
 * Helper to retrieve Razorpay secret key securely on the server.
 */
export async function getRazorpaySecretKey() {
  return (await getSafeSetting('RAZORPAY_KEY_SECRET')) || process.env.RAZORPAY_KEY_SECRET || "";
}

/**
 * Cryptographically verifies one-time order payment signature.
 */
export async function verifyRazorpayOrderSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const secret = await getRazorpaySecretKey();
  if (!secret || !orderId || !paymentId || !signature) return false;
  try {
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * Cryptographically verifies recurring mandate subscription payment signature.
 */
export async function verifyRazorpaySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string): Promise<boolean> {
  const secret = await getRazorpaySecretKey();
  if (!secret || !subscriptionId || !paymentId || !signature) return false;
  try {
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', secret).update(`${paymentId}|${subscriptionId}`).digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}
