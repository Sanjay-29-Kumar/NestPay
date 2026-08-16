import mongoose, { Schema, Document } from "mongoose";

export enum PaymentStatus {
    PENDING = "PENDING",
    PAID_APP = "PAID_APP",
    PAID_MANUAL = "PAID_MANUAL",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
}

export interface IPayment extends Document {
    organizationId: mongoose.Types.ObjectId;
    propertyId?: mongoose.Types.ObjectId;
    unitId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    rentId?: mongoose.Types.ObjectId;
    invoiceId?: mongoose.Types.ObjectId;
    amount: number; // In INR
    currency: string;
    paymentMode: "APP" | "MANUAL";
    paymentProvider?: string; // 'razorpay'
    providerOrderId?: string;
    providerPaymentId?: string;
    providerSignature?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: string; // 'upi', 'card', 'netbanking', 'wallet', 'qr'
    manualPaymentType?: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
    manualNote?: string;
    markedBy?: mongoose.Types.ObjectId;
    markedAt?: Date;
    paidDate?: Date;
    receiptNo: string;
    invoiceMonth?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
            index: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rentId: {
            type: Schema.Types.ObjectId,
            ref: "Rent",
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        currency: {
            type: String,
            default: "INR",
        },
        paymentMode: {
            type: String,
            enum: ["APP", "MANUAL"],
            default: "APP",
        },
        paymentProvider: {
            type: String,
            default: "razorpay",
        },
        providerOrderId: {
            type: String,
            index: true,
        },
        providerPaymentId: {
            type: String,
            index: true,
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
        manualPaymentType: {
            type: String,
            enum: ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"],
        },
        manualNote: {
            type: String,
        },
        markedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        markedAt: {
            type: Date,
        },
        paidDate: {
            type: Date,
        },
        receiptNo: {
            type: String,
            required: true,
        },
        invoiceMonth: {
            type: String,
            default: "August 2026",
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
