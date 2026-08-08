import { Schema, model, Document, Types } from "mongoose";

export interface IDocumentVault extends Document {
    organizationId: Types.ObjectId;
    title: string;
    documentType:
        | "RENTAL_AGREEMENT"
        | "PAN"
        | "AADHAAR"
        | "PASSPORT"
        | "DRIVING_LICENSE"
        | "INSURANCE"
        | "PROPERTY_DOCUMENT"
        | "OTHER";
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    relatedPropertyId?: Types.ObjectId;
    relatedUnitId?: Types.ObjectId;
    relatedCustomerId?: Types.ObjectId;
    uploadedByUserId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const documentVaultSchema = new Schema<IDocumentVault>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        documentType: {
            type: String,
            enum: [
                "RENTAL_AGREEMENT",
                "PAN",
                "AADHAAR",
                "PASSPORT",
                "DRIVING_LICENSE",
                "INSURANCE",
                "PROPERTY_DOCUMENT",
                "OTHER",
            ],
            required: true,
            default: "OTHER",
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            default: "PDF",
        },
        fileSize: {
            type: Number,
            default: 0,
        },
        relatedPropertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            default: null,
        },
        relatedUnitId: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            default: null,
        },
        relatedCustomerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        uploadedByUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

documentVaultSchema.index({ organizationId: 1, documentType: 1 });

const DocumentVault = model<IDocumentVault>("DocumentVault", documentVaultSchema);

export default DocumentVault;
