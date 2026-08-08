import { Schema, model, Document, Types } from "mongoose";

export interface IProperty extends Document {
    organizationId: Types.ObjectId;
    name: string;
    code: string;
    propertyType:
        | "APARTMENT"
        | "BUILDING"
        | "VILLA"
        | "HOUSE"
        | "COMMERCIAL"
        | "WAREHOUSE"
        | "OFFICE"
        | "LAND"
        | "LINE_HOUSE"
        | "ROW_HOUSE"
        | "CHAWL"
        | "PG_HOSTEL"
        | "CO_LIVING";
    description?: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    geoLocation?: {
        latitude?: number;
        longitude?: number;
    };
    images?: string[];
    documents?: string[];
    status: "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE";
    createdAt: Date;
    updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        propertyType: {
            type: String,
            enum: [
                "APARTMENT",
                "BUILDING",
                "VILLA",
                "HOUSE",
                "COMMERCIAL",
                "WAREHOUSE",
                "OFFICE",
                "LAND",
                "LINE_HOUSE",
                "ROW_HOUSE",
                "CHAWL",
                "PG_HOSTEL",
                "CO_LIVING",
            ],
            required: true,
            default: "APARTMENT",
        },
        description: {
            type: String,
            default: "",
        },
        address: {
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            country: { type: String, default: "" },
            postalCode: { type: String, default: "" },
        },
        geoLocation: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        images: {
            type: [String],
            default: [],
        },
        documents: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

propertySchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Property = model<IProperty>("Property", propertySchema);

export default Property;
