import { Schema, model, Document, Types } from "mongoose";

export interface IMembership extends Document {
    userId: Types.ObjectId;
    organizationId: Types.ObjectId;
    role: "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF" | "TENANT" | "MEMBER";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: Date;
    updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        role: {
            type: String,
            enum: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"],
            required: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index ensuring a user has only ONE membership per organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const Membership = model<IMembership>("Membership", membershipSchema);

export default Membership;
