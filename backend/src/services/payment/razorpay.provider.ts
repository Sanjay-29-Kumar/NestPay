import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
  IPaymentProvider,
  CreateOrderParams,
  CreatedOrderResult,
  VerifySignatureParams,
} from './paymentProvider.interface.js';

export class RazorpayProvider implements IPaymentProvider {
  private getInstance(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from backend/.env environment file.'
      );
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  private getKeySecret(): string {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error('RAZORPAY_KEY_SECRET is missing from environment file.');
    }
    return keySecret;
  }

  async createOrder(params: CreateOrderParams): Promise<CreatedOrderResult> {
    const rzp = this.getInstance();
    // Razorpay accepts amount in paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(params.amount * 100);

    const options = {
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    };

    const order = await rzp.orders.create(options);

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || params.receipt,
      status: order.status,
    };
  }

  verifyPaymentSignature(params: VerifySignatureParams): boolean {
    const { orderId, paymentId, signature } = params;
    const secret = this.getKeySecret();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  }
}

export const razorpayProvider = new RazorpayProvider();
