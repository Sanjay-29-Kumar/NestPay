import { Schema, model, Document, Types } from "mongoose";

export interface IUnit extends Document {
    organizationId: Types.ObjectId;
    propertyId: Types.ObjectId;
    unitNumber: string;
    blockWing?: string;
    roomType?: string;
    unitType: string;
    floor?: string;
    areaSqFt?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxCapacity?: number;
    sharingType?: "PRIVATE" | "DOUBLE_SHARING" | "TRIPLE_SHARING" | "MULTI_SHARING";
    occupancyType?: "Single" | "Family" | "Sharing";
    rentAmount: number;
    depositAmount?: number;
    maintenanceCharge?: number;
    furnishingStatus?: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
    amenities?: string[];
    photos?: string[];
    notes?: string;
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
        blockWing: {
            type: String,
            default: "",
            trim: true,
        },
        roomType: {
            type: String,
            default: "1BHK",
            trim: true,
        },
        unitType: {
            type: String,
            default: "FLAT",
        },
        floor: {
            type: String,
            default: "",
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
        occupancyType: {
            type: String,
            default: "Family",
        },
        rentAmount: {
            type: Number,
            default: 0,
        },
        depositAmount: {
            type: Number,
            default: 0,
        },
        maintenanceCharge: {
            type: Number,
            default: 0,
        },
        furnishingStatus: {
            type: String,
            default: "Unfurnished",
        },
        amenities: {
            type: [String],
            default: [],
        },
        photos: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            default: "",
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
