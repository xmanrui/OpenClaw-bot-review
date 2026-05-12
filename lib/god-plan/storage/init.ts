import { getDb } from '@/lib/god-plan/storage/db'
import { ensureSchema } from '@/lib/god-plan/storage/schema'
import { seedInitialData } from '@/lib/god-plan/storage/seed'

export interface StorageInitResult {
  ok: true
  db: ReturnType<typeof getDb>
  schema: ReturnType<typeof ensureSchema>
  seed: ReturnType<typeof seedInitialData>
  initializedAt: string
}

export function initStorage(): StorageInitResult {
  const db = getDb()
  const schema = ensureSchema()
  const seed = seedInitialData()

  return {
    ok: true,
    db,
    schema,
    seed,
    initializedAt: new Date().toISOString(),
  }
}
