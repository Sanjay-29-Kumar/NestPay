export type UnitTypeEnum =
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

export interface CreateUnitInput {
    propertyId?: string;
    unitNumber: string;
    blockWing?: string;
    roomType?: string;
    unitType?: string;
    floor?: string;
    areaSqFt?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxCapacity?: number;
    sharingType?: "PRIVATE" | "DOUBLE_SHARING" | "TRIPLE_SHARING" | "MULTI_SHARING";
    occupancyType?: "Single" | "Family" | "Sharing";
    rentAmount?: number;
    depositAmount?: number;
    maintenanceCharge?: number;
    furnishingStatus?: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
    amenities?: string[];
    photos?: string[];
    notes?: string;
}

export interface UpdateUnitInput extends Partial<CreateUnitInput> {
    status?: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
}
