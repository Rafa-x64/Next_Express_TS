import { z } from "zod/v3"

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().nonnegative().min(1).default(1),
    limit: z.coerce.number().int().nonnegative().min(1).default(10)
})

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>
