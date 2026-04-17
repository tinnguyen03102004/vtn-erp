import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // PrismaPg adapter requires direct connection (port 5432), NOT pgBouncer (port 6543)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!

  const pool = new Pool({
    connectionString,
    // Serverless-optimized settings:
    max: 1,                      // Only 1 connection per serverless instance
    idleTimeoutMillis: 20_000,   // Close idle connections after 20s
    connectionTimeoutMillis: 10_000, // Fail fast if can't connect in 10s
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Cache PrismaClient in globalThis to avoid creating multiple pools
// This works in both dev (hot reload) and production (serverless warm starts)
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
