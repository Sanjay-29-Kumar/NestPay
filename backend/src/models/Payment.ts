import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  rentId: mongoose.Types.ObjectId;
  amount: number; // In INR / Main currency unit
  currency: string;
  paymentProvider: string; // 'razorpay'
  providerOrderId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string; // 'upi', 'card', 'netbanking', 'wallet', 'qr'
  receiptNo: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rentId: {
      type: Schema.Types.ObjectId,
      ref: 'Rent',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentProvider: {
      type: String,
      default: 'razorpay',
    },
    providerOrderId: {
      type: String,
      required: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
    },
    providerSignature: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
