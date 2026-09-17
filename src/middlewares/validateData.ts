import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod/v3'

export const validateData = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            const formattedErrors = result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))

            return res.status(400).json({
                success: false,
                error: {
                    message: "Los datos suministrados son inválidos",
                    code: "VALIDATION_ERROR",
                    details: formattedErrors
                }
            })

        }

        req.body = result.data
        next()
    }
}
