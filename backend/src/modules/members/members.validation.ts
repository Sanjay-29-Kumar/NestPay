import { z } from "zod";

export const editRoleSchema = z.object({
    body: z.object({
        role: z.enum(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"], {
            message: "Invalid workspace role",
        }),
    }),
});

export const updateMemberStatusSchema = z.object({
    body: z.object({
        status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"], {
            message: "Status must be ACTIVE, SUSPENDED, or INACTIVE",
        }),
    }),
});

export const transferOwnershipSchema = z.object({
    body: z.object({
        targetUserId: z.string({ message: "Target user ID is required" }).min(1),
    }),
});
