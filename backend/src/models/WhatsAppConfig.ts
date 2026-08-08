import { Schema, model, Document, Types } from "mongoose";

export interface IWhatsAppConfig extends Document {
    organizationId: Types.ObjectId;
    provider: "META_CLOUD_API";
    phoneNumberId: string;
    businessAccountId: string;
    displayName?: string;
    status: "ACTIVE" | "INACTIVE" | "PENDING";
    createdAt: Date;
    updatedAt: Date;
}

const whatsAppConfigSchema = new Schema<IWhatsAppConfig>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        provider: {
            type: String,
            enum: ["META_CLOUD_API"],
            default: "META_CLOUD_API",
        },
        phoneNumberId: {
            type: String,
            required: true,
            trim: true,
        },
        businessAccountId: {
            type: String,
            required: true,
            trim: true,
        },
        displayName: {
            type: String,
            default: "NestPay Notifications",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "PENDING"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

const WhatsAppConfig = model<IWhatsAppConfig>("WhatsAppConfig", whatsAppConfigSchema);

export default WhatsAppConfig;
