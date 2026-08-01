import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    message: string;
    type: "INVITATION" | "SYSTEM";
    invitationToken?: string;
    organizationId?: Types.ObjectId;
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
            enum: ["INVITATION", "SYSTEM"],
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
