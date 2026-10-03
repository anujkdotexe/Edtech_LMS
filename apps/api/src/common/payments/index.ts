import crypto from 'crypto';
import { IPaymentGateway, CreateOrderParams, PaymentOrderResult, VerifyPaymentParams } from './payment.interface';

export class MockPaymentGateway implements IPaymentGateway {
  readonly providerName = 'MOCK';

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const orderId = 'order_mock_' + crypto.randomBytes(6).toString('hex');
    return {
      orderId,
      amount: params.amount,
      currency: 'USD',
      provider: 'MOCK',
    };
  }

  async verifyPayment(_params: VerifyPaymentParams): Promise<boolean> {
    return true;
  }
}

export class RazorpayPaymentGateway implements IPaymentGateway {
  readonly providerName = 'RAZORPAY';
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (!this.keyId || !this.keySecret) {
      console.warn('[WARN] Razorpay keys not configured. Falling back to sandbox simulator.');
      const orderId = 'order_rzp_mock_' + crypto.randomBytes(6).toString('hex');
      return {
        orderId,
        amount: params.amount,
        currency: 'INR',
        provider: 'RAZORPAY',
        keyId: this.keyId || 'rzp_test_mock',
      };
    }

    // Amount in smallest unit (paise)
    const amountInPaise = Math.round(params.amount * 100);
    const apiBase = process.env.RAZORPAY_API_BASE || 'http://localhost:4000/api/mock-gateway';
    const authHeader = 'Basic ' + Buffer.from(`${this.keyId || 'rzp_test_mock'}:${this.keySecret || 'mock_secret'}`).toString('base64');

    const res = await fetch(`${apiBase}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${params.courseId.slice(0, 8)}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[ERROR] Razorpay order creation failed: ${err}`);
      throw new Error('Failed to initiate Razorpay checkout order');
    }

    const data: any = await res.json();
    return {
      orderId: data.id,
      amount: params.amount,
      currency: data.currency,
      provider: 'RAZORPAY',
      keyId: this.keyId,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!this.keySecret) return true;
    if (!params.signature) return false;

    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === params.signature;
  }
}

export * from './payment.interface';

function createPaymentGateway(): IPaymentGateway {
  const provider = (process.env.PAYMENT_PROVIDER || 'MOCK').toUpperCase();
  if (provider === 'RAZORPAY') {
    return new RazorpayPaymentGateway();
  }
  return new MockPaymentGateway();
}

export const paymentGateway = createPaymentGateway();
