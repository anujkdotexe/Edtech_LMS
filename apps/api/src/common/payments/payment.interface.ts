export interface CreateOrderParams {
  courseId: string;
  courseTitle: string;
  amount: number;
  userId: string;
  userEmail: string;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'MOCK' | 'RAZORPAY' | 'STRIPE';
  clientSecret?: string;
  keyId?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface IPaymentGateway {
  readonly providerName: string;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
}
