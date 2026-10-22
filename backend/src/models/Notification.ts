import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    message: string;
    type: "INVITATION" | "SYSTEM" | "IN_APP_MESSAGE" | "PAYMENT_REMINDER" | "PAYMENT_CONFIRMATION" | "MANUAL_WHATSAPP_ACTION" | "RENT_DUE";
    invitationToken?: string;
    organizationId?: Types.ObjectId;
    unitId?: Types.ObjectId;
    senderName?: string;
    metadata?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["INVITATION", "SYSTEM", "IN_APP_MESSAGE", "PAYMENT_REMINDER", "PAYMENT_CONFIRMATION", "MANUAL_WHATSAPP_ACTION", "RENT_DUE"],
            default: "SYSTEM",
        },
        invitationToken: {
            type: String,
            default: null,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            default: null,
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            default: null,
        },
        senderName: {
            type: String,
            default: "",
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = model<INotification>("Notification", notificationSchema);

export default Notification;
