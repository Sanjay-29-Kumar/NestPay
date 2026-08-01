import { z } from "zod";

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "Organization name is required" })
            .min(2, "Organization name must be at least 2 characters long")
            .max(100, "Organization name cannot exceed 100 characters")
            .trim(),
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
