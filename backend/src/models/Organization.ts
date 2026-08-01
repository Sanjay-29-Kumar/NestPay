import { Schema, model, Document, Types } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    slug: string;
    ownerId: Types.ObjectId;
    status: "ACTIVE" | "SUSPENDED";
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
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
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
    },
    {
        timestamps: true,
    }
);

const Organization = model<IOrganization>("Organization", organizationSchema);

export default Organization;
