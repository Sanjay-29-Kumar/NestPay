import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateRequest(schema: ZodSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body || {},
                query: req.query || {},
                params: req.params || {},
            });

            // Replace req objects with sanitized/validated data
            req.body = (parsed as { body?: unknown }).body ?? req.body;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.length > 1 ? issue.path.slice(1).join(".") : issue.path.join("."),
                    message: issue.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    errors: formattedErrors,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Internal Server Error during validation",
            });
        }
    };
}
