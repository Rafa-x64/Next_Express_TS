import { Router } from 'express'
import { Request, Response } from 'express'
import { tasks } from '../fakeTask'

const taskRouter = Router({ mergeParams: true })

taskRouter.get('/', (req: Request, res: Response) => {
    const { userId } = req.params
    const { status } = req.query

    if (Array.isArray(userId)) {
        return res.status(400).json({ error: 'userId no puede ser un array' })
    }
    const parsedUserId = parseInt(userId, 10)
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: 'ID de usuario inválido en la ruta' })
    }

    let statusFilter: string | undefined
    if (status !== undefined) {
        if (Array.isArray(status)) {
            return res.status(400).json({ error: 'status no puede ser un array' })
        }
        if (status !== 'completed' && status !== 'pending') {
            return res.status(400).json({ error: `status de tarea "${status}" inválida` })
        }
        statusFilter = status
    }

    const userTasks = tasks.filter(task => {
        const matchesUser = task.userId === parsedUserId
        const matchesStatus = statusFilter ? task.status === statusFilter : true
        return matchesUser && matchesStatus
    })

    res.status(200).json({
        success: true,
        userId: parsedUserId,
        filters: { status: statusFilter || 'todos' },
        tasks: userTasks,
        total: userTasks.length
    })
})

export default taskRouter
