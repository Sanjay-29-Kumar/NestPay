import { Schema, model, Document, Types } from "mongoose";

export interface IUnit extends Document {
    organizationId: Types.ObjectId;
    propertyId: Types.ObjectId;
    unitNumber: string;
    unitType:
        | "FLAT"
        | "ROOM"
        | "SHOP"
        | "OFFICE"
        | "SUITE"
        | "VILLA"
        | "BLOCK"
        | "FLOOR"
        | "ONE_RK"
        | "ONE_BHK"
        | "TWO_BHK"
        | "THREE_BHK"
        | "SHARED_ROOM"
        | "BED_SPACE"
        | "LINE_UNIT";
    floor?: string;
    areaSqFt?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxCapacity?: number;
    sharingType?: "PRIVATE" | "DOUBLE_SHARING" | "TRIPLE_SHARING" | "MULTI_SHARING";
    rentAmount: number;
    depositAmount?: number;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
    createdAt: Date;
    updatedAt: Date;
}

const unitSchema = new Schema<IUnit>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        unitNumber: {
            type: String,
            required: true,
            trim: true,
        },
        unitType: {
            type: String,
            enum: [
                "FLAT",
                "ROOM",
                "SHOP",
                "OFFICE",
                "SUITE",
                "VILLA",
                "BLOCK",
                "FLOOR",
                "ONE_RK",
                "ONE_BHK",
                "TWO_BHK",
                "THREE_BHK",
                "SHARED_ROOM",
                "BED_SPACE",
                "LINE_UNIT",
            ],
            required: true,
            default: "FLAT",
        },
        floor: {
            type: String,
            default: "G",
        },
        areaSqFt: {
            type: Number,
            default: 0,
        },
        bedrooms: {
            type: Number,
            default: 1,
        },
        bathrooms: {
            type: Number,
            default: 1,
        },
        maxCapacity: {
            type: Number,
            default: 1,
        },
        sharingType: {
            type: String,
            enum: ["PRIVATE", "DOUBLE_SHARING", "TRIPLE_SHARING", "MULTI_SHARING"],
            default: "PRIVATE",
        },
        rentAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        depositAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["VACANT", "OCCUPIED", "MAINTENANCE", "RESERVED"],
            default: "VACANT",
        },
    },
    {
        timestamps: true,
    }
);

unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

const Unit = model<IUnit>("Unit", unitSchema);

export default Unit;
