import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    isEmailVerified: boolean;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    
    // Profile Fields
    fullName?: string;
    displayName?: string;
    photo?: string;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
    dateOfBirth?: Date;
    phone?: string;
    alternatePhone?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    preferredLanguage?: string;
    theme?: "LIGHT" | "DARK" | "SYSTEM";
    timezone?: string;
    notificationPreferences?: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
    };
    securitySettings?: {
        twoFactorEnabled: boolean;
    };
    profileCompletionPercentage: number;

    // Audit history for names and mobile numbers
    previousNames?: Array<{ name: string; updatedAt: Date }>;
    previousPhones?: Array<{ phone: string; updatedAt: Date }>;

    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        googleId: {
            type: String,
            default: null,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
            default: "ACTIVE",
        },

        // Profile Fields
        fullName: {
            type: String,
            trim: true,
            default: "",
        },
        displayName: {
            type: String,
            trim: true,
            default: "",
        },
        photo: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
            default: "PREFER_NOT_TO_SAY",
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        alternatePhone: {
            type: String,
            default: "",
            trim: true,
        },
        emergencyContact: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            relationship: { type: String, default: "" },
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
        preferredLanguage: {
            type: String,
            default: "en",
        },
        theme: {
            type: String,
            enum: ["LIGHT", "DARK", "SYSTEM"],
            default: "SYSTEM",
        },
        timezone: {
            type: String,
            default: "UTC",
        },
        notificationPreferences: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false },
        },
        securitySettings: {
            twoFactorEnabled: { type: Boolean, default: false },
        },
        profileCompletionPercentage: {
            type: Number,
            default: 10,
        },
        previousNames: [
            {
                name: { type: String, required: true },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        previousPhones: [
            {
                phone: { type: String, required: true },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User = model<IUser>("User", userSchema);

export default User;