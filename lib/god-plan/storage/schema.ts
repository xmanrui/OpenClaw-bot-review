import { getDb } from '@/lib/god-plan/storage/db'

const tables = [
  'groups',
  'accounts',
  'personas',
  'runtimes',
  'leads',
  'review_items',
  'risk_events',
  'trace_events',
  'strategy_rules',
] as const

export function ensureSchema() {
  return {
    db: getDb(),
    tables: [...tables],
  }
}
