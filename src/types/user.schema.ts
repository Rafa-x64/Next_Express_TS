import { z } from 'zod'

const userSchema = z.object({
    email: z.string().email(),
    age: z.number().min(18)
})

type UserDto = z.infer<typeof userSchema>;
