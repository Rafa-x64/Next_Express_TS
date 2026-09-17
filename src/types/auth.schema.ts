import { z } from 'zod/v3'

export const registerUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("El formato del correo electrónico es inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    role: z.enum(['USER', 'ADMIN', 'EDITOR']).optional().default('USER')
})

export type RegisterUserDto = z.infer<typeof registerUserSchema>
