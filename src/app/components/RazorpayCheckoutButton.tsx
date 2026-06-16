'use client';

import { useEffect, useState } from 'react';

interface CheckoutProps {
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  publicKey: string;
  name: string;
  description: string;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  buttonText?: string;
}

export default function RazorpayCheckoutButton(props: CheckoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Inject Razorpay checkout script if not present
    if (document.getElementById('razorpay-checkout-script')) {
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handlePayment = () => {
    if (!isLoaded || !window.Razorpay) {
      props.onError(new Error("Razorpay SDK not loaded"));
      return;
    }

    const options: any = {
      key: props.publicKey,
      amount: Math.round(props.amount * 100),
      currency: props.currency,
      name: props.name,
      description: props.description,
      image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png',
      handler: function (response: any) {
        props.onSuccess(response);
      },
      prefill: {
        name: 'Guest User',
        email: 'user@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#f26422'
      }
    };

    if (props.subscriptionId) {
      options.subscription_id = props.subscriptionId;
    } else if (props.orderId) {
      options.order_id = props.orderId;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      props.onError(response.error);
    });
    rzp.open();
  };

  return (
    <button 
      onClick={handlePayment}
      style={{ 
        width: '100%', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
        color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', 
        fontWeight: 900, cursor: 'pointer', fontSize: '1.05rem', 
        boxShadow: '0 15px 40px rgba(242,100,34,0.3)', transition: 'transform 0.2s' 
      }}
    >
      {props.buttonText || '💳 PAY & UNLOCK INSTANTLY'}
    </button>
  );
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
