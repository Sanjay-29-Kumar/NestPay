import { Schema, model, Document, Types } from "mongoose";

export interface IFamilyRequest extends Document {
    organizationId: Types.ObjectId;
    unitId: Types.ObjectId;
    familyHeadUserId: Types.ObjectId;
    familyHeadCustomerId?: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    relationship: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const familyRequestSchema = new Schema<IFamilyRequest>(
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
        familyHeadUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        familyHeadCustomerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
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
        relationship: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
            index: true,
        },
        rejectionReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

familyRequestSchema.index({ organizationId: 1, status: 1 });

const FamilyRequest = model<IFamilyRequest>("FamilyRequest", familyRequestSchema);

export default FamilyRequest;
