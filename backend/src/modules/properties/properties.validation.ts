import { z } from "zod";

export const createPropertySchema = z.object({
    body: z.object({
        name: z.string({ message: "Property name is required" }).min(2).max(150).trim(),
        code: z.string({ message: "Property code is required" }).min(2).max(30).trim(),
        propertyType: z.enum([
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
        ]),
        description: z.string().max(1000).optional(),
        address: z
            .object({
                street: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                country: z.string().optional(),
                postalCode: z.string().optional(),
            })
            .optional(),
        geoLocation: z
            .object({
                latitude: z.number().optional(),
                longitude: z.number().optional(),
            })
            .optional(),
        images: z.array(z.string()).optional(),
        documents: z.array(z.string()).optional(),
    }),
});

export const updatePropertySchema = z.object({
    body: z.object({
        name: z.string().min(2).max(150).trim().optional(),
        code: z.string().min(2).max(30).trim().optional(),
        propertyType: z
            .enum([
                "APARTMENT",
                "BUILDING",
                "VILLA",
                "HOUSE",
                "COMMERCIAL",
                "WAREHOUSE",
                "OFFICE",
                "LAND",
            ])
            .optional(),
        description: z.string().max(1000).optional(),
        address: z
            .object({
                street: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                country: z.string().optional(),
                postalCode: z.string().optional(),
            })
            .optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"]).optional(),
    }),
});
