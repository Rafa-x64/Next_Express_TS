//Ejemplo de Type Aliases y tipado progresivo

import chalk from 'chalk'

type User = {
    id: number,
    name: string,
    email: string,
    role: UserRole,
    isActive: boolean
}

type UserRole = "admin" | "editor" | "member"

const activeAdmin: User = {
    id: 1,
    name: "Rafael Alvarez",
    email: "ejemplo@gmail.com",
    role: "admin",
    isActive: true
}

console.log(activeAdmin)

//Ejemplo de async y await y promesas
const findUserById = (id: number): Promise<User> => {
    return new Promise((resolve, rejected) => {
        setTimeout(() => {
            if (id === 1) {
                resolve({
                    id: 1,
                    name: "Carlos",
                    email: "carlos@test.com",
                    role: 'admin',
                    isActive: true
                })
            } else {
                rejected(new Error(`Usuario con ID ${id} no encontrado`))
            }
        }, 1000)
    })
}

const runUserVerification = async () => {
    try {
        console.log("Buscando usuario en la base de datos...")
        const user = await findUserById(1)
        console.log(`¡Usuario verificado! Nombre: ${user.name}, Rol: ${user.role}`)
    } catch (error) {
        console.error(`Error en la verificación: ${(error as Error).message}`)
    }
}

runUserVerification()

//Ejercicio Práctico: Pasarela de Procesamiento de Pagos Asíncrona
type TransationStatus = 'pending' | 'approved' | 'rejected'
type Transaction = {
    id: string,
    amount: number,
    currency: string,
    status: TransationStatus
}

const fakeDatabase: Transaction[] = [
    {
        id: "transaccion #1",
        amount: 10,
        currency: "Bs.",
        status: "pending"
    },
    {
        id: "transaccion #2",
        amount: 500,
        currency: "USD",
        status: "pending"
    },
    {
        id: "transaccion #3",
        amount: 100,
        currency: "USD",
        status: "approved"
    },
    {
        id: "transaccion #4",
        amount: 650,
        currency: "Bs.",
        status: "rejected"
    }
]

const proccessPaymentGateway = async (tx: Transaction): Promise<Transaction> => {
    return new Promise((resolve, rejected) => {
        setTimeout(() => {
            if (tx.amount > 500) {
                rejected(new Error(`Transacción ${tx.id} rechazada: Excede el límite de seguridad.`))
            }

            if (tx.status === "approved") {
                rejected(new Error(`Esta transaccion ya fue aprovada`))
            }

            resolve(
                {
                    id: tx.id,
                    amount: tx.amount,
                    currency: tx.currency,
                    status: "approved"
                }
            )
        }, 1500)
    })
}

const bootstrap = async () => {
    console.info(chalk.blue("Iniciando el modulo de procesamiento de pago"))
    for (const transaction of fakeDatabase) {
        if (transaction.status === "approved") {
            console.log(chalk.yellow(`Esta transaccion con id "${transaction.id}": ya fue aprovada... Ignorando.`))
        }

        try {
            const response = await proccessPaymentGateway(transaction)
            console.log(chalk.green(`Transacción ${response.id} procesada con éxito.`))
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(chalk.red(`Error al procesar la transaccion con id ${transaction.id}: ${error.message}`))
            }else{
                console.error(chalk.red("Error desconocido al procesar la transaccion"))
            }
        }

    }
    console.log(chalk.green("Procesamiento finalizado"));

}

bootstrap()
