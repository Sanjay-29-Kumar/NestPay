export type PropertyTypeEnum =
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

export interface CreatePropertyInput {
    name: string;
    code: string;
    propertyType: PropertyTypeEnum;
    description?: string;
    address?: {
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
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
    status?: "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE";
}
