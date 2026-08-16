import { Schema, model, Document, Types } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    displayName?: string;
    slug: string;
    logo?: string;
    description?: string;
    organizationType: "APARTMENT" | "RENTAL_PROPERTY" | "BUSINESS" | "SCHOOL" | "COMMUNITY" | "SMALL_ORGANIZATION" | "SERVICE_PROVIDER" | "OTHER";
    registrationNumber?: string;
    gstVat?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    currency: string;
    timezone: string;
    language: string;
    ownerId: Types.ObjectId;
    status: "ACTIVE" | "SUSPENDED";
    allowTenantRoommateVisibility?: boolean;
    bankDetails?: {
        upiId?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
    };
    razorpayConfig?: {
        keyId?: string;
        keySecret?: string;
        isConfigured?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        displayName: {
            type: String,
            trim: true,
            default: "",
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        logo: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        organizationType: {
            type: String,
            enum: [
                "APARTMENT",
                "RENTAL_PROPERTY",
                "BUSINESS",
                "SCHOOL",
                "COMMUNITY",
                "SMALL_ORGANIZATION",
                "SERVICE_PROVIDER",
                "OTHER",
            ],
            default: "APARTMENT",
        },
        registrationNumber: {
            type: String,
            default: "",
        },
        gstVat: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            default: "",
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        website: {
            type: String,
            default: "",
            trim: true,
        },
        address: {
            type: String,
            default: "",
        },
        country: {
            type: String,
            default: "",
        },
        state: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            default: "",
        },
        postalCode: {
            type: String,
            default: "",
        },
        currency: {
            type: String,
            default: "USD",
        },
        timezone: {
            type: String,
            default: "UTC",
        },
        language: {
            type: String,
            default: "en",
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
        allowTenantRoommateVisibility: {
            type: Boolean,
            default: true,
        },
        bankDetails: {
            upiId: { type: String, default: "" },
            accountHolderName: { type: String, default: "" },
            accountNumber: { type: String, default: "" },
            ifscCode: { type: String, default: "" },
            bankName: { type: String, default: "" },
        },
        razorpayConfig: {
            keyId: { type: String, default: "" },
            keySecret: { type: String, default: "" },
            isConfigured: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

const Organization = model<IOrganization>("Organization", organizationSchema);

export default Organization;
