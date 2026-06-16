import RazorpayCheckoutButton from '@/app/components/RazorpayCheckoutButton';
import { createRazorpayOrder } from '@/app/actions/razorpay';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function CheckoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const courseId = params.id;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=/checkout/${courseId}`);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    redirect('/');
  }

  const isAbroad = user.country && user.country !== 'IN';
  const amount = isAbroad ? (course.priceUSD || Math.ceil((course.price || 299) / 80)) : (course.price || 299);
  const currency: 'INR' | 'USD' = isAbroad ? 'USD' : 'INR';

  // 1. Pre-fetch real Razorpay Order
  const orderResult = await createRazorpayOrder({ amount, currency });

  // 2. Server Action for Payment Validation
  async function handleCompletePurchase(responsePayload: any) {
    "use server";
    
    await prisma.purchase.create({
      data: {
        userId: user!.id,
        courseId: course!.id,
        amount: amount,
        razorpayOrderId: responsePayload.razorpay_order_id || orderResult.orderId,
        razorpayPaymentId: responsePayload.razorpay_payment_id || 'mock_pay',
        billingAddress: user!.address || 'Registered Profile Address',
        placeOfSupply: user!.state || 'Karnataka'
      }
    });

    await prisma.user.update({
      where: { id: user!.id },
      data: { coins: { increment: 50 } }
    });

    // 💬 WhatsApp Checkout Automation Dispatch
    const { sendWhatsAppMessage, getWhatsAppSettings } = await import('@/lib/whatsapp');
    if (user!.phone) {
      const settings = await getWhatsAppSettings();
      if (settings.enabled && settings.templates.subscription) {
         sendWhatsAppMessage(user!.phone, settings.templates.subscription, 'en_US', [
           { type: "text", text: user!.name || 'Valued Student' },
           { type: "text", text: course!.title }
         ]).catch(console.error);
      }
    }

    revalidatePath(`/watch/${courseId}`);
    redirect(`/watch/${courseId}`);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
       
       <div style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', background: '#111', border: '1px solid #222', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          
          {/* INVOICE DECK */}
          <div style={{ padding: '40px', borderRight: '1px solid #222' }}>
             <Link href={`/watch/${courseId}`} style={{ textDecoration: 'none', color: '#777', fontSize: '0.85rem', fontWeight: 800 }}>← RETURN TO PREVIEW</Link>
             <h1 style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 900 }}>🛒 Checkout & Unlock</h1>
             <p style={{ color: '#666', fontSize: '0.9rem' }}>Complete secure micro-transaction to bind this course to your profile permanently.</p>
             
             <div style={{ marginTop: '40px', background: '#000', borderRadius: '16px', padding: '25px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                   <img src={course.thumbnailUrl || 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg'} style={{ width: '100px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                   <div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{course.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 'bold' }}>INDIVIDUAL LIFETIME ACCESS</div>
                   </div>
                </div>
                
                <div style={{ height: '1px', background: '#222', margin: '25px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <span style={{ color: '#777' }}>Course Listing Value</span>
                   <span>{isAbroad ? '$' : '₹'}{isAbroad ? amount : (amount / 1.18).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <span style={{ color: '#777' }}>{isAbroad ? 'Export GST (0%)' : 'Integrated GST (18%)'}</span>
                   <span>{isAbroad ? '$0.00' : `₹${(amount - amount / 1.18).toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff', marginTop: '15px' }}>
                   <span>Total Due</span>
                   <span style={{ color: 'var(--primary)' }}>{isAbroad ? '$' : '₹'}{amount}</span>
                </div>
             </div>

             {isAbroad && (
               <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(70,211,105,0.1)', color: '#46d369', borderRadius: '6px', fontSize: '0.8rem' }}>
                 🔒 Profile locked to International Billing ({user.country}). Rupee (INR) bypass disabled.
               </div>
             )}

             <div style={{ marginTop: '30px', fontSize: '0.75rem', color: '#555', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔒 SSL Encrypted</span>
                <span>•</span>
                <span>📄 Instant Invoice Generated</span>
                <span>•</span>
                <span>🚀 50 Vyoma Coins Awarded</span>
             </div>
          </div>

          {/* ACTION PANEL */}
          <div style={{ padding: '40px', background: 'linear-gradient(145deg, #151515, #0d0d0d)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <div style={{ background: '#000', padding: '20px', borderRadius: '12px', border: '1px solid #222', marginBottom: '30px' }}>
                <div style={{ color: '#777', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Purchasing Profile</div>
                <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '0.95rem' }}>{user.name || user.email}</div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>Email: {user.email} | Country: {user.country || 'IN'}</div>
             </div>

             {orderResult.success ? (
               <RazorpayCheckoutButton 
                 amount={amount}
                 currency={currency}
                 name="Vyoma Ott"
                 description={`Purchase: ${course.title}`}
                 orderId={orderResult.orderId}
                 publicKey={orderResult.publicKey as string}
                 onSuccess={handleCompletePurchase}
                 onError={async (err: any) => {
                   "use server";
                   console.error("Payment failed", err);
                 }}
               />
             ) : (
               <div style={{ color: 'red', textAlign: 'center' }}>Failed to initialize payment gateway. Please try again.</div>
             )}
             
             <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href={`/watch/${courseId}`} style={{ color: '#555', fontSize: '0.8rem', textDecoration: 'underline' }}>Cancel transaction</Link>
             </div>
          </div>

       </div>
    </main>
  );
}
