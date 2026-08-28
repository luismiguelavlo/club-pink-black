import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

let client: ReturnType<typeof postgres> | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  const config = useRuntimeConfig()
  const databaseUrl = config.databaseUrl

  if (!databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL is not configured',
    })
  }

  if (!client) {
    client = postgres(databaseUrl, {
      max: 10,
      // Neon pooler does not support prepared statements in all modes.
      prepare: false,
    })
    dbInstance = drizzle(client, { schema })
  }

  if (!dbInstance) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database client failed to initialize',
    })
  }

  return dbInstance
}
