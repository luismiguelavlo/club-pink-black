import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { users } from './schema'

const passwordHasher = new Hash(new Scrypt({}))

async function seed() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client)

  const seedUsers = [
    {
      email: (process.env.SEED_ADMIN_EMAIL ?? 'admin@club.com').toLowerCase(),
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
      name: process.env.SEED_ADMIN_NAME ?? 'Administrador',
      role: 'admin' as const,
    },
    {
      email: (process.env.SEED_USER_EMAIL ?? 'rider@club.com').toLowerCase(),
      password: process.env.SEED_USER_PASSWORD ?? 'Rider123!',
      name: process.env.SEED_USER_NAME ?? 'Rider',
      role: 'user' as const,
    },
  ]

  for (const seedUser of seedUsers) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seedUser.email))
      .limit(1)

    if (existing) {
      console.log(`Skip existing user: ${seedUser.email}`)
      continue
    }

    const passwordHash = await passwordHasher.make(seedUser.password)

    await db.insert(users).values({
      email: seedUser.email,
      passwordHash,
      name: seedUser.name,
      role: seedUser.role,
      isActive: true,
    })

    console.log(`Created ${seedUser.role}: ${seedUser.email}`)
  }

  await client.end()
  console.log('Seed completed')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
