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

# Nivel 4.3: Ciclo de vida de las migraciones automáticas: de desarrollo a producción

¡Qué tal, mi hermano! Bienvenido al **Subnivel 4.3**. Ya sabemos cómo modelar esquemas relacionales en `schema.prisma`. Ahora toca entender cómo esos cambios se traducen de forma segura a la base de datos real sin perder datos ni romper el entorno de producción.

---

## Conceptos Clave

Una **migración** es un control de versiones para tu base de datos (como Git, pero para tablas y columnas). Cada vez que modificas `schema.prisma`, necesitas generar un archivo SQL que registre el cambio exacto.

En el ecosistema moderno de Prisma, existen 3 comandos fundamentales y debes saber exactamente cuándo usar cada uno:

1. **`pnpm exec prisma migrate dev --name <nombre>` (Desarrollo local):**
   * Compara tu `schema.prisma` con el estado actual de tu base de datos local.
   * Genera un nuevo archivo SQL dentro de `prisma/migrations/YYYYMMDDHHMMSS_nombre/`.
   * Aplica la migración a la base de datos local.
   * Ejecuta automáticamente `prisma generate` para actualizar los tipos de TypeScript.
   * Registra la migración en la tabla interna `_prisma_migrations`.

2. **`pnpm exec prisma migrate deploy` (Producción / CI/CD):**
   * **NUNCA genera archivos nuevos.**
   * Lee la carpeta `prisma/migrations/` (que viene de Git) y aplica solo las migraciones pendientes en la base de datos de producción o staging.
   * No modifica `schema.prisma` ni resetea la base de datos.

3. **`pnpm exec prisma db push` (Prototipado rápido / Pistas de prueba):**
   * Sincroniza directamente el `schema.prisma` con la base de datos sin crear archivos SQL de migración.
   * Ideal para bases de datos temporales (como Supabase/Neon en desarrollo rápido) o prototipos. **No usar en producción si necesitas historial**.

---

## Buenas Prácticas

1. **Inmutabilidad en Git:** Jamás edites un archivo SQL de migración que ya fue subido a Git y aplicado en el equipo o en producción. Si cometiste un error, haz la corrección en `schema.prisma` y genera una nueva migración.
2. **Migraciones con SQL Personalizado (`--create-only`):** Si necesitas agregar índices especiales de PostgreSQL, disparadores (*triggers*) o vistas que Prisma no soporta declarativamente, usa el flag `--create-only`. Esto genera el archivo `.sql` para que lo edites manualmente antes de aplicarlo.
3. **Pipelining en CI/CD:** En tu servidor de despliegue, el comando de arranque debe ser siempre `pnpm exec prisma migrate deploy` antes de iniciar el servidor Node.js.

---

## Ejemplos de Código

### Flujo de Trabajo en Desarrollo

```bash
# 1. Validar sintaxis del esquema
pnpm exec prisma validate

# 2. Generar migración tras cambiar schema.prisma
pnpm exec prisma migrate dev --name add_posts_and_categories

# 3. Consultar el estado de las migraciones
pnpm exec prisma migrate status
```

### Crear Migración con SQL Personalizado (`--create-only`)

```bash
# Genera el archivo SQL sin aplicarlo inmediatamente a la DB
pnpm exec prisma migrate dev --name add_fulltext_search_index --create-only
```

Esto creará el archivo `prisma/migrations/YYYYMMDDHHMMSS_add_fulltext_search_index/migration.sql`. Puedes abrirlo y agregar SQL nativo de PostgreSQL:

```sql
-- migration.sql
-- AlterTable original generado por Prisma...

-- SQL personalizado para índice de búsqueda rápida en PostgreSQL
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON "posts" USING gin(to_tsvector('spanish', "title"));
```

Para aplicar este archivo modificado, ejecutas:

```bash
pnpm exec prisma migrate dev
```

---

## Nota de Arquitectura

> **Tolerancia a fallos en Despliegues:** Ejecutar `prisma migrate deploy` como un paso previo en tu contenedor de Docker (antes del comando de inicio del servidor) garantiza que el código nuevo nunca empiece a recibir tráfico si la estructura de la base de datos no está 100% actualizada.

---

## 🛠️ Mini-Proyecto: "Script de Verificación de Migraciones y Healthcheck"

Crearemos un script de utilidad que verifique si existen migraciones pendientes o si la base de datos está desincronizada antes de arrancar la aplicación.

### Código Fuente (`src/Nivel4/src/migration-check.ts`)

```typescript
import { prisma } from '../../lib/prisma.js';
import { execSync } from 'child_process';

async function checkMigrationStatus() {
  try {
    // Verificar conectividad básica con la tabla interna de Prisma
    const appliedMigrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
      SELECT migration_name, finished_at FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5;
    `;

    console.log("=== ESTADO DE MIGRACIONES APLICADAS (Últimas 5) ===");
    appliedMigrations.forEach((m) => {
      console.log(`✅ ${m.migration_name} - ${m.finished_at.toISOString()}`);
    });
  } catch (error) {
    console.error("❌ Error al verificar la tabla de migraciones:", (error as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
```

---

## 🎯 Desafíos del Nivel 4.3

1. **Simulación de Migración Fallida:** Modifica un archivo `.sql` de una migración local agregando una sintaxis SQL inválida. Ejecuta `pnpm exec prisma migrate dev` y observa el mensaje de error de Prisma y cómo la tabla `_prisma_migrations` registra el fallo.
2. **Creación de un Script de Deploy para `package.json`:** Agrega un script `"db:deploy": "prisma migrate deploy"` en tu `package.json` y pruébalo ejecutando `pnpm exec prisma migrate status` para confirmar que tu entorno local está al día.

---
---

# Nivel 4.4: Operaciones CRUD avanzadas y optimización de consultas (Prevención de N+1)

¡Excelente, mi hermano! Ahora que sabemos cómo mover los cambios de esquema a la base de datos de producción sin romper nada, vamos a dominar la lectura y escritura de datos con **Prisma Client**.

---

## Conceptos Clave

### 1. Las 5 Operaciones Fundamentales del Cliente
* **`findUnique` / `findFirst` / `findMany`**: Búsqueda por clave primaria/índice único, primer registro que coincida o lista de registros.
* **`create` / `createMany`**: Inserción individual o masiva de registros.
* **`update` / `updateMany`**: Actualización con filtros.
* **`upsert`**: Modifica el registro si existe; si no existe, lo crea atómicamente en una sola operación de base de datos.
* **`delete` / `deleteMany`**: Eliminación física.

### 2. El Problema N+1 y cómo lo resuelve Prisma
El problema **N+1** ocurre cuando consultas una lista de $N$ registros (por ejemplo, 10 usuarios) y luego, dentro de un bucle, ejecutas una consulta adicional a la base de datos por cada usuario para obtener sus publicaciones. Esto genera $1 + N$ (11) consultas a la base de datos, destruyendo el rendimiento de la red y saturando el pool de conexiones.

**¿Cómo lo evita Prisma?**
Prisma no hace consultas perezosas (*lazy loading*) automáticas en bucles. Te obliga a declarar explícitamente lo que deseas incluir mediante **`include`** o **`select`**. Internamente, Prisma une los datos mediante cláusulas `JOIN` altamente optimizadas en SQL o utiliza la estrategia de `IN (...)` combinando las peticiones en exactamente **2 consultas eficaces**.

### 3. `include` vs `select` (Payloads Delgado)
* **`include`**: Trae **todos** los campos del modelo principal + las relaciones especificadas.
* **`select`**: Trae **únicamente** los campos que le pidas (tanto del modelo principal como de sus relaciones). **Es la opción recomendada para producción**, ya que reduce el consumo de memoria RAM en Node.js y el tráfico de red.

---

## Buenas Prácticas

1. **Paginación por Cursor para grandes volúmenes:** Para listas con miles o millones de registros, evita la paginación tradicional basada en offset (`skip` + `take`), ya que PostgreSQL debe recorrer y descartar las filas anteriores. Usa paginación basada en cursor (`cursor` + `take`).
2. **Usa `prisma.$transaction()` para atomicidad:** Si necesitas crear un usuario y su perfil en pasos separados o transferir saldo entre dos cuentas, envuélvelo en una transacción. Si falla algún paso, PostgreSQL devolverá todo a su estado original (*rollback*).

---

## Ejemplos de Código

### Búsqueda Optimizada evitando N+1 con `select`

```typescript
// Consulta ultraligera: trae solo el id y nombre del usuario, y solo el título de sus posts
const usersWithPosts = await prisma.user.findMany({
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true
      }
    }
  },
  take: 20 // Paginación inicial
});
```

### Operación Atómica con `upsert` y Transacciones

```typescript
// Si el usuario existe, actualiza su nombre; si no existe, lo crea
const user = await prisma.user.upsert({
  where: { email: 'rafael@ejemplo.com' },
  update: { name: 'Rafael Alvarez Refactorizado' },
  create: {
    email: 'rafael@ejemplo.com',
    name: 'Rafael Alvarez',
    role: 'ADMIN'
  }
});

// Transacción interactiva (Atomicidad garantizada)
const [updatedUser, newPost] = await prisma.$transaction([
  prisma.user.update({
    where: { id: user.id },
    data: { isActive: true }
  }),
  prisma.post.create({
    data: {
      title: 'Transacciones atómicas en Prisma',
      content: 'Garantizando consistencia de datos',
      authorId: user.id
    }
  })
]);
```

---

## Nota de Arquitectura

> **Ancho de banda e inmunidad N+1:** Proyectar campos usando `select` en lugar de `include` reduce la carga en la serialización JSON. En aplicaciones de alto tráfico, filtrar las columnas innecesarias directamente en PostgreSQL reduce el uso de memoria en el runtime hasta en un 70%.

---

## 🛠️ Mini-Proyecto: "Feed de Publicaciones con Paginación por Cursor"

Construiremos una función de servicio optimizada para obtener un feed de noticias/posts paginado mediante cursor, sin sobrecargar la base de datos.

### Código Fuente (`src/Nivel4/src/feed-service.ts`)

```typescript
import { prisma } from '../../lib/prisma.js';

type FeedOptions = {
  take?: number;
  cursorId?: string;
};

export async function getPaginatedFeed({ take = 10, cursorId }: FeedOptions) {
  const posts = await prisma.post.findMany({
    take: take + 1, // Solicitamos un elemento extra para saber si hay página siguiente
    ...(cursorId && {
      skip: 1, // Saltamos el cursor actual
      cursor: { id: cursorId }
    }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  let nextCursor: string | undefined = undefined;

  if (posts.length > take) {
    const nextItem = posts.pop(); // Removemos el elemento extra que usamos para el check
    nextCursor = nextItem?.id;
  }

  return {
    data: posts,
    nextCursor
  };
}

// Demostración de uso
async function runDemo() {
  console.log("=== CARGANDO PÁGINA 1 DEL FEED ===");
  const page1 = await getPaginatedFeed({ take: 2 });
  console.log("Página 1:", page1.data);

  if (page1.nextCursor) {
    console.log(`\n=== CARGANDO PÁGINA 2 (Usando cursor: ${page1.nextCursor}) ===`);
    const page2 = await getPaginatedFeed({ take: 2, cursorId: page1.nextCursor });
    console.log("Página 2:", page2.data);
  }

  await prisma.$disconnect();
}

runDemo();
```

---

## 🎯 Desafíos del Nivel 4.4

1. **Creación Masiva con `createMany`:** Crea una función que reciba un arreglo de 5 categorías y las inserte usando `prisma.category.createMany({ data: [...], skipDuplicates: true })`.
2. **Filtro Avanzado de Búsqueda:** Construye una consulta que retorne los usuarios que tienen al menos un post publicado (`posts: { some: { published: true } }`) ordenados de forma descendente por su fecha de creación.
