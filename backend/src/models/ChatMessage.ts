import { Schema, model, Document, Types } from "mongoose";

export interface IChatAttachment {
    url: string;
    fileName?: string;
    mimeType?: string;
}

export interface IChatMessage extends Document {
    unitId: Types.ObjectId;
    organizationId: Types.ObjectId;
    senderId?: Types.ObjectId;
    senderName: string;
    senderRole: "OWNER" | "ADMIN" | "MANAGER" | "TENANT" | "SYSTEM";
    messageType: "TEXT" | "IMAGE" | "SYSTEM";
    text: string;
    attachments: IChatAttachment[];
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
    {
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
            index: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        senderName: {
            type: String,
            required: true,
            trim: true,
        },
        senderRole: {
            type: String,
            enum: ["OWNER", "ADMIN", "MANAGER", "TENANT", "SYSTEM"],
            default: "TENANT",
        },
        messageType: {
            type: String,
            enum: ["TEXT", "IMAGE", "SYSTEM"],
            default: "TEXT",
        },
        text: {
            type: String,
            default: "",
        },
        attachments: [
            {
                url: { type: String, required: true },
                fileName: { type: String, default: "" },
                mimeType: { type: String, default: "" },
            },
        ],
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);

export default ChatMessage;
