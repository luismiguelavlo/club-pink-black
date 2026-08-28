import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
