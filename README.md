# Nivel 5: Seguridad, Validación con Zod y JWT

¡Qué tal, mi hermano! Bienvenido al **Nivel 5**. En los niveles anteriores logramos que nuestro servidor sea asíncrono, modular y esté conectado a una base de datos PostgreSQL mediante Prisma ORM. Ahora es momento de **blindar el sistema**. 

Una aplicación backend en producción no puede confiar en los datos que envían los usuarios. En este nivel aprenderás a implementar **validaciones de entrada estrictas con Zod**, **protección de cabeceras HTTP con Helmet** y **encriptación unidireccional de contraseñas con bcrypt**.

---

# Nivel 5.1: Validación de Esquemas en Puntos de Entrada (Payloads) usando Esquemas Compartidos con Zod

### Conceptos Clave

El principio fundamental de un backend seguro es **Fail-Fast** (fallar rápido). Si un cliente envía datos malformados, incompletos o maliciosos, la petición debe ser rechazada en la puerta de entrada (capa HTTP), impidiendo que toque tus controladores o tu base de datos PostgreSQL.

Para lograr esto de forma moderna utilizamos **Zod**, la librería de declaración y validación de esquemas preferida en el ecosistema TypeScript para 2026.

#### 1. Inferencia de Tipos Estáticos (`z.infer`)
A diferencia de librerías como Joi o Yup, Zod está diseñado desde cero para TypeScript. Al definir un esquema de validación con Zod, TypeScript infiere automáticamente el tipo estático correspondiente sin necesidad de escribir interfaces o tipos manualmente.

```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// Extraemos el tipo estático automáticamente
type UserDto = z.infer<typeof userSchema>; 
```

#### 2. Esquemas Compartidos (Full-Stack Type Safety)
Una de las mayores ventajas de usar Zod es que estos esquemas de validación se pueden **compartir entre el backend (Express) y el frontend (Next.js)**. El mismo esquema que valida la petición en la API de Express servirá en la Fase 2 para validar los formularios en React con React Hook Form, garantizando un contrato único y sin duplicación de código.

---

### Buenas Prácticas

1. **Aplica la Regla 5 (No sobrevalidar):** Valida solo lo que sea crítico para el dominio de negocio. Evita expresiones regulares hipercomplejas a menos que sean estrictamente necesarias.
2. **Usa `coerce` para transformar entradas de la URL:** Los parámetros de consulta (`req.query`) y de ruta (`req.params`) siempre llegan como cadenas de texto (`string`). Usa `z.coerce.number()` o `z.coerce.boolean()` para que Zod parsee e infiera los tipos de forma limpia.
3. **Encapsula la validación en un Middleware Reutilizable:** No repitas `.safeParse()` dentro de cada controlador. Crea un middleware genérico `validateData(schema)` que capture las fallas de validación de forma transparente.

---

### Ejemplos de Código (TypeScript ESM Nativo)

#### 1. Middleware Genérico de Validación (`src/middlewares/validateData.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Middleware de orden superior para validar body, query o params
export const validateData = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Analizamos el cuerpo de la petición de forma segura
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Damos formato a los errores de Zod para devolver una respuesta limpia
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: "Los datos suministrados son inválidos",
          code: "VALIDATION_ERROR",
          details: formattedErrors
        }
      });
    }

    // Inyectamos los datos parseados y limpiados de vuelta al req.body
    req.body = result.data;
    next();
  };
};
```

#### 2. Esquema de Registro de Usuario (`src/schemas/auth.schema.ts`)

```typescript
import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("El formato del correo electrónico es inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(['USER', 'ADMIN', 'EDITOR']).optional().default('USER')
});

// Exportamos el tipo inferido para usarlo en el servicio o controlador
export type RegisterUserDto = z.infer<typeof registerUserSchema>;
```

---

> 📝 **Nota de Arquitectura y Escalabilidad:**
> Ubicar los esquemas en una capa aislada (`/schemas`) permite exportarlos como un módulo compartido cuando acoplemos el frontend de Next.js en el Nivel 8. Esto elimina las discrepancias de tipos entre lo que envía el cliente y lo que acepta la API.

---

### 🛠️ Mini-Proyecto: "API Endpoint Validada con Zod"

Vamos a construir un endpoint para crear productos en el inventario con validación estricta de tipos y precios.

#### 1. Esquema de Producto (`src/Nivel5/schemas/product.schema.ts`)

```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3, "El nombre del producto debe ser más descriptivo"),
  price: z.number().positive("El precio debe ser un número positivo mayor a 0"),
  stock: z.number().int().nonnegative("El stock no puede ser negativo").default(0),
  category: z.string().min(1, "La categoría es requerida")
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
```

#### 2. Servidor con Endpoint Validado (`src/Nivel5/src/app.ts`)

```typescript
import express, { Request, Response } from 'express';
import { validateData } from '../middlewares/validateData.js';
import { createProductSchema, CreateProductDto } from '../schemas/product.schema.js';

const app = express();
app.use(express.json());

// Endpoint POST protegido con nuestro middleware de Zod
app.post('/api/v1/products', validateData(createProductSchema), (req: Request, res: Response) => {
  // TypeScript sabe exactamente que req.body cumple con CreateProductDto
  const productData: CreateProductDto = req.body;

  res.status(201).json({
    success: true,
    message: "Producto validado y creado con éxito",
    data: productData
  });
});

app.listen(3000, () => {
  console.log("🚀 Servidor con validación Zod corriendo en http://localhost:3000");
});
```

---

### 🎯 Desafíos del Nivel 5.1

1. **Validación de Parámetros de Consulta (Pagination Schema):** Crea un esquema Zod llamado `paginationQuerySchema` que valide `page` y `limit` desde `req.query`, forzando la conversión de string a número con `z.coerce.number().min(1)` y valores por defecto (`page=1`, `limit=10`).
2. **Esquema Parcial para Actualización (PATCH):** Utiliza la función `.partial()` de Zod para derivar un esquema `updateProductSchema` a partir de `createProductSchema` donde todos los campos sean opcionales.

---
---

# Nivel 5.2: Seguridad en Express: Hashing de Contraseñas con bcrypt y Cabeceras Seguras con Helmet

### Conceptos Clave

Un backend listo para producción debe proteger la integridad de los datos de sus usuarios y la estructura de su servidor web contra ataques maliciosos comunes (como clickjacking, inyecciones de script o ataques de fuerza bruta).

#### 1. Hashing de Contraseñas con `bcrypt`
**Regla de Oro de Seguridad:** Jamás, bajo ninguna circunstancia, se almacena una contraseña en texto plano en la base de datos.
Si un atacante logra acceso a tu PostgreSQL, tener contraseñas en texto plano compromete inmediatamente a tus usuarios.

* **¿Qué es Hashing?** A diferencia de la encriptación (que es bidireccional y se puede desencriptar), el hashing es una función **unidireccional**. Una vez transformada la contraseña en un hash, no se puede revertir al texto original.
* **Salt & Cost Factor (Salt Rounds):** `bcrypt` genera una cadena aleatoria (*Salt*) que se mezcla con la contraseña antes de aplicar el algoritmo. El factor de costo (por defecto 10 o 12 rounds) determina cuántas iteraciones se aplican, haciendo que calcular el hash sea deliberadamente lento para la CPU, neutralizando ataques por tablas de arcoíris (*Rainbow Tables*) o fuerza bruta.

```text
Contraseña Plana: "password123" ──[ Salt + bcrypt 10 rounds ]──> "$2b$10$e8N...hash_inreversible"
```

#### 2. Cabeceras de Seguridad HTTP con `Helmet`
Express revela por defecto información interna a través de cabeceras HTTP (como `X-Powered-By: Express`). Esto le indica a los atacantes qué framework usas, facilitándoles buscar vulnerabilidades conocidas.

**`Helmet`** es un middleware para Express que asegura la aplicación configurando automáticamente 15+ cabeceras HTTP de seguridad perimetral, incluyendo:
* `X-Content-Type-Options: nosniff` (previene ataques de tipo MIME).
* `X-Frame-Options: DENY` (evita que introduzcan tu sitio en un `<iframe>` para clickjacking).
* `Strict-Transport-Security` (fuerza conexiones HTTPS seguras).
* Elimina la cabecera `X-Powered-By`.

---

### Buenas Prácticas

1. **Configura Helmet al principio de la pila:** Registra `app.use(helmet())` inmediatamente después de instanciar Express, antes de definir cualquier ruta.
2. **Ajusta los Salt Rounds de bcrypt:** Usa 10 o 12 rounds. Menos de 10 es vulnerable; más de 14 ralentizará innecesariamente tu servidor de Node.js por carga de CPU durante el login.
3. **Usa `bcryptjs` o `bcrypt`:** En entornos ESM/TypeScript modernos, `bcryptjs` ofrece compatibilidad multiplataforma instantánea sin requerir compiladores nativos C++ en el sistema operativo.

---

### Ejemplos de Código (TypeScript ESM Nativo)

#### 1. Servicio de Criptografía (`src/utils/password.ts`)

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Transforma la contraseña plana en un hash seguro
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compara una contraseña plana contra el hash almacenado en PostgreSQL
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

#### 2. Configuración de Helmet y Middleware de Seguridad (`src/Nivel5/src/app.ts`)

```typescript
import express from 'express';
import helmet from 'helmet';

const app = express();

// 🛡️ Registramos Helmet en el perímetro global del servidor
app.use(helmet()); 

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: "healthy", security: "Helmet Active" });
});
```

---

> 📝 **Nota de Arquitectura y Escalabilidad:**
> Al ejecutar el hashing de contraseñas de forma asíncrona dentro del backend independiente de Express, mantenemos la capa frontend de Next.js libre de operaciones intensivas de CPU, garantizando respuestas inmediatas en la interfaz de usuario.

---

### 🛠️ Mini-Proyecto: "Endpoint de Registro Seguro con Zod, bcrypt, Helmet y Prisma"

Vamos a integrar todas las capas aprendidas hasta ahora: validación con Zod, seguridad de cabeceras con Helmet, hashing con bcrypt y persistencia física en PostgreSQL mediante Prisma.

#### Implementación (`src/Nivel5/src/register-server.ts`)

```typescript
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { prisma } from '../../lib/prisma.js';
import { validateData } from '../middlewares/validateData.js';
import { registerUserSchema, RegisterUserDto } from '../schemas/auth.schema.js';
import { hashPassword } from '../utils/password.js';

const app = express();

// 1. Cabeceras de seguridad
app.use(helmet());
app.use(express.json());

// 2. Endpoint de registro seguro
app.post(
  '/api/v1/auth/register',
  validateData(registerUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, role }: RegisterUserDto = req.body;

      // Verificamos si el usuario ya existe en la base de datos
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { message: "El correo electrónico ya se encuentra registrado", code: "EMAIL_EXISTS" }
        });
      }

      // Hasheamos la contraseña de forma segura con bcrypt
      const hashedPassword = await hashPassword(password);

      // Guardamos el usuario en PostgreSQL con la contraseña encriptada
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          role,
          // Guardamos únicamente el hash, nunca el texto plano
          createdAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
          // Excluimos intencionalmente el hash de la respuesta JSON
        }
      });

      res.status(201).json({
        success: true,
        message: "Usuario registrado con éxito de forma segura",
        data: newUser
      });

    } catch (error) {
      console.error("Error en el registro:", error);
      res.status(500).json({ success: false, error: { message: "Error interno del servidor" } });
    }
  }
);

app.listen(3000, () => {
  console.log("🔒 Servidor de Autenticación Segura corriendo en http://localhost:3000");
});
```

---

### 🎯 Desafíos del Nivel 5.2

1. **Verificación de Login:** Crea el esquema `loginUserSchema` (email y password) y un endpoint `POST /api/v1/auth/login`. Busca al usuario en PostgreSQL, compara la contraseña enviada con el hash guardado usando `comparePassword()` y devuelve un mensaje de éxito o un error `401 Unauthorized` con credenciales inválidas.
2. **Personalización de Helmet:** Modifica la configuración de Helmet para permitir que tu servidor Express cargue recursos de fuentes o imágenes externas desactivando o personalizando la directiva `contentSecurityPolicy`.
