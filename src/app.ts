import express, { Request, Response, NextFunction } from "express"
import { validateData } from '../src/middlewares/validateData.js'
import { createProductSchema, CreateProductDto } from './types/product.schema.js'

const app = express()
app.use(express.json())

app.get('/api/health', (req: Request, res: Response) => {

    if (req.body && req.body !== undefined) {
        res.status(200).json({
            success: true,
            message: "todo fino por aqui",
            data: req.body
        })
    }

    res.status(200).json({
        success: true,
        message: "todo fino por aqui",
    })
})

app.post("/api/products", validateData(createProductSchema), (req: Request, res: Response) => {
    const productData: CreateProductDto = req.body

    res.status(201).json({
        success: true,
        message: "Producto validado y creado con éxito",
        data: productData
    })
})

app.listen(3000, () => {
    console.log("puerto listo y escuchando en el puerto 3000. http://localhost:3000/")
})



