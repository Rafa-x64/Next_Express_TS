import { z } from 'zod/v3'

export const createProductSchema = z.object({
    name: z.string().min(3, "El nombre del producto debe ser más descriptivo"),
    price: z.number().positive("El precio debe ser un número positivo mayor a 0"),
    stock: z.number().int().nonnegative("El stock no puede ser negativo").default(0),
    category: z.string().min(1, "La categoría es requerida")
})

export const updateProductSchema = createProductSchema.partial()

export type UpdateProductDto = z.infer<typeof updateProductSchema>
export type CreateProductDto = z.infer<typeof createProductSchema>
