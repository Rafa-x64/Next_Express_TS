# Nivel 2: TypeScript Core y Tipado Progresivo para Backend

¡Qué tal, mi hermano! Qué bueno que ya tienes tu entorno moderno volando con `tsx` y ESM nativo. Ahora que la mesa de trabajo está lista, es momento de empezar a esculpir.

En este nivel vamos a dominar **TypeScript Core** aplicado al backend. Olvídate de la teoría aburrida y de memorizar manuales enteros. Nos enfocaremos en lo que realmente necesitas para escribir lógica de servidor: **tipado progresivo, modelado inteligente de datos con Type Aliases y el control absoluto del flujo asíncrono** [1-3]. ¡Vamos a por ello!

---

## 2.1 y 2.2 Tipado Progresivo y Alias de Tipos (Type Alias)

### Conceptos Clave
A diferencia de lenguajes como PHP o JavaScript puro, que son de tipado dinámico o débil (donde una variable puede cambiar de tipo en cualquier momento, provocando fallos en producción), TypeScript introduce **tipado estático** [4, 5]. Esto significa que definimos el "contrato" de la información en tiempo de diseño para ahorrarnos horas de debugging en caliente [6, 7].

Utilizaremos **Type Aliases** (mediante la palabra clave `type`) para dar semántica a nuestro negocio [2]. Además, aplicaremos la filosofía del **tipado progresivo**: no te vuelvas loco decorando cada variable o creando genéricos ultra complejos desde el primer día [8]. TypeScript está para ayudarte, no para estorbarte. Si en un paso de transición necesitas usar `any`, hazlo sin culpa, haz que funcione primero y luego refina [9].

### Buenas Prácticas
*   **Regla de tipos simples:** No crees interfaces ni tipos complejos para datos que se explican solos [8].
*   **Declara los tipos inline:** Al principio, mantén los tipos en el mismo archivo donde los usas [10]. No crees carpetas `/types` vacías "por si acaso" [11].

### Ejemplos de Código (ESM nativo)

```typescript
// Definimos un tipo personalizado (Type Alias) para modelar un usuario del sistema [2]
type UserRole = 'admin' | 'editor' | 'member'; // Union type para restringir valores [2, 12]

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

// Uso del tipo personalizado
const activeAdmin: User = {
  id: 1,
  name: "Carlos",
  email: "carlos@test.com",
  role: 'admin',
  isActive: true
};
```

---

## 2.3 y 2.4 Control del Flujo Asíncrono (Promises y Async/Await)

### Conceptos Clave
El backend es por naturaleza asíncrono: consultar bases de datos, leer archivos o consumir APIs externas son tareas que toman tiempo [13]. Node.js gestiona esto de forma brillante sin bloquear el servidor [14].

Una **Promesa** es un objeto que representa el resultado (exitoso o fallido) de una operación asíncrona, transitando por los estados: *pending* (pendiente), *fulfilled* (resuelta) o *rejected* (rechazada) [13].
Para evitar el "infierno de callbacks" (*callback hell*) [15], usaremos la sintaxis moderna **`async/await`** [3]. Esta característica nos permite pausar la ejecución de una función asíncrona hasta que se resuelva la promesa, logrando que el código asíncrono se lea de forma tan fluida y limpia como si fuera síncrono [3, 16].

Cualquier error en este flujo lo atraparemos de forma elegante utilizando bloques estructurados **`try/catch`** [16].

### Buenas Prácticas
*   **Nunca dejes una promesa sin manejar:** Toda función que use `await` debe estar envuelta en un bloque `try/catch` para evitar que el proceso de Node.js muera por excepciones no controladas [16].
*   **No computes lo que puedes leer:** Usa async/await solo cuando de verdad requieras operaciones de E/S (I/O) o delays reales [17].

### Ejemplos de Código

```typescript
// Función que simula una consulta asíncrona a la base de datos devolviendo una Promesa [18]
const findUserById = (id: number): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === 1) {
        resolve({
          id: 1,
          name: "Carlos",
          email: "carlos@test.com",
          role: 'admin',
          isActive: true
        });
      } else {
        reject(new Error(`Usuario con ID \${id} no encontrado`)); // [19]
      }
    }, 1000);
  });
};

// Consumo estructurado del flujo asíncrono con try/catch [16]
async function runUserVerification() {
  try {
    console.log("Buscando usuario en la base de datos...");
    const user = await findUserById(1); // Espera síncrona visual [3]
    console.log(`¡Usuario verificado! Nombre: \\({user.name}, Rol: \\){user.role}`);
  } catch (error) {
    console.error(`Error en la verificación: \${(error as Error).message}`);
  }
}
```

---

## 🛠️ Mini-Proyecto: "Procesador Asíncrono de Transacciones"

Vamos a integrar todo lo aprendido en un flujo de ejecución backend real. Crearemos un procesador que recibe, valida y ejecuta transacciones de pago simuladas de manera asíncrona.

### Configuración del script

En tu `package.json` de la lección anterior, asegúrate de tener tu script configurado:
`"dev:nivel2": "tsx watch ./src/Nivel2/src/app.ts"`

### Implementación del Código (`src/Nivel2/src/app.ts`)

```typescript
// src/Nivel2/src/app.ts

// 1. Definición del modelo de datos de nuestro dominio (Type Alias) [2]
type TransactionStatus = 'pending' | 'approved' | 'rejected';

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
};

// 2. Base de datos simulada en memoria
const fakeDatabase: Transaction[] = [
  { id: "tx-001", amount: 150.50, currency: "USD", status: 'pending' },
  { id: "tx-002", amount: 99.00, currency: "EUR", status: 'pending' },
];

// 3. Función asíncrona para simular el procesamiento de pago (E/S) [18]
const processPaymentGateway = (tx: Transaction): Promise<Transaction> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulación de regla de negocio
      if (tx.amount > 500) {
        reject(new Error(`Transacción \${tx.id} rechazada: Excede el límite de seguridad.`));
      } else {
        resolve({ ...tx, status: 'approved' });
      }
    }, 1500);
  });
};

// 4. Orquestador de arranque de la aplicación (Bootstrap)
async function bootstrap() {
  console.log("=== INICIANDO PROCESADOR DE PAGOS ===");

  for (const tx of fakeDatabase) {
    try {
      console.log(`\n[Procesando] Iniciando transacción \${tx.id} por \\({tx.amount} \\){tx.currency}...`);

      const completedTx = await processPaymentGateway(tx); // [3]

      console.log(`[Éxito] ✅ Transacción \${completedTx.id} aprobada con éxito.`);
    } catch (error) {
      console.error(`[Fallo] ❌ Error al procesar: \${(error as Error).message}`);
    }
  }

  console.log("\n=== PROCESAMIENTO FINALIZADO ===");
}

bootstrap();
```

---

> 📝 **Nota de Arquitectura:**
> Modelar los estados usando `Union Types` rígidos (como `'pending' | 'approved' | 'rejected'`) en lugar de strings genéricos garantiza que, cuando conectemos la base de datos real con Prisma en el Nivel 4, no permitiremos jamás que se guarden estados corruptos en el sistema [2, 12].

---

## 🎯 Desafío del Nivel 2

Para consolidar tu aprendizaje, realiza el siguiente ejercicio:

1.  **Validación de fondos dinámicos:** Añade una nueva transacción en tu `fakeDatabase` con un monto de `600` (excede el límite).
2.  **Manejo de excepciones controlado:** Modifica la función de simulación para que, si el monto es inválido, lance un error específico y asegúrate de que el bloque `try/catch` del bucle principal lo capture adecuadamente y continúe procesando la siguiente transacción sin detener el servidor [20, 21].

---

¡Increíble avance! Cuéntame cómo te va corriendo el mini-proyecto de este nivel con `pnpm dev:nivel2` o si te topas con alguna duda.

Cuando domines este flujo de datos asíncrono, dime: **"Comienza con el Nivel 3"** y entraremos de lleno a construir servidores reales con Express Core y Middlewares avanzados. ¡A romperla! 🚀
