import { Schema, model, Document, Types } from "mongoose";

export interface IReminderLogRecipient {
    name: string;
    phone: string;
    email: string;
    role?: string;
}

export interface IReminderLog extends Document {
    organizationId: Types.ObjectId;
    unitId: Types.ObjectId;
    invoiceId?: Types.ObjectId;
    sentAt: Date;
    channels: string[]; // ["WhatsApp", "In-App", "Email"]
    recipients: IReminderLogRecipient[];
    dayRule: string; // e.g. "Day 1 — Primary Tenant", "Day 10 — All Tenants", "Amount Changed", "Manual Issue Payment"
    messageType: "REMINDER" | "AMOUNT_SET" | "AMOUNT_CHANGED" | "MANUAL_ISSUE";
    amount: number;
    dueDate: Date;
    status: "SUCCESS" | "FAILED" | "PARTIAL";
    details?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reminderLogSchema = new Schema<IReminderLog>(
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
        dayRule: {
            type: String,
            required: true,
        },
        messageType: {
            type: String,
            enum: ["REMINDER", "AMOUNT_SET", "AMOUNT_CHANGED", "MANUAL_ISSUE"],
            default: "REMINDER",
        },
        amount: {
            type: Number,
            required: true,
        },
        dueDate: {
            type: Date,
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

reminderLogSchema.index({ unitId: 1, sentAt: -1 });

const ReminderLog = model<IReminderLog>("ReminderLog", reminderLogSchema);
export default ReminderLog;
