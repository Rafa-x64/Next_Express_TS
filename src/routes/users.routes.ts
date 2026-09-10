import { Router } from 'express'
import { Request, Response, NextFunction } from 'express'
import type { Task } from '../fakeTask'
import { tasks } from '../fakeTask'
import taskRouter from './task.routes'

const userRouter = Router()

userRouter.get('/:userId', (req: Request, res: Response) => {
    const { userId } = req.params

    if (Array.isArray(userId)) {
        return res.status(400).json({ error: 'userId no puede ser un array' })
    }

    res.json({ id: parseInt(userId, 10), name: `Usuario ${userId}` })
})

userRouter.use('/:userId/tasks', taskRouter)

export default userRouter
