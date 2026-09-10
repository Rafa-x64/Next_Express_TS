import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, '../.env')
})

const bootstrap = () => {
    const serverName = "Standalone Core"
    const startTimeStamp = new Date().toLocaleString()
    const port = process.env.PORT || 3000

    console.log(`[${startTimeStamp}] Servidor en desarrollo "${serverName}" inicializado con exito`)
    console.log("entorno multiplataforma configurado con exito")
    console.log(`Escuchando localmente en el puerto: ${port}`)
}

bootstrap()
