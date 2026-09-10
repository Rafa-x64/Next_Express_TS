import { Express, request } from 'express'
import { asyncHandler } from './middlewares/asyncHandler'
import { Request, Response, NextFunction } from 'express'
import { AppError } from './AppError'
import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.resolve(__dirname, '../../../.env')
})

const PORT = process.env.PORT || 3001
const app = express()
app.use(express.json())

export type User = {
    id: number,
    name: string
}

const users: User[] = [
    { id: 1, name: 'Rafael Alvarez' },
    { id: 2, name: 'Carlos Perez' }
]

const dbQueryUser = async (id: number): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = users.find(u => u.id === id)
            if (user) {
                resolve(user)
            }
            reject(new AppError(`El usuario con ID ${id} no existe en nuestro sistema`, 404))
        }, 500)
    })
}

app.get('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (Array.isArray(id)) {
        return res.status(400).json({ error: 'El ID no puede ser un array' })
    }

    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
        throw new AppError(`El ID proporcionado "${id}" es invalido`, 400)
    }

    const user = await dbQueryUser(parsedId)

    res.status(200).json({ success: true, data: user })
}))

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500
    const message = err.message || 'Algo salió terriblemente mal en nuestro servidor'

    console.error(`[EXCEPCIÓN CENTRALIZADA] ❌: ${err.message}`)

    if (process.env.NODE_ENV !== 'development') {
        res.status(statusCode).json({
            success: false,
            error: {
                message: "Servicio temporalmente no disponible",
                code: 500
            }
        })
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err instanceof AppError ? 'OPERATIONAL_ERROR' : 'SYSTEM_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    })
})

app.get('/api/health-check', asyncHandler(async (req: Request, res: Response) => {
    const numeroAleatorio = Math.floor(Math.random() * 2) + 1
    switch (numeroAleatorio) {
        case 1:
            return res.status(200).json({
                error: false,
                code: 200,
                message: "todo bien"
            })
            break;
        case 2:
            throw new AppError("Error al comunicarse con el servidor: sistema caído", 503)
            break;

        default:
            throw new AppError("Error al generar número aleatorio: sistema caído", 503)
            break;
    }
}))

app.listen(PORT, () => {
    console.log(`📡 Servidor de Pruebas contra fallas activo en http://localhost:${PORT}`)
})
