import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string({ message: "Name is required" })
            .min(2, "Name must be at least 2 characters long")
            .max(50, "Name cannot exceed 50 characters")
            .trim(),

        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),

        password: z
            .string({ message: "Password is required" })
            .min(8, "Password must be at least 8 characters long")
            .max(100, "Password cannot exceed 100 characters"),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),

        password: z
            .string({ message: "Password is required" })
            .min(1, "Password cannot be empty"),
    }),
});

export const resendVerificationSchema = z.object({
    body: z.object({
        email: z
            .string({ message: "Email is required" })
            .email("Please provide a valid email address")
            .toLowerCase()
            .trim(),
    }),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type ResendVerificationSchemaInput = z.infer<typeof resendVerificationSchema>;
