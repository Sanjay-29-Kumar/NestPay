import { Schema, model, Document, Types } from "mongoose";

export interface IVerificationToken extends Document {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            expires: 0, // MongoDB TTL index: automatically deletes document when expiresAt date is reached
        },
    },
    {
        timestamps: true,
    }
);

const VerificationToken = model<IVerificationToken>("VerificationToken", verificationTokenSchema);

export default VerificationToken;
