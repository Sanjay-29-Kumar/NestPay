import { z } from "zod";

export const createCustomerSchema = z.object({
    body: z.object({
        name: z.string({ message: "Customer name is required" }).min(2).max(100).trim(),
        email: z.string({ message: "Email is required" }).email().trim(),
        phone: z.string({ message: "Phone is required" }).min(3).max(30).trim(),
        propertyId: z.string().optional(),
        unitId: z.string().optional(),
        photo: z.string().optional(),
        emergencyContact: z
            .object({
                name: z.string().optional(),
                phone: z.string().optional(),
                relationship: z.string().optional(),
            })
            .optional(),
        occupation: z.string().optional(),
        nationality: z.string().optional(),
        governmentIds: z
            .array(
                z.object({
                    idType: z.string(),
                    idNumber: z.string(),
                    documentUrl: z.string().optional(),
                })
            )
            .optional(),
    }),
});

export const updateCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).trim().optional(),
        email: z.string().email().trim().optional(),
        phone: z.string().min(3).max(30).trim().optional(),
        propertyId: z.string().optional(),
        unitId: z.string().optional(),
        status: z.enum(["ACTIVE", "PAST", "PENDING"]).optional(),
    }),
});

export const assignUnitSchema = z.object({
    body: z.object({
        propertyId: z.string({ message: "Property ID is required" }).min(1),
        unitId: z.string({ message: "Unit ID is required" }).min(1),
    }),
});
