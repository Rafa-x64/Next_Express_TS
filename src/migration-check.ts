import { prisma } from './lib/prisma.js'
import { execSync } from 'child_process'

async function checkMigrationStatus() {
    try {
        // Verificar conectividad básica con la tabla interna de Prisma
        const appliedMigrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
        SELECT migration_name, finished_at FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5;
    `

        console.log("=== ESTADO DE MIGRACIONES APLICADAS (Últimas 5) ===")
        appliedMigrations.forEach((m) => {
            console.log(`✅ ${m.migration_name} - ${m.finished_at.toISOString()}`)
        })
    } catch (error) {
        console.error("❌ Error al verificar la tabla de migraciones:", (error as Error).message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

checkMigrationStatus()
