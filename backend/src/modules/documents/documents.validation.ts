import { z } from "zod";

export const createDocumentSchema = z.object({
    body: z.object({
        title: z.string({ message: "Document title is required" }).min(2).max(150).trim(),
        documentType: z.enum([
            "RENTAL_AGREEMENT",
            "PAN",
            "AADHAAR",
            "PASSPORT",
            "DRIVING_LICENSE",
            "INSURANCE",
            "PROPERTY_DOCUMENT",
            "OTHER",
        ]),
        fileUrl: z.string({ message: "File URL is required" }).min(1),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        relatedPropertyId: z.string().optional(),
        relatedUnitId: z.string().optional(),
        relatedCustomerId: z.string().optional(),
    }),
});
