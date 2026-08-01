import { Schema, model, Document, Types } from "mongoose";

export interface IInvitation extends Document {
    organizationId: Types.ObjectId;
    email: string;
    role: "OWNER" | "ADMIN" | "TENANT" | "MEMBER";
    invitedByUserId: Types.ObjectId;
    token: string;
    status: "PENDING" | "ACCEPTED" | "EXPIRED";
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["OWNER", "ADMIN", "TENANT", "MEMBER"],
            required: true,
        },
        invitedByUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "EXPIRED"],
            default: "PENDING",
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Invitation = model<IInvitation>("Invitation", invitationSchema);

export default Invitation;
