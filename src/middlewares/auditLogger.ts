import express, { Request, Response, NextFunction } from 'express'
import chalk from 'chalk'

//funcion para calcular el tiempo de ejecucion de una peticion y su estatus
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
    const startHrTime = process.hrtime() //capturamos el tiempo exacto de inicio
    res.on('finish', () => {
        const diffHrTime = process.hrtime(startHrTime)//empezamos el cronometro
        const durationInMs = (diffHrTime[0] * 1000 + diffHrTime[1] / 1000000).toFixed(3) //parseamos a milisegundos
        const timestamp = new Date().toISOString()

        //imprimimos de color amarillo con chalk
        console.log(chalk.yellow(`[${timestamp}] 📡 ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Latencia: ${durationInMs}ms`))

        if (req.method === "POST" || req.method === "PUT") {
            console.log(req.body)
        }
    })

    next()
}
