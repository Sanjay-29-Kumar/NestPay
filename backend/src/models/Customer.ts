import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
    organizationId: Types.ObjectId;
    propertyId?: Types.ObjectId;
    unitId?: Types.ObjectId;
    userId?: Types.ObjectId;
    photo?: string;
    name: string;
    email: string;
    phone: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    occupation?: string;
    nationality?: string;
    governmentIds?: Array<{
        idType: string;
        idNumber: string;
        documentUrl?: string;
    }>;
    documents?: string[];
    occupancyRole?: "Single" | "Family Head" | "Sharing" | "Family Member";
    familyHeadId?: Types.ObjectId;
    moveInDate?: Date;
    status: "ACTIVE" | "PAST" | "PENDING";
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            default: null,
        },
        unitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            default: null,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        photo: {
            type: String,
            default: "",
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        emergencyContact: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            relationship: { type: String, default: "" },
        },
        occupation: {
            type: String,
            default: "",
        },
        nationality: {
            type: String,
            default: "",
        },
        governmentIds: [
            {
                idType: { type: String, required: true },
                idNumber: { type: String, required: true },
                documentUrl: { type: String, default: "" },
            },
        ],
        documents: {
            type: [String],
            default: [],
        },
        occupancyRole: {
            type: String,
            enum: ["Single", "Family Head", "Sharing", "Family Member"],
            default: "Single",
        },
        familyHeadId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        moveInDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PAST", "PENDING"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

customerSchema.index({ organizationId: 1, email: 1 });

const Customer = model<ICustomer>("Customer", customerSchema);

export default Customer;
