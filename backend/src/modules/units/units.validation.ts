import { z } from "zod";

const unitTypeEnum = z.enum([
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
]);

export const createUnitSchema = z.object({
    body: z.object({
        propertyId: z.string({ message: "Property ID is required" }).min(1),
        unitNumber: z.string({ message: "Unit number is required" }).min(1).max(50).trim(),
        unitType: unitTypeEnum,
        floor: z.string().optional(),
        areaSqFt: z.number().min(0).optional(),
        bedrooms: z.number().min(0).optional(),
        bathrooms: z.number().min(0).optional(),
        maxCapacity: z.number().min(1).optional(),
        sharingType: z.enum(["PRIVATE", "DOUBLE_SHARING", "TRIPLE_SHARING", "MULTI_SHARING"]).optional(),
        rentAmount: z.number({ message: "Rent amount is required" }).min(0),
        depositAmount: z.number().min(0).optional(),
    }),
});

export const updateUnitSchema = z.object({
    body: z.object({
        unitNumber: z.string().min(1).max(50).trim().optional(),
        unitType: unitTypeEnum.optional(),
        floor: z.string().optional(),
        areaSqFt: z.number().min(0).optional(),
        bedrooms: z.number().min(0).optional(),
        bathrooms: z.number().min(0).optional(),
        maxCapacity: z.number().min(1).optional(),
        sharingType: z.enum(["PRIVATE", "DOUBLE_SHARING", "TRIPLE_SHARING", "MULTI_SHARING"]).optional(),
        rentAmount: z.number().min(0).optional(),
        depositAmount: z.number().min(0).optional(),
        status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE", "RESERVED"]).optional(),
    }),
});
