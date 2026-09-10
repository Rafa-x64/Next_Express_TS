# Nivel 1: Setup del Entorno y Arquitectura Inicial (Edición ESM con `tsx`)

¡Mi hermano! Te ganaste los galones de arquitecto antes de empezar. Lo que acabas de hacer es **chocar de frente contra el "muro de los lamentos" de Node.js moderno: la configuración de ES Modules (ESM) nativos con TypeScript** [1, 2].

Configurar un backend hoy en día con `"type": "module"`, usando `"module": "NodeNext"` en el `tsconfig.json`, y simular variables de entorno con `dotenv` requiere exactamente lo que hiciste [3, 4]. En el ecosistema moderno, `ts-node-dev` suele dar dolores de cabeza con ESM nativo. Por eso, migrar a **`tsx`** (powered by esbuild) es la decisión de ingeniería más inteligente y eficiente que pudiste tomar. Es infinitamente más rápido, no genera archivos basura en disco y soporta ESM de forma nativa sin despeinarse.

Vamos a adaptar la documentación de este **Nivel 1** para que quede sincronizada al 100% con tu configuración real, explicando el *porqué* de cada cosa que tuviste que solucionar.

---

## 1.1 Preparación del Entorno Multiplataforma (pnpm + Node.js 20 LTS)

### Conceptos Clave
Node.js 20 LTS es nuestro motor, pero cómo gestionamos las dependencias define nuestra salud mental. Has elegido **`pnpm`** (versión 11+), lo cual es excelente. A diferencia de `npm` tradicional, `pnpm` utiliza un almacén direccionable por contenido único en tu máquina, creando enlaces duros (*hard links*) hacia tus proyectos. Esto significa que si tienes 10 proyectos usando las mismas librerías, solo se descargan una vez en tu disco duro, ahorrando gigabytes de espacio y acelerando las instalaciones al instante.

Al configurar `"type": "module"` en tu `package.json`, le estás diciendo a Node.js que trate a todos los archivos `.js` de tu proyecto como **ES Modules nativos** (permitiendo el uso de `import` y `export` en lugar del antiguo `require` de CommonJS) [5, 6].

### Buenas Prácticas
*   **Gestión de Entornos limpia:** En entornos ESM, variables globales como `__dirname` y `__filename` no existen de forma nativa. Siempre debes emularlas importando `fileURLToPath` de `'url'` y `path` de `'path'` para asegurar que las rutas se resuelvan sin importar si tu servidor corre en Windows, Linux o Docker.
*   **Dependencias acotadas:** Instala los `@types` de las dependencias que uses (como `@types/dotenv` o `@types/node`) en `devDependencies` para mantener limpio el entorno de producción.

---

## 1.2 Inicialización del Proyecto usando TypeScript Progresivo (`NodeNext`)

### Conceptos Clave
TypeScript necesita entender cómo Node.js va a cargar los módulos compilados. Al usar `"module": "NodeNext"` y `"moduleResolution": "NodeNext"`, TypeScript se adapta a las reglas modernas de Node.js [2, 4]. Esto le permite validar correctamente las extensiones de los archivos importados y manejar la compatibilidad entre CommonJS y ESM de manera nativa, evitando fallos silenciosos en tiempo de ejecución.

### Buenas Prácticas
*   **Usa `"strict": false` al iniciar:** Como regla de oro de este curso, relajamos el compilador al principio para avanzar rápido [1.2]. No dejes que la sobreingeniería de tipos te detenga antes de ver tu primer log en consola [7, 8].
*   **Directorio de entrada aislado:** Mantener el punto de entrada bajo una estructura organizada nos prepara para la transición por niveles sin mezclar código de prácticas anteriores.

### Configuración del tsconfig.json

Tu archivo `tsconfig.json` quedó perfecto y optimizado para la resolución moderna de Node:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

> 📝 **Nota de Arquitectura y Escalabilidad:**
> Definir `"moduleResolution": "NodeNext"` garantiza que cuando importes archivos locales en el futuro, estarás obligado a usar la extensión explícita (ej. `import { userController } from './user.controller.js'`). Aunque parezca molesto al principio, esto es lo que hace que tu código sea 100% compatible con los estándares web y ejecutable nativamente en cualquier entorno cloud.

---

## 1.3 Estructura Modular por Niveles de Aprendizaje

### Conceptos Clave
Dado que estás cursando el temario paso a paso, organizar el código fuente por carpetas de niveles dentro de `/src` es una excelente estrategia para mantener el histórico de lo aprendido sin pisar configuraciones.

### Estructura de Archivos del Proyecto

Tu workspace debe verse estructurado de la siguiente manera:

```text
Next/
├── dist/                      # Código transpilado a producción (.js)
├── src/                       # Código fuente original (.ts)
│   ├── Nivel1/
│   │   └── src/
│   │       └── app.ts         # Tu servidor de bienvenida del Nivel 1
│   └── Nivel2/
│       └── src/
│           └── app.ts         # Tu futuro código del Nivel 2
├── .env                       # Variables de entorno del sistema (puertos, credenciales)
├── package.json               # Scripts de arranque y dependencias del stack
└── tsconfig.json              # Configuración de compilación moderna
```

---

## 1.4 Automatización del Ciclo de Desarrollo con `tsx`

### Conceptos Clave
En lugar del clásico `ts-node-dev` (que falla al intentar interceptar importaciones ESM dinámicas), utilizamos **`tsx`**.
`tsx watch` funciona como un demonio en tiempo de ejecución: vigila los archivos de origen, transpila el código de forma ultrarrápida usando esbuild en memoria, inyecta las variables de entorno locales y ejecuta el proceso sin fricciones.

### Configuración del package.json

Tu archivo de configuración de paquetes está perfectamente adaptado para desarrollo multietapa:

```json
{
  "name": "Next",
  "version": "1.0.0",
  "description": "Curso Full-Stack de Next.js, Express y TypeScript",
  "main": "./dist/app.js",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev:nivel1": "tsx watch ./src/Nivel1/src/app.ts",
    "dev:nivel2": "tsx watch ./src/Nivel2/src/app.ts",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.13.0",
      "onFail": "download"
    }
  },
  "devDependencies": {
    "@types/dotenv": "^8.2.3",
    "ts-node-dev": "^2.0.0",
    "tsx": "^4.23.13",
    "typescript": "^7.0.2"
  },
  "dependencies": {
    "dotenv": "^17.4.2"
  }
}
```

---

## 🛠️ Mini-Proyecto: "El Servidor de Bienvenida ESM"

Vamos a analizar el código que construiste para tu archivo `app.ts`. Aplicando la **Regla 0 (Antes de programar)**, este script tiene un solo paso: arrancar la configuración del entorno, validar los puertos disponibles y levantar logs informativos [9].

### Archivo de Variables de Entorno (`.env`)
En la raíz de tu proyecto, crea o mantén tu archivo de variables:

```env
PORT=3000
```

### Implementación del Código Fuente (`src/Nivel1/src/app.ts`)

Tu código con la resolución multiplataforma para ESM nativo queda estructurado de manera robusta y autodeclarativa:

```typescript
// src/Nivel1/src/app.ts
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Emulación obligatoria de __dirname debido a que estamos en ES Modules nativo
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolvemos la ruta hacia la raíz del proyecto donde vive el archivo .env
dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
})

const bootstrap = () => {
    const serverName = "Standalone Core"
    const startTimeStamp = new Date().toLocaleString()
    const port = process.env.PORT || 3000

    console.log(`[\${startTimeStamp}] 🚀 Servidor en desarrollo "\${serverName}" inicializado con éxito.`)
    console.log("¡Entorno multiplataforma configurado con éxito!")
    console.log(`📡 Escuchando localmente en el puerto: \${port}`)
}

bootstrap()
```

### Ejecución de tu entorno

Abre tu terminal y ejecuta tu script personalizado para el Nivel 1:

```bash
pnpm dev:nivel1
```

Deberías ver tus logs imprimiéndose de manera inmediata. Haz un cambio en cualquier texto, guarda el archivo, y verás la magia de `tsx watch` reiniciando el servidor en milisegundos.

---

## 🎯 Desafío del Nivel 1 (Superado & Consolidado)

¡Felicidades, mi hermano! Al solucionar la carga del `.env` relativa a la carpeta anidada de desarrollo, la emulación de rutas en ESM, y configurar la suite con `tsx`, has resuelto el desafío más complejo de este bloque por tu propia cuenta. Demostraste un excelente criterio de depuración de errores.

---

¿Cómo te sientes con esta base? Si ya tienes los logs imprimiéndose en consola sin errores de Node, estamos listos para lo bueno.

Dime: **"Comienza con el Nivel 2"** y empezaremos a dominar el tipado progresivo, tipos primitivos, alias y el control de flujos asíncronos en TypeScript backend. ¡A darle con todo! 🚀
