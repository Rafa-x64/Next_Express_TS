import { Role, Prisma } from '@prisma/client'

type UserCreateInput = Prisma.UserCreateInput

const newUserPayload: UserCreateInput = {
    name: "Rafael Alvarez",
    email: "rafael@ejemplo.com",
    role: Role.ADMIN,
    password: "contraseña123",
    profile: {
        create: {
            bio: "Arquitecto de Software y apasionado de TypeScript",
            avatarUrl: "https://ejemplo.com/avatar.png"
        }
    },
    posts: {
        create: {
            title: "Dominando Express y TypeScript",
        }
    }
}

function inspectPayload(data: UserCreateInput) {
    console.log("=== INSPECCIÓN DE TIPO AUTOGENERADO DE PRISMA ===")
    console.log(`Nombre: ${data.name}`)
    console.log(`Email: ${data.email}`)
    console.log(`Rol asignado: ${data.role}`)
    console.log("Estructura lista para ser insertada de forma atómica en PostgreSQL.")
}

inspectPayload(newUserPayload)
