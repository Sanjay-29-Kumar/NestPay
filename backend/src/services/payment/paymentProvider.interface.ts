export interface CreateOrderParams {
  amount: number; // in INR
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreatedOrderResult {
  orderId: string;
  amount: number; // in paise for Razorpay
  currency: string;
  receipt: string;
  status: string;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface IPaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CreatedOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams): boolean;
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean;
}
