import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import userRouter from './routes/users.routes'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.resolve(__dirname, '../../../.env')
})

import express, { Request, Response, NextFunction } from 'express'
import { auditLogger } from './middlewares/auditLogger'
import { securityShield } from './middlewares/securityShield'
import chalk from 'chalk'
import { asyncHandler } from './middlewares/asyncHandler'

declare global {
    namespace Express {
        interface Request {
            userContext?: {
                ip: string | undefined
                origin: string
                authTime?: string | Date // Marcado como opcional con '?'
            }
        }
    }
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(auditLogger)

// Middleware global de contexto base
app.use((req: Request, res: Response, next: NextFunction) => {
    req.userContext = {
        ip: req.ip,
        origin: req.get('Origin') || 'Unknown'
    }
    next()
})

// ========== Endpoints ==========

app.get('/api/ping', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.json({
        status: 'online',
        client: req.userContext
    })
}))

app.get('/api/public-data', (req: Request, res: Response) => {
    res.json({
        status: "success",
        data: "Este es un recurso público disponible sin autenticación."
    })
})

app.get('/api/secure-vault', securityShield, (req: Request, res: Response) => {
    res.json({
        status: "success",
        data: `🔐 Bienvenidos a la bóveda secreta. Las variables de rendimiento están seguras. Autenticado en: ${req.userContext?.authTime}`,
    })
})

app.post('/api/test', securityShield, (req: Request, res: Response) => {
    res.json({
        status: "success",
        data: `🔐 Endpoint de test. Autenticado en: ${req.userContext?.authTime}. Cuerpo de solicitud: ${JSON.stringify(req.body, null, 2)}`,
    })
})

app.use('/api/users', userRouter)

// ========== Inicializar servidor ==========

app.listen(PORT, () => {
    console.log(chalk.green(`\n=== SERVIDOR EXPRESS INICIALIZADO ===`))
    console.log(chalk.cyan(`📡 Escuchando en: http://localhost:${PORT}`))
    console.log(chalk.yellow(`🔐 Modo de seguridad activo con API Key.`))
})
