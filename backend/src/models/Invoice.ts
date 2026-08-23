import { Schema, model, Document, Types } from "mongoose";

export enum InvoiceStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    PARTIALLY_PAID = "PARTIALLY_PAID",
}

export interface IInvoice extends Document {
    organizationId: Types.ObjectId;
    propertyId: Types.ObjectId;
    unitId: Types.ObjectId;
    billingPeriod: string; // e.g. "2026-08" or "August 2026"
    dueDate: Date;
    defaultRentAmount: number;
    overrideAmount?: number;
    totalAmount: number;
    status: InvoiceStatus;
    isEstablished?: boolean;
    paidAt?: Date;
    paymentMode?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
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
            required: true,
            index: true,
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
            index: true,
        },
        billingPeriod: {
            type: String,
            required: true,
            index: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        defaultRentAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        overrideAmount: {
            type: Number,
            default: undefined,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(InvoiceStatus),
            default: InvoiceStatus.UNPAID,
            index: true,
        },
        isEstablished: {
            type: Boolean,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        paymentMode: {
            type: String,
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index({ unitId: 1, billingPeriod: 1 }, { unique: true });

const Invoice = model<IInvoice>("Invoice", invoiceSchema);
export default Invoice;
