import { Schema, model, Document, Types } from "mongoose";

export interface IPaymentConfirmationRecipient {
    name: string;
    phone: string;
    email: string;
    role?: string;
}

export interface IPaymentConfirmationLog extends Document {
    organizationId: Types.ObjectId;
    unitId: Types.ObjectId;
    invoiceId?: Types.ObjectId;
    paymentId?: Types.ObjectId;
    sentAt: Date;
    channels: string[]; // ["WhatsApp", "In-App", "Email"]
    recipients: IPaymentConfirmationRecipient[];
    amount: number;
    paymentMode: string; // "CASH" | "UPI" | "GPay" | "Bank Transfer" | "APP" | "OTHER"
    status: "SUCCESS" | "FAILED" | "PARTIAL";
    details?: string;
    createdAt: Date;
    updatedAt: Date;
}

const paymentConfirmationLogSchema = new Schema<IPaymentConfirmationLog>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
            index: true,
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
        },
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        channels: {
            type: [String],
            default: ["WhatsApp", "In-App", "Email"],
        },
        recipients: [
            {
                name: { type: String, required: true },
                phone: { type: String, default: "" },
                email: { type: String, default: "" },
                role: { type: String, default: "" },
            },
        ],
        amount: {
            type: Number,
            required: true,
        },
        paymentMode: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "PARTIAL"],
            default: "SUCCESS",
        },
        details: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

paymentConfirmationLogSchema.index({ unitId: 1, sentAt: -1 });

const PaymentConfirmationLog = model<IPaymentConfirmationLog>(
    "PaymentConfirmationLog",
    paymentConfirmationLogSchema
);
export default PaymentConfirmationLog;
