import type { PaymentOrder } from '../api/types';

// Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
// Mock orders (server without Razorpay keys) never load the script; the app shows a test panel.

interface CheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loader: Promise<void> | null = null;

const loadCheckout = (): Promise<void> => {
  if (window.Razorpay) return Promise.resolve();
  loader ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Could not load Razorpay. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return loader;
};

// Show only the chosen method. For UPI, Checkout displays a scannable QR on desktop and opens
// the UPI app on mobile; the payment is tied to our order, so it confirms automatically.
const displayConfig = (method: PaymentOrder['method']) => {
  const upi = method === 'upi_qr';
  return {
    display: {
      blocks: {
        chosen: {
          name: upi ? 'Pay by UPI' : 'Pay by card',
          instruments: [{ method: upi ? 'upi' : 'card' }],
        },
      },
      sequence: ['block.chosen'],
      preferences: { show_default_blocks: false },
    },
  };
};

export interface CheckoutResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// Opens Razorpay Checkout. Resolves with the signed result on success, or with null and the
// last failure reason when the customer closes it (Checkout lets them retry failed attempts).
export const openCheckout = async (
  order: PaymentOrder,
  details: { name: string; phone: string; email?: string | null; description: string },
): Promise<{ result: CheckoutResult | null; error?: string }> => {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay is not available right now.');

  return new Promise((resolve) => {
    let lastError: string | undefined;
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'The Riverside Cricket Box',
      description: details.description,
      prefill: { name: details.name, contact: `+91${details.phone}`, email: details.email ?? undefined },
      config: displayConfig(order.method),
      theme: { color: '#0f6b47' },
      retry: { enabled: true },
      handler: (response: CheckoutSuccess) =>
        resolve({
          result: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        }),
      modal: { ondismiss: () => resolve({ result: null, error: lastError }), confirm_close: true },
    });
    checkout.on('payment.failed', (response) => {
      lastError = response.error?.description ?? 'Payment failed. No money has been deducted.';
    });
    checkout.open();
  });
};

// Payment links: Checkout with every method the account supports (UPI, cards, netbanking,
// wallets). Same result shape as openCheckout.
export const openStandardCheckout = async (options: {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  name: string;
  description: string;
  prefill: { name: string; contact: string; email: string | null };
}): Promise<{ result: CheckoutResult | null; error?: string }> => {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay is not available right now.');

  return new Promise((resolve) => {
    let lastError: string | undefined;
    const checkout = new Razorpay({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency,
      order_id: options.razorpayOrderId,
      name: options.name,
      description: options.description,
      prefill: { name: options.prefill.name, contact: `+91${options.prefill.contact}`, email: options.prefill.email ?? undefined },
      readonly: { contact: true },
      theme: { color: '#062019' },
      retry: { enabled: true },
      handler: (response: CheckoutSuccess) =>
        resolve({
          result: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        }),
      modal: { ondismiss: () => resolve({ result: null, error: lastError }), confirm_close: true },
    });
    checkout.on('payment.failed', (response) => {
      lastError = response.error?.description ?? 'Payment failed. No money has been deducted.';
    });
    checkout.open();
  });
};
