import { z } from "zod";

export const sendWhatsAppTestSchema = z.object({
    body: z
        .object({
            phoneNumber: z.string().min(8, "Phone number must be at least 8 characters").max(25).optional(),
            recipientNumber: z.string().min(8).max(25).optional(),
            message: z.string().min(1, "Message content cannot be empty").max(4096, "Message exceeds 4096 character limit").optional(),
            templateName: z.string().optional(),
            languageCode: z.string().optional(),
            components: z.array(z.any()).optional(),
            organizationId: z.string().optional(),
        })
        .refine((data) => Boolean(data.phoneNumber || data.recipientNumber), {
            message: "Recipient phone number ('phoneNumber' or 'recipientNumber') is required.",
            path: ["phoneNumber"],
        }),
});
