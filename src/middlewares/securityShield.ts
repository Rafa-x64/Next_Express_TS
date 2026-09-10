import { Request, Response, NextFunction } from 'express'
import chalk from 'chalk'

// Ampliación del namespace global de Express para TypeScript
declare global {
    namespace Express {
        interface Request {
            userContext?: {
                ip: string | undefined
                origin: string
                authTime?: string | Date
            }
        }
    }
}

export const securityShield = (req: Request, res: Response, next: NextFunction): void => {
    const API_KEY = process.env.API_KEY // Leemos en tiempo de petición
    const clientKey = req.get('X-API-Key')
    const authTime = new Date().toISOString()
    
    // Validación de cabecera
    if (!clientKey || clientKey !== API_KEY) {
        console.log(chalk.red(`[Seguridad] Intentaron acceder sin autorización desde la IP: ${req.ip}`))

        res.status(401).json({
            error: "No Autorizado",
            message: "La cabecera 'X-API-Key' es inválida o no ha sido suministrada."
        })
        return
    }

    // Inyección inmutable del sub-objeto manteniendo los valores preexistentes
    req.userContext = {
        ...(req.userContext || {
            ip: req.ip,
            origin: req.get('Origin') || 'Unknown'
        }),
        authTime
    }

    next()
}
