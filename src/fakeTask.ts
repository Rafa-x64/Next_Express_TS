export type Task = {
    id: number,
    userId: number,
    title: string,
    status: 'completed' | 'pending'
}

export const tasks: Task[] = [
    { id: 101, userId: 1, title: 'Configurar TypeScript', status: 'completed' },
    { id: 102, userId: 1, title: 'Modularizar con Express Router', status: 'pending' },
    { id: 103, userId: 2, title: 'Levantar base con PostgreSQL', status: 'pending' }
]
