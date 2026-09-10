# Nivel 4: Persistencia de Datos con Prisma ORM y PostgreSQL

Bienvenido al nivel 4. Aquí dejamos la aplicación en estado real: ya no vive solo en memoria, sino que persiste datos en una base de datos relacional con PostgreSQL y Prisma.

Este nivel se divide en dos partes:

- 4.1: Inicialización de Prisma y conexión con PostgreSQL local
- 4.2: Modelado de datos con `schema.prisma`

---

# Nivel 4.1: Inicialización de Prisma y conexión con PostgreSQL local

## 1. ¿Por qué Prisma?

Un backend moderno necesita almacenamiento persistente. Para eso existen varias opciones:

1. SQL directo con drivers como `pg`
2. ORMs clásicos como Sequelize o TypeORM
3. Prisma ORM, que usa un archivo `schema.prisma` como fuente de verdad y genera automáticamente un cliente con tipos seguros para TypeScript

Prisma destaca porque:
- reduce el trabajo repetitivo
- valida tu schema antes de ejecutar
- genera client types automáticamente
- ayuda a evitar errores de escritura y nombres de columnas

---

## 2. Requisitos

Antes de empezar, asegúrate de tener:

- Node.js
- pnpm
- Docker
- PostgreSQL

En este proyecto usamos `pnpm`, no `npm`, porque el repositorio configura `packageManager` y `devEngines` para hacerlo compatible con la herramienta correcta.

---

## 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con este contenido:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/next_app?schema=public"
```

La clave es `DATABASE_URL`, porque Prisma la lee desde el entorno para conectarse a PostgreSQL.

---

## 4. Docker para levantar PostgreSQL

Si quieres correr PostgreSQL localmente con Docker, puedes hacer esto:

```bash
docker run --name next-app-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=next_app -p 5432:5432 -d postgres:16
```

También puedes usar `docker-compose.yaml` si tu proyecto ya lo incluye.

---

## 5. Configuración moderna de Prisma

La estructura moderna de Prisma ya no coloca `datasource` dentro de `prisma.config.ts`. Ese valor va en el archivo `schema.prisma`.

### `prisma.config.ts`

```ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
})
```

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Esto es la forma actual recomendada. El `DATABASE_URL` vive en `.env`, y Prisma lo carga desde aquí.

---

## 6. Instalación de dependencias

Ejecuta esto en la raíz del proyecto:

```bash
pnpm install
```

Esto instala Prisma y el cliente generado.

---

## 7. Comandos útiles de Prisma

Estos son los comandos correctos para el flujo actual:

```bash
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

También puedes usar:

```bash
pnpm exec prisma db push
pnpm exec prisma studio
```

> Importante: en este proyecto se recomienda usar `pnpm exec prisma ...` en lugar de `npx prisma ...`, porque el repo está configurado para trabajar con pnpm.

---

## 8. Patrón Singleton para Prisma

Cuando trabajas con `tsx watch` o reinicios frecuentes del servidor, no debes crear un `new PrismaClient()` en cada importación. Eso puede saturar la conexión a la base de datos.

La solución correcta es usar un singleton.

### `src/lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

Con este patrón:
- evita más de una instancia en desarrollo
- reduce el consumo de conexiones
- mantiene la app más estable durante recargas de archivos y pruebas rápidas

---

## 9. Buenas prácticas

1. NUNCA dejes la cadena de conexión directamente en el código
2. Mantén `DATABASE_URL` solo en `.env`
3. Reutiliza una sola instancia de Prisma
4. Ejecuta migraciones desde el entorno correcto (`pnpm exec prisma migrate dev`)

---

# Nivel 4.2: Modelado de datos robusto con `schema.prisma`

## 1. ¿Qué es `schema.prisma`?

`schema.prisma` es el archivo central de Prisma. Aquí defines:
- tu cliente generated (`generator client`)
- la conexión a la base de datos (`datasource db`)
- los modelos de negocio (`model User`, `model Post`, etc.)

Es la fuente de verdad de tu capa de datos.

---

## 2. Estructura base

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Esto dice:
- usaremos Prisma Client de JavaScript
- nuestra base de datos es PostgreSQL
- la URL viene desde `DATABASE_URL`

---

## 3. Modelo básico

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
}
```

### Qué significa cada parte:

- `@id`: clave primaria
- `@default(autoincrement())`: genera un número secuencial
- `@unique`: evita duplicados
- `@default(now())`: fecha automática al crear el registro

---

## 4. Tipos escalares principales

Prisma soporta varios tipos base:

- `String`
- `Int`
- `Float`
- `Boolean`
- `DateTime`
- `Json`

Ejemplo:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  metadata    Json?
}
```

`Json?` indica que este campo puede ser nulo.

---

## 5. Campos opcionales y valores por defecto

```prisma
model Profile {
  id        Int     @id @default(autoincrement())
  bio       String?
  avatarUrl String?
  userId    Int     @unique
}
```

### Importante:
- `String?` = campo opcional
- `@default(...)` = valor generado automaticamente
- `@unique` = no puede repetirse

---

## 6. Relaciones entre modelos

### Relación 1 a muchos

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}
```

Aquí:
- un `User` puede tener muchos `Post`
- cada `Post` pertenece a un solo `User`

---

## 7. Relación 1 a 1

```prisma
model User {
  id      Int     @id @default(autoincrement())
  email   String  @unique
  profile Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

---

## 8. Relación muchos a muchos

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

Prisma genera la tabla pivote automáticamente.

---

## 9. Buenas prácticas del modelado

1. Usa `PascalCase` para modelos (`User`, `Post`)
2. Usa `camelCase` para campos (`createdAt`, `authorId`)
3. Usa `@unique` para identificadores de negocio
4. Usa `@default(now())` para fechas de creación
5. Usa `@relation` para relaciones explícitas y mantenibles
6. Mantén tu schema legible y centralizado

---

## 10. Flujo recomendado del proyecto

```bash
pnpm install
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

Y luego, cuando cambies el schema:

```bash
pnpm exec prisma migrate dev --name nombre_de_cambio
```

---

## 11. Resumen

Prisma en este proyecto se usa de forma moderna:
- `prisma.config.ts` para la configuración del proyecto
- `.env` para `DATABASE_URL`
- `schema.prisma` para definir modelos y conexión
- `src/lib/prisma.ts` para proteger la instancia singleton
- `pnpm exec prisma ...` como flujo recomendado

Con esto ya puedes trabajar con base de datos de forma ordenada, segura y escalable.
3. **Uso de Enums para Estados Finitos:** En lugar de usar strings abiertos para campos de estado (como `'ACTIVE'`, `'INACTIVE'`, `'PENDING'`), define un `enum` en Prisma para restringir los valores a nivel de motor de base de datos.

---

## Ejemplo de Código: Esquema de Dominio Completo

Actualiza tu archivo `prisma/schema.prisma` con la siguiente estructura relacional completa:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Enum para controlar roles de acceso con seguridad estricta
enum Role {
  USER
  ADMIN
  EDITOR
}

// Modelo de Usuarios
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  profile   Profile?
  posts     Post[]

  @@map("users")
}

// Modelo de Perfil (Relación 1 a 1 con User)
model Profile {
  id        String  @id @default(uuid())
  bio       String?
  avatarUrl String? @map("avatar_url")
  userId    String  @unique @map("user_id")

  // Relación explícita con clave foránea
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// Modelo de Publicaciones (Relación 1 a Muchos con User)
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relación con el Autor
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categories Category[]

  @@map("posts")
}

// Modelo de Categorías (Relación Muchos a Muchos implícita con Post)
model Category {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]

  @@map("categories")
}
```

### Ejecución de Migraciones

Para aplicar este esquema en tu base de datos de PostgreSQL local y generar los tipos estáticos de TypeScript, ejecuta en tu terminal:

```bash
pnpx prisma migrate dev --name init_domain_models
```

Este comando realizará tres acciones automáticas:
1. Traducirá el esquema de Prisma a una migración SQL en `prisma/migrations/`.
2. Ejecutará el script SQL en PostgreSQL para crear las tablas, índices y restricciones.
3. Generará los tipos de TypeScript actualizados dentro de `node_modules/@prisma/client`.

---

## Nota de Arquitectura

> **Single Source of Truth (Fuente Única de Verdad):** El archivo `schema.prisma` actúa como la especificación maestra de la arquitectura de datos. A partir de él se sincronizan automáticamente tres capas críticas de tu backend: el esquema físico DDL en PostgreSQL, las validaciones de tipo en TypeScript y la documentación implícita del dominio de negocio. Esto elimina de raíz los despasajes entre la base de datos y la aplicación.

---

## 🛠️ Mini-Proyecto: "Validador de Tipos Autogenerados por Prisma"

Vamos a construir un script que demuestre cómo el cliente de Prisma autogenera tipos estrictos en TypeScript a partir de tu archivo `schema.prisma`, sin necesidad de definir interfaces manuales.

### Código Fuente (`src/Nivel4/src/model-test.ts`)

```typescript
// src/Nivel4/src/model-test.ts
import { Role, Prisma } from '@prisma/client';

// Demostración de uso de tipos autogenerados por Prisma
type UserCreateInput = Prisma.UserCreateInput;

// Construcción de un objeto fuertemente tipado según el schema
const newUserPayload: UserCreateInput = {
  name: "Rafael Alvarez",
  email: "rafael@ejemplo.com",
  role: Role.ADMIN,
  profile: {
    create: {
      bio: "Arquitecto de Software y apasionado de TypeScript",
      avatarUrl: "https://ejemplo.com/avatar.png"
    }
  },
  posts: {
    create: [
      {
        title: "Dominando Express y TypeScript",
        content: "Aprende a construir backends escalables sin sobreingeniería."
      }
    ]
  }
};

function inspectPayload(data: UserCreateInput) {
  console.log("=== INSPECCIÓN DE TIPO AUTOGENERADO DE PRISMA ===");
  console.log(`Nombre: ${data.name}`);
  console.log(`Email: ${data.email}`);
  console.log(`Rol asignado: ${data.role}`);
  console.log("Estructura lista para ser insertada de forma atómica en PostgreSQL.");
}

inspectPayload(newUserPayload);
```

Para probar este archivo, ejecuta:
```bash
pnpx tsx src/Nivel4/src/model-test.ts
```

---

## 🎯 Desafíos del Nivel 4.2

1. **Ampliación del Dominio (Modelo de Comentarios):** Añade un nuevo modelo llamado `Comment` a tu archivo `schema.prisma`. Debe incluir un campo `content` de tipo `String`, relacionarse con el modelo `Post` (un post tiene muchos comentarios) y con el modelo `User` (un usuario hace muchos comentarios).
2. **Enum de Estado para Publicaciones:** Crea un `enum PostStatus` con los valores `DRAFT`, `PUBLISHED` y `ARCHIVED`. Reemplaza el campo booleano `published` en el modelo `Post` por un campo `status` que utilice este enum con valor por defecto `DRAFT`. Ejecuta `pnpx prisma migrate dev --name add_comments_and_post_status` para aplicar los cambios a la base de datos.
