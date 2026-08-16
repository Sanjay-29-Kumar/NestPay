import { z } from "zod";

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "Organization name is required" })
            .min(2, "Organization name must be at least 2 characters long")
            .max(100, "Organization name cannot exceed 100 characters")
            .trim(),
        organizationType: z
            .enum([
                "APARTMENT",
                "RENTAL_PROPERTY",
                "BUSINESS",
                "SCHOOL",
                "COMMUNITY",
                "SMALL_ORGANIZATION",
                "SERVICE_PROVIDER",
                "OTHER",
            ])
            .optional(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
    }),
});

export const updateOrganizationSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).trim().optional(),
        displayName: z.string().max(100).trim().optional(),
        logo: z.string().optional(),
        description: z.string().max(500).optional(),
        organizationType: z
            .enum([
                "APARTMENT",
                "RENTAL_PROPERTY",
                "BUSINESS",
                "SCHOOL",
                "COMMUNITY",
                "SMALL_ORGANIZATION",
                "SERVICE_PROVIDER",
                "OTHER",
            ])
            .optional(),
        registrationNumber: z.string().max(100).optional(),
        gstVat: z.string().max(100).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(50).optional(),
        website: z.string().max(200).optional(),
        address: z.string().max(300).optional(),
        country: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        city: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional(),
        currency: z.string().max(10).optional(),
        timezone: z.string().max(50).optional(),
        language: z.string().max(10).optional(),
        bankDetails: z
            .object({
                upiId: z.string().optional(),
                accountHolderName: z.string().optional(),
                accountNumber: z.string().optional(),
                ifscCode: z.string().optional(),
                bankName: z.string().optional(),
            })
            .optional(),
    }),
});

export const inviteUserSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
        role: z.enum(["ADMIN", "TENANT", "MEMBER"], {
            message: "Role must be ADMIN, TENANT, or MEMBER",
        }),
    }),
});

export const acceptInviteSchema = z.object({
    body: z.object({
        token: z.string({ message: "Invitation token is required" }).min(1),
    }),
});
